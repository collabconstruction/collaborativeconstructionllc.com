// Session recording script — captures execution session details for handoff
//
// This script records what was accomplished in an AI implementation session
// It updates SYSTEM_STATE.md with progress, decisions, and next steps
//
// Usage: node scripts/record-session.mjs [--summary <text>] [--tasks-completed <id,id,...>] [--next-action <text>]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUMMARY_ARG = process.argv.find(arg => arg.startsWith('--summary='));
const SUMMARY = SUMMARY_ARG ? SUMMARY_ARG.split('=')[1] : null;
const TASKS_ARG = process.argv.find(arg => arg.startsWith('--tasks-completed='));
const TASKS_COMPLETED = TASKS_ARG ? TASKS_ARG.split('=')[1].split(',') : [];
const NEXT_ACTION_ARG = process.argv.find(arg => arg.startsWith('--next-action='));
const NEXT_ACTION = NEXT_ACTION_ARG ? NEXT_ACTION_ARG.split('=')[1] : null;

const AI_OPS_DIR = 'docs/ai-operations';
const SYSTEM_STATE_FILE = path.join(AI_OPS_DIR, 'SYSTEM_STATE.md');
const ACTION_QUEUE_FILE = path.join(AI_OPS_DIR, 'ACTION_QUEUE.md');

function readSystemState() {
  try {
    return fs.readFileSync(SYSTEM_STATE_FILE, 'utf8');
  } catch {
    console.error(`[record-session] ${SYSTEM_STATE_FILE} not found`);
    process.exit(1);
  }
}

function updateSystemState(content, summary, tasksCompleted, nextAction) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString();

  // Find the "Session handoff notes" section
  const handoffSection = content.indexOf('## Session handoff notes');
  if (handoffSection === -1) {
    console.warn('[record-session] No "Session handoff notes" section found, appending');
    return content + `\n\n## Session handoff notes\n\n### ${dateStr} — Session recorded\n\n**Summary:** ${summary || 'No summary provided'}\n**Tasks completed:** ${tasksCompleted.join(', ') || 'None'}\n**Next action:** ${nextAction || 'None'}\n`;
  }

  // Insert new session entry before the handoff notes
  const newEntry = `### ${dateStr} — Session recorded

**Summary:** ${summary || 'No summary provided'}
**Tasks completed:** ${tasksCompleted.join(', ') || 'None'}
**Next action:** ${nextAction || 'None'}
**Session time:** ${timeStr}

`;

  const beforeHandoff = content.slice(0, handoffSection);
  const afterHandoff = content.slice(handoffSection);

  return beforeHandoff + newEntry + afterHandoff;
}

function updateLastUpdated(content) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  
  // Update the "Last updated" line at the top
  return content.replace(
    /\*\*Last updated:\*\* \d{4}-\d{2}-\d{2}/,
    `**Last updated:** ${dateStr}`
  );
}

function main() {
  console.log(`[record-session] ${new Date().toISOString()} starting`);

  if (!SUMMARY && !TASKS_COMPLETED.length && !NEXT_ACTION) {
    console.error('[record-session] Provide at least one of: --summary, --tasks-completed, --next-action');
    console.error('[record-session] Usage: node scripts/record-session.mjs [--summary <text>] [--tasks-completed <id,id,...>] [--next-action <text>]');
    process.exit(1);
  }

  // Read current system state
  const stateContent = readSystemState();

  // Update with session details
  let updated = updateSystemState(stateContent, SUMMARY, TASKS_COMPLETED, NEXT_ACTION);
  updated = updateLastUpdated(updated);

  // Write back
  fs.writeFileSync(SYSTEM_STATE_FILE, updated, 'utf8');
  console.log(`[record-session] updated ${SYSTEM_STATE_FILE}`);

  console.log('[record-session] session recorded:');
  if (SUMMARY) console.log(`  summary: ${SUMMARY}`);
  if (TASKS_COMPLETED.length) console.log(`  tasks completed: ${TASKS_COMPLETED.join(', ')}`);
  if (NEXT_ACTION) console.log(`  next action: ${NEXT_ACTION}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
