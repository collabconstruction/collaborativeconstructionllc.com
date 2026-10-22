import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, chmod, rm, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderDashboard, summarize, FLAG_LABELS } from '../scripts/lib/dashboard-render.mjs';

// Synthetic fixtures only, never real customer records (see docs/operations.md).
const sample = {
  generated_at: '2026-10-12T00:00:00.000Z',
  environment: 'local',
  row_count: 2,
  completeness: 'All leads with workflow rows, without pagination or date filtering.',
  records: [
    {
      id: 'lead-1', created_at: '2026-10-11T12:00:00.000Z',
      name: "<script>alert('x')</script>", email: 'a@example.invalid', phone: '555-0100',
      message: 'Interested in an addition & a <b>deck</b>', project_type: 'addition', project_town: 'Falmouth',
      stage: 'new', assigned_to: '', follow_up_due_at: '2026-10-10T12:00:00.000Z',
      notification_state: 'pending', attachment_state: 'none', next_action: 'Call back',
      overdue: 1, unassigned: 1, missing_follow_up: 0, notification_exception: 1, attachment_exception: 0,
    },
    {
      id: 'lead-2', created_at: '2026-10-12T09:00:00.000Z',
      name: 'Jamie Example', email: 'jamie@example.invalid', phone: null,
      message: 'ADU question', project_type: 'adu', project_town: 'Barnstable',
      stage: 'contacted', assigned_to: 'Wesleigh Behn', follow_up_due_at: '2026-10-13T09:00:00.000Z',
      notification_state: 'accepted', attachment_state: 'stored', next_action: 'Send estimate',
      overdue: 0, unassigned: 0, missing_follow_up: 0, notification_exception: 0, attachment_exception: 0,
    },
  ],
};

test('summarize counts each exception flag and groups by stage', () => {
  const { counts, byStage } = summarize(sample.records);
  assert.equal(counts.overdue, 1);
  assert.equal(counts.unassigned, 1);
  assert.equal(counts.notification_exception, 1);
  assert.equal(counts.attachment_exception, 0);
  assert.deepEqual(byStage, { new: 1, contacted: 1 });
});

test('renderDashboard escapes customer-submitted free text (no stored-XSS)', () => {
  const html = renderDashboard(sample);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /Interested in an addition &amp; a &lt;b&gt;deck&lt;\/b&gt;/);
});

test('renderDashboard never references any external network resource', () => {
  const html = renderDashboard(sample);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(html, /<script\s+src=/i);
  assert.doesNotMatch(html, /<link\s+[^>]*href=/i);
});

test('renderDashboard renders a badge per active flag and OK when none are set', () => {
  const html = renderDashboard(sample);
  assert.match(html, /badge-overdue/);
  assert.match(html, /badge-unassigned/);
  assert.match(html, /badge-notification_exception/);
  assert.match(html, /badge-ok/); // lead-2 has no active flags
});

test('renderDashboard surfaces every declared flag label and the row count', () => {
  const html = renderDashboard(sample);
  for (const label of Object.values(FLAG_LABELS)) assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, />2</); // row_count
});

test('renderDashboard tolerates an empty or malformed export without throwing', () => {
  assert.doesNotThrow(() => renderDashboard({}));
  assert.doesNotThrow(() => renderDashboard({ records: [] }));
  const html = renderDashboard({ records: [] });
  assert.match(html, /Total leads in export/);
});

test('CLI requires absolute private paths outside the repository and never overwrites output', { skip: Number(process.versions.node.split('.')[0]) < 22 }, async () => {
  const cli = new URL('../scripts/dashboard.mjs', import.meta.url).pathname;
  const dir = await mkdtemp(path.join(tmpdir(), 'cc-dashboard-test-'));
  try {
    const queuePath = path.join(dir, 'queue.json');
    await writeFile(queuePath, JSON.stringify(sample), { mode: 0o600 });
    const outPath = path.join(dir, 'dashboard.html');

    // Relative path rejected.
    let run = spawnSync(process.execPath, [cli, '--in', 'queue.json', '--out', outPath], { encoding: 'utf8' });
    assert.equal(run.status, 1);

    // In-repository output rejected.
    const repoPath = new URL('../private-test-dashboard.html', import.meta.url).pathname;
    run = spawnSync(process.execPath, [cli, '--in', queuePath, '--out', repoPath], { encoding: 'utf8' });
    assert.equal(run.status, 1);

    // World/group-readable input rejected.
    await chmod(queuePath, 0o644);
    run = spawnSync(process.execPath, [cli, '--in', queuePath, '--out', outPath], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    await chmod(queuePath, 0o600);

    // Valid call succeeds and writes a private, non-empty file.
    run = spawnSync(process.execPath, [cli, '--in', queuePath, '--out', outPath], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const info = await stat(outPath);
    assert.equal(info.mode & 0o777, 0o600);
    const html = await readFile(outPath, 'utf8');
    assert.match(html, /Jamie Example/);

    // Second call must not overwrite the existing file.
    run = spawnSync(process.execPath, [cli, '--in', queuePath, '--out', outPath], { encoding: 'utf8' });
    assert.equal(run.status, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
