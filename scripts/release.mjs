#!/usr/bin/env node
/**
 * One command release tooling for the public website. It wraps the existing steps; it does not replace them.
 *
 *   npm run release:prepare        checks everything and builds _deploy. Never changes production.
 *   npm run release:deploy         deploys the prepared folder after two explicit confirmations.
 *   npm run release:verify-live    checks the live site (read only).
 *   npm run release:rollback-info  prints the rollback command for the last release (does not run it).
 *
 * Flags: prepare --no-cloudflare   (cloud workspace without Wrangler login: builds and checks, but the result can never be deployed)
 *        prepare --allow-missing /path   (accept a live file that is referenced but not retrievable; recorded in the report)
 *        prepare --allow-branch          (prepare from a branch other than main for a preview of the checks; cannot be deployed)
 *        deploy --confirm <first 7 characters of the commit>
 *
 * Every check fails closed. See docs/DEPLOY-LIVE.md.
 */
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXPECTED, PAGES, checkBindings, checkDeployFolder, checkDeployReadiness, hashDir, latestDeploymentId,
  parseVersionId, parseWhoami, repoFromRemote, rollbackCommand,
} from "./lib/release-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REL = join(ROOT, ".release");
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n) => args.includes(`--${n}`);
const flagValue = (n) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : undefined; };
const allMulti = (n) => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []));

const say = (m = "") => console.log(m);
const ok = (m) => say(`  PASS  ${m}`);
const warn = (m) => say(`  WARN  ${m}`);
function stop(m, extra = []) {
  console.error(`\nSTOPPED: ${m}`);
  for (const e of extra) console.error(`  - ${e}`);
  process.exit(1);
}

function run(file, a, opts = {}) {
  const r = spawnSync(file, a, { cwd: ROOT, encoding: "utf8", env: { ...process.env, NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY ?? "1" }, maxBuffer: 64 * 1024 * 1024, ...opts });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}
const git = (...a) => run("git", a).out.trim();
const step = (title, file, a) => {
  say(`\n> ${title}`);
  const r = run(file, a);
  if (r.code !== 0) { console.error(r.out.split("\n").slice(-25).join("\n")); stop(`${title} failed`); }
  ok(title);
  return r.out;
};

function repoState() {
  const remote = git("remote", "get-url", "origin");
  return {
    repo: repoFromRemote(remote),
    branch: git("rev-parse", "--abbrev-ref", "HEAD"),
    head: git("rev-parse", "HEAD"),
    dirty: git("status", "--porcelain").split("\n").filter(Boolean),
  };
}

function approvedPr(head) {
  const r = run("gh", ["api", `repos/${EXPECTED.repo}/commits/${head}/pulls`, "--jq", ".[] | select(.merged_at != null) | .number"]);
  if (r.code !== 0) return { known: false };
  const n = r.out.split("\n").map((x) => x.trim()).filter((x) => /^\d+$/.test(x))[0];
  return { known: true, pr: n ? Number(n) : null };
}

function cloudflare() {
  const who = parseWhoami(run("npx", ["wrangler", "whoami"]).out);
  if (!who.ok) return { ok: false, why: who.why };
  const list = run("npx", ["wrangler", "deployments", "list", "--name", EXPECTED.worker, "--json"]);
  const id = latestDeploymentId(list.out.slice(list.out.indexOf("[") > -1 ? list.out.indexOf("[") : 0)) ?? latestDeploymentId(list.out);
  return { ok: true, why: who.why, previousDeploymentId: id };
}

