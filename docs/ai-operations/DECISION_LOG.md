# Decision Log — Implementation Choices

**Purpose:** Record why implementation decisions were made, providing context for future work

## Log format

```markdown
## [YYYY-MM-DD] — [Decision Title]

**Context:** [What situation led to this decision]  
**Options considered:**
- Option A: [description]
- Option B: [description]
- Option C: [description]

**Decision:** [Option chosen]  
**Rationale:** [Why this option was chosen]  
**Impact:** [What this affects]  
**Alternatives rejected:** [Why other options were not chosen]  
**Related items:** [Links to ACTION_QUEUE items, PRs, commits]  
**Reversible?** [yes/no and how]
```

## Decisions

*No decisions yet — system initialization. Decisions will be added as implementation work proceeds.*

## Decision categories

- Architecture and design
- Technology choices
- Implementation approach
- Prioritization
- Trade-offs and compromises
- Rejections of proposed work
- Process changes

## When to record a decision

Record a decision when:

1. Choosing between multiple implementation approaches
2. Making a significant architectural change
3. Rejecting a proposed feature or improvement
4. Changing priorities or direction
5. Making a trade-off with clear downsides
6. Establishing a new process or convention

## Example decisions

## 2026-10-23 — Create central AI operations system

**Context:** Multiple AI agents (Grok, ChatGPT, Claude, GitHub Actions) producing research reports without coordination. Need to turn research into actionable work while protecting the website from unreviewed changes.

**Options considered:**
- Option A: Add new SaaS platform for AI orchestration
- Option B: Build complex agent framework with message broker
- Option C: Create repository-native intelligence system with Markdown/JSON state

**Decision:** Option C — Repository-native intelligence system

**Rationale:**
- Leverages existing Git infrastructure
- No new SaaS costs or dependencies
- All state is versioned and reviewable
- Works with existing report ingestion scripts
- Simple, maintainable, and transparent
- Respects existing deployment safeguards

**Impact:**
- New `docs/ai-operations/` directory with central coordination files
- AGENTS.md updated to route agents to the new system
- Integration with existing report ingestion workflow
- Clear handoff mechanism between AI sessions

**Alternatives rejected:**
- Option A: Would introduce new cost, vendor lock-in, and external dependency
- Option B: Over-engineering for current needs; adds complexity without clear benefit

**Related items:**
- ACTION_QUEUE: System initialization
- AGENTS.md: Added AI Intelligence & Execution System section
- Files created: README.md, SOURCE_REGISTRY.md, INTELLIGENCE_PROTOCOL.md, ACTION_QUEUE.md, DECISION_LOG.md, SYSTEM_STATE.md

**Reversible?** Yes — can be removed by deleting `docs/ai-operations/` and reverting AGENTS.md changes

---

## 2026-10-23 — Keep private data out of public repository

**Context:** AI agents may access customer emails, financial data, and project notes. Need to protect privacy while still enabling intelligence work.

**Options considered:**
- Option A: Encrypt private data in repository
- Option B: Store private data in separate private repository
- Option C: Keep private data outside Git entirely

**Decision:** Option C — Keep private data outside Git entirely

**Rationale:**
- Encryption adds complexity and key management burden
- Private repository still requires access control management
- Existing tools (leads.mjs, dashboard.mjs) already work with local files
- Clear boundary: public repo for public findings only
- Aligns with existing operations.md guidance

**Impact:**
- Customer records stay in D1 and local private files
- Financial data stays in private Google Sheets
- Only aggregated summaries enter the repository
- Intelligence protocol enforces privacy boundaries

**Alternatives rejected:**
- Option A: Encryption can fail, keys can leak, adds operational overhead
- Option B: Still requires managing another repository and access controls

**Related items:**
- INTELLIGENCE_PROTOCOL.md — Privacy enforcement section
- SOURCE_REGISTRY.md — Privacy classification rules
- docs/operations.md — Existing private data handling

**Reversible?** No — this is a security/privacy decision that should persist

---

## 2026-10-23 — Treat report content as evidence, not instruction

**Context:** AI reports contain recommendations and proposed actions. Need to prevent automatic execution of embedded instructions while still enabling intelligent action.

**Options considered:**
- Option A: Allow agents to execute report recommendations automatically
- Option B: Require manual review before any action
- Option C: Treat reports as evidence, require validation before queueing actions

**Decision:** Option C — Evidence-first with validation

**Rationale:**
- Protects website from unreviewed changes
- Enables intelligent action without blind execution
- Maintains human oversight for consequential changes
- Allows safe automation for low-risk items
- Aligns with existing AGENTS.md safeguards

**Impact:**
- Intelligence protocol requires source validation
- Action queue separates proposals from approved work
- Approval requirements distinguish auto-approved from owner-required
- No automatic production deployments

**Alternatives rejected:**
- Option A: Too risky — could deploy unreviewed changes
- Option B: Too manual — defeats the purpose of AI intelligence

**Related items:**
- INTELLIGENCE_PROTOCOL.md — Core principles section
- ACTION_QUEUE.md — Approval requirements section
- AGENTS.md — Existing deployment safeguards

**Reversible?** Yes — can be relaxed by changing protocol, but not recommended

## Reviewing past decisions

When revisiting a decision:

1. Check if context has changed
2. Review the original rationale
3. Consider if alternatives are now more viable
4. If reversing, document why and what changed
5. Update related items and documentation

## Decision quality checklist

A good decision record:

- [ ] Clearly states the context
- [ ] Lists multiple options considered
- [ ] Explains the rationale for the chosen option
- [ ] Documents the impact
- [ ] Explains why alternatives were rejected
- [ ] Links to related work
- [ ] States whether it's reversible
- [ ] Is dated for reference
