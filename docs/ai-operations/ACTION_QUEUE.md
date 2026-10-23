# Action Queue — Central Work Tracker

 **Last updated:** October 23, 2026  
**Purpose:** Track all actionable work from AI intelligence sources

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

## Lifecycle states

```
DISCOVERED → VERIFIED → READY → IN_PROGRESS → REVIEW → COMPLETED
                ↓           ↓           ↓
            BLOCKED    BLOCKED    BLOCKED
                ↓           ↓           ↓
            REJECTED   REJECTED   REJECTED
                ↓           ↓           ↓
            SUPERSEDED SUPERSEDED SUPERSEDED
```

**State definitions:**

- **DISCOVERED:** New finding from a report, not yet validated
- **VERIFIED:** Evidence checked, finding confirmed, ready for prioritization
- **READY:** Prioritized, dependencies met, awaiting implementation
- **IN_PROGRESS:** Actively being implemented
- **REVIEW:** Implementation complete, awaiting owner review
- **COMPLETED:** Implemented, verified, and accepted
- **BLOCKED:** Cannot proceed due to dependency, conflict, or missing information
- **REJECTED:** Not proceeding (documented reason)
- **SUPERSEDED:** Replaced by a better approach or no longer relevant

## Item template

```markdown
### [ID] — [Title]

**Category:** [category]  
**Priority:** [high|medium|low]  
**Status:** [status]  
**Date discovered:** [YYYY-MM-DD]  
**Source:** [agent/report-id]  
**Confidence:** [high|medium|low]

**Evidence:**
- [Link to report or source]
- [Additional citations]

**Business impact:**
- [Description of impact if addressed]
- [Description of impact if not addressed]

**Recommended action:**
- [What the report suggested]

**Dependencies:**
- [Other items this depends on]

**Approval requirements:**
- [auto-approved|owner approval required]

**Verification criteria:**
- [How to verify the fix is complete]

**Current status notes:**
- [Any context about current state]

**Completion evidence:**
- [PR/commit links when complete]

**Last updated:** [YYYY-MM-DD]
```

## Categories

- Website availability and reliability
- Lead intake and communications
- SEO and local search
- Content and portfolio
- Analytics and measurement
- Customer trust and reputation
- Business growth and profitability
- Automation health
- Technical debt
- Owner decisions

## Current queue

*No items yet — system initialization. Items will be added as research reports are processed.*

## Adding items

When processing a research report:

1. Extract actionable findings per INTELLIGENCE_PROTOCOL.md
2. Check for duplicates against existing items
3. Create new item using the template above
4. Assign category, priority, and status
5. Set initial status to DISCOVERED or VERIFIED depending on validation level
6. Update queue status counts at top of file

## Updating items

When work progresses:

1. Update status field
2. Add notes about progress or blockers
3. Update last updated date
4. Update queue status counts at top
5. For COMPLETED items, add completion evidence (PR/commit links)

## Prioritization guidelines

**High priority:**
- Critical production issues (site down, broken forms, data loss)
- Security vulnerabilities
- Major SEO regressions
- Customer-facing bugs
- Revenue-impacting issues

**Medium priority:**
- Important improvements with clear value
- Performance optimizations
- UX enhancements
- Content gaps
- Technical debt reduction

**Low priority:**
- Nice-to-have features
- Speculative opportunities
- Minor polish
- Research without clear implementation path

## Dependencies

Document dependencies clearly:

- If item B requires item A to complete first, list A in B's dependencies
- If A completes, update B's status to remove the blocker
- If A is rejected or superseded, reassess B's viability

## Approval requirements

**Auto-approved (safe to implement without owner review):**
- Internal tooling improvements
- Test additions
- Documentation updates
- Non-production bug fixes
- Code refactoring (no behavior change)
- Accessibility improvements
- Performance optimizations (no UI change)

**Owner approval required:**
- Production deployments
- Public content changes
- Customer communications
- Spending/budget changes
- Major feature additions
- Breaking changes
- DNS/infrastructure changes
- Third-party integrations

## Verification criteria

Every item should have clear verification criteria:

- **For bugs:** "Reproduce the bug, apply fix, verify bug no longer occurs"
- **For features:** "Implement feature, run tests, verify feature works as specified"
- **For content:** "Update content, build site, verify content appears correctly"
- **For SEO:** "Apply change, run Lighthouse/Search Console, verify metric improvement"
- **For performance:** "Apply optimization, measure load time, verify improvement"

