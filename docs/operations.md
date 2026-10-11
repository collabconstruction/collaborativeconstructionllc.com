# Private lead operations

Release preparation verified October 11, 2026. This is a private local CLI, not a public service. The production schema was inspected read-only and matches the local schema, including Phase 1 workflow tables and triggers. No customer field values were read. Internal responder and 24-hour follow-up defaults remain operational defaults, not public response promises.

## Existing production database: do not migrate again

Production already contains both schema migrations' objects. Its migration ledger currently records only `0001_existing_leads.sql`; `0002_lead_operations.sql` was applied outside the ledger. **Do not run remote migration apply or replay either SQL file for this release.** Ledger reconciliation is separate future maintenance requiring its own review. The release command deploys code/assets only.

For a fresh synthetic local database only: `npm run db:local`. The local config has no email binding and never sends notifications. Keep actual customer exports outside this repository. See [release procedure](releases/2026-10-11-intake-release.md) for deployment, verification and rollback.

## Daily workflow

Use Node.js 22 or newer (the installed Wrangler prerequisite). The CLI runs Wrangler with the same Node executable used to launch it; it never silently changes your Node installation. Local operations explicitly use `wrangler.local.jsonc`. The CLI uses existing Wrangler authentication, no new paid dependency and no public administrator endpoint. It defaults to nothing: every invocation requires `--local` or `--remote`. An operator must select the environment deliberately. Only use remote commands after applicable authorization. Customer records are never printed; detailed exports go to a new, owner-readable file outside this repository. Paths and provider errors are withheld from terminal output. Temporary SQL and provider logs are created in a private temporary directory and removed after execution. An abruptly killed process may leave that directory behind; retain device encryption and remove abandoned `cc-leads-*` directories after checking no operation is active.

Create an owner-only directory outside the checkout (for example `$HOME/Private/cc-leads`) and protect it with permissions 700. Input files must have permissions 600; output files are created with 600 and never overwrite existing files. Do not use a publicly synced directory. Exporting all leads is intentionally an operator action, not an agent default; share only the assigned record or sanitized aggregates with an agent.

```sh
node scripts/leads.mjs --help
node scripts/leads.mjs queue --local --out /absolute/private/location/queue.json
node scripts/leads.mjs export --local --out /absolute/private/location/leads.json
node scripts/leads.mjs add --local --input /absolute/private/location/inquiry.json
node scripts/leads.mjs update --local --id LEAD_UUID --input /absolute/private/location/update.json
node scripts/leads.mjs history --local --id LEAD_UUID --out /absolute/private/location/history.json
node scripts/leads.mjs report --local --from 2026-10-01T00:00:00Z --to 2026-10-12T00:00:00Z
```

Examples below are fictional shapes only; enter real records exclusively in private files.

Manual phone/referral inquiry:

```json
{"name":"Example only","phone":"555-0100","message":"Interested in an addition","acquisition_source":"phone","project_town":"Falmouth","project_type":"addition"}
```

Update after a real contact:

```json
{"stage":"contacted","assigned_to":"Wesleigh Behn","first_response_at":"2026-10-11T15:00:00-04:00","last_contact_at":"2026-10-11T15:00:00-04:00","next_action":"Confirm scope and consultation availability","follow_up_due_at":"2026-10-12T15:00:00-04:00"}
```

Stages: new → contacted → qualified → consultation → estimate_sent → won / lost / not_a_fit. Record the actual event; skipping stages is allowed. Terminal records should have an explicit outcome and meaningful next action such as “Transfer to project planning” or “Closed; no follow-up requested”; use null for a no-longer-needed follow-up date. Closing as lost or not_a_fit requires a nonempty loss reason; explicitly use “unknown” when not established. Closing supplies a sensible next action and clears the follow-up date unless provided. Updates support budget range, timing, project type/town, acquisition source, contact timestamps, owner, next action, outcome, loss reason, customer key and optional economic fields. First-response timestamps reflect actual staff responses, never email-provider acceptance. All timestamps require a timezone and are normalized to UTC. Avoid putting identifying information into free-text economic fields or customer keys unless necessary.

