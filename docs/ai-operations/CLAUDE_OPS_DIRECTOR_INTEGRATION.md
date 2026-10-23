# Claude Operations Director Integration

**Purpose:** How the existing Claude scheduled AI Operations Director should use the new intelligence system

## Current state

The existing Claude scheduled task configuration (if any) lives in local scheduled-task files at `~/.claude/scheduled-tasks/`. The new AI operations system provides a structured way for any Claude session to:

1. Ingest research reports from multiple AI sources
2. Maintain a central action queue
3. Execute authorized work safely
4. Preserve handoff state between sessions

## Integration approach

The Claude Operations Director should be updated to:

1. **On each scheduled run:**
   - Run `node scripts/sync-reports.mjs` to pull new reports from GitHub
   - Run `node scripts/build-research-index.mjs` to refresh the index
   - Run `node scripts/ingest-intelligence.mjs` to process new findings
   - Review ACTION_QUEUE.md for high-priority READY items
   - If auto-approved task exists: run `node scripts/execute-task.mjs <task-id>`
   - Update SYSTEM_STATE.md with progress using `node scripts/record-session.mjs`

2. **Before implementing any work:**
   - Read AGENTS.md for deployment safeguards
   - Check Git status and worktree state
   - Verify the task is auto-approved (not owner-approval-required)
   - Create or use an isolated branch/worktree
   - Run tests before committing

3. **After implementation:**
   - Update ACTION_QUEUE.md with completion evidence
   - Update DECISION_LOG.md with any decisions made
   - Update SYSTEM_STATE.md with session summary
   - Report what was done and what needs owner review

## Recommended scheduled task prompt

Update the Claude Operations Director skill/prompt to:

```
Continue Collaborative Construction operations.

Read AGENTS.md and the central AI operations documentation (docs/ai-operations/).

1. Sync new reports: node scripts/sync-reports.mjs
2. Refresh index: node scripts/build-research-index.mjs
3. Ingest intelligence: node scripts/ingest-intelligence.mjs
4. Review ACTION_QUEUE.md for the highest-priority READY task
5. If task is auto-approved:
   - Run: node scripts/execute-task.mjs <task-id>
   - Implement the changes on the isolated branch
   - Run tests: npm test && npm run build
   - Commit and push if successful
   - Update ACTION_QUEUE.md with completion evidence
6. Record session: node scripts/record-session.mjs --summary "<what was done>" --tasks-completed "<task-id>" --next-action "<what's next>"

Do not implement tasks requiring owner approval. Do not make production deployments. Do not modify customer data. Report what was actually changed, what was verified, and what needs my decision.
```

## Local vs Cloud execution

**Important distinction:**

- **Local scheduled tasks** (on the owner's Mac): Can use all scripts, including those that require local Git access and file system writes
- **Cloud Routines** (Claude Cloud): Cannot run local scripts or access the file system directly; they can only push reports to GitHub branches

The intelligence system is designed to work with both:
- Cloud Routines produce reports and push to GitHub
- Local scheduled tasks (or manual sessions) sync those reports and process them

## Dependencies

The Claude Operations Director requires:

1. **Node.js 22+** (already required by the project)
2. **Git access** (for branch management and report syncing)
3. **File system write access** (for updating ACTION_QUEUE.md and SYSTEM_STATE.md)
4. **Claude Code app running** (for local scheduled tasks only)

## Safety checks

Before implementing any task, the Operations Director should:

1. Verify the task status is READY (not BLOCKED, REJECTED, or SUPERSEDED)
2. Verify approval requirements are "auto-approved"
3. Check for uncommitted changes in the working directory
4. Verify the current branch is correct
5. Run tests before committing changes
6. Never deploy to production without explicit owner approval

## Example session flow

```
[Ops Director starts]
→ Read AGENTS.md
→ Read docs/ai-operations/README.md
→ Check SYSTEM_STATE.md
→ Run: node scripts/sync-reports.mjs
→ Run: node scripts/build-research-index.mjs
→ Run: node scripts/ingest-intelligence.mjs
→ Review ACTION_QUEUE.md
→ Found ACT-001: Fix broken contact form (Priority: high, Status: READY, Approval: auto-approved)
→ Run: node scripts/execute-task.mjs ACT-001
→ [Script creates branch ai/act-001 and updates status to IN_PROGRESS]
→ Implement the fix on branch ai/act-001
→ Run: npm test
→ Run: npm run build
→ Commit changes
→ Run: git push -u origin ai/act-001
→ Update ACTION_QUEUE.md with PR link and test results
→ Run: node scripts/record-session.mjs --summary "Fixed contact form bug" --tasks-completed "ACT-001" --next-action "Owner review PR"
→ [Session ends]
```

## Monitoring and alerts

The Operations Director should:

1. Log all actions to console
2. Report any errors or blockers
3. Flag tasks requiring owner approval
4. Report when no auto-approved tasks are available
5. Preserve full session context in SYSTEM_STATE.md

## Failure handling

If a step fails:

1. **Sync fails:** Log network/auth error, continue with local data
2. **Ingestion fails:** Log parsing error, continue with existing queue
3. **Task execution fails:** Log error, revert status change, report blocker
4. **Tests fail:** Do not commit, report test failures, mark task as BLOCKED
5. **Git operations fail:** Log Git error, do not proceed, report blocker

## Owner notifications

The Operations Director should notify the owner when:

1. A task requires owner approval (cannot auto-implement)
2. A task is blocked and needs investigation
3. Tests fail and cannot be resolved automatically
4. A production deployment is needed (after PR approval)
5. No auto-approved tasks are available for N consecutive runs

## Integration checklist

- [ ] Update Claude Operations Director prompt with new workflow
- [ ] Test the full flow with a synthetic task
- [ ] Verify Git branch management works correctly
- [ ] Verify test execution and build process
- [ ] Verify ACTION_QUEUE.md updates correctly
- [ ] Verify SYSTEM_STATE.md handoff works
- [ ] Verify error handling and rollback
- [ ] Verify owner approval gating works

## Rollback plan

If integration causes issues:

1. Revert to previous Operations Director prompt
2. The intelligence system files are documentation-only and don't affect production
3. Existing report ingestion (sync-reports.mjs, build-research-index.mjs) continues to work
4. No production changes are made without owner approval
