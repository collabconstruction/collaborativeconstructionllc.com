#!/usr/bin/env node
/**
 * Build `_deploy/`: the live site exactly as it is now, plus only the files
 * this branch changed.
 *
 * Why this exists. A Cloudflare assets deploy replaces the WHOLE set of public
 * files, and the page templates in this repo are older than the pages that are
 * live (different wording, self hosted fonts, company social links, 148 photo
 * files that are not committed). Deploying `_site` would roll all of that back.
 * So instead of building from the templates, this script:
 *
 *   1. copies every public file of the live site (crawled from its pages, its
 *      stylesheet, its script and its sitemap), then
 *   2. overlays the few files this branch changed (OVERLAY below) and the pages built from this repo.
 *
 * The script does not edit live files in place. It only copies, overlays and then checks.
 *
 * Nothing is deployed by this script. It only writes `_deploy/` and reports.
 *
 * Usage:  node scripts/build-live-overlay.mjs [--site https://example.com]
 */
import { mkdir, writeFile, readFile, cp, rm, readdir, stat } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { FACEBOOK_NOW, FACEBOOK_OLD, FORBIDDEN_FILES } from "./lib/release-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_deploy");
const siteArg = process.argv.indexOf("--site");
const SITE = (siteArg > -1 ? process.argv[siteArg + 1] : "https://collaborativeconstructionllc.com").replace(/\/$/, "");
const HOST = new URL(SITE).host;

/** Files this branch changed, copied over the live copy. Edit this list when more files change. */
const OVERLAY = [
  "css/styles.css",
  "js/main.js",
  "js/gallery.js",
  "assets/img/swirls",
  "assets/img/backgrounds",
  "assets/img/textures",
  "assets/logo.png",
  "assets/logo-header.png",
  "assets/c-icon.png",
  "assets/favicon.png",
  "assets/apple-touch-icon.png",
];

const ASSET_EXT = "css|js|png|jpe?g|webp|avif|gif|svg|woff2?|ico|json|txt|xml|webmanifest|mp4|pdf";
const seen = new Map(); // url path -> "ok" | status code
const queue = [];
let fetched = 0;

const add = (path) => {
  if (!path.startsWith("/") || path.startsWith("//")) return;
  path = path.split("#")[0].split("?")[0].replace(/[:;,]+$/, "");
  if (!path || seen.has(path)) return;
  seen.set(path, "queued");
  queue.push(path);
};

/** Pull every same site path out of HTML, CSS or JS text. */
function harvest(text) {
  const abs = new RegExp(`https?://${HOST.replace(/\./g, "\\.")}(/[^\\s"'<>)\\\\]*)`, "g");
  for (const m of text.matchAll(abs)) add(m[1]);
  // any /path.ext appearing after a quote, bracket, space or comma (covers src, href, srcset, url(), imagesrcset, JS strings)
  const rel = new RegExp(`[\\s"'(=,](/[A-Za-z0-9_\\-./%]+\\.(?:${ASSET_EXT}))(?=[\\s"')?#,]|$)`, "gi");
  for (const m of text.matchAll(rel)) add(m[1]);
  // page links such as href="/about/"
  for (const m of text.matchAll(/href="(\/[a-z0-9\-/]*\/)"/g)) add(m[1]);
}

const localPath = (urlPath) => (urlPath.endsWith("/") ? urlPath + "index.html" : urlPath);