Workflow stage changes are recorded in `lead_stage_history`; initial historical records are marked `migration-baseline` and do not reconstruct unavailable earlier events. `estimate_sent` and `won` sync to legacy `quoted` and `booked` respectively. Existing legacy statuses remain intact during migration. Do not edit `leads.status` directly: the supported operational writer is `lead_workflow.stage`. Other field changes do not have a full audit trail; this is a lightweight queue, not a compliance CRM.

Queue exports include all leads plus overdue, missing-follow-up, unassigned, attachment-exception and notification-exception flags. Exports include row count and completeness notes. Review active overdue records, missing dates, empty owners and pending/failed/unknown notifications each business day. A new record's follow-up deadline is received time +24 hours, including weekends; customize after review. Historical deadlines use historical receipt time, intentionally exposing neglected records. A notification marked `accepted` only means the provider accepted it. It never proves inbox arrival or a person read it. Manual phone/referral entries are marked `not_applicable`. Check recorded inquiries even when email appears healthy. Attachment keys in exports are internal object identifiers, not public photo links. No attachment-download endpoint is added.

Manual add writes core data first, which triggers an accountable default workflow before enrichment; a command failure after insertion can therefore leave a valid default record. Inspect the private queue before retrying a failed add to avoid duplicates. Manual adds are not idempotent. Website request deduplication uses its separate receipt mechanism.

## Weekly report and known limits

The report returns aggregate JSON only, with generation time, environment and an inclusive-start/exclusive-end received-date cohort. Current-stage counts are snapshot counts, not counts of historical consultations or estimates. The mean response time includes nonnegative recorded durations; invalid timestamps and missing responses have separate counts. Empty cohorts have zero total inquiries and null SQL sums/averages. Never infer no business activity from a missing export or an empty unverified local database.

Recorded economic totals include only supplied values; every field has an unknown count. No currency, margin definition or acquisition cost is invented. Use one confirmed currency and consistent contribution accounting before interpreting sums. Acquisition cost, Search Console, organic traffic and capacity remain null pending authorized external data. Grouped source/service/stage/campaign inquiry counts are included. Source and service names use controlled labels; unrecognized free text is grouped as other. Campaign labels are represented by stable SHA-256-derived identifiers so untrusted campaign text is never printed; reconcile them privately with the export when needed. Unique/new/repeat customer counts remain null without a trustworthy identity ledger. Summary and grouped results use separate reads, so active updates can briefly produce differences. Project-type conversion, duplicate-customer reconciliation and stage-transition cohort analysis need a more complete record set and are not claimed as implemented. Campaign-source completeness is only one diagnostic, not full attribution proof. Phone calls exist in this system only when staff records them; clicking a phone link is not a completed call.

Exports contain customer information and must not enter Git, site assets, general research Markdown, shared screenshots or unrestricted agent context. Set a retention period with the owner; there is deliberately no automatic deletion of production inquiries. Remove working exports once their review is complete. Provider backups and attachment retention require a separate reviewed procedure.

## Verification

`node --test tests/lead-operations.test.mjs` exercises actual SQLite migrations, historical quoted/booked status mapping, notification unknowns, intake defaults, stage audit/synchronization, SQL quote injection resistance, strict update input validation, report date boundaries and unknown economics. Tests use Python's standard-library SQLite and Node's built-in test runner; no account access or real records are required. Production schema compatibility is now verified read-only. Inbox delivery and day-to-day staff acknowledgment still require the approved end-to-end test.

Local migration verification caught a Wrangler statement-splitter incompatibility with CASE spacing inside triggers. The migration now preserves required whitespace; a regression test executes every Wrangler-split statement against SQLite. Synthetic local D1 migration and aggregate CLI report succeeded. This does not verify production schema or data.
