// Pure helpers for scripts/release.mjs. No network, no Cloudflare calls, no deploys. Tested in tests/release-lib.test.mjs.
import { createHash } from "node:crypto";
import { readdir, readFile, rename, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { join, posix, relative } from "node:path";

export const EXPECTED = {
  repo: "collabconstruction/collaborativeconstructionllc.com",
  accountId: "0fadcd0965374caa75a44c3aa9784042",
  worker: "collaborativeconstructionllc-com",
  site: "https://collaborativeconstructionllc.com",
  // Bindings that must survive every release. They are read from the dry run output.
  bindings: ["DB", "ATTACHMENTS", "SEND_EMAIL", "INTAKE_RATE_LIMITER", "LEAD_INBOX", "LEAD_FROM_ADDRESS", "ASSETS"],
  database: "cc-leads",
  bucket: "cc-lead-attachments",
};

export const FACEBOOK_NOW = "https://www.facebook.com/profile.php?id=61595651094549";
export const FACEBOOK_OLD = [
  "https://www.facebook.com/people/Collaborative-Construction/61595651094549/",
  "https://www.facebook.com/profile.php?id=61593017512930",
];
/** Files that must never be published, by any route (overlay, direct build, preview). */
export const FORBIDDEN_FILES = ["assets/img/wesleigh-behn.jpg"];

export const PAGES = ["/", "/about/", "/gallery/", "/construction-advisory/", "/adu-builder-cape-cod/", "/custom-home-builder-cape-cod/", "/home-additions-cape-cod/", "/home-renovation-cape-cod/", "/general-contractor-falmouth-ma/"];
export const pageFile = (p) => (p.endsWith("/") ? p.slice(1) + "index.html" : p.slice(1));

/** The contact form depends on these files being served. */
export const INTAKE_FILES = ["js/turnstile-lifecycle.js", "js/intake-context.js", "js/analytics.js", "js/main.js", "css/styles.css"];

export function repoFromRemote(url) {
  const m = /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\s*$/.exec(String(url).trim());
  return m ? m[1] : null;
}

/** `wrangler whoami` text: accept only when the expected account id is listed. Not authenticated fails closed. */
export function parseWhoami(text, accountId = EXPECTED.accountId) {
  const t = String(text);
  if (/not authenticated|not logged in/i.test(t)) return { ok: false, why: "Wrangler is not logged in on this machine (run: npx wrangler login)" };
  if (!t.includes(accountId)) return { ok: false, why: `Wrangler is logged in, but account ${accountId} is not listed` };
  return { ok: true, why: `account ${accountId} is available` };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every complete JSON array or object in text that may also hold log lines (banners, warnings, braces in messages). */
export function extractJsonAll(text) {
  const t = String(text), found = [];
  let start = 0;
  while (start < t.length) {
    const open = t[start];
    if (open !== "[" && open !== "{") { start++; continue; }
    const close = open === "[" ? "]" : "}";
    let depth = 0, inStr = false, end = -1;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (inStr) { if (c === "\\") i++; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close && --depth === 0) { end = i; break; }
    }
    if (end > -1) {
      try { found.push(JSON.parse(t.slice(start, end + 1))); start = end + 1; continue; } catch { /* not JSON, move on */ }
    }
    start++;
  }
  return found;
}

export const extractJson = (text) => extractJsonAll(text)[0] ?? null;

const deploymentList = (data) => (Array.isArray(data) ? data : data?.deployments ?? data?.result?.deployments);

/**
 * Rollback target from `wrangler deployments list --json`.
 * A deployment has its own id; `wrangler rollback` needs a Worker VERSION id. The version id lives in
 * `versions[].version_id`. The deployment id is never used as a version id. Fails closed unless the
 * newest deployment sends 100 percent of traffic to exactly one version (a gradual rollout has no single target).
 */
export function pickRollbackVersion(text) {
  const list = extractJsonAll(text).map(deploymentList).find((l) => Array.isArray(l) && l.length && l.every((d) => d && typeof d === "object" && !Array.isArray(d)));
  if (!list) return { ok: false, why: "no deployments found in the Wrangler output" };
  const when = (d) => Date.parse(d.created_on ?? d.createdOn ?? "") || 0;
  const newest = [...list].sort((a, b) => when(b) - when(a))[0];
  const versions = newest?.versions;
  if (!Array.isArray(versions) || versions.length === 0) return { ok: false, why: "the newest deployment lists no versions, so a version id cannot be established" };
  if (versions.length !== 1) return { ok: false, why: `the newest deployment splits traffic across ${versions.length} versions (gradual rollout): no single rollback target` };
  const v = versions[0];
  if (v.percentage !== undefined && Number(v.percentage) !== 100) return { ok: false, why: `the only version receives ${v.percentage} percent of traffic` };
  if (typeof v.version_id !== "string" || !UUID.test(v.version_id)) return { ok: false, why: "the version id is missing or not a valid id" };
  return { ok: true, versionId: v.version_id, deploymentId: UUID.test(newest.id ?? "") ? newest.id : null };
}

/** Which merged pull request produced this commit. `gh api repos/<repo>/commits/<sha>/pulls` output, one JSON object per line. Unknown or unavailable never counts as approved. */
export function checkProvenance(text, head) {
  const prs = String(text).split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!prs.length) return { ok: false, why: "GitHub did not confirm any merged pull request for this commit (gh unavailable, not logged in, or none)" };
  const hit = prs.find((p) => p.merged_at && p.base === "main" && p.merge_commit_sha === head);
  if (!hit) return { ok: false, why: "no merged pull request into main has this exact commit as its merge commit" };
  return { ok: true, pr: hit.number, why: `merged by pull request #${hit.number}` };
}

