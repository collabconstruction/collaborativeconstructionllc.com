#!/usr/bin/env node
/**
 * Parity report: how far is the repo build (_site) from what would be deployed (_deploy, which starts from the live site)?
 * Read only. Run `npm run build` and `node scripts/build-live-overlay.mjs` first.
 * The goal is to shrink "only live" to zero, which is the condition for retiring the overlay.
 *   node scripts/parity-report.mjs [--list]
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function inventory(dir) {
  const map = new Map();
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else map.set(relative(dir, full).split("\\").join("/"), createHash("sha256").update(await readFile(full)).digest("hex"));
    }
  };
  await walk(dir);
  return map;
}

export function compare(repo, deploy) {
  const onlyLive = [], onlyRepo = [], differs = [];
  for (const [f, h] of deploy) { if (!repo.has(f)) onlyLive.push(f); else if (repo.get(f) !== h) differs.push(f); }
  for (const f of repo.keys()) if (!deploy.has(f)) onlyRepo.push(f);
  return { same: [...deploy].filter(([f, h]) => repo.get(f) === h).length, onlyLive: onlyLive.sort(), onlyRepo: onlyRepo.sort(), differs: differs.sort() };
}

const group = (files) => { const g = {}; for (const f of files) { const k = f.split("/").slice(0, f.split("/").length > 2 ? 2 : 1).join("/"); g[k] = (g[k] ?? 0) + 1; } return g; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = await inventory(join(ROOT, "_site")).catch(() => null);
  const deploy = await inventory(join(ROOT, "_deploy")).catch(() => null);
  if (!repo || !deploy) { console.error("Run npm run build and node scripts/build-live-overlay.mjs first."); process.exit(1); }
  const r = compare(repo, deploy);
  console.log(`Repo build files: ${repo.size}. Deploy folder files: ${deploy.size}. Identical: ${r.same}.`);
  console.log(`Only in the deploy folder (live site, not produced by the repo build): ${r.onlyLive.length}`, group(r.onlyLive));
  console.log(`Different content: ${r.differs.length}`, group(r.differs));
  console.log(`Only in the repo build: ${r.onlyRepo.length}`, group(r.onlyRepo));
  if (process.argv.includes("--list")) for (const [t, l] of [["ONLY LIVE", r.onlyLive], ["DIFFERENT", r.differs], ["ONLY REPO", r.onlyRepo]]) { console.log(`\n${t}`); l.forEach((f) => console.log("  " + f)); }
  console.log(r.onlyLive.length + r.differs.length === 0 ? "\nPARITY: the repo build equals the deploy folder." : "\nNOT AT PARITY: the overlay is still required.");
}
