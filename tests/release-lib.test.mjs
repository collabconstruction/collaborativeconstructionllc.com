import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  EXPECTED, PAGES, extractJsonAll, FACEBOOK_NOW, FACEBOOK_OLD, FORBIDDEN_FILES, pageFile, repoFromRemote, parseWhoami, extractJson, pickRollbackVersion,
  checkProvenance, classifyOutcome, judgeDeployment, pollForVersion, parseVersionId, checkBindings, hashDir, localRefs, checkDeployFolder, checkDeployReadiness,
  rollbackCommand, clearPrepareState, writeReportAtomic, consumePrepareReport,
} from "../scripts/lib/release-lib.mjs";

const fixture = (n) => readFile(new URL(`./fixtures/wrangler/${n}`, import.meta.url), "utf8");

const ID1 = "308583ee-8c69-4207-9336-982cc82f3555";
const ID2 = "d44368c2-a776-4c21-a387-2bbba3a5d830";

test("repository is read from https and ssh remotes", () => {
  assert.equal(repoFromRemote("https://github.com/collabconstruction/collaborativeconstructionllc.com.git"), EXPECTED.repo);
  assert.equal(repoFromRemote("git@github.com:collabconstruction/collaborativeconstructionllc.com.git"), EXPECTED.repo);
  assert.equal(repoFromRemote("https://github.com/someone/else"), "someone/else");
  assert.equal(repoFromRemote("nonsense"), null);
});

test("whoami: only the expected account passes, and not logged in fails closed", () => {
  assert.equal(parseWhoami(`| Account | ${EXPECTED.accountId} |`).ok, true);
  assert.equal(parseWhoami("| Account | 1111 |").ok, false);
  assert.equal(parseWhoami("You are not authenticated. Please run `wrangler login`.").ok, false);
  assert.equal(parseWhoami("").ok, false);
});

test("rollback target is the newest deployment's VERSION id, never the deployment id", async () => {
  for (const f of ["deployments-single.json", "deployments-newest-first.json", "deployments-envelope.json", "deployments-with-banner.txt"]) {
    const r = pickRollbackVersion(await fixture(f));
    assert.equal(r.ok, true, f);
    assert.equal(r.versionId, ID2, f);
    assert.equal(r.deploymentId, "9e7b4f10-2c8d-4a65-b0e1-6d3f5a7c8e90", f);
    assert.notEqual(r.versionId, r.deploymentId, f);
  }
});

test("rollback target fails closed when no single version can be established", async () => {
  assert.match(pickRollbackVersion(await fixture("deployments-no-versions.json")).why, /no versions/);
  assert.match(pickRollbackVersion(await fixture("deployments-gradual.json")).why, /splits traffic/);
  assert.match(pickRollbackVersion("[]").why, /no deployments/);
  assert.match(pickRollbackVersion("garbage").why, /no deployments/);
  assert.match(pickRollbackVersion("").why, /no deployments/);
  const bad = JSON.stringify([{ id: ID1, created_on: "2026-10-21T00:00:00Z", versions: [{ version_id: "not-an-id", percentage: 100 }] }]);
  assert.match(pickRollbackVersion(bad).why, /not a valid id/);
  const partial = JSON.stringify([{ id: ID1, created_on: "2026-10-21T00:00:00Z", versions: [{ version_id: ID2, percentage: 50 }] }]);
  assert.match(pickRollbackVersion(partial).why, /50 percent/);
});

test("JSON is found after banner and log lines that contain braces", async () => {
  const all = extractJsonAll(await fixture("deployments-with-banner.txt"));
  assert.equal(all.length, 2, "the log object and the deployment list");
  assert.equal(Array.isArray(all[1]), true);
  assert.equal(all[1].length, 2);
  assert.equal(extractJson("no json here"), null);
  assert.equal(extractJson('prefix {"a":[1,2,{"b":"}"}]} suffix').a[2].b, "}");
});

const PRLINE = (over = {}) => JSON.stringify({ number: 12, merged_at: "2026-10-21T21:00:00Z", base: "main", merge_commit_sha: "a".repeat(40), ...over });