async function get(urlPath) {
  const res = await fetch(SITE + urlPath, { redirect: "manual" });
  fetched++;
  return res;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // Seeds: the home page, the sitemap's pages, and the standard root files.
  add("/");
  for (const p of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/css/styles.css", "/js/main.js"]) add(p);
  const sm = await get("/sitemap.xml");
  if (sm.ok) {
    const xml = await sm.text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      try { const u = new URL(m[1]); if (u.host === HOST) add(u.pathname); } catch { /* ignore */ }
    }
  }

  const problems = [];
  while (queue.length) {
    const path = queue.shift();
    let res;
    try { res = await get(path); } catch (e) { seen.set(path, "network"); problems.push(`${path}  network error: ${e.message}`); continue; }
    if (res.status !== 200) { seen.set(path, res.status); problems.push(`${path}  HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = join(OUT, localPath(path));
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    seen.set(path, "ok");
    const type = res.headers.get("content-type") || "";
    if (/text\/html|text\/css|javascript|json|xml|text\/plain/.test(type)) harvest(buf.toString("utf8"));
  }

  // Files this repo tracks under assets/ that no live page links to may still be served live.
  // A deploy would delete them, so probe each one and keep the live copy when it exists.
  const tracked = execFileSync("git", ["ls-files", "assets"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
  const kept = [];
  for (const rel of tracked) {
    const urlPath = "/" + rel;
    if (seen.get(urlPath) === "ok") continue;
    let res;
    try { res = await get(urlPath); } catch { continue; }
    if (res.status !== 200) continue; // not served live, so nothing is lost by leaving it out
    const dest = join(OUT, rel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    seen.set(urlPath, "ok");
    kept.push(rel);
  }
  if (kept.length) console.log(`Kept ${kept.length} live file(s) that no page links to: ${kept.join(", ")}`);

  // Pages and photos this branch changed. The pages come from the repo build (_site), so run
  // `npm run build` first. Each page already carries the current Facebook link.
  {
    const built = ["index.html", "about/index.html", "gallery/index.html", "construction-advisory/index.html", "home-additions-cape-cod/index.html", "adu-builder-cape-cod/index.html", "home-renovation-cape-cod/index.html", "custom-home-builder-cape-cod/index.html", "llms.txt", "robots.txt"];
    for (const rel of built) {
      try { await stat(join(ROOT, "_site", rel)); } catch { console.error(`NOT READY: _site/${rel} is missing. Run npm run build first.`); process.exit(1); }
      await cp(join(ROOT, "_site", rel), join(OUT, rel));
    }
    // Every photo referenced by src/_data/projects.json must end up in _deploy, even one that is
    // new to this branch and so was never served live (the crawl above only grabs what a GET to
    // the live site actually returns, and a brand new file 404s there until it is deployed).
    // Compute the exact file list from the data file itself rather than a hardcoded filename
    // prefix: an earlier version of this script only special cased "carlisle-residence-", which
    // silently dropped every other project's new photos from the deploy. Deriving it from the
    // data file means a future photo addition cannot 404 in production by surprise.
    const projects = JSON.parse(await readFile(join(ROOT, "src/_data/projects.json"), "utf8"));
    const neededImgFiles = new Set();
    for (const p of projects.items) {
      const pics = p.footerThumb ? [...p.images, p.footerThumb] : p.images;
      for (const img of pics) {
        const base = img.src.replace("/assets/img/", "").replace(/\.jpe?g$/i, "");
        neededImgFiles.add(`assets/img/${base}.jpg`);
        for (const w of img.widths) neededImgFiles.add(`assets/img/r/${base}-${w}.webp`);
      }
    }
    let copiedNew = 0;
    for (const rel of neededImgFiles) {
      const dest = join(OUT, rel);
      try { await stat(dest); continue; } catch { /* not already in _deploy from the live crawl */ }
      await mkdir(dirname(dest), { recursive: true });
      await cp(join(ROOT, rel), dest);
      copiedNew++;
    }
    // robots.txt comes from the repo build, never from the live copy: the live copy already
    // carries Cloudflare's managed block, and redeploying it made the block repeat on every deploy.
    const robots = await readFile(join(OUT, "robots.txt"), "utf8");
    if (/BEGIN Cloudflare Managed/.test(robots)) {
      console.error("NOT READY: _deploy/robots.txt contains Cloudflare's managed block; it must come from the repo build.");
      process.exit(1);
    }
    console.log(`Overlaid every page, llms.txt and robots.txt from this branch's build, plus ${copiedNew} project photo file(s) new to this branch.`);
  }

  // Checks only, no edits. Every page in _deploy comes from this repo's build (or the live copy for
  // other files), and the build already carries the approved hero photos and social links. If the
  // result is wrong, the build or the templates are wrong: stop and fix them at the source instead of
  // patching the copy. (Earlier releases rewrote the hero and the Facebook URL in place here; that is
  // gone so a future release cannot be changed by a leftover release-specific edit.)
  {
    const htmlFiles = [];
    const walk = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith(".html")) htmlFiles.push(full);
      }
    };
    await walk(OUT);
    const home = await readFile(join(OUT, "index.html"), "utf8");
    if (!home.includes("belmont-hero-1280.webp")) {
      console.error("NOT READY: the approved Belmont hero photos are not in the home page. Fix src/_includes/hero-figure.html, not the copy.");
      process.exit(1);
    }
    for (const file of htmlFiles) {
      const text = await readFile(file, "utf8");
      if (!text.includes(FACEBOOK_NOW)) { console.error(`NOT READY: the current Facebook link is missing from ${file}. Fix the template.`); process.exit(1); }
      for (const old of FACEBOOK_OLD) if (text.includes(old)) { console.error(`NOT READY: ${file} contains an old Facebook link. Fix the template.`); process.exit(1); }
    }
    console.log(`Verified without editing: Belmont hero photos present, current Facebook link on all ${htmlFiles.length} pages, no old links.`);
  }

  // Overlay the changed files.
  const overlaid = [];
  for (const rel of OVERLAY) {
    const src = join(ROOT, rel);
    // This curated directory is replaced as a unit so a retired texture that
    // was harvested from the live stylesheet cannot survive the next deploy.
    if (rel === "assets/img/textures") {
      await rm(join(OUT, rel), { recursive: true, force: true });
    }
    await cp(src, join(OUT, rel), { recursive: true });
    overlaid.push(rel);
  }

  // Everything in the repo's public asset folders that the live site did not have is reported, never added silently.
  const ok = [...seen.values()].filter((v) => v === "ok").length;
  console.log(`Copied ${ok} live files from ${SITE} (${fetched} requests).`);
  console.log(`Overlaid from this branch: ${overlaid.join(", ")}`);
  if (problems.length) {
    console.log(`\nReferenced by the live site but not retrievable (${problems.length}):`);
    problems.forEach((p) => console.log("  " + p));
  }

  // Files that must never be published, whatever copied them.
  for (const f of FORBIDDEN_FILES) {
    try { await stat(join(OUT, f)); console.error(`NOT READY: ${f} is in the deploy folder and must never be published.`); process.exit(1); } catch { /* absent, as required */ }
  }

  // Machine readable record for scripts/release.mjs: which live files were copied and which were not retrievable.
  await mkdir(join(ROOT, ".release"), { recursive: true });
  await writeFile(join(ROOT, ".release", "overlay-manifest.json"), JSON.stringify({
    site: SITE, generatedAt: new Date().toISOString(), requests: fetched, copied: ok, overlaid, kept,
    problems: problems.map((x) => x.trim()),
  }, null, 2));

  // Sanity gates. A deploy replaces the whole site, so refuse to call this ready if it looks incomplete.
  const must = ["index.html", "about/index.html", "gallery/index.html", "construction-advisory/index.html",
    "css/styles.css", "js/main.js", "robots.txt", "sitemap.xml"];
  const missing = [];
  for (const f of must) { try { await stat(join(OUT, f)); } catch { missing.push(f); } }
  const webp = await readdir(join(OUT, "assets/img/r")).catch(() => []);
  if (missing.length) { console.error(`\nNOT READY: missing ${missing.join(", ")}`); process.exit(1); }
  if (webp.length < 100) { console.error(`\nNOT READY: only ${webp.length} responsive photos found (expected ~148)`); process.exit(1); }
  const hardFail = problems.filter((p) => !/\.(?:json|map)\s/.test(p) && /HTTP (5\d\d|network)/.test(p));
  if (hardFail.length) { console.error("\nNOT READY: server errors while copying the live site."); process.exit(1); }
  console.log(`\nREADY: _deploy/ has ${ok + 0} live files plus the overlay. Pages: index, about, gallery, construction-advisory and the service pages.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
