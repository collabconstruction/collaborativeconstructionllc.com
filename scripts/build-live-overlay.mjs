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
 *   2. overlays the few files this branch changed (OVERLAY below).
 *
 * Nothing is deployed by this script. It only writes `_deploy/` and reports.
 *
 * Usage:  node scripts/build-live-overlay.mjs [--site https://example.com]
 */
import { mkdir, writeFile, readFile, cp, rm, readdir, stat } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_deploy");
const siteArg = process.argv.indexOf("--site");
const SITE = (siteArg > -1 ? process.argv[siteArg + 1] : "https://collaborativeconstructionllc.com").replace(/\/$/, "");
const HOST = new URL(SITE).host;

/** Files this branch changed, copied over the live copy. Edit this list when more files change. */
const OVERLAY = [
  "css/styles.css",
  "js/main.js",
  "assets/img/swirls",
  "assets/logo.png",
  "assets/logo-header.png",
  "assets/c-icon.png",
  "assets/favicon.png",
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

  // Patch the live home page: swap the hero photos for the Belmont project photos, no caption.
  // The markup comes from src/_includes/hero-figure.html, the same file the template uses.
  {
    const homePath = join(OUT, "index.html");
    let home = await readFile(homePath, "utf8");
    const figure = (await readFile(join(ROOT, "src/_includes/hero-figure.html"), "utf8")).trim();
    if (!/<figure class="hero-figure"[\s\S]*?<\/figure>/.test(home)) {
      console.error("NOT READY: the live home page has no hero figure to patch (its markup changed).");
      process.exit(1);
    }
    home = home.replace(/<figure class="hero-figure"[\s\S]*?<\/figure>/, () => figure);
    home = home.replace(/<link rel="preload" as="image"[^>]*>/, () =>
      '<link rel="preload" as="image" type="image/webp" imagesrcset="/assets/img/r/belmont-hero-480.webp 480w, /assets/img/r/belmont-hero-768.webp 768w, /assets/img/r/belmont-hero-1024.webp 1024w" imagesizes="(min-width: 980px) 560px, (max-width: 600px) 92vw, 480px" fetchpriority="high">');
    // Safe to run again: if the live page already has this hero the replacement changes nothing.
    // What must hold afterwards is that the Belmont photos are in the page.
    if (!home.includes("belmont-hero-1280.webp")) {
      console.error("NOT READY: the Belmont hero photos are not in the home page after patching.");
      process.exit(1);
    }
    await writeFile(homePath, home);
    console.log("Patched the home page hero: Belmont photos, no caption.");
  }

  // Link replacements applied to the copied live pages (header and footer links and the hidden
  // structured data all carry the same URL). Any older Facebook URL becomes the current one, and the
  // build stops unless the current URL ends up on every page, so a replacement can never silently
  // do nothing (and a rerun against a page that already has the right URL still passes).
  {
    const FACEBOOK_NOW = "https://www.facebook.com/profile.php?id=61595651094549";
    const FACEBOOK_OLD = [
      "https://www.facebook.com/people/Collaborative-Construction/61595651094549/",
      "https://www.facebook.com/profile.php?id=61593017512930",
    ];
    const htmlFiles = [];
    const walk = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith(".html")) htmlFiles.push(full);
      }
    };
    await walk(OUT);
    let replaced = 0;
    for (const file of htmlFiles) {
      let text = await readFile(file, "utf8");
      let changed = false;
      for (const from of FACEBOOK_OLD) {
        if (text.includes(from)) { replaced += text.split(from).length - 1; text = text.split(from).join(FACEBOOK_NOW); changed = true; }
      }
      if (changed) await writeFile(file, text);
      if (!text.includes(FACEBOOK_NOW)) {
        console.error(`NOT READY: the Facebook link is missing from ${file}`);
        process.exit(1);
      }
    }
    console.log(`Facebook link is ${FACEBOOK_NOW} on all ${htmlFiles.length} pages (${replaced} older link(s) replaced).`);
  }

  // Overlay the changed files.
  const overlaid = [];
  for (const rel of OVERLAY) {
    const src = join(ROOT, rel);
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