test("provenance: only a merged PR into main whose merge commit is this commit counts", () => {
  const head = "a".repeat(40);
  assert.deepEqual(checkProvenance(PRLINE(), head), { ok: true, pr: 12, why: "merged by pull request #12" });
  assert.equal(checkProvenance("", head).ok, false);
  assert.equal(checkProvenance("gh: not logged in", head).ok, false);
  assert.equal(checkProvenance(PRLINE({ merged_at: null }), head).ok, false);
  assert.equal(checkProvenance(PRLINE({ base: "feature" }), head).ok, false);
  assert.equal(checkProvenance(PRLINE({ merge_commit_sha: "b".repeat(40) }), head).ok, false);
  assert.equal(checkProvenance(`${PRLINE({ number: 1, merge_commit_sha: "c".repeat(40) })}\n${PRLINE({ number: 2 })}`, head).pr, 2);
});

const NEW = ID2, OLD = ID1;
const obs = (...ids) => ids.map((v) => (v ? { ok: true, versionId: v } : { ok: false }));
const judge = (over) => judgeDeployment({ wranglerExit: 0, printedVersionId: NEW, beforeVersionId: OLD, observations: obs(NEW), ...over });

test("deployment evidence: Wrangler success alone never counts as verified", () => {
  assert.deepEqual(judge({}), { upload: "succeeded", active: "confirmed", versionId: NEW, note: "Cloudflare lists the new version as current" });
  // listing unreadable
  assert.equal(judge({ observations: obs(null, null) }).active, "unconfirmed");
  assert.equal(judge({ observations: [] }).active, "unconfirmed");
  // listing lagging: still the previous version
  const lag = judge({ observations: obs(OLD, OLD, OLD) });
  assert.equal(lag.active, "unconfirmed");
  assert.match(lag.note, /lagging/);
  // listing shows some other version
  assert.match(judge({ observations: obs("11111111-1111-4111-8111-111111111111") }).note, /different version/);
  // a later read confirms after earlier stale reads (eventual consistency)
  assert.equal(judge({ observations: obs(OLD, null, OLD, NEW) }).active, "confirmed");
  // no printed id: a changed version is accepted, an unchanged one is not
  assert.equal(judge({ printedVersionId: null, observations: obs(OLD, NEW) }).versionId, NEW);
  assert.equal(judge({ printedVersionId: null, observations: obs(OLD) }).active, "unconfirmed");
});

test("a successful upload is never classified as not deployed, even when the listing is stale", () => {
  for (const observations of [obs(OLD), obs(OLD, OLD, OLD, OLD, OLD, OLD), obs(null), []]) {
    const j = judge({ observations });
    const o = classifyOutcome({ judgement: j, liveFailed: 0, seoOk: true });
    assert.equal(j.upload, "succeeded");
    assert.notEqual(o.code, 1, "must not say not deployed");
    assert.equal(o.code, 5);
    assert.match(o.label, /NOT CONFIRMED THE NEW VERSION IS ACTIVE/);
    assert.match(o.stages[1], /NOT CONFIRMED/);
  }
});

test("failed upload: not deployed only when Cloudflare shows the previous version; changed or unreadable are reported as such", () => {
  const failed = (observations) => judgeDeployment({ wranglerExit: 1, printedVersionId: null, beforeVersionId: OLD, observations });
  assert.equal(classifyOutcome({ judgement: failed(obs(OLD, OLD)) }).code, 1);
  assert.equal(classifyOutcome({ judgement: failed(obs(null, null)) }).code, 4);
  const changed = failed(obs(OLD, NEW));
  assert.equal(changed.active, "confirmed");
  assert.equal(changed.upload, "failed");
  assert.equal(classifyOutcome({ judgement: changed, liveFailed: 0, seoOk: true }).code, 0);
});

test("outcome codes and the four reported stages", () => {
  const ok = judge({});
  const all = classifyOutcome({ judgement: ok, liveFailed: 0, seoOk: true });
  assert.equal(all.code, 0);
  assert.match(all.label, /upload, active version, live checks, SEO audit/);
  assert.equal(all.stages.length, 4);
  assert.match(all.stages[0], /Wrangler upload:\s+succeeded/);
  assert.match(all.stages[1], /confirmed by Cloudflare/);
  assert.match(all.stages[2], /Live HTTP checks:\s+passed/);
  assert.match(all.stages[3], /SEO audit:\s+passed/);
  assert.equal(classifyOutcome({ judgement: ok, liveFailed: 2 }).code, 2);
  assert.match(classifyOutcome({ judgement: ok, liveFailed: 2 }).label, /DEPLOYED, BUT 2 LIVE/);
  assert.equal(classifyOutcome({ judgement: ok, liveFailed: 0, seoOk: false }).code, 3);
  assert.equal(classifyOutcome({ judgement: ok, liveFailed: 1, seoOk: false }).code, 2);
  // unconfirmed active version with failed live checks keeps the live failure code, and never says verified
  const unconfirmed = judge({ observations: obs(OLD) });
  assert.equal(classifyOutcome({ judgement: unconfirmed, liveFailed: 1 }).code, 2);
  assert.doesNotMatch(classifyOutcome({ judgement: unconfirmed, liveFailed: 0 }).label, /^DEPLOYED and verified/);
});

