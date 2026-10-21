# Intake release candidate — 2026-10-12

Status: local release preparation; push, deployment and live inquiry await explicit approval. This procedure supersedes older Phase 1 activation documents for this release. Those historical documents remain outside the release commit; do not use their migration or rollback commands.

## What is already live

Read-only Cloudflare inspection found Worker version `2d3e6d9c-dfdc-4194-9ad3-38aa3f394c3d` (created 2026-10-11 16:47:50 UTC), serving 100% of production traffic. The public apex domain maps to `collaborativeconstructionllc-com` in account `0fadcd0965374caa75a44c3aa9784042`.

The downloaded Worker bundle matches the Phase 1 implementation except for the honeypot fix. Live `js/main.js` and `js/intake-context.js` match local source byte-for-byte. Live analytics and CSS differ only in the trap name/hiding fix. All eight secondary HTML pages (five service pages, advisory, about, gallery) match the local pre-release build. Live homepage differences are the trap fix and an incorrect 10,000-character message limit; the candidate uses 5,000, matching the existing Worker limit. Sitemap content matched before committing previously uncommitted page sources; the candidate's Git-derived last-modified dates reflect those commits.

Thus the larger source diff records completed code already serving production, rather than introducing a new growth experiment. Research, agent skills, old release reports and unfinished workspace documents are excluded.

## Commit organization

- `d2872d6`: focused honeypot fix and independent regression suite.
- `d709ba5`: existing workflow schema, private lead CLI, local-only runtime config, and operations tests/documentation.
- `04b2ee0`: complete compatible deployed Phase 1 frontend, Worker, bindings, service pages and integration tests; retains the honeypot fix.
- The commit containing this procedure: Node 22.23.3 selection, dependency engine metadata, release build checks, production baseline evidence, structured error events and monitoring configuration. No dependency versions are upgraded.

## Configuration and database verification

- Compatibility date remains `2025-06-01`.
- `DB` is the existing `cc-leads` database, ID `7e094c32-e89e-4efa-95ce-1133a9b4293c`.
- `ATTACHMENTS` points to existing `cc-lead-attachments`; no bucket or object changes.
- `INTAKE_RATE_LIMITER` matches production namespace `10041`, 5 attempts per 60 seconds.
- Assets remain `_site` only, with `/api/*` routed through the Worker first.
- `SEND_EMAIL` and `LEAD_INBOX` target `collaborativeconstructiongc@gmail.com`. Cloudflare confirms that destination was verified. Sender remains `website@collaborativeconstructionllc.com`.
- Production has `TURNSTILE_SECRET_KEY`. The candidate retains public key `0x4AAAAAAFT7_DoQM-wX5k4h`, exactly as rendered live, and action `contact`. No secret value was read or changed. Existing OAuth cannot read Turnstile widget settings (403), so hostname allowlist and secret/key pairing are not independently verified. Do not rotate credentials to address that access gap. A successful authorized browser challenge is still required.
- Production also has an unused `BREVO_API_KEY` binding. The deployed and candidate code use native Cloudflare email, with an optional Resend fallback only when configured. No provider switch or secret removal is part of this release.
- All 12 application tables/indexes/triggers match the local migration-created schema after SQL whitespace normalization. Read-only counts: 1 lead, 1 workflow, 0 intake receipts. No customer field values were fetched; all inspection queries reported zero rows written.
- **Migration 0002 is already applied, but is absent from the production migration ledger. Do not run migrations, replay SQL, backfill, repair the ledger, or restore D1 during this release.** The mismatch is recorded for separate maintenance. Migration files are committed as the schema/test baseline, not as deployment instructions.
- Proposed monitoring change: persist structured error-event codes, disable automatic invocation logs, and sample traces at 1%. Application logging adds no customer fields or request bodies. These settings are local until approval/deployment.

## Exact candidate verification

Use a clean checkout of the reviewed release commit, with Node 22.23.3 selected by `.nvmrc`. Install from `package-lock.json` using `npm ci`, then run `npm run release:check`.

That command runs the entire test suite, cleans and builds Eleventy, checks built frontend/Worker trap and challenge contracts, checks the 5,000-character limit, verifies local page/asset references, excludes private files from the public build, and runs `wrangler deploy --dry-run`. The dry run does not upload or deploy.

The suite contains 51 tests, including synthetic SQLite transactions, retries, upload failures, notification errors, origin/rate limiting, Turnstile success/failure, autofill, duplicate/non-string traps, unchanged client trap submission, analytics consent and private CLI controls. Passing these tests does not prove live CAPTCHA or Gmail delivery.

## Deployment after approval only

Use the separately prepared clean release checkout, not the dirty research workspace. The final handoff provides its absolute path and full expected commit hash. Verify both HEAD and an empty `git status --porcelain` before executing:

```sh
nvm use
npm run release:check
npx wrangler deploy --config wrangler.jsonc
```

The exact deployment command is `npx wrangler deploy --config wrangler.jsonc` after the verified build in that clean checkout. It ships frontend assets and Worker together. No migration, secret, or Git push command is included. Recheck current deployment identity and bindings immediately before deployment; stop if production changed since this review.

## One approved real inquiry after release

1. Obtain explicit approval for deployment and the single live inquiry. Use the owner's approved contact details and a unique test message. Complete Turnstile normally; do not bypass it.
2. Submit once from the production website. Confirm `ok: true`, `stored: true`, and retain the returned inquiry ID privately. A failed/uncertain response must be investigated before retrying; the UI preserves the submission key for unchanged retries.
3. Read only that returned ID in D1. Verify exactly one `leads` row, a linked `lead_workflow`, an `intake_receipts` row, assigned responder, stage `new`, next action and follow-up date. Use an aggregate count beforehand/afterward only as supporting evidence.
4. Verify `notification_state` transitions to `accepted` or investigate `failed`/`pending`. Transport acceptance alone is not Gmail delivery.
5. Have the company inbox owner confirm the same inquiry ID and message in Gmail (including spam if necessary). Do not claim inbox success from a database flag. Record confirmation without putting contact details/message text into Git.
6. Keep the inquiry and its audit history. No automatic deletion or cleanup of production rows. If notification fails, the saved inquiry remains actionable through the private queue; do not resubmit merely to trigger another email.

## Rollback that preserves inquiries

Record the new deployed version ID when releasing. If the new version causes a release regression, the application-only emergency rollback command, after approval, is:

```sh
npx wrangler rollback 2d3e6d9c-dfdc-4194-9ad3-38aa3f394c3d --name collaborativeconstructionllc-com --message "Emergency intake release rollback; retain all D1 and R2 data"
```

This restores the previous code/assets version, not a Git branch. Keep D1 tables, triggers, receipts, stage history and all R2 objects intact. Do not run `git checkout main` as a rollback mechanism; do not restore a database snapshot, drop tables, delete rows, or replay migrations. The previous Worker already uses the same schema. Recheck bindings/secrets before rollback if anyone changed them after release.

**The rollback target contains the known autofill bug.** It is an emergency return to the verified prior deployment, not a fix for that bug. Prefer a narrow forward correction if possible. After rollback, verify the website version and inquiry/workflow counts, and continue processing saved inquiries through the private queue. Email failure alone is not a reason to lose a durably saved inquiry.

Cloudflare documents that code rollback does not roll back connected resource data: [rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/). Monitoring settings follow [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) and [Traces](https://developers.cloudflare.com/workers/observability/traces/), validated against installed Wrangler 4.104.0.
