# Phase 1 recovery candidate

Local fixes only. Deployment and another inquiry require explicit approval of the final SHA supplied in the handoff. Phase 1 remains incomplete until D1, workflow, private queue and actual Gmail receipt pass a real test.

## Resolution — 2026-10-12, owner-confirmed PASS

This recovery candidate (commit `1a8c15b7423882b1f6d2d2e14b4a835ec749b941`) was deployed. Worker version `28d3bb86-6417-4266-a3b0-c12e28f8c37f`, created 2026-10-12T16:34:30.692Z, serving 100% of production traffic. Live `js/main.js` and `js/turnstile-lifecycle.js` were independently diffed byte-for-byte against this commit and matched.

A single authorized fresh-browser test inquiry was submitted 52 seconds after that deployment (2026-10-12T16:35:22.560Z / ~12:35 PM EDT). Read-only production verification found:

- Turnstile passed server-side verification (the lead would not have persisted otherwise; `worker/index.js` rejects before storage on verification failure).
- Exactly one new `leads` row and exactly one new `intake_receipts` row — no duplicate.
- `lead_workflow` created: `stage=new`, `assigned_to=Wesleigh Behn`, `notification_state=accepted`, `next_action=Review inquiry and contact prospect`.
- The repaired private queue CLI (`be4bf6c`) retrieved the record correctly by ID.
- The historical lead (`d5a4b6e8`, received 2026-09-29) was unchanged — lead count went from 1 to 2 as expected, no data loss.
- The owner independently checked `collaborativeconstructiongc@gmail.com` and confirmed the notification email actually arrived. This resolves the "transport acceptance is not inbox delivery" caveat below.

**The original Turnstile 403 root cause from `production-verification.md` (04:36 UTC deployment, 12:11 PM EDT test) remains formally undiagnosed.** No diagnostic log entry was captured for that failure, and the diagnostics added in `57aac15` were not live at the time it occurred. The recovery deployment's own test succeeded without logging an `intake-turnstile-rejected` event, so the specific failure mode was out-run, not reproduced or root-caused. Treat this as resolved-in-practice. See `docs/phase1-status.md` for the consolidated current status.

Recovery branch `codex/phase1-recovery` has been pushed to `origin` and fast-forward merged locally into `phase1-release-prep` (now at `1a8c15b`). It has not been merged into `main` or pushed there; that requires separate approval.

## Evidence and remaining uncertainty

Production baseline remains commit `2b5f2e7ed3326a56cc71e591002ac839840ec6e8`, version `84408614-4caf-4da9-bf23-6b7c6c0bb6ab`, deployment `a79ef696-0a13-45dd-9a2a-838db7c18cc9` at 100%. Current deployment metadata was checked during recovery. The original private report is `/Users/marcusbehn/.codex/release-evidence/cc-2026-10-12/production-verification.md`.

The single failed request reached the Siteverify guard and returned 403 without a Worker exception or saved test inquiry. Its underlying cause remains unknown: the old verifier discarded all diagnostic reasons. A long-lived browser session makes expiry worth investigating, but token generation time was not captured and the widget normally auto-refreshes. Expiry is not established by elapsed page time.

The current source uses exactly `https://challenges.cloudflare.com/turnstile/v0/siteverify`, sends FormData `secret`, `response` and optional `remoteip`, reads `TURNSTILE_SECRET_KEY`, requires `success === true`, the request hostname, and action `contact`. Frontend action matches. Valid new requests invoke Siteverify once; durable identical retries return their existing receipt without validating the used token twice. The origin check remains the production apex. The public site key is unchanged.

The previous account inspection could not read widget settings (403). Secret/site-key pairing and widget hostname allowlist remain independently unverified. No secret was retrieved or rotated. Owner dashboard check, if needed: locate public site key `0x4AAAAAAFT7_DoQM-wX5k4h`, confirm `collaborativeconstructionllc.com` is allowed, and confirm the Worker binding's configured secret came from that widget. Do not paste or export the secret. No settings change is currently justified.

## Narrow changes

- `57aac15`: safe Turnstile diagnostics and frontend token lifecycle. Files: `worker/index.js`, `js/main.js`, new `js/turnstile-lifecycle.js`, `src/index.njk`, `scripts/verify-release-build.mjs`, and the intake/frontend/honeypot regression tests.
- `be4bf6c`: remote private reads use Wrangler `--command` with strict query-result parsing. Files: `scripts/leads.mjs`, new `scripts/lib/d1-read.mjs`, `scripts/lib/lead-operations.mjs`, new `tests/d1-read.test.mjs`.
- Documentation commit: this recovery runbook. No configuration, dependencies, credentials, migrations, marketing content or CSS changes.

Worker logs one `intake-turnstile-rejected` event with a fixed category: missing-secret, missing-token, invalid-token-type, token-too-long, siteverify-http, siteverify-invalid-response, siteverify-rejected, siteverify-context, timeout, network-failure or parse-failure. Only HTTP status, boolean hostname/action matches and allowlisted provider error names can accompany it. Unknown provider codes become `unknown-code`. No tokens, secrets, raw bodies, exception messages, customer fields or IPs are logged. Existing generic customer errors and fail-closed behavior remain.

