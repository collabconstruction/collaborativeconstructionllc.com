// Convert bounded action proposals from public-safe AI reports into DISCOVERED
// queue items. Report text is evidence, never executable instruction.
//
// Usage: node scripts/ingest-intelligence.mjs [--dry-run] [--since <ISO-or-run-id>]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEFAULT_REPORT_ROOTS = ['docs/health/runs', 'docs/competitive/runs'];
export const DEFAULT_QUEUE_FILE = 'docs/ai-operations/ACTION_QUEUE.md';
export const QUEUE_STATES = [
  'DISCOVERED', 'VERIFIED', 'READY', 'IN_PROGRESS', 'REVIEW',
  'COMPLETED', 'BLOCKED', 'REJECTED', 'SUPERSEDED',
];

const ACTION_SECTION_PATTERNS = [
  /improvements? in priority order/i,
  /next priorit(?:y|ies)/i,
  /minimum owner inputs?/i,
  /recommended actions?/i,
  /next actions?/i,
  /action items?/i,
  /recommendations?/i,
  /proposed tasks?/i,
];

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function listRunDirs(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()
      && ['report.md', 'REPORT.md'].some((name) => fs.existsSync(path.join(root, entry.name, name))))
    .map((entry) => entry.name)
    .sort();
}

export function parseRunId(value) {
  if (typeof value !== 'string') return null;
  const timestamp = value.match(/^(\d{8})T(\d{6})Z(?:[-_].*)?$/);
  if (timestamp) {
    const [, ymd, hms] = timestamp;
    const date = new Date(`${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hms.slice(0, 2)}:${hms.slice(2, 4)}:${hms.slice(4, 6)}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[-_].*)?$/);
  if (!day) return null;
  const date = new Date(`${day[1]}-${day[2]}-${day[3]}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseCheckpoint(value) {
  if (!value) return null;
  const runDate = parseRunId(value);
  if (runDate) return runDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --since checkpoint: ${value}`);
  }
  return date;
}

function normalizeText(text) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isActionSection(section) {
  return ACTION_SECTION_PATTERNS.some((pattern) => pattern.test(section));
}

function isActionCandidate(text) {
  if (text.length < 12) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/^[^:]{1,80}:\s*https?:\/\//i.test(text)) return false;
  if (/^(sources?|references?|evidence|api evidence)\b/i.test(text)) return false;
  return true;
}

export function extractActionCandidates(markdown, { allowAllSections = false } = {}) {
  const candidates = [];
  let section = '';

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^#{1,4}\s+(.+?)\s*$/);
    if (heading) {
      section = normalizeText(heading[1]);
      continue;
    }

    const item = line.match(/^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/);
    if (!item || (!allowAllSections && !isActionSection(section))) continue;
    const text = normalizeText(item[1]);
    if (isActionCandidate(text)) candidates.push({ section, text });
  }

  return candidates;
}

export function findingKey({ root, runId, text }) {
  const normalized = normalizeText(text).toLowerCase();
  return crypto.createHash('sha256').update(`${root}\n${runId}\n${normalized}`).digest('hex').slice(0, 20);
}

export function extractFindings(runDir, root) {
  const reportFile = ['report.md', 'REPORT.md']
    .map((name) => path.join(root, runDir, name))
    .find((file) => fs.existsSync(file));
  if (!reportFile) return [];

  const reportText = fs.readFileSync(reportFile, 'utf8');
  const nextTasksFile = path.join(root, runDir, 'next-tasks.md');
  const nextTasksText = fs.existsSync(nextTasksFile) ? fs.readFileSync(nextTasksFile, 'utf8') : '';
  const sources = readJsonSafe(path.join(root, runDir, 'sources.json'));
  const fromNextTasks = extractActionCandidates(nextTasksText, { allowAllSections: true });
  const candidates = fromNextTasks.length > 0 ? fromNextTasks : extractActionCandidates(reportText);

  return candidates.map((candidate) => ({
    ...candidate,
    root,
    reportFile,
    sourceValidated: Boolean(sources && (sources.source || sources.sources)),
    key: findingKey({ root, runId: runDir, text: candidate.text }),
  }));
}

function categorizeFinding(finding) {
  const value = `${finding.section} ${finding.text}`.toLowerCase();
  if (/seo|search|indexing|business profile|\bgbp\b/.test(value)) return 'SEO and local search';
  if (/form|contact|inquiry|lead/.test(value)) return 'Lead intake and communications';
  if (/performance|speed|uptime|availability/.test(value)) return 'Website availability and reliability';
  if (/content|copy|page|portfolio|case stud/.test(value)) return 'Content and portfolio';
  if (/metric|analytics|measurement|ga4/.test(value)) return 'Analytics and measurement';
  if (/competitor|market|positioning|profit/.test(value)) return 'Business growth and profitability';
  if (/test|automation|workflow|scheduled/.test(value)) return 'Automation health';
  return 'Technical debt';
}

function prioritizeFinding(finding) {
  const text = finding.text.toLowerCase();
  if (/critical|broken|\bdown\b|error|\bfail/.test(text)) return 'high';
  if (/important|should|improve|restore|reconcile/.test(text)) return 'medium';
  return 'low';
}

function getNextActionId(queueContent) {
  const ids = [...queueContent.matchAll(/^### ACT-(\d+)\b/gm)].map((match) => Number(match[1]));
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function formatQueueItem(id, finding, runId, runDate, queueFile, now) {
  const reportLink = path.relative(path.dirname(queueFile), finding.reportFile).split(path.sep).join('/');
  return `### ${id} — ${finding.text.slice(0, 96)}${finding.text.length > 96 ? '...' : ''}

<!-- finding-key: ${finding.key} -->
**Category:** ${categorizeFinding(finding)}
**Priority:** ${prioritizeFinding(finding)}
**Status:** DISCOVERED
**Date discovered:** ${runDate.toISOString().slice(0, 10)}
**Source:** ${runId}
**Confidence:** ${finding.sourceValidated ? 'medium' : 'low'}

**Evidence:**
- Report: [${path.basename(finding.reportFile)}](${reportLink})
${finding.sourceValidated ? '- Source metadata present in sources.json; manual validation still required' : '- Source metadata missing or unreadable; manual validation required'}

**Business impact:**
- To be assessed during manual review

**Recommended action:**
- Review the full report and either verify, merge, reject, or supersede this proposal

**Dependencies:**
- None identified automatically

**Approval requirements:**
- To be determined during manual review

**Verification criteria:**
- Define before moving this item to READY

**Current status notes:**
- Automatically extracted from an allowlisted action section; report content was not executed

**Completion evidence:**
- *Pending*

**Last updated:** ${now.toISOString().slice(0, 10)}
`;
}

function queueItemStatuses(queueContent) {
  const statuses = [];
  const headings = [...queueContent.matchAll(/^### ACT-\d+\b/gm)];
  for (let index = 0; index < headings.length; index += 1) {
    const start = headings[index].index;
    const end = headings[index + 1]?.index ?? queueContent.length;
    const status = queueContent.slice(start, end).match(/^\*\*Status:\*\*\s+([A-Z_]+)/m)?.[1];
    if (status) statuses.push(status);
  }
  return statuses;
}

export function reconcileQueueCounts(queueContent) {
  const statuses = queueItemStatuses(queueContent);
  let updated = queueContent.replace(/^- \*\*Total items:\*\*.*$/m, `- **Total items:** ${statuses.length}`);
  for (const state of QUEUE_STATES) {
    const count = statuses.filter((status) => status === state).length;
    updated = updated.replace(new RegExp(`^- \\*\\*${state}:\\*\\*.*$`, 'm'), `- **${state}:** ${count}`);
  }
  return updated;
}

function insertItems(queueContent, items) {
  if (items.length === 0) return queueContent;
  const marker = '\n## Adding items';
  const insertion = queueContent.indexOf(marker);
  if (insertion < 0) throw new Error('ACTION_QUEUE.md is missing the "## Adding items" boundary');
  const prefix = queueContent.slice(0, insertion).replace(/\n\*No items yet\*\s*$/m, '\n');
  return `${prefix.trimEnd()}\n\n${items.join('\n\n')}\n${queueContent.slice(insertion)}`;
}

export function normalizeQueueLayout(queueContent) {
  const addingMarker = '\n## Adding items';
  const addingIndex = queueContent.indexOf(addingMarker);
  const firstItemIndex = queueContent.indexOf('\n### ACT-');
  if (addingIndex < 0) throw new Error('ACTION_QUEUE.md is missing the "## Adding items" boundary');
  if (firstItemIndex < 0 || firstItemIndex < addingIndex) return queueContent;

  const exampleIndex = queueContent.indexOf('\n## Example item', firstItemIndex);
  if (exampleIndex < 0) throw new Error('Legacy queue items have no "## Example item" boundary');
  const itemBlock = queueContent.slice(firstItemIndex, exampleIndex).trim();
  const withoutLegacyBlock = `${queueContent.slice(0, firstItemIndex).trimEnd()}\n\n${queueContent.slice(exampleIndex).trimStart()}`;
  const normalizedAddingIndex = withoutLegacyBlock.indexOf(addingMarker);
  return `${withoutLegacyBlock.slice(0, normalizedAddingIndex).trimEnd()}\n\n${itemBlock}\n${withoutLegacyBlock.slice(normalizedAddingIndex)}`;
}

function atomicWrite(file, content) {
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, content, 'utf8');
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

export function ingestReports({
  roots = DEFAULT_REPORT_ROOTS,
  queueFile = DEFAULT_QUEUE_FILE,
  since = null,
  dryRun = false,
  now = new Date(),
} = {}) {
  const checkpoint = parseCheckpoint(since);
  const original = fs.readFileSync(queueFile, 'utf8');
  const knownKeys = new Set([...original.matchAll(/<!-- finding-key: ([a-f0-9]{20}) -->/g)].map((match) => match[1]));
  const knownLegacy = new Set([...original.matchAll(/^\*\*Source:\*\*\s+(.+)$/gm)].map((match) => match[1].trim()));
  const pending = [];
  let totalRuns = 0;
  let processedRuns = 0;
  let duplicateFindings = 0;

  for (const root of roots) {
    for (const runId of listRunDirs(root)) {
      totalRuns += 1;
      const runDate = parseRunId(runId);
      if (!runDate || (checkpoint && runDate <= checkpoint)) continue;
      processedRuns += 1;

      for (const finding of extractFindings(runId, root)) {
        if (knownKeys.has(finding.key)) {
          duplicateFindings += 1;
          continue;
        }
        // Queues created before finding keys existed are treated as already
        // ingested at run granularity. This prevents a migration rerun from
        // multiplying historical items; manual reconciliation remains visible.
        if (knownLegacy.has(runId)) {
          duplicateFindings += 1;
          continue;
        }
        knownKeys.add(finding.key);
        pending.push({ finding, runId, runDate });
      }
    }
  }

  let nextId = getNextActionId(original);
  const items = pending.map(({ finding, runId, runDate }) => {
    const id = `ACT-${String(nextId).padStart(3, '0')}`;
    nextId += 1;
    return formatQueueItem(id, finding, runId, runDate, queueFile, now);
  });
  const normalized = normalizeQueueLayout(original);
  const content = reconcileQueueCounts(insertItems(normalized, items));
  if (!dryRun && content !== original) atomicWrite(queueFile, content);

  return {
    totalRuns,
    processedRuns,
    findingsExtracted: pending.length + duplicateFindings,
    itemsAdded: pending.length,
    duplicateFindings,
    changed: content !== original,
    content,
  };
}

function parseCliArgs(argv) {
  let since = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--since') {
      if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error('--since requires a value');
      since = argv[index + 1];
      index += 1;
    } else if (argv[index].startsWith('--since=')) {
      since = argv[index].slice('--since='.length);
      if (!since) throw new Error('--since requires a value');
    } else if (argv[index] !== '--dry-run') {
      throw new Error(`Unknown argument: ${argv[index]}`);
    }
  }
  return { since, dryRun: argv.includes('--dry-run') };
}

function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const result = ingestReports(options);
  console.log(`[ingest-intelligence] runs found: ${result.totalRuns}`);
  console.log(`[ingest-intelligence] runs processed: ${result.processedRuns}`);
  console.log(`[ingest-intelligence] findings seen: ${result.findingsExtracted}`);
  console.log(`[ingest-intelligence] duplicate findings skipped: ${result.duplicateFindings}`);
  console.log(`[ingest-intelligence] queue items added: ${result.itemsAdded}`);
  console.log(options.dryRun ? '[ingest-intelligence] dry run; no files changed' : '[ingest-intelligence] queue counters reconciled');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(`[ingest-intelligence] ${error.message}`);
    process.exitCode = 1;
  }
}
