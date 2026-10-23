# AI Operations — Central Intelligence & Execution System

**Created:** October 23, 2026  
**Purpose:** Transform AI research into actionable engineering and business work for Collaborative Construction LLC

## What this system does

This system connects multiple independent AI agents (Grok, ChatGPT, Claude, GitHub Actions) into a coordinated intelligence and execution pipeline. It:

1. **Discovers and ingests research** from multiple AI sources without duplication
2. **Maintains a central action queue** tracking all actionable work
3. **Prioritizes and executes** authorized improvements safely
4. **Preserves handoff state** across separate AI sessions
5. **Protects the website** from unreviewed changes
6. **Keeps private data** out of the public repository

## Quick start for agents

When beginning work:

1. Read this README
2. Check `SYSTEM_STATE.md` for current progress and blockers
3. Review `ACTION_QUEUE.md` for pending work
4. Consult `SOURCE_REGISTRY.md` for active AI sources
5. Follow `INTELLIGENCE_PROTOCOL.md` for processing research
6. Update `DECISION_LOG.md` when making implementation choices
7. Update `SYSTEM_STATE.md` before ending the session

## File structure

| File | Purpose |
|------|---------|
| `README.md` | This file — system overview and entry point |
| `INTELLIGENCE_PROTOCOL.md` | How to read, validate, and reconcile research reports |
| `SOURCE_REGISTRY.md` | All AI sources, their schedules, and output locations |
| `ACTION_QUEUE.md` | Central work queue with priorities, status, and evidence |
| `DECISION_LOG.md` | Why implementation decisions were made |
| `SYSTEM_STATE.md` | Current technical progress, blockers, and next steps |

## How it works

### Research ingestion

1. AI agents (Grok, ChatGPT, Claude Cloud Routines, GitHub Actions) produce reports
2. Reports are stored in their designated locations (see `SOURCE_REGISTRY.md`)
3. Run `node scripts/ingest-intelligence.mjs --dry-run` to inspect bounded action proposals
4. The helper prefers `next-tasks.md`, otherwise reads only explicit action sections, and skips stable duplicate keys
5. Run without `--dry-run` to add `DISCOVERED` proposals and reconcile queue counters atomically
6. Read the full report and validate evidence before advancing any item

### Action execution

1. An authorized implementation session (typically Claude Code on the owner's machine) reads the queue
2. The highest-priority READY task is selected
3. Implementation is performed on an isolated branch or worktree
4. Tests are run and changes are verified
5. The queue is updated with completion evidence
6. A PR is opened for owner review (if needed)
7. `SYSTEM_STATE.md` is updated with progress

### Privacy boundaries

- **Public repository:** Research reports, action queue, decisions, system state, technical documentation
- **Private (outside repository):** Customer emails, financial data, project notes, credentials, personal lead details
- **Never in Git:** Raw customer records, private Drive links, API keys, passwords, unredacted financial exports

## Existing infrastructure this builds on

This system integrates with existing Collaborative Construction automation:

- **Report ingestion:** `scripts/sync-reports.mjs` and `scripts/build-research-index.mjs` (already implemented)
- **Queue proposal ingestion:** `scripts/ingest-intelligence.mjs` with synthetic regression coverage
- **Agent pipeline:** `docs/research/09-agent-pipeline.md` (roles, handoffs, boundaries)
- **Research base:** `docs/research/` (company facts, competitors, opportunities)
- **Skills:** `.agents/skills/` (specialized company intelligence tools)
- **Scheduled tasks:** Claude Cloud Routines and local scheduled-task backups (see `docs/automation/`)

## What this does NOT replace

- The owner's authority to approve production deployments
- The owner's authority to send customer communications
- The owner's authority to make spending decisions
- The need for human review of consequential changes
- Existing Git workflow and deployment safeguards (see AGENTS.md)

## Testing the system

To verify the system works:

```bash
# 1. Sync any new reports from GitHub
node scripts/sync-reports.mjs

# 2. Rebuild the research index
node scripts/build-research-index.mjs

# 3. Read the central AI operations docs
cat docs/ai-operations/README.md
cat docs/ai-operations/SOURCE_REGISTRY.md
cat docs/ai-operations/ACTION_QUEUE.md
```

## Integration with existing scheduled tasks

The existing Claude Cloud Routines and local scheduled tasks (`cc-daily-health-report-local`, `cc-daily-competitor-scan-local`, `cc-reports-sync-local`) continue to operate as documented in `docs/automation/report-ingestion.md`. This system provides the intelligence coordination layer that consumes their outputs.

## Next steps for a new session

1. Read `SYSTEM_STATE.md` to understand where things stand
2. Check `ACTION_QUEUE.md` for the highest-priority READY task
3. Verify the task is still relevant and evidence is current
4. Implement the work on an appropriate branch
5. Run tests and verify changes
6. Update the queue and system state
7. Report what was done and what needs owner approval
