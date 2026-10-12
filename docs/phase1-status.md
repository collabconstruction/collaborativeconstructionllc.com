# Phase 1 status — customer intake pipeline

**Status: PASS — verified in production.**
**Last updated**: October 12, 2026.

This is the single current-status document for Phase 1. It supersedes `phase1-production-preflight.md`, `phase1-activation-checklist.md`, `phase1-deliverables.md`, `phase1-final-approval-request.md`, and `phase1-release-decision-report.md`, which are preserved unmodified as historical pre-deployment records (each now carries a banner pointing here). Full investigation detail lives in `docs/releases/2026-10-12-intake-release.md` and `docs/releases/2026-10-12-intake-recovery.md`.

## Production facts

- **Deployed Worker version**: `28d3bb86-6417-4266-a3b0-c12e28f8c37f` (created 2026-10-12T16:34:30.692Z), Worker `collaborativeconstructionllc-com`, account `0fadcd0965374caa75a44c3aa9784042`.
- **Deployed source commit**: `1a8c15b7423882b1f6d2d2e14b4a835ec749b941`, verified byte-identical for frontend assets (`js/main.js`, `js/turnstile-lifecycle.js`) between the live site and this commit.
- **Git status**: `codex/phase1-recovery` is pushed to `origin`. `phase1-release-prep` is fast-forward merged to the same commit locally. Neither has been merged into `main`; that is a separate decision, not a technical blocker (see Owner decisions below).
- **D1**: `cc-leads` database, 2 leads total (1 historical pre-Phase-1 lead, 1 verification test lead), 1 `lead_workflow` row each, 1 `intake_receipts` row for the test lead. No data loss, no duplicates.

## Acceptance criteria — all met

| Criterion | Result |
|---|---|
| Contact form accepts a legitimate inquiry | Pass |
| Cloudflare Turnstile passes server-side verification | Pass |
| D1 saves the lead exactly once (no duplicate) | Pass |
| Intake receipt created (deduplication) | Pass |
| Lead workflow created with correct ownership | Pass — `assigned_to: Wesleigh Behn`, `stage: new`, `next_action: Review inquiry and contact prospect` |
| Private CLI retrieves the lead | Pass — `node scripts/leads.mjs queue --remote --id <id>` returns the joined lead+workflow record |
| Notification provider accepts the email | Pass — `emailed: 1`, `email_error: null`, `notification_state: accepted` |
| Email actually received in company Gmail inbox | **Pass — owner-confirmed 2026-10-12.** Transport acceptance alone was previously insufficient evidence; the owner personally checked `collaborativeconstructiongc@gmail.com` and confirmed receipt. |
| Historical lead record preserved | Pass — lead `d5a4b6e8` (received 2026-09-29) unchanged |

This confirms the core pipeline works for **one verified submission**, not every possible browser, network, attachment, or email-provider failure mode.

## Known unresolved technical items

1. **Original Turnstile 403 root cause is undiagnosed.** The first production test (2026-10-12, ~12:11 PM EDT, against Worker version `84408614`) failed with HTTP 403 at the Siteverify guard. The old verifier discarded diagnostic reasons, so the exact cause (stale token, hostname/action mismatch, transient Siteverify issue) was never identified. The recovery deployment's own successful test did not reproduce the failure or log a rejection event, so this is resolved-in-practice, not root-caused. New structured diagnostics (`57aac15`) are now live and will capture detail (status/category only, never tokens or secrets) if it recurs.
2. **Minor mobile layout issue**: horizontal overflow observed around 390px viewport width (document width ~410–416px) during the verification browser session. Not a Phase 1 blocker; no production CSS has changed to address it. Needs a separate, small layout investigation.
3. **Migration ledger mismatch**: `migrations/0002_lead_operations.sql` is applied to production D1 but absent from the `d1_migrations` tracking table (migration 0001 has the same gap, applied manually before tracking existed). This is a bookkeeping issue, not a schema problem — do not replay or repair it as part of routine work; it needs its own reviewed maintenance task.

## What is NOT yet true

- Not every email provider failure mode, attachment failure mode, or browser/network edge case has been tested — only the happy path, once.
- Analytics (GA4) consent-accepted conversion firing was not exercised in the verification test (consent was declined in that session).
- GBP, GSC, and GA4 account-level reporting access are still not connected (see `docs/research/06-data-access.md`); this is a business-data gap, unrelated to the intake pipeline's technical correctness.

## Owner decisions available now

- Whether to merge `phase1-release-prep` into `main` and push (currently local-only; not yet requested).
- Whether to invest further in the mobile overflow fix now, or treat it as low-priority until it affects a real customer.
- Whether to schedule a repair of the D1 migration ledger bookkeeping gap.

None of the above block using the live site for real customer inquiries today.