test("polling waits through a stale listing and stops as soon as the new version shows", async () => {
  let calls = 0, sleeps = 0;
  const seq = [{ ok: true, versionId: OLD }, { ok: false }, { ok: true, versionId: OLD }, { ok: true, versionId: NEW }, { ok: true, versionId: NEW }];
  const o = await pollForVersion({ read: async () => seq[calls++], sleep: async () => { sleeps++; }, wanted: NEW, before: OLD, attempts: 6, delayMs: 1 });
  assert.equal(o.length, 4);
  assert.equal(sleeps, 3);
  assert.equal(judge({ observations: o }).active, "confirmed");
});

test("polling gives up after the allowed attempts and reports what it saw", async () => {
  let calls = 0;
  const o = await pollForVersion({ read: async () => { calls++; return { ok: true, versionId: OLD }; }, sleep: async () => {}, wanted: NEW, before: OLD, attempts: 4, delayMs: 1 });
  assert.equal(calls, 4);
  assert.equal(judge({ observations: o }).active, "unconfirmed");
});

test("without a printed id, polling stops at the first version different from the previous one", async () => {
  const seq = [{ ok: true, versionId: OLD }, { ok: true, versionId: NEW }];
  let i = 0;
  const o = await pollForVersion({ read: async () => seq[i++], sleep: async () => {}, wanted: null, before: OLD, attempts: 6, delayMs: 1 });
  assert.equal(o.length, 2);
});

test("the deploy flow polls before judging and never decides from one read", async () => {
  const src = await readFile(new URL("../scripts/release.mjs", import.meta.url), "utf8");
  const dep = src.slice(src.indexOf("async function deploy()"), src.indexOf("async function checkWrangler"));
  assert.ok(dep.indexOf("pollForVersion") > dep.indexOf('"wrangler", "deploy"'));
  assert.ok(dep.indexOf("judgeDeployment") > dep.indexOf("pollForVersion"));
  assert.doesNotMatch(dep, /deployed = after\./, "the old single read decision is gone");
});

test("provenance supports a merge commit, a squash commit and a rebase tip, because each is the PR's merge_commit_sha; later or direct commits are not supported", () => {
  const head = "d".repeat(40);
  for (const strategy of ["merge commit", "squash", "rebase tip"]) {
    assert.equal(checkProvenance(PRLINE({ merge_commit_sha: head, number: 77 }), head).ok, true, strategy);
  }
  // a commit pushed after the merge is not the merge commit, even if it is on main
  assert.equal(checkProvenance(PRLINE({ merge_commit_sha: "e".repeat(40) }), head).ok, false);
  // a direct push to main has no associated merged pull request
  assert.equal(checkProvenance("", head).ok, false);
  // a pull request merged into another branch does not authorize a deploy from main
  assert.equal(checkProvenance(PRLINE({ merge_commit_sha: head, base: "release" }), head).ok, false);
});

test("new version id is read from deploy output", () => {
  assert.equal(parseVersionId(`Uploaded x\nDeployed x triggers\nCurrent Version ID: ${ID2}\n`), ID2);
  assert.equal(parseVersionId("no id here"), null);
});

const DRY = `env.DB (cc-leads) D1 Database
env.ATTACHMENTS (cc-lead-attachments) R2 Bucket
env.SEND_EMAIL (a@b.c) Send Email
env.INTAKE_RATE_LIMITER (5 requests/60s) Rate Limit
env.ASSETS Assets
env.LEAD_INBOX ("a@b.c") Environment Variable
env.LEAD_FROM_ADDRESS ("website@x") Environment Variable`;

test("dry run must show every contact form binding", () => {
  assert.deepEqual(checkBindings(DRY), []);
  assert.match(checkBindings(DRY.replace("env.ATTACHMENTS", "env.OTHER")).join(), /ATTACHMENTS/);
  assert.match(checkBindings(DRY.replace("(cc-leads)", "(other)")).join(), /cc-leads/);
  assert.match(checkBindings(DRY + "\nenv.HQ (cc-intel)").join(), /HQ database/);
  assert.ok(checkBindings("").length > 5);
});

