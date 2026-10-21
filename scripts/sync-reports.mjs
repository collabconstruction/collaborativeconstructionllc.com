// Pulls completed cloud/local-backup research reports (docs/health/runs/*,
// docs/competitive/runs/*) out of remote `claude/*` report branches and onto
// local disk, WITHOUT ever checking out, merging, or diffing those branches
// against the current branch. This is deliberate: a report branch can carry
// unrelated experimental commits, and this project's working tree routinely
// has unrelated uncommitted changes from other sessions — this script must
// never touch either. It only ever reads three known-named files per run
// directory via `git show <branch>:<path>` (a read-only blob fetch) and
// writes brand-new local files under docs/health/runs/<run-id>/ or
// docs/competitive/runs/<run-id>/. It never stages or commits anything.
//
// Usage: node scripts/sync-reports.mjs [--dry-run]
// See docs/automation/report-ingestion.md for the full design and the
// companion `node scripts/build-research-index.mjs` step.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const REPORT_ROOTS = ['docs/health/runs', 'docs/competitive/runs'];
const REPORT_FILES = ['report.md', 'sources.json', 'next-tasks.md'];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function tryGit(args) {
  try {
    return { ok: true, out: git(args) };
  } catch (err) {
    return { ok: false, out: '', error: err };
  }
}

function listRemoteReportBranches() {
  const out = tryGit(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin/claude/']);
  if (!out.ok || !out.out) return [];
  return out.out.split('\n').map(s => s.trim()).filter(Boolean);
}

// Returns the set of run directories (e.g. "docs/health/runs/2026...-cloud-x")
// that actually contain report.md on the given branch, by inspecting the
// branch's tree read-only. Branches unrelated to reports (e.g. older design
// branches) simply yield an empty list here and are skipped.
function listRunDirsOnBranch(branch) {
  const dirs = new Set();
  for (const root of REPORT_ROOTS) {
    const out = tryGit(['ls-tree', '-r', '--name-only', branch, '--', root]);
    if (!out.ok || !out.out) continue;
    for (const line of out.out.split('\n')) {
      const m = line.match(new RegExp(`^(${root}/[^/]+)/report\\.md$`));
      if (m) dirs.add(m[1]);
    }
  }
  return [...dirs];
}

function readBlob(branch, relPath) {
  const out = tryGit(['show', `${branch}:${relPath}`]);
  return out.ok ? out.out : null;
}

function readLocal(relPath) {
  try {
    return fs.readFileSync(relPath, 'utf8');
  } catch {
    return null;
  }
}

function main() {
  console.log(`[sync-reports] ${new Date().toISOString()} starting${DRY_RUN ? ' (dry run)' : ''}`);

  console.log('[sync-reports] git fetch origin --prune');
  const fetch = tryGit(['fetch', 'origin', '--prune']);
  if (!fetch.ok) {
    console.error('[sync-reports] git fetch failed — check network/auth. No local files touched. Error:');
    console.error(String(fetch.error?.message ?? fetch.error));
    process.exit(1);
  }

  const branches = listRemoteReportBranches();
  console.log(`[sync-reports] found ${branches.length} remote claude/* branch(es): ${branches.join(', ') || '(none)'}`);

  let newRuns = 0, alreadySynced = 0, conflicts = 0, branchesWithReports = 0;

  for (const branch of branches) {
    const remoteBranch = branch.startsWith('origin/') ? branch : `origin/${branch}`;
    const runDirs = listRunDirsOnBranch(remoteBranch);
    if (runDirs.length === 0) continue; // not a report branch — e.g. an older design branch
    branchesWithReports++;

    for (const runDir of runDirs) {
      const localFiles = REPORT_FILES.map(f => path.join(runDir, f));
      const existsLocally = fs.existsSync(path.join(runDir, 'report.md'));

      // Fetch the three files from the branch (sources.json/next-tasks.md are
      // optional in principle, but both current prompts always write them).
      const remoteContents = {};
      for (const f of REPORT_FILES) {
        const content = readBlob(remoteBranch, path.join(runDir, f).split(path.sep).join('/'));
        if (content !== null) remoteContents[f] = content;
      }
      if (!remoteContents['report.md']) continue; // incomplete run on the branch; skip rather than guess

      if (existsLocally) {
        // Dedup: compare every file we have remotely against what's on disk.
        let identical = true;
        for (const [f, remoteText] of Object.entries(remoteContents)) {
          const localText = readLocal(path.join(runDir, f));
          if (localText !== remoteText) { identical = false; break; }
        }
        if (identical) {
          alreadySynced++;
          continue;
        }
        // Same run ID, different content — should not normally happen since
        // run IDs embed source+timestamp+suffix, but preserve provenance
        // instead of silently overwriting either copy.
        const conflictDir = `${runDir}.conflict-${branch.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        console.warn(`[sync-reports] CONFLICT: ${runDir} exists locally with different content than ${branch}. Writing the branch copy to ${conflictDir} instead of overwriting. Review both manually.`);
        if (!DRY_RUN) {
          fs.mkdirSync(conflictDir, { recursive: true });
          for (const [f, text] of Object.entries(remoteContents)) {
            fs.writeFileSync(path.join(conflictDir, f), text, 'utf8');
          }
        }
        conflicts++;
        continue;
      }

      console.log(`[sync-reports] syncing new run from ${branch}: ${runDir}`);
      if (!DRY_RUN) {
        fs.mkdirSync(runDir, { recursive: true });
        for (const [f, text] of Object.entries(remoteContents)) {
          fs.writeFileSync(path.join(runDir, f), text, 'utf8');
        }
      }
      newRuns++;
    }
  }

  console.log('[sync-reports] summary:');
  console.log(`  report branches scanned: ${branchesWithReports} of ${branches.length} total claude/* branches`);
  console.log(`  new runs synced to disk: ${newRuns}${DRY_RUN ? ' (dry run — not actually written)' : ''}`);
  console.log(`  runs already in sync: ${alreadySynced}`);
  console.log(`  conflicts preserved (not overwritten): ${conflicts}`);
  console.log('[sync-reports] no files were staged or committed. Run `git status` to review before deciding whether to commit any synced report directories.');
}

main();