async function prepare() {
  say("RELEASE PREPARE (no production change)");
  const st = repoState();
  say("\n> Repository and commit");
  if (st.repo !== EXPECTED.repo) stop(`wrong repository: ${st.repo} (expected ${EXPECTED.repo})`);
  ok(`repository ${st.repo}`);
  if (st.dirty.length) stop("working tree is not clean", st.dirty.slice(0, 10));
  ok("working tree clean");
  const fetchR = run("git", ["fetch", "origin"]);
  if (fetchR.code !== 0) stop("could not fetch origin", [fetchR.out.trim().slice(0, 200)]);
  const originMain = git("rev-parse", "origin/main");
  const canDeploy = st.branch === "main";
  if (!canDeploy && !flag("allow-branch")) stop(`on branch ${st.branch}. Deploys come only from main. Use --allow-branch to run the checks on a branch (it can never be deployed).`);
  if (canDeploy && st.head !== originMain) stop("main is not the same as origin/main (pull first, or push is missing)");
  if (!canDeploy) warn(`branch ${st.branch}: this prepare can be used for checks only`);
  else ok(`on main at ${st.head.slice(0, 7)}, equal to origin/main`);
  const pr = approvedPr(st.head);
  if (!pr.known) warn("could not ask GitHub which pull request merged this commit (gh not available or not logged in)");
  else if (pr.pr) ok(`merged by pull request #${pr.pr}`);
  else warn("GitHub shows no merged pull request for this commit (direct push?). The owner must confirm it was approved.");

  say("\n> Cloudflare account");
  let cf = { ok: false, previousDeploymentId: null, why: "skipped (--no-cloudflare)" };
  if (flag("no-cloudflare")) warn("Cloudflare not checked. This prepare can never be deployed.");
  else {
    cf = cloudflare();
    if (!cf.ok) stop(cf.why);
    ok(cf.why);
    if (!cf.previousDeploymentId) stop("could not read the current production deployment id (needed for rollback)");
    ok(`current production deployment id (for rollback): ${cf.previousDeploymentId}`);
  }

  step("Tests", "npm", ["test"]);
  step("Python tests", "python3", ["-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py"]);
  step("Build", "npm", ["run", "build"]);
  step("Release build checks", "node", ["scripts/verify-release-build.mjs"]);
  const overlayOut = step("Overlay: copy live site, add approved files", "node", ["scripts/build-live-overlay.mjs"]);
  if (!/^READY/m.test(overlayOut)) stop("the overlay did not report READY");

  say("\n> Live content retrieval");
  const manifest = JSON.parse(await readFile(join(REL, "overlay-manifest.json"), "utf8"));
  const allowed = new Set(allMulti("allow-missing"));
  const unaccepted = manifest.problems.filter((p) => !allowed.has(p.split(/\s+/)[0]));
  if (unaccepted.length) stop("some live files that pages reference could not be retrieved", [...unaccepted.slice(0, 15), "Fix the cause, or accept a known one with --allow-missing /path (recorded in the report)."]);
  ok(`${manifest.copied} live files copied, none missing${allowed.size ? ` (${allowed.size} accepted by flag)` : ""}`);

  say("\n> Deploy folder checks");
  const folderProblems = await checkDeployFolder(join(ROOT, "_deploy"));
  if (folderProblems.length) stop("the _deploy folder failed its checks", folderProblems.slice(0, 20));
  ok(`all ${PAGES.length} pages, contact form, Turnstile, honeypot, robots, sitemap, images and every local reference present`);
  const folder = await hashDir(join(ROOT, "_deploy"));
  ok(`${folder.files} files, fingerprint ${folder.sha256.slice(0, 12)}`);

  say("\n> Wrangler dry run (uploads nothing)");
  const dry = run("npx", ["wrangler", "deploy", "--assets", "_deploy", "--dry-run"]);
  if (dry.code !== 0) { console.error(dry.out.split("\n").slice(-20).join("\n")); stop("wrangler dry run failed"); }
  const bindingProblems = checkBindings(dry.out);
  if (bindingProblems.length) stop("the Worker bindings changed", bindingProblems);
  ok("bindings intact: D1 cc-leads, R2 cc-lead-attachments, email, rate limiter, inbox variables");

  const report = {
    preparedAt: new Date().toISOString(), commit: st.head, branch: st.branch, pullRequest: pr.pr ?? null,
    cloudflareVerified: cf.ok, previousDeploymentId: cf.previousDeploymentId, folder,
    liveFilesCopied: manifest.copied, acceptedMissing: [...allowed], canDeploy: canDeploy && cf.ok,
  };
  await mkdir(REL, { recursive: true });
  await writeFile(join(REL, "prepare.json"), JSON.stringify(report, null, 2));
  say(`\nREADY TO REVIEW: commit ${st.head.slice(0, 7)}, ${folder.files} files, nothing changed in production.`);
  if (report.canDeploy) say(`To deploy: npm run release:deploy -- --confirm ${st.head.slice(0, 7)}`);
  else say("This prepare cannot be deployed (it was run with --no-cloudflare or on a branch).");
  say(`Rollback target if needed: ${rollbackCommand(cf.previousDeploymentId ?? "<previous id>")}`);
}

