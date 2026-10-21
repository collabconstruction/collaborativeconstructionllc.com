import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXPECTED, PAGES, pageFile, repoFromRemote, parseWhoami, latestDeploymentId, parseVersionId, checkBindings,
  hashDir, localRefs, checkDeployFolder, checkDeployReadiness, rollbackCommand,
} from "../scripts/lib/release-lib.mjs";

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

test("latest deployment id is the newest one and must look like a uuid", () => {
  const list = [{ id: ID1, created_on: "2026-10-20T10:00:00Z" }, { id: ID2, created_on: "2026-10-21T10:00:00Z" }];
  assert.equal(latestDeploymentId(JSON.stringify(list)), ID2);
  assert.equal(latestDeploymentId(JSON.stringify([...list].reverse())), ID2);
  assert.equal(latestDeploymentId("[]"), null);
  assert.equal(latestDeploymentId("not json"), null);
  assert.equal(latestDeploymentId(JSON.stringify([{ id: "x", created_on: "2026-10-21T10:00:00Z" }])), null);
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
  const page = (extra = "") => `<!doctype html><link rel="canonical" href="${EXPECTED.site}/"><h1>Title</h1>${extra}`;
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
    ["turnstile", async (d) => writeFile(join(d, "index.html"), `<link rel="canonical" href="x"><h1>t</h1><form id="i"><input name="website"></form>`), /Turnstile/],
    ["honeypot", async (d) => writeFile(join(d, "index.html"), `<link rel="canonical" href="x"><h1>t</h1><form id="i"><div class="cf-turnstile" data-sitekey="0xAA"></div></form><script src="/js/turnstile-lifecycle.js"></script>`), /honeypot/],
    ["managed robots", (d) => writeFile(join(d, "robots.txt"), `# BEGIN Cloudflare Managed content\nDisallow: /api/\nSitemap: ${EXPECTED.site}/sitemap.xml`), /managed block/],
    ["two sitemap lines", (d) => writeFile(join(d, "robots.txt"), `Disallow: /api/\nSitemap: a\nSitemap: b`), /exactly one Sitemap/],
    ["sitemap", (d) => writeFile(join(d, "sitemap.xml"), "<loc></loc>"), /sitemap does not list/],
    ["broken image", (d) => rm(join(d, "assets/img/a.jpg")), /referenced file is not in the folder: \/assets\/img\/a\.jpg/],
    ["two h1", (d) => writeFile(join(d, "about/index.html"), `<link rel="canonical" href="x"><h1>a</h1><h1>b</h1>`), /about\/index\.html: needs exactly one H1/],
    ["no canonical", (d) => writeFile(join(d, "about/index.html"), `<h1>a</h1>`), /canonical/],
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
  report: { commit: SHA, cloudflareVerified: true, previousDeploymentId: ID1, folder: { sha256: "f" }, preparedAt: new Date().toISOString() },
  head: SHA, originMain: SHA, dirtyFiles: [], folderSha: "f", branch: "main",
});

test("deploy readiness passes only when everything lines up", () => {
  assert.deepEqual(checkDeployReadiness(base()), []);
});

test("deploy readiness refuses every unsafe state", () => {
  const refuse = (mut, re) => { const b = base(); mut(b); assert.match(checkDeployReadiness(b).join("\n"), re); };
  refuse((b) => { b.report = null; }, /run npm run release:prepare/);
  refuse((b) => { b.branch = "feature"; }, /only from main/);
  refuse((b) => { b.dirtyFiles = ["x"]; }, /not clean/);
  refuse((b) => { b.head = "b".repeat(40); b.originMain = "b".repeat(40); }, /prepared commit/);
  refuse((b) => { b.originMain = "c".repeat(40); }, /latest origin\/main/);
  refuse((b) => { b.report.cloudflareVerified = false; }, /Cloudflare/);
  refuse((b) => { b.report.previousDeploymentId = null; }, /rollback/);
  refuse((b) => { b.folderSha = "other"; }, /changed after prepare/);
  refuse((b) => { b.now = Date.now() + 3 * 3600_000; }, /older than 2 hours/);
});

test("rollback command is printed with the recorded id and never needs a guess", () => {
  assert.equal(rollbackCommand(ID1), `npx wrangler rollback ${ID1} --message "rollback after release"`);
});