## Completion evidence

When an item is COMPLETED, add:

- Pull request URL (if applicable)
- Commit hash
- Branch name
- Test results
- Production verification (if deployed)
- Screenshot or measurement (if applicable)

## Cleaning up the queue

Periodically review the queue and:

- Mark stale items (> 90 days inactive) as SUPERSEDED or REJECTED with reason
- Merge duplicate items
- Remove items that are no longer relevant
- Archive completed items older than 6 months (move to separate file or delete)

### ACT-001 — 1. Restore an approved, usable public website. Review and release the persistent...

**Category:** SEO and local search
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-002 — 2. Make measurement trustworthy. Use the business GA4 property, exclude preview/...

**Category:** Lead intake and communications
**Priority:** high
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-003 — 3. Build evidence and local referrals. Publish two verified local case studies w...

**Category:** Lead intake and communications
**Priority:** medium
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-004 — Decide timing for the public website release after reviewing the prepared websit...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-005 — Identify the genuine manager LinkedIn account for administering a proper company...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-006 — Provide access through the Google Business Profile owner dashboard or a sanction...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-007 — Confirm priority services/towns, earliest available start/capacity and minimum s...

**Category:** Website availability and reliability
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-008 — For a real company-performance diagnosis, supply sanitized counts for calls/refe...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-009 — Google website closures: https://developers.google.com/search/docs/crawling-inde...

**Category:** SEO and local search
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-010 — GA4 key-event configuration: https://support.google.com/analytics/answer/1312848...

**Category:** Technical debt
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-011 — GBP local ranking guidance: https://support.google.com/business/answer/7091

**Category:** Technical debt
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-012 — Local scheduled-task requirements: https://learn.chatgpt.com/docs/automations?su...

**Category:** Automation health
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-013 — Cape Associates: https://www.capeassociates.com/

**Category:** Technical debt
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-014 — REEF: https://capecodbuilder.com/

**Category:** Technical debt
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-015 — API evidence: google-public.json, indexing.json, metricool-facebook.json, metric...

**Category:** SEO and local search
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-18
**Source:** 2026-10-18
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-18/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-016 — 1. Approve and execute the prepared website release through existing checks; mai...

**Category:** Technical debt
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-19
**Source:** 2026-10-19
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-19/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-017 — 2. Reconcile the one stored record against known tests through private operation...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-19
**Source:** 2026-10-19
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-19/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

### ACT-018 — 3. Establish correct GBP performance reporting and genuine manager-administered ...

**Category:** Lead intake and communications
**Priority:** low
**Status:** DISCOVERED
**Date discovered:** 2026-10-19
**Source:** 2026-10-19
**Confidence:** low

**Evidence:**
- Report: [report.md](../../../health/runs/2026-10-19/report.md)
- No source validation

**Business impact:**
- To be assessed

**Recommended action:**
- To be determined from full report review

**Dependencies:**
- None

**Approval requirements:**
- To be determined

**Verification criteria:**
- To be defined

**Current status notes:**
- Automatically extracted from report; requires manual review

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23

## Example item

**Category:** Website availability and reliability  
**Priority:** high  
**Status:** READY  
**Date discovered:** 2026-10-23  
**Source:** daily-health-report/20261023T065200Z-cloud-health  
**Confidence:** high

**Evidence:**
- [report.md](../../docs/health/runs/20261023T065200Z-cloud-health/report.md) — Section 3.2
- [sources.json](../../docs/health/runs/20261023T065200Z-cloud-health/sources.json) — Form submission test logs

**Business impact:**
- If addressed: Customers can successfully submit inquiries from the About page
- If not addressed: Potential customers cannot contact the company, lost leads

**Recommended action:**
- Investigate form submission failure in worker/index.js
- Fix the bug
- Add regression test
- Deploy to production

**Dependencies:**
- None

**Approval requirements:**
- owner approval required (production deployment)

**Verification criteria:**
- Submit test inquiry through /about form
- Verify inquiry appears in D1 database
- Verify notification email is sent
- Run regression test

**Current status notes:**
- Bug reproduced locally, issue identified in form handler

**Completion evidence:**
- *Pending*

**Last updated:** 2026-10-23