/** Version id from `wrangler deploy` output ("Current Version ID: ..."). */
export function parseVersionId(text) {
  const m = /Current Version ID:\s*([0-9a-f-]{36})/i.exec(String(text));
  return m ? m[1] : null;
}

/** Dry run output must show every binding the contact form needs, with the expected database and bucket. */
export function checkBindings(dryRunText) {
  const t = String(dryRunText);
  const problems = EXPECTED.bindings.filter((b) => !new RegExp(`env\\.${b}\\b`).test(t)).map((b) => `binding ${b} is missing from the dry run`);
  if (!t.includes(`(${EXPECTED.database})`)) problems.push(`database ${EXPECTED.database} is not bound`);
  if (!t.includes(`(${EXPECTED.bucket})`)) problems.push(`bucket ${EXPECTED.bucket} is not bound`);
  if (/cc-intel/.test(t)) problems.push("an HQ database (cc-intel) appears in the public website config");
  return problems;
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out.sort();
}

/** Fingerprint of a folder: sha256 over every relative path and file hash. Changes if anything is added, removed or edited. */
export async function hashDir(dir) {
  const h = createHash("sha256");
  let files = 0, bytes = 0;
  for (const f of await walk(dir)) {
    const buf = await readFile(f);
    h.update(relative(dir, f).split("\\").join("/") + "\0" + createHash("sha256").update(buf).digest("hex") + "\n");
    files++; bytes += buf.length;
  }
  return { sha256: h.digest("hex"), files, bytes };
}

const LOCAL_REF = /(?:src|href|data-src|poster|imagesrcset|srcset|content)=["']([^"']+)["']/gi;
const CSS_URL = /url\(\s*["']?(\/[^"')\s]+)["']?\s*\)/gi;

/** Local file paths a page refers to (images, scripts, styles, fonts). Ignores external links, mail, tel, anchors, api and page links. */
export function localRefs(html) {
  const refs = new Set();
  const take = (raw) => {
    for (const part of raw.split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (!u.startsWith("/") || u.startsWith("//") || u.startsWith("/api/")) continue;
      const p = u.split("#")[0].split("?")[0];
      if (/\.[a-z0-9]{2,5}$/i.test(p) && !/\.html?$/i.test(p)) refs.add(p);
    }
  };
  for (const m of html.matchAll(LOCAL_REF)) take(m[1]);
  for (const m of html.matchAll(CSS_URL)) take(m[1]);
  return [...refs];
}

