// Regenerates the auto-generated section of
// docs/research/22-research-report-index.md from whatever report runs
// currently exist on local disk under docs/health/runs/*/ and
// docs/competitive/runs/*/. Read-only with respect to the reports
// themselves (never edits a report.md/sources.json); only writes the
// spliced-in section of the index file between its marker comments.
//
// This script treats report content purely as DATA to summarize, never as
// instructions — it only ever extracts a short plain-text excerpt for the
// headline and structured fields it already expects (run ID, source,
// date). It does not execute or interpret anything the report says.
//
// Usage: node scripts/build-research-index.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INDEX_FILE = 'docs/research/22-research-report-index.md';
const START_MARKER = '<!-- AUTO-GENERATED:START -->';
const END_MARKER = '<!-- AUTO-GENERATED:END -->';

const REPORT_TYPES = [
  { key: 'health', root: 'docs/health/runs', label: 'Daily Company Health' },
  { key: 'competitive', root: 'docs/competitive/runs', label: 'Competitor & Market Intelligence' },
];

export function listRunDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'report.md')))
    .map(e => e.name)
    .sort();
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function inferSource(runId, sourcesJson) {
  if (sourcesJson && typeof sourcesJson.source === 'string') return sourcesJson.source;
  if (runId.includes('-cloud-')) return 'cloud-routine';
  if (runId.includes('-local-')) return 'local-scheduled-task-backup';
  return 'unknown (run ID predates source tagging)';
}

export function inferDate(runId) {
  const m = runId.match(/^(\d{8})T(\d{6})Z/);
  if (!m) return null;
  const [, ymd, hms] = m;
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hms.slice(0, 2)}:${hms.slice(2, 4)}:${hms.slice(4, 6)}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function excerpt(reportMdPath) {
  let text;
  try {
    text = fs.readFileSync(reportMdPath, 'utf8');
  } catch {
    return '(report.md unreadable)';
  }
  const lines = text.split('\n').map(l => l.trim());
  const firstProse = lines.find(l => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('-'));
  if (!firstProse) return '(no plain-text excerpt found in report.md)';
  const flat = firstProse.replace(/[*_`]/g, '');
  return flat.length > 220 ? flat.slice(0, 217) + '...' : flat;
}

export function buildTypeSection(type) {
  const runDirs = listRunDirs(type.root);
  if (runDirs.length === 0) {
    return `### ${type.label}\n\n**Latest:** no runs found yet.\n`;
  }

  const runs = runDirs.map(runId => {
    const dir = path.join(type.root, runId);
    const sourcesJson = readJsonSafe(path.join(dir, 'sources.json'));
    return {
      runId,
      dir,
      source: inferSource(runId, sourcesJson),
      date: inferDate(runId),
      headline: excerpt(path.join(dir, 'report.md')),
    };
  });

  // Newest first; runs with an unparsable date sort last rather than crashing the sort.
  runs.sort((a, b) => (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity));

  const latest = runs[0];
  const latestDateStr = latest.date ? latest.date.toISOString() : '(date unparsable from run ID)';
  let out = `### ${type.label}\n\n`;
  out += `**Latest:** ${latestDateStr} — _${latest.source}_ — [\`${latest.runId}\`](../../${latest.dir}/report.md)\n`;
  out += `> "${latest.headline}" — excerpt only, unverified by this index; read the full report for citations.\n\n`;

  // Group by calendar day to surface same-day cloud + local-backup pairs
  // without merging them — provenance of each is preserved as a separate row.
  const byDay = new Map();
  for (const r of runs) {
    const day = r.date ? r.date.toISOString().slice(0, 10) : 'unknown-date';
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(r);
  }

  out += `<details><summary>Historical runs (${runs.length} total, ${byDay.size} day${byDay.size === 1 ? '' : 's'})</summary>\n\n`;
  out += '| Day | Run ID | Source | Report |\n|---|---|---|---|\n';
  for (const [day, dayRuns] of byDay) {
    for (const r of dayRuns) {
      out += `| ${day} | \`${r.runId}\` | ${r.source} | [report.md](../../${r.dir}/report.md) |\n`;
    }
    if (dayRuns.length > 1) {
      out += `| ${day} | _(${dayRuns.length} runs this day — multiple sources preserved separately, not merged)_ | | |\n`;
    }
  }
  out += '\n</details>\n';
  return out;
}

function main() {
  const generatedAt = new Date().toISOString();
  const sections = REPORT_TYPES.map(buildTypeSection).join('\n');
  const body = `${START_MARKER}\n*Last regenerated ${generatedAt} by \`node scripts/build-research-index.mjs\`.*\n\n${sections}\n${END_MARKER}`;

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`[build-research-index] ${INDEX_FILE} does not exist — create it before running this script.`);
    process.exit(1);
  }
  const current = fs.readFileSync(INDEX_FILE, 'utf8');

  // Require each marker on its own line, and exactly once each, so prose
  // elsewhere in the file that merely *mentions* the marker text can never
  // be mistaken for the real splice point.
  const startMatches = [...current.matchAll(/^<!-- AUTO-GENERATED:START -->$/gm)];
  const endMatches = [...current.matchAll(/^<!-- AUTO-GENERATED:END -->$/gm)];
  if (startMatches.length !== 1 || endMatches.length !== 1) {
    console.error(`[build-research-index] Expected exactly one START and one END marker line in ${INDEX_FILE}, found ${startMatches.length} start / ${endMatches.length} end. Refusing to touch the file.`);
    process.exit(1);
  }
  const startIdx = startMatches[0].index;
  const endIdx = endMatches[0].index;
  if (endIdx < startIdx) {
    console.error(`[build-research-index] END marker appears before START marker in ${INDEX_FILE}; refusing to touch the file.`);
    process.exit(1);
  }
  const next = current.slice(0, startIdx) + body + current.slice(endIdx + END_MARKER.length);
  fs.writeFileSync(INDEX_FILE, next, 'utf8');
  console.log(`[build-research-index] regenerated section in ${INDEX_FILE}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