test("local references: images, srcset, css urls; not external, api, anchors or pages", () => {
  const html = `<img src="/assets/a.jpg" srcset="/assets/r/a-480.webp 480w, /assets/r/a-768.webp 768w">
  <a href="https://x.com/y.png">x</a><a href="/about/">p</a><a href="#top">t</a><a href="/api/contact">c</a>
  <link rel="stylesheet" href="/css/styles.css?v=1"><div style="background:url('/assets/bg.webp')"></div><script src="//cdn.x/y.js"></script>`;
  assert.deepEqual(localRefs(html).sort(), ["/assets/a.jpg", "/assets/bg.webp", "/assets/r/a-480.webp", "/assets/r/a-768.webp", "/css/styles.css"]);
});

test("folder fingerprint changes when a file is added, removed or edited, and not otherwise", async () => {
  const d = await mkdtemp(join(tmpdir(), "rel-"));
  try {
    await writeFile(join(d, "a.txt"), "one");
    const h1 = await hashDir(d);
    assert.equal((await hashDir(d)).sha256, h1.sha256);
    await writeFile(join(d, "a.txt"), "two");
    const h2 = await hashDir(d);
    assert.notEqual(h2.sha256, h1.sha256);
    await mkdir(join(d, "s"));
    await writeFile(join(d, "s", "b.txt"), "x");
    assert.notEqual((await hashDir(d)).sha256, h2.sha256);
    assert.equal((await hashDir(d)).files, 2);
  } finally { await rm(d, { recursive: true, force: true }); }
});

async function goodFolder() {
  const d = await mkdtemp(join(tmpdir(), "dep-"));
  const page = (extra = "") => `<!doctype html><link rel="canonical" href="${EXPECTED.site}/"><h1>Title</h1><a href="${FACEBOOK_NOW}">f</a>${extra}`;
  for (const p of PAGES) {
    const f = join(d, pageFile(p)); await mkdir(join(f, ".."), { recursive: true });
    const extra = p === "/" ? `<form id="intake"><div class="cf-turnstile" data-sitekey="0xAAAA"></div><input name="website"></form><script src="/js/turnstile-lifecycle.js"></script><img src="/assets/img/a.jpg">` : "";
    await writeFile(f, page(extra));
  }
  for (const f of ["js/turnstile-lifecycle.js", "js/intake-context.js", "js/analytics.js", "js/main.js", "css/styles.css", "llms.txt"]) { await mkdir(join(d, f, ".."), { recursive: true }); await writeFile(join(d, f), "x"); }
  await writeFile(join(d, "robots.txt"), `User-agent: *\nDisallow: /api/\nSitemap: ${EXPECTED.site}/sitemap.xml\n`);
  await writeFile(join(d, "sitemap.xml"), PAGES.map((p) => `<loc>${EXPECTED.site}${p}</loc>`).join(""));
  await mkdir(join(d, "assets/img"), { recursive: true });
  for (let i = 0; i < 160; i++) await writeFile(join(d, `assets/img/img${i}.webp`), "x");
  await writeFile(join(d, "assets/img/a.jpg"), "x");
  return d;
}

test("a complete deploy folder passes", async () => {
  const d = await goodFolder();
  try { assert.deepEqual(await checkDeployFolder(d), []); } finally { await rm(d, { recursive: true, force: true }); }
});