const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

/** Everything a deploy folder must satisfy before it may be uploaded. Returns a list of problems; empty means pass. */
export async function checkDeployFolder(dir) {
  const problems = [];
  for (const p of PAGES) if (!(await exists(join(dir, pageFile(p))))) problems.push(`page missing: ${p}`);
  for (const f of [...INTAKE_FILES, "robots.txt", "sitemap.xml", "llms.txt"]) if (!(await exists(join(dir, f)))) problems.push(`required file missing: ${f}`);

  const robots = (await exists(join(dir, "robots.txt"))) ? await readFile(join(dir, "robots.txt"), "utf8") : "";
  if (/BEGIN Cloudflare Managed/i.test(robots)) problems.push("robots.txt contains Cloudflare's managed block (it must come from the repo build)");
  if ((robots.match(/^Sitemap:/gim) ?? []).length !== 1) problems.push("robots.txt must have exactly one Sitemap line");
  if (!/^Disallow:\s*\/api\//im.test(robots)) problems.push("robots.txt must disallow /api/");

  const sitemap = (await exists(join(dir, "sitemap.xml"))) ? await readFile(join(dir, "sitemap.xml"), "utf8") : "";
  for (const p of PAGES) if (!sitemap.includes(`${EXPECTED.site}${p}`)) problems.push(`sitemap does not list ${p}`);

  const home = (await exists(join(dir, "index.html"))) ? await readFile(join(dir, "index.html"), "utf8") : "";
  if (!/cf-turnstile/.test(home)) problems.push("home page has no Turnstile widget");
  if (!/data-sitekey="0x[A-Za-z0-9_-]+"/.test(home)) problems.push("Turnstile widget has no site key");
  if (!/name="(?:cc_x7q2m9|website|company|url|hp|honeypot)[^"]*"|class="[^"]*(?:hp-field|hp|honeypot)[^"]*"/i.test(home)) problems.push("home page has no honeypot field");
  if (!/<form[^>]+(?:id|action)=/i.test(home)) problems.push("home page has no contact form");
  if (!/\/js\/turnstile-lifecycle\.js/.test(home)) problems.push("home page does not load turnstile-lifecycle.js");

  const missingRefs = new Map();
  for (const f of (await walk(dir)).filter((x) => x.endsWith(".html"))) {
    const html = await readFile(f, "utf8");
    const page = "/" + relative(dir, f).split("\\").join("/");
    if (!html.includes(FACEBOOK_NOW)) problems.push(`${page}: current Facebook link is missing`);
    for (const old of FACEBOOK_OLD) if (html.includes(old)) problems.push(`${page}: contains an old Facebook link`);
    if ((html.match(/<h1[\s>]/gi) ?? []).length !== 1) problems.push(`${page}: needs exactly one H1`);
    if ((html.match(/<link[^>]+rel=["']canonical["']/gi) ?? []).length !== 1) problems.push(`${page}: needs exactly one canonical tag`);
    for (const ref of localRefs(html)) {
      if (!(await exists(join(dir, ref.slice(1))))) (missingRefs.get(ref) ?? missingRefs.set(ref, []).get(ref)).push(page);
    }
  }
  for (const [ref, pages] of missingRefs) problems.push(`referenced file is not in the folder: ${ref} (used by ${pages.slice(0, 3).join(", ")}${pages.length > 3 ? ", ..." : ""})`);

  const all = (await walk(dir)).map((f) => relative(dir, f).split("\\").join("/"));
  for (const f of FORBIDDEN_FILES) if (all.includes(f)) problems.push(`forbidden file would be published: ${f}`);

  const images = (await walk(dir)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).length;
  if (images < 150) problems.push(`only ${images} image files (expected 150 or more)`);
  return problems;
}

/** Decides if the prepared folder and repo state may be deployed. Pure, so every refusal is testable. */
export function checkDeployReadiness({ report, head, originMain, fetchOk, dirtyFiles, folderSha, currentVersionId, provenance, now = Date.now(), maxAgeMs = 2 * 3600_000, branch }) {
  const problems = [];
  if (!report) return ["no prepare report found: run npm run release:prepare first"];
  if (branch !== "main") problems.push(`deploys come only from main (current branch: ${branch})`);
  if (dirtyFiles?.length) problems.push(`working tree is not clean (${dirtyFiles.length} changed file(s))`);
  if (!fetchOk) problems.push("git fetch origin failed, so origin/main cannot be trusted");
  if (report.commit !== head) problems.push(`prepared commit ${String(report.commit).slice(0, 7)} is not the current commit ${head.slice(0, 7)}`);
  if (head !== originMain) problems.push("the current commit is not the latest origin/main (not pushed, or main moved)");
  if (!provenance?.ok) problems.push(`release provenance not established: ${provenance?.why ?? "not checked"}`);
  if (!report.cloudflareVerified) problems.push("prepare did not verify the Cloudflare account");
  if (!report.previousVersionId) problems.push("no rollback version id was recorded at prepare");
  if (!currentVersionId) problems.push("the current production version could not be read now");
  else if (report.previousVersionId && currentVersionId !== report.previousVersionId) problems.push(`production changed since prepare (was ${report.previousVersionId}, now ${currentVersionId}): run prepare again`);
  if (report.folder?.sha256 !== folderSha) problems.push("the _deploy folder changed after prepare");
  if (!(now - Date.parse(report.preparedAt) <= maxAgeMs)) problems.push("the prepare report is older than 2 hours (or has no valid time): run prepare again");
  return problems;
}

/**
 * What happened to production after `wrangler deploy`, from three separate pieces of evidence:
 *   upload  - did the Wrangler command exit 0
 *   active  - does Cloudflare's own deployment list show the new version as current
 *   (live HTTP checks and the SEO audit are judged separately in classifyOutcome)
 * Cloudflare's listing can lag a fresh deployment, so `observations` is a series of reads over time and one stale
 * read never decides anything. A successful upload is never reported as "not deployed".
 */
export function judgeDeployment({ wranglerExit, printedVersionId, beforeVersionId, observations = [] }) {
  const upload = wranglerExit === 0 ? "succeeded" : "failed";
  const good = observations.filter((o) => o?.ok && o.versionId);
  const latest = good[good.length - 1];
  if (upload === "succeeded") {
    if (printedVersionId) {
      if (good.some((o) => o.versionId === printedVersionId)) return { upload, active: "confirmed", versionId: printedVersionId, note: "Cloudflare lists the new version as current" };
      if (!good.length) return { upload, active: "unconfirmed", versionId: printedVersionId, note: "Cloudflare's deployment list could not be read after the upload" };
      if (latest.versionId === beforeVersionId) return { upload, active: "unconfirmed", versionId: printedVersionId, note: "Cloudflare still lists the previous version (the listing may be lagging)" };
      return { upload, active: "unconfirmed", versionId: printedVersionId, note: `Cloudflare lists a different version (${latest.versionId}) as current` };
    }
    const changed = good.find((o) => o.versionId !== beforeVersionId);
    if (changed) return { upload, active: "confirmed", versionId: changed.versionId, note: "Cloudflare lists a new version as current (Wrangler did not print its id)" };
    return { upload, active: "unconfirmed", versionId: null, note: "Wrangler printed no version id and Cloudflare shows no new version yet" };
  }
  if (good.some((o) => o.versionId !== beforeVersionId)) return { upload, active: "confirmed", versionId: good.find((o) => o.versionId !== beforeVersionId).versionId, note: "Wrangler reported an error, but Cloudflare lists a new version as current" };
  if (good.length && good.every((o) => o.versionId === beforeVersionId)) return { upload, active: "not-changed", versionId: null, note: "Cloudflare still lists the previous version" };
  return { upload, active: "unknown", versionId: null, note: "Wrangler failed and Cloudflare's deployment list could not be read" };
}

/** Reads Cloudflare's current version repeatedly until it shows `wanted` (or something other than `before` when wanted is unknown). Pure apart from the injected read and sleep. */
export async function pollForVersion({ read, sleep, wanted, before, attempts = 6, delayMs = 10_000 }) {
  const observations = [];
  for (let i = 0; i < attempts; i++) {
    const o = await read();
    observations.push(o);
    if (o?.ok && (wanted ? o.versionId === wanted : o.versionId !== before)) break;
    if (i < attempts - 1) await sleep(delayMs);
  }
  return observations;
}

/**
 * Final outcome. Exit codes: 0 deployed and everything verified; 1 not deployed; 2 deployed but live checks failed;
 * 3 deployed and active, live checks passed, SEO audit failed; 4 unknown whether production changed;
 * 5 deployed (Wrangler succeeded) but Cloudflare has not confirmed the new version is active.
 */
export function classifyOutcome({ judgement, liveFailed = 0, seoOk = true }) {
  const j = judgement;
  const stages = [
    `Wrangler upload:        ${j.upload}`,
    `Active version:         ${j.active === "confirmed" ? "confirmed by Cloudflare (" + j.versionId + ")" : j.active === "not-changed" ? "unchanged (previous version still current)" : "NOT CONFIRMED: " + j.note}`,
    `Live HTTP checks:       ${liveFailed > 0 ? liveFailed + " FAILED" : liveFailed === 0 && j.active !== "not-changed" && j.active !== "unknown" ? "passed" : "not run"}`,
    `SEO audit:              ${seoOk ? "passed" : "FAILED"}`,
  ];
  let code, label;
  if (j.upload === "failed" && j.active === "not-changed") ({ code, label } = { code: 1, label: "NOT DEPLOYED: Wrangler failed and Cloudflare still lists the previous version" });
  else if (j.upload === "failed" && j.active === "unknown") ({ code, label } = { code: 4, label: "UNKNOWN: Wrangler failed and Cloudflare could not be read. Run: npx wrangler deployments list" });
  else if (liveFailed > 0) ({ code, label } = { code: 2, label: `DEPLOYED, BUT ${liveFailed} LIVE CHECK(S) FAILED` });
  else if (j.active !== "confirmed") ({ code, label } = { code: 5, label: "DEPLOYED (Wrangler succeeded), BUT CLOUDFLARE HAS NOT CONFIRMED THE NEW VERSION IS ACTIVE. Do not call this verified. Run: npx wrangler deployments list" });
  else if (!seoOk) ({ code, label } = { code: 3, label: "DEPLOYED and active, live checks passed, BUT THE SEO AUDIT FAILED" });
  else ({ code, label } = { code: 0, label: "DEPLOYED and verified (upload, active version, live checks, SEO audit)" });
  return { code, label, stages };
}

export const rollbackCommand = (id) => `npx wrangler rollback ${id} --message "rollback after release"`;

// ---- prepare report state: never stale, never half written, single use ----

/** Called first thing in prepare: an aborted or failed prepare must not leave an older deployable report behind. */
export async function clearPrepareState(dir) {
  await rm(join(dir, "prepare.json"), { force: true });
  await rm(join(dir, "prepare.json.tmp"), { force: true });
}

/** Writes the report in one step: readers see the old file or the new one, never part of one. */
export async function writeReportAtomic(dir, report) {
  await mkdir(dir, { recursive: true });
  const tmp = join(dir, "prepare.json.tmp");
  await writeFile(tmp, JSON.stringify(report, null, 2));
  await rename(tmp, join(dir, "prepare.json"));
}

/** A prepare report authorizes one deploy attempt. Moving it aside means it cannot authorize another. */
export async function consumePrepareReport(dir, stamp = Date.now()) {
  await rename(join(dir, "prepare.json"), join(dir, `prepare-used-${stamp}.json`));
}
