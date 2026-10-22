#!/usr/bin/env node
// Private local lead dashboard viewer. No server, no new Worker route, no
// public admin endpoint, reads an existing `leads.mjs queue` export and
// renders it as a self-contained, offline HTML file for local review only.
// See docs/operations.md: "no public administrator endpoint" is a
// deliberate decision for this system; this stays consistent with it.
import { readFile, open, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDashboard } from './lib/dashboard-render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const help = `Private local lead dashboard (no server, no public endpoint):
  node scripts/dashboard.mjs --in /private/path/queue.json --out /private/path/dashboard.html

First produce the input with the existing queue export, e.g.:
  node scripts/leads.mjs queue --local --out /private/path/queue.json

Writes a self-contained, offline HTML file (no network calls, no external
scripts or fonts). The output is written privately (chmod 600) and never
overwritten. It contains customer information: keep it outside Git, outside
any cloud-synced folder, and delete it once you are done reviewing it.
Open it directly from the local filesystem in a browser.`;

async function privateExisting(filename) {
  if (!filename || !path.isAbsolute(filename)) throw Error('Use an absolute private path.');
  const resolved = await realpath(filename);
  const repository = await realpath(root);
  if (resolved === repository || resolved.startsWith(repository + path.sep)) throw Error('Private files must be outside the repository.');
  const info = await stat(resolved);
  if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 20 * 1024 * 1024) throw Error('Input must be a private regular file (chmod 600), at most 20 MB.');
  return resolved;
}

async function privateOutput(filename) {
  if (!filename || !path.isAbsolute(filename)) throw Error('Use an absolute private path.');
  const resolved = path.join(await realpath(path.dirname(filename)), path.basename(filename));
  const repository = await realpath(root);
  if (resolved === repository || resolved.startsWith(repository + path.sep)) throw Error('Private files must be outside the repository.');
  return resolved;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) { console.log(help); return; }
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--in', '--out'].includes(key) || Object.hasOwn(flags, key)) throw Error('Unknown or duplicate option.');
    flags[key] = args[++i];
    if (flags[key] === undefined) throw Error('Missing option value.');
  }
  if (!flags['--in'] || !flags['--out']) throw Error('Both --in and --out are required.');

  const inputPath = await privateExisting(flags['--in']);
  const outputPath = await privateOutput(flags['--out']);
  const queueExport = JSON.parse(await readFile(inputPath, 'utf8'));
  const html = renderDashboard(queueExport);

  // Reserve the private output before any further processing; wx rejects
  // existing files and symlinks, matching scripts/leads.mjs's discipline.
  const handle = await open(outputPath, 'wx', 0o600);
  try { await handle.writeFile(html); }
  finally { await handle.close(); }
  console.log('Private dashboard written. Contains customer information; keep it outside Git/cloud sync and delete it when done reviewing.');
}

main().catch(() => {
  console.error('Dashboard generation failed. Check command syntax (--help), input/output paths, and permissions.');
  process.exitCode = 1;
});