Client callbacks register before the async provider script. Completion records a token and time privately in memory. Submit checks exact token identity, age below 240 seconds (one-minute transit margin), and widget expiry. It consumes local readiness before posting; stale/missing/consumed tokens require fresh verification and another deliberate Send Inquiry click. Expiry, timeout and error callbacks invalidate readiness and provide accessible feedback. Automatic widget refresh remains enabled; reset targets this form after each request. No automatic inquiry retries, customer-field clearing on failures, or honeypot clearing are introduced. The idempotency key survives unchanged retries.

CLI read commands (queue/export/history/report) use the remote query API; write operations and local execution keep their existing paths. Strict parsing rejects failed/malformed envelopes and import summaries. Query and provider errors are sanitized. Existing private file permissions, repository exclusion and no-overwrite protection remain. `queue --id UUID` optionally restricts retrieval to one lead. Full export is not needed for the next test.

## Validation

Node 22.23.3: 73 tests passed, zero failures/skips. Full production build, built-asset contract checks and Wrangler dry run passed. Repeat against the exact final clean commit before deployment. Coverage includes all diagnostic categories, privacy, hostname/action rejection, valid verification, one Siteverify call per new request, expiry/recovery, double-submit prevention, unchanged customer entries, honeypot and rate limiting, and query rows/empty/error/import-summary handling.

Read-only production validation: `SELECT 42 AS recovery_probe` returned the expected actual row with zero rows written, including through the repaired reader. CLI queue lookup of an all-zero nonexistent UUID produced a private empty-result file. No production lead database export, mutation, Siteverify request or live form submission was performed during recovery. Actual fresh Turnstile and Gmail delivery remain pending.

## Deployment gate

Checkout: `/Users/marcusbehn/.codex/worktrees/intake-release/CollaberativeConstructionWebsite`, branch `codex/phase1-recovery`. Use only the exact final reviewed commit and a clean tree; the final handoff gives the full SHA and guarded commands. Run `nvm use` (22.23.3), `npm run release:check`, then `npx wrangler deploy --config wrangler.jsonc` after approval. Recheck Worker/account, current version, bindings and compatible schema before deployment; stop if the baseline materially changed. Ship frontend and Worker together. Do not push or run migrations. Migration 0002 already exists despite the incomplete ledger.

## One fresh-browser test after separate approval

1. Start a private POST-only Worker tail for the newly deployed version; verify it is connected. Record aggregate lead/receipt counts and historical lead existence without exporting customer fields. Keep evidence outside the repository with restricted permissions.
2. Open a fresh production tab. Verify new lifecycle script/callbacks, neutral empty trap, current assets and phone/email fallbacks. Use the owner's company Gmail address with name `Phase 1 Recovery Test`, project type Home addition, town East Falmouth, and message `Authorized Phase 1 recovery test. Not a real construction project.` No attachments. If browser automation requires a CAPTCHA interaction, obtain the required action-time confirmation or let the owner complete it.
3. Complete a fresh challenge and submit promptly once. If preparation takes longer than four minutes, refresh verification before submitting. Nonempty hidden input or a visual Success alone is not proof of server verification.
4. Capture browser status plus safe response fields and Worker HTTP status/outcome. Record any diagnostic category without copying request headers, tokens, IPs or customer details into the report. If any stage fails or the response is uncertain, stop; do not resubmit automatically.
5. On success, use the returned lead ID to read only that lead, workflow and receipt. Verify exactly one of each, stage `new`, owner `Wesleigh Behn`, next action `Review inquiry and contact prospect`, follow-up due one day after receipt, historical lead preserved, and no duplicate. Inspect notification state separately.
6. Run `node scripts/leads.mjs queue --remote --id <returned-id> --out <new-absolute-private-file>`; verify one matching record with the same workflow. Do not print private records or export all leads.
7. Confirm the same reference actually arrived in `collaborativeconstructiongc@gmail.com` via authorized inbox access or explicit owner confirmation, including spam if needed. Provider `accepted` alone is insufficient. Preserve the test record.
8. Check conversion behavior under the chosen consent state. Declined consent should suppress GA; never claim GA4 receipt without independent analytics evidence. Report PASS only when core inquiry, persistence, workflow, queue and Gmail are verified; otherwise state the specific incomplete stage.

## Rollback

After approval only, revert Worker/assets together to current baseline version `84408614-4caf-4da9-bf23-6b7c6c0bb6ab` using the documented Wrangler rollback procedure. Preserve D1, receipts, workflows and R2; do not restore snapshots, replay migrations or revert schema. This target retains the honeypot fix but also the undiagnosed Turnstile failure and lacks new diagnostics/lifecycle improvements. The older `2d3e6d9c-dfdc-4194-9ad3-38aa3f394c3d` additionally restores the honeypot autofill bug and is not the preferred recovery target. No automatic rollback.

## Primary references

- [Cloudflare Siteverify validation and token lifetime](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare widget callbacks and refresh configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/)
- [Cloudflare widget lifecycle APIs](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