export async function liveChecks(site = EXPECTED.site) {
  const results = [];
  const check = (name, pass, detail = "") => results.push({ name, pass, detail });
  const get = async (p, init) => { try { return await fetch(site + p, { redirect: "manual", ...init }); } catch (e) { return { status: 0, headers: new Headers(), text: async () => "", err: e.message }; } };
  for (const p of PAGES) { const r = await get(p); check(`page ${p}`, r.status === 200, r.err ? `no answer: ${r.err}` : `HTTP ${r.status}`); }
  const home = await (await get("/")).text();
  check("home page has Turnstile and honeypot", /cf-turnstile/.test(home) && /data-sitekey=/.test(home) && /honeypot|name="(?:website|company|url|hp)/i.test(home));
  for (const f of ["/css/styles.css", "/js/main.js", "/js/turnstile-lifecycle.js", "/js/intake-context.js", "/js/gallery.js", "/sitemap.xml", "/llms.txt"]) { const r = await get(f); check(`file ${f}`, r.status === 200, `HTTP ${r.status}`); }
  const robots = await (await get("/robots.txt")).text();
  check("robots.txt has one Sitemap line", (robots.match(/^Sitemap:/gim) ?? []).length === 1);
  check("Cloudflare managed block appears at most once", (robots.match(/BEGIN Cloudflare Managed/gi) ?? []).length <= 1);
  const gal = await (await get("/gallery/")).text();
  const img = /\/assets\/img\/[A-Za-z0-9_\-./]+\.(?:webp|jpg)/.exec(gal)?.[0];
  if (img) { const r = await get(img); check(`gallery image ${img}`, r.status === 200, `HTTP ${r.status}`); }
  // Read only: a GET to the contact endpoint must be refused with 405 and Allow: POST. No submission is made.
  const contact = await get("/api/contact");
  check("contact endpoint answers GET with 405 and Allow: POST", contact.status === 405 && /POST/i.test(contact.headers.get("allow") ?? ""), `HTTP ${contact.status}`);
  return results;
}

async function verifyLive(site) {
  if (!process.env.NODE_USE_ENV_PROXY && (process.env.HTTPS_PROXY || process.env.https_proxy)) say("NOTE: a proxy is set. If every check shows no answer, run with NODE_USE_ENV_PROXY=1.");
  say(`LIVE CHECKS on ${site} (read only; the contact form is never submitted)`);
  const res = await liveChecks(site);
  for (const r of res) say(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? " (" + r.detail + ")" : ""}`);
  const seo = run("python3", ["scripts/seo_audit.py"]);
  say(`  ${seo.code === 0 ? "PASS" : "WARN"}  SEO audit of the nine pages (python3 scripts/seo_audit.py) exit ${seo.code}`);
  const bad = res.filter((r) => !r.pass);
  return { bad, seoExit: seo.code };
}

async function deploy() {
  say("RELEASE DEPLOY (changes production)");
  const report = JSON.parse(await readFile(join(REL, "prepare.json"), "utf8").catch(() => "null"));
  const st = repoState();
  run("git", ["fetch", "origin"]);
  const folder = await hashDir(join(ROOT, "_deploy")).catch(() => ({ sha256: "missing" }));
  const problems = checkDeployReadiness({ report, head: st.head, originMain: git("rev-parse", "origin/main"), dirtyFiles: st.dirty, folderSha: folder.sha256, branch: st.branch });
  if (!report?.canDeploy) problems.push("the last prepare was not deployable (run npm run release:prepare on main with Cloudflare logged in)");
  if (st.repo !== EXPECTED.repo) problems.push(`wrong repository ${st.repo}`);
  if (problems.length) stop("not safe to deploy", problems);
  const cf = cloudflare();
  if (!cf.ok) stop(cf.why);
  if (cf.previousDeploymentId !== report.previousDeploymentId) say(`NOTE: production changed since prepare (was ${report.previousDeploymentId}, now ${cf.previousDeploymentId}). Rollback target is the newer one.`);
  const before = cf.previousDeploymentId;

  say(`\nAbout to deploy to ${EXPECTED.site}`);
  say(`  commit        ${st.head.slice(0, 7)}${report.pullRequest ? " (pull request #" + report.pullRequest + ")" : ""}`);
  say(`  files         ${report.folder.files} (fingerprint ${report.folder.sha256.slice(0, 12)})`);
  say(`  account       ${EXPECTED.accountId}, Worker ${EXPECTED.worker}`);
  say(`  rollback to   ${before}`);
  if (flagValue("confirm") !== st.head.slice(0, 7)) stop(`add --confirm ${st.head.slice(0, 7)} to proceed`);
  if (!process.stdin.isTTY) stop("an interactive terminal is required: type the confirmation yourself");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = (await rl.question('\nType "deploy production" to continue: ')).trim();
  rl.close();
  if (typed !== "deploy production") stop("confirmation did not match; nothing was deployed");

  const r = run("npx", ["wrangler", "deploy", "--assets", "_deploy"]);
  say(r.out.split("\n").slice(-14).join("\n"));
  if (r.code !== 0) stop(`wrangler deploy failed. Production may be unchanged. Check: npx wrangler deployments list. Rollback if needed: ${rollbackCommand(before)}`);
  const versionId = parseVersionId(r.out);

  const { bad, seoExit } = await verifyLive(EXPECTED.site);
  const log = { deployedAt: new Date().toISOString(), commit: st.head, pullRequest: report.pullRequest, previousDeploymentId: before, newVersionId: versionId, liveChecksFailed: bad.map((b) => b.name), seoExit };
  await writeFile(join(REL, `deploy-${Date.now()}.json`), JSON.stringify(log, null, 2));
  say(`\nNew deployed version: ${versionId ?? "(not printed; run: npx wrangler deployments list)"}`);
  say(`Previous version:     ${before}`);
  say(`Rollback (not run):   ${rollbackCommand(before)}`);
  if (bad.length) { console.error(`\nATTENTION: ${bad.length} live check(s) failed. Consider rolling back with the command above and tell the owner.`); process.exit(2); }
  say("\nDeployed and live checks passed. Also open the site once in a browser, and run the owner approved contact test if the contact area changed.");
}

async function rollbackInfo() {
  const files = (await readdir(REL).catch(() => [])).filter((f) => f.startsWith("deploy-")).sort();
  const last = files.length ? JSON.parse(await readFile(join(REL, files[files.length - 1]), "utf8")) : null;
  const prep = JSON.parse(await readFile(join(REL, "prepare.json"), "utf8").catch(() => "null"));
  const id = last?.previousDeploymentId ?? prep?.previousDeploymentId;
  if (!id) stop("no recorded deployment id. Run: npx wrangler deployments list");
  say(`Last recorded release: ${last ? last.deployedAt + " (version " + last.newVersionId + ")" : "none deployed from this machine"}`);
  say("This command is only printed, never run by the tool:");
  say(`  ${rollbackCommand(id)}`);
}

const table = { prepare, deploy, "verify-live": () => verifyLive(flagValue("site") ?? EXPECTED.site).then(({ bad }) => process.exit(bad.length ? 1 : 0)), "rollback-info": rollbackInfo };
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!table[cmd]) stop("usage: node scripts/release.mjs prepare | deploy | verify-live | rollback-info");
  await table[cmd]();
}
