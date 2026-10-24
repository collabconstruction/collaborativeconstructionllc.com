// Task execution script — implements authorized work from the action queue
//
// This script implements the execution workflow for safe, authorized improvements
// It reads a task from ACTION_QUEUE.md, implements it on an isolated branch, runs tests, and updates status
//
// Usage: node scripts/execute-task.mjs <task-id> [--branch <branch-name>] [--dry-run]
//
// task-id: The ACT-XXX ID from ACTION_QUEUE.md
// --branch: Specify branch name (default: auto-generated from task ID)
// --dry-run: Print what would be done without making changes

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TASK_ID = process.argv[2];
const BRANCH_ARG = process.argv.find(arg => arg.startsWith('--branch='));
const BRANCH_NAME = BRANCH_ARG ? BRANCH_ARG.split('=')[1] : null;
const DRY_RUN = process.argv.includes('--dry-run');

const AI_OPS_DIR = 'docs/ai-operations';
const ACTION_QUEUE_FILE = path.join(AI_OPS_DIR, 'ACTION_QUEUE.md');
const SYSTEM_STATE_FILE = path.join(AI_OPS_DIR, 'SYSTEM_STATE.md');

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

function readActionQueue() {
  try {
    return fs.readFileSync(ACTION_QUEUE_FILE, 'utf8');
  } catch {
    console.error(`[execute-task] ${ACTION_QUEUE_FILE} not found`);
    process.exit(1);
  }
}

function parseTask(queueContent, taskId) {
  const lines = queueContent.split('\n');
  let task = null;
  let currentId = null;
  let inTask = false;
  let taskLines = [];

  for (const line of lines) {
    const idMatch = line.match(/^### (ACT-\d+)/);
    if (idMatch) {
      if (inTask && currentId === taskId) {
        task = taskLines.join('\n');
        break;
      }
      currentId = idMatch[1];
      inTask = (currentId === taskId);
      taskLines = [];
      continue;
    }

    if (inTask) {
      taskLines.push(line);
    }
  }

  if (inTask && currentId === taskId && taskLines.length > 0) {
    task = taskLines.join('\n');
  }

  return task;
}

function extractField(taskText, fieldName) {
  const lines = taskText.split('\n');
  for (const line of lines) {
    const match = line.match(new RegExp(`^\\*\\*${fieldName}:\\*\\*\\s*(.+)$`));
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function main() {
  if (!TASK_ID) {
    console.error('[execute-task] Usage: node scripts/execute-task.mjs <task-id> [--branch <branch-name>] [--dry-run]');
    process.exit(1);
  }

  console.log(`[execute-task] ${new Date().toISOString()} starting`);
  console.log(`[execute-task] task ID: ${TASK_ID}`);
  if (DRY_RUN) console.log('[execute-task] dry run mode — no changes will be made');

  // Step 1: Read action queue and find task
  const queueContent = readActionQueue();
  const taskText = parseTask(queueContent, TASK_ID);

  if (!taskText) {
    console.error(`[execute-task] task ${TASK_ID} not found in ${ACTION_QUEUE_FILE}`);
    process.exit(1);
  }

  console.log(`[execute-task] found task ${TASK_ID}`);

  // Step 2: Extract task metadata
  const status = extractField(taskText, 'Status');
  const approval = extractField(taskText, 'Approval requirements');
  const category = extractField(taskText, 'Category');
  const priority = extractField(taskText, 'Priority');

  console.log(`[execute-task] status: ${status}`);
  console.log(`[execute-task] approval: ${approval}`);
  console.log(`[execute-task] category: ${category}`);
  console.log(`[execute-task] priority: ${priority}`);

  // Step 3: Check if task is ready for implementation
  if (status === 'COMPLETED') {
    console.error(`[execute-task] task ${TASK_ID} is already completed`);
    process.exit(1);
  }

  if (status === 'IN_PROGRESS') {
    console.warn(`[execute-task] task ${TASK_ID} is already in progress`);
  }

  if (approval === 'owner approval required' && !DRY_RUN) {
    console.error(`[execute-task] task ${TASK_ID} requires owner approval`);
    console.error('[execute-task] obtain owner approval before implementing');
    process.exit(1);
  }

  // Step 5: Check current Git state
  const currentBranch = git(['branch', '--show-current']);
  const gitStatus = tryGit(['status', '--porcelain']);
  
  console.log(`[execute-task] current branch: ${currentBranch}`);
  if (gitStatus.ok && gitStatus.out) {
    console.warn('[execute-task] working directory has uncommitted changes:');
    console.warn(gitStatus.out);
    if (!DRY_RUN) {
      console.error('[execute-task] commit or stash changes before implementing a task');
      process.exit(1);
    }
  }

  // Step 6: Create or switch to implementation branch
  const targetBranch = BRANCH_NAME || `ai/${TASK_ID.toLowerCase()}`;
  
  console.log(`[execute-task] target branch: ${targetBranch}`);

  if (!DRY_RUN) {
    const branchExists = tryGit(['rev-parse', '--verify', targetBranch]);
    if (branchExists.ok) {
      console.log(`[execute-task] switching to existing branch ${targetBranch}`);
      git(['checkout', targetBranch]);
    } else {
      console.log(`[execute-task] creating new branch ${targetBranch}`);
      git(['checkout', '-b', targetBranch]);
    }
  } else {
    console.log(`[execute-task] would create/switch to branch ${targetBranch}`);
  }

  // Step 6: Update task status to IN_PROGRESS
  if (!DRY_RUN) {
    const updatedQueue = queueContent.replace(
      new RegExp(`(### ${TASK_ID}.*?\\*\\*Status:\\*\\*)\\s*${status}`),
      `$1 IN_PROGRESS`
    );
    // Atomic write
    const tempPath = ACTION_QUEUE_FILE + '.tmp';
    fs.writeFileSync(tempPath, updatedQueue, 'utf8');
    fs.renameSync(tempPath, ACTION_QUEUE_FILE);
    console.log(`[execute-task] updated ${TASK_ID} status to IN_PROGRESS`);
  } else {
    console.log(`[execute-task] would update ${TASK_ID} status to IN_PROGRESS`);
  }

  // Step 7: Implementation guidance
  console.log('');
  console.log('[execute-task] === IMPLEMENTATION GUIDANCE ===');
  console.log('[execute-task] Review the task details in ACTION_QUEUE.md');
  console.log('[execute-task] Implement the changes on the current branch');
  console.log('[execute-task] Run tests: npm test');
  console.log('[execute-task] Build the site: npm run build');
  console.log('[execute-task] Verify changes work as expected');
  console.log('[execute-task] Commit changes with a descriptive message');
  console.log('[execute-task] Push branch: git push -u origin ' + targetBranch);
  console.log('[execute-task] Open PR: gh pr create --base main --draft');
  console.log('');
  console.log('[execute-task] After implementation:');
  console.log('[execute-task] Update ACTION_QUEUE.md with completion evidence');
  console.log('[execute-task] Update SYSTEM_STATE.md with progress');
  console.log('[execute-task] Mark task status as REVIEW or COMPLETED');
  console.log('');

  if (DRY_RUN) {
    console.log('[execute-task] dry run complete — no changes made');
  } else {
    console.log(`[execute-task] ready for implementation on branch ${targetBranch}`);
    console.log('[execute-task] task status updated to IN_PROGRESS');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
