// Validates scripts/build-research-index.mjs's parsing/grouping logic
// against explicitly-labeled TEST_FIXTURE directories under
// scripts/fixtures/reports/ — never against the real docs/health/runs or
// docs/competitive/runs trees, so this test cannot be confused with real
// report data and cannot corrupt a real run.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listRunDirs,
  inferSource,
  inferDate,
  excerpt,
  buildTypeSection,
} from '../scripts/build-research-index.mjs';

const FIXTURE_EMPTY = 'scripts/fixtures/reports/TEST_FIXTURE_empty/runs';
const FIXTURE_MIXED = 'scripts/fixtures/reports/TEST_FIXTURE_mixed/runs';

test('listRunDirs returns [] for a root with no run directories', () => {
  assert.deepEqual(listRunDirs(FIXTURE_EMPTY), []);
});

test('listRunDirs returns [] for a nonexistent root (never throws)', () => {
  assert.deepEqual(listRunDirs('scripts/fixtures/reports/TEST_FIXTURE_does_not_exist'), []);
});

test('listRunDirs finds only directories that actually contain report.md', () => {
  const dirs = listRunDirs(FIXTURE_MIXED);
  assert.deepEqual(dirs, [
    '20261010T065200Z-cloud-ab12',
    '20261010T070500Z-local-cd34',
    '20261011T065200Z-cloud-ef56',
  ]);
});

test('inferSource prefers the sources.json "source" field over the run-ID suffix', () => {
  assert.equal(inferSource('20261010T065200Z-cloud-ab12', { source: 'cloud-routine' }), 'cloud-routine');
});

test('inferSource falls back to the run-ID suffix when sources.json is missing/unreadable', () => {
  assert.equal(inferSource('20261010T065200Z-cloud-ab12', null), 'cloud-routine');
  assert.equal(inferSource('20261010T070500Z-local-cd34', null), 'local-scheduled-task-backup');
  assert.equal(inferSource('some-old-run-id', null), 'unknown (run ID predates source tagging)');
});

test('inferDate parses the leading UTC timestamp and rejects anything else', () => {
  const d = inferDate('20261010T065200Z-cloud-ab12');
  assert.ok(d instanceof Date);
  assert.equal(d.toISOString(), '2026-10-10T06:52:00.000Z');
  assert.equal(inferDate('not-a-timestamp'), null);
});

test('excerpt pulls the first plain-text line and skips headings', () => {
  const text = excerpt(`${FIXTURE_MIXED}/20261010T065200Z-cloud-ab12/report.md`);
  assert.match(text, /Fixture finding A from the cloud routine/);
});

test('excerpt handles a missing report.md without throwing', () => {
  assert.equal(excerpt(`${FIXTURE_MIXED}/does-not-exist/report.md`), '(report.md unreadable)');
});

test('buildTypeSection reports "no runs found yet" for an empty root', () => {
  const out = buildTypeSection({ root: FIXTURE_EMPTY, label: 'Test Type' });
  assert.match(out, /no runs found yet/);
});

test('buildTypeSection picks the newest run as Latest and preserves same-day provenance', () => {
  const out = buildTypeSection({ root: FIXTURE_MIXED, label: 'Test Type' });
  // Newest fixture run (2026-10-11) must be "Latest", not the same-day pair from 2026-10-10.
  assert.match(out, /\*\*Latest:\*\* 2026-10-11T06:52:00\.000Z/);
  assert.match(out, /Fixture finding C/);
  // Both same-day runs must still each appear by run ID (provenance preserved, not merged).
  assert.match(out, /20261010T065200Z-cloud-ab12/);
  assert.match(out, /20261010T070500Z-local-cd34/);
  assert.match(out, /multiple sources preserved separately, not merged/);
});