test("each missing piece of the folder is reported", async () => {
  const cases = [
    ["page missing", (d) => rm(join(d, "gallery/index.html")), /page missing: \/gallery\//],
    ["turnstile", async (d) => writeFile(join(d, "index.html"), `<link rel="canonical" href="x"><h1>t</h1><a href="${FACEBOOK_NOW}">f</a><form id="i"><input name="website"></form>`), /Turnstile/],
    ["honeypot", async (d) => writeFile(join(d, "index.html"), `<link rel="canonical" href="x"><h1>t</h1><a href="${FACEBOOK_NOW}">f</a><form id="i"><div class="cf-turnstile" data-sitekey="0xAA"></div></form><script src="/js/turnstile-lifecycle.js"></script>`), /honeypot/],
    ["managed robots", (d) => writeFile(join(d, "robots.txt"), `# BEGIN Cloudflare Managed content\nDisallow: /api/\nSitemap: ${EXPECTED.site}/sitemap.xml`), /managed block/],
    ["two sitemap lines", (d) => writeFile(join(d, "robots.txt"), `Disallow: /api/\nSitemap: a\nSitemap: b`), /exactly one Sitemap/],
    ["sitemap", (d) => writeFile(join(d, "sitemap.xml"), "<loc></loc>"), /sitemap does not list/],
    ["broken image", (d) => rm(join(d, "assets/img/a.jpg")), /referenced file is not in the folder: \/assets\/img\/a\.jpg/],
    ["two h1", (d) => writeFile(join(d, "about/index.html"), `<link rel="canonical" href="x"><h1>a</h1><h1>b</h1>`), /about\/index\.html: needs exactly one H1/],
    ["no canonical", (d) => writeFile(join(d, "about/index.html"), `<h1>a</h1>`), /canonical/],
    ["forbidden owner photo", (d) => writeFile(join(d, "assets/img/wesleigh-behn.jpg"), "x"), /forbidden file would be published: assets\/img\/wesleigh-behn\.jpg/],
    ["old facebook link", (d) => writeFile(join(d, "gallery/index.html"), `<link rel="canonical" href="x"><h1>a</h1><a href="${FACEBOOK_NOW}">n</a><a href="${FACEBOOK_OLD[0]}">o</a>`), /gallery\/index\.html: contains an old Facebook link/],
    ["missing facebook link", (d) => writeFile(join(d, "gallery/index.html"), `<link rel="canonical" href="x"><h1>a</h1>`), /gallery\/index\.html: current Facebook link is missing/],
    ["intake script", (d) => rm(join(d, "js/intake-context.js")), /intake-context/],
    ["too few images", async (d) => { for (let i = 0; i < 20; i++) await rm(join(d, `assets/img/img${i}.webp`)); }, /only \d+ image files/],
  ];
  for (const [name, mutate, expected] of cases) {
    const d = await goodFolder();
    try { await mutate(d); assert.match((await checkDeployFolder(d)).join("\n"), expected, name); } finally { await rm(d, { recursive: true, force: true }); }
  }
});

const SHA = "a".repeat(40);
const base = () => ({
  report: { commit: SHA, cloudflareVerified: true, previousVersionId: ID1, folder: { sha256: "f" }, preparedAt: new Date().toISOString() },
  head: SHA, originMain: SHA, fetchOk: true, dirtyFiles: [], folderSha: "f", currentVersionId: ID1, provenance: { ok: true, pr: 12, why: "merged" }, branch: "main",
});

test("deploy readiness passes only when everything lines up", () => {
  assert.deepEqual(checkDeployReadiness(base()), []);
});

test("deploy readiness refuses every unsafe state", () => {
  const refuse = (mut, re) => { const b = base(); mut(b); assert.match(checkDeployReadiness(b).join("\n"), re); };
  refuse((b) => { b.report = null; }, /run npm run release:prepare/);
  refuse((b) => { b.branch = "feature"; }, /only from main/);
  refuse((b) => { b.dirtyFiles = ["x"]; }, /not clean/);
  refuse((b) => { b.fetchOk = false; }, /git fetch origin failed/);
  refuse((b) => { b.head = "b".repeat(40); b.originMain = "b".repeat(40); }, /prepared commit/);
  refuse((b) => { b.originMain = "c".repeat(40); }, /latest origin\/main/);
  refuse((b) => { b.provenance = { ok: false, why: "gh unavailable" }; }, /provenance not established: gh unavailable/);
  refuse((b) => { b.provenance = undefined; }, /provenance not established/);
  refuse((b) => { b.report.cloudflareVerified = false; }, /Cloudflare/);
  refuse((b) => { b.report.previousVersionId = null; }, /no rollback version id/);
  refuse((b) => { b.currentVersionId = null; }, /could not be read now/);
  refuse((b) => { b.currentVersionId = ID2; }, /production changed since prepare .*run prepare again/);
  refuse((b) => { b.folderSha = "other"; }, /changed after prepare/);
  refuse((b) => { b.now = Date.now() + 3 * 3600_000; }, /older than 2 hours/);
  refuse((b) => { b.report.preparedAt = "garbage"; }, /older than 2 hours|valid time/);
});

test("an aborted prepare cannot leave a reusable report, writes are whole, and a report is single use", async () => {
  const d = await mkdtemp(join(tmpdir(), "state-"));
  try {
    await writeReportAtomic(d, { commit: SHA, canDeploy: true });
    assert.equal(JSON.parse(await readFile(join(d, "prepare.json"), "utf8")).canDeploy, true);
    assert.equal((await readdir(d)).includes("prepare.json.tmp"), false);
    await writeFile(join(d, "prepare.json.tmp"), "{half");
    await clearPrepareState(d);
    assert.deepEqual(await readdir(d), []);
    await clearPrepareState(d); // safe when nothing exists
    await writeReportAtomic(d, { commit: SHA });
    await consumePrepareReport(d, 123);
    const files = await readdir(d);
    assert.equal(files.includes("prepare.json"), false);
    assert.ok(files.includes("prepare-used-123.json"));
  } finally { await rm(d, { recursive: true, force: true }); }
});

test("prepare clears stale state before any other work, and deploy consumes the report before deploying", async () => {
  const src = await readFile(new URL("../scripts/release.mjs", import.meta.url), "utf8");
  const prep = src.slice(src.indexOf("async function prepare()"), src.indexOf("export async function liveChecks"));
  assert.ok(prep.indexOf("clearPrepareState(REL)") > -1 && prep.indexOf("clearPrepareState(REL)") < prep.indexOf("repoState()"));
  assert.ok(prep.indexOf("writeReportAtomic") > prep.indexOf("checkBindings"), "the report is written only after every check");
  const dep = src.slice(src.indexOf("async function deploy()"), src.indexOf("async function checkWrangler"));
  assert.ok(dep.indexOf("consumePrepareReport(REL)") > dep.indexOf("deploy production") && dep.indexOf("consumePrepareReport(REL)") < dep.indexOf('"wrangler", "deploy"'));
  assert.ok(dep.indexOf("fetchOk: fetchR.code === 0") > -1, "deploy passes the fetch result to the readiness check");
});

test("deploy without a prepare report refuses and changes nothing", () => {
  let out = "", code = 0;
  try { execFileSync("node", ["scripts/release.mjs", "deploy"], { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 }); }
  catch (e) { code = e.status; out = `${e.stdout}${e.stderr}`; }
  assert.equal(code, 1);
  assert.match(out, /STOPPED: not safe to deploy/);
  assert.doesNotMatch(out, /Type "deploy production"/);
});

test("rollback command is printed with the recorded version id", () => {
  assert.equal(rollbackCommand(ID1), `npx wrangler rollback ${ID1} --message "rollback after release"`);
});

test("the overlay script no longer edits live files in place, and it checks instead", async () => {
  const src = await readFile(new URL("../scripts/build-live-overlay.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /Patched the home page hero/);
  assert.doesNotMatch(src, /home\.replace\(/);
  assert.doesNotMatch(src, /split\(from\)\.join\(FACEBOOK_NOW\)/);
  assert.match(src, /Verified without editing/);
  assert.match(src, /FORBIDDEN_FILES/);
  assert.match(src, /FACEBOOK_OLD/);
});

test("the owner photo is excluded from a direct Eleventy build, while the repository still holds it", async () => {
  const out = await mkdtemp(join(tmpdir(), "build-"));
  try {
    execFileSync("npx", ["eleventy", `--output=${out}`], { cwd: new URL("..", import.meta.url).pathname, stdio: "ignore", timeout: 180000 });
    for (const f of FORBIDDEN_FILES) {
      await assert.rejects(stat(join(out, f)), `${f} must not be in the build`);
    }
    assert.ok((await stat(join(out, "assets/img/belmont-hero.jpg"))).isFile(), "other images are still copied");
    assert.ok((await stat(new URL("../assets/img/wesleigh-behn.jpg", import.meta.url))).isFile(), "the file stays in the repository");
  } finally { await rm(out, { recursive: true, force: true }); }
});


test("npm run deploy is guarded: it refuses, and the release commands exist", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(pkg.scripts.deploy, /process\.exit\(1\)/);
  assert.doesNotMatch(pkg.scripts.deploy, /wrangler/);
  for (const k of ["release:prepare", "release:deploy", "release:verify-live", "release:rollback-info", "release:parity"]) assert.ok(pkg.scripts[k], k);
  assert.match(pkg.scripts["deploy:direct-unsafe"], /wrangler deploy/);
});

test("agent instructions carry the deployment rules", async () => {
  const agents = await readFile(new URL("../AGENTS.md", import.meta.url), "utf8");
  const claude = await readFile(new URL("../CLAUDE.md", import.meta.url), "utf8");
  for (const needle of ["docs/DEPLOY-LIVE.md", "Never deploy `_site` directly", "pushed", "merged", "deployed", "not logged in to Wrangler", "owner's approval"]) assert.ok(agents.includes(needle), needle);
  assert.ok(claude.includes("docs/DEPLOY-LIVE.md"));
});
