import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  extractActionCandidates,
  extractFindings,
  ingestReports,
  normalizeQueueLayout,
  parseCheckpoint,
  parseRunId,
} from '../scripts/ingest-intelligence.mjs';

const QUEUE_FIXTURE = `# Action Queue

## Queue status

- **Total items:** 0
- **DISCOVERED:** 0
- **VERIFIED:** 0
- **READY:** 0
- **IN_PROGRESS:** 0
- **REVIEW:** 0
- **COMPLETED:** 0
- **BLOCKED:** 0
- **REJECTED:** 0
- **SUPERSEDED:** 0

## Current queue

*No items yet*

## Adding items

Manual instructions.
`;

test('action extraction is limited to proposal sections and excludes source bullets', () => {
  const markdown = `## Improvements in priority order
1. Add an idempotency regression test.
2. Reconcile queue counters after every write.

## Sources
- Node documentation: https://nodejs.org/api/fs.html
- https://example.com/reference
`;
  assert.deepEqual(
    extractActionCandidates(markdown).map(({ text }) => text),
    ['Add an idempotency regression test.', 'Reconcile queue counters after every write.'],
  );
});

test('next-tasks proposals take precedence over report prose', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-intelligence-findings-'));
  const run = path.join(temp, '2026-10-23');
  fs.mkdirSync(run);
  fs.writeFileSync(path.join(run, 'report.md'), '## Recommended actions\n- Ignore this fallback.\n');
  fs.writeFileSync(path.join(run, 'next-tasks.md'), '# Next tasks\n- Use this explicit proposal.\n');

  const findings = extractFindings('2026-10-23', temp);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].text, 'Use this explicit proposal.');
});

test('run IDs and checkpoints accept documented formats and reject invalid input', () => {
  assert.equal(parseRunId('20261023T120102Z-cloud-health').toISOString(), '2026-10-23T12:01:02.000Z');
  assert.equal(parseRunId('2026-10-23-health').toISOString(), '2026-10-23T00:00:00.000Z');
  assert.equal(parseRunId('not-a-run'), null);
  assert.equal(parseCheckpoint('2026-10-23T10:00:00Z').toISOString(), '2026-10-23T10:00:00.000Z');
  assert.throws(() => parseCheckpoint('not-a-checkpoint'), /Invalid --since checkpoint/);
});

test('legacy items are moved under Current queue without changing their text', () => {
  const legacy = `${QUEUE_FIXTURE}\n## Cleaning up the queue\n\nGuidance.\n\n### ACT-009 — Misplaced item\n\n**Status:** REJECTED\n\n## Example item\n\nExample.`;
  const normalized = normalizeQueueLayout(legacy);
  assert.ok(normalized.indexOf('### ACT-009') < normalized.indexOf('## Adding items'));
  assert.ok(normalized.indexOf('## Cleaning up the queue') > normalized.indexOf('## Adding items'));
  assert.equal((normalized.match(/### ACT-009/g) || []).length, 1);
});

test('ingestion is atomic in effect, idempotent, linked correctly and reconciles counters', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-intelligence-ingest-'));
  const queueFile = path.join(temp, 'docs', 'ai-operations', 'ACTION_QUEUE.md');
  const reportRoot = path.join(temp, 'docs', 'health', 'runs');
  const runId = '20261023T120000Z-health';
  const run = path.join(reportRoot, runId);
  fs.mkdirSync(path.dirname(queueFile), { recursive: true });
  fs.mkdirSync(run, { recursive: true });
  fs.writeFileSync(queueFile, QUEUE_FIXTURE);
  fs.writeFileSync(path.join(run, 'report.md'), `## Next priorities
- Repair the report ingestion boundary.
- Add a duplicate-ingestion regression test.

## Sources
- Vendor docs: https://example.com/docs
`);
  fs.writeFileSync(path.join(run, 'sources.json'), JSON.stringify({ source: 'synthetic-test' }));

  const first = ingestReports({
    roots: [reportRoot],
    queueFile,
    now: new Date('2026-10-23T15:00:00Z'),
  });
  assert.equal(first.itemsAdded, 2);
  assert.equal(first.duplicateFindings, 0);

  const firstContent = fs.readFileSync(queueFile, 'utf8');
  assert.match(firstContent, /- \*\*Total items:\*\* 2/);
  assert.match(firstContent, /- \*\*DISCOVERED:\*\* 2/);
  assert.doesNotMatch(firstContent, /\*No items yet\*/);
  assert.match(firstContent, /\[report\.md\]\(\.\.\/health\/runs\/20261023T120000Z-health\/report\.md\)/);
  assert.doesNotMatch(firstContent, /Vendor docs/);
  assert.equal((firstContent.match(/<!-- finding-key:/g) || []).length, 2);

  const second = ingestReports({ roots: [reportRoot], queueFile });
  assert.equal(second.itemsAdded, 0);
  assert.equal(second.duplicateFindings, 2);
  assert.equal(fs.readFileSync(queueFile, 'utf8'), firstContent);

  const dryRun = ingestReports({ roots: [reportRoot], queueFile, dryRun: true });
  assert.equal(dryRun.itemsAdded, 0);
  assert.equal(fs.readFileSync(queueFile, 'utf8'), firstContent);
});
