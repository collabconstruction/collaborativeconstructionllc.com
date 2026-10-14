# GA4 measurement-ID activation — production release — 2026-10-14

Status: **Deployed and verified live, with one honest caveat on end-to-end Analytics confirmation (see "What is not yet confirmed" below).** No database migration, no `worker/index.js` change, no new binding, no customer data touched, no Git push to `origin`, no merge to `main`. The owner reviewed a prepared, detailed authorization prompt (including explicit isolation, verification, and stop-if-unsafe conditions) and approved production activation in chat.

Deployed an **isolated cherry-pick of commit `9fb6ac8`** onto the production baseline `ff8cfb4`, producing release commit `1602f6c` in a throwaway worktree — not a deploy of the full `design/site-refresh-2026-10` branch tip, which also carries unrelated/unreviewed redesign and docs commits.

## Why an isolated cherry-pick instead of deploying branch HEAD

At deploy time, `design/site-refresh-2026-10` HEAD was `4568220`, several commits ahead of the last production release (`ff8cfb4`, Worker version `00c4ba2e-dee6-4c69-9771-954ac685cd8d`). A diff between those two commits showed:

```
docs/implementation/2026-10-13-design-motion-handoff.md   | new, docs-only
docs/releases/2026-10-13-design-motion-faq-release.md     | new, docs-only
docs/research/06-data-access.md                           | new, docs-only
docs/research/14-phase2-execution-plan.md                 | docs-only
docs/research/19-ga4-connection-and-diagnosis.md           | new, docs-only
src/_data/analytics.json                                  | 2 insertions, 2 deletions  <- the only app-code change
```

Every non-docs change between the last production release and branch HEAD was exactly the 2-line `analytics.json` edit from `9fb6ac8`. Rather than trust that observation alone, the release was built by branching fresh from the known-good production commit (`ff8cfb4`) and cherry-picking only `9fb6ac8` onto it — so the deployed artifact is provably limited to the measurement-ID correction, independent of whatever else lands on the branch later.

## What was approved and deployed

- `src/_data/analytics.json`: `ga4MeasurementId` switched from `G-13DBV8V3BE` to `G-PNS7LJP5QB` (business-owned property `558903217`, stream `16124097872`, account `collaborativeconstructiongc@gmail.com`). Config-only; `js/analytics.js`'s consent-gated loader logic is untouched (confirmed byte-identical via SHA-256 before and after: `06717e289a8c3252fabe63e676d1ad1c43529cb3a596c35df4057efa4f337420`).

## What was explicitly not part of this release

- No redesign work, no unrelated feature, no Git push/merge to `main`.
- No change to `worker/index.js`, intake/Turnstile/honeypot logic, migrations, or any D1/R2 binding.
- No customer email, no new lead submission, no production database change.
- `G-13DBV8V3BE` (the prior, school-email-associated property) was left untouched — not deleted, no permission change.

## Preflight, in the isolated worktree (`/tmp/cc-release-ga4-*`, detached at `ff8cfb4` + cherry-pick of `9fb6ac8` = `1602f6c`)

- `npm ci` — clean, 163 packages.
- `npm test` — **88/88 pass, 0 fail** (same count as the `ff8cfb4` baseline release, confirming no test-suite drift from the isolation approach).
- `npm run build` — 11 files written. Build output grepped: all 9 canonical pages contain `G-PNS7LJP5QB`; zero occurrences of `G-13DBV8V3BE` anywhere in `_site`.
- `node scripts/verify-release-build.mjs` — passed (51 public files, trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants across 9 pages).
- `npx wrangler deploy --dry-run` — bindings matched the known-good set exactly: `SEND_EMAIL`, D1 `cc-leads`, R2 `cc-lead-attachments`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS` — no drift.
- Additional checks specific to this release (requested explicitly): grepped the full repo for `googletagmanager|gtm\.js|GTM-` — the only match is `js/analytics.js`'s own consent-gated `gtag/js` loader URL; no Google Tag Manager container and no other third-party pixel exists anywhere in `src/_includes/base.njk` or elsewhere. Grepped both measurement IDs across `src`/`worker`/`js` — the only live reference is the single `ga4MeasurementId` field; `worker/index.js` has zero analytics/script/CSP-related code, so simultaneous dual-property sending is structurally impossible.
- Confirmed pre-deploy production Worker version via `wrangler deployments list`: `00c4ba2e-dee6-4c69-9771-954ac685cd8d`, 100% traffic — recorded as the rollback target.

## Deployment

```sh
# isolated worktree, detached at ff8cfb4, with 9fb6ac8 cherry-picked as 1602f6c
npx wrangler deploy
```

- **Deployed at:** 2026-10-14T01:42:33Z
- **New Worker version:** `2df7f1c9-d140-45cb-91d3-1ef65f78f42e`
- **Traffic:** 100%
- **Assets uploaded:** 9 new/modified (the 9 canonical HTML pages carrying the new measurement ID), 42 already-uploaded assets unchanged (css/js/images — including `js/analytics.js`, confirming it was never touched by this release), 63 total read from `_site`.
- **Production URL:** `https://collaborativeconstructionllc.com` / `https://collaborativeconstructionllc-com.wesleighb.workers.dev`
- **Release commit:** `1602f6c` (cherry-pick of `9fb6ac8` onto `ff8cfb4`, exists only in the throwaway worktree — not pushed to any branch in the main repo; the equivalent change is already on `design/site-refresh-2026-10` as `9fb6ac8`).
- **Rollback target:** `00c4ba2e-dee6-4c69-9771-954ac685cd8d`.

## Post-deploy verification (live, against `https://collaborativeconstructionllc.com`)

- Homepage and all 8 other canonical pages: **200** each.
- Live homepage HTML's only measurement ID is `G-PNS7LJP5QB`; zero occurrences of `G-13DBV8V3BE`. Re-checked across all 9 canonical pages individually — same result on every page.
- `js/analytics.js` live SHA-256 matches the pre-deploy known-good hash exactly — confirms the consent-gating code was not altered by this deploy.
- `css/styles.css`, `sitemap.xml`, `robots.txt` all **200**, unchanged.
- No Google Tag Manager container found live (`googletagmanager|GTM-` grep on live homepage HTML: 0 matches beyond the expected `gtag/js` loader call).

### Clean-browser consent + tag verification (live site, real Chrome browser, not a local build)

- Started from a genuinely no-consent state (cleared `localStorage['cc-consent']`, reloaded): **zero requests to any Google domain** before consent — consent gating confirmed working in production, not just locally.
- Clicked "Accept" on the live consent banner: `localStorage['cc-consent']` became `"granted"`, the banner closed, and `window.dataLayer` populated with the expected sequence — `consent/default` (`analytics_storage: granted`, `ad_storage`/`ad_user_data`/`ad_personalization`: all `denied`), `config` targeting `G-PNS7LJP5QB` with `send_page_view: false` / `allow_google_signals: false` / `allow_ad_personalization_signals: false`, then an explicit `event: page_view`. This is strong evidence the tag initialized correctly with the right destination and the right privacy defaults.
- `gtag.js` was confirmed loaded from `googletagmanager.com` with the correct `id=G-PNS7LJP5QB` query parameter (one anomalous `503` on the very first page load of the session, which did not recur on any subsequent reload — consistent with a transient edge hiccup or a one-time extension interaction rather than a real delivery defect, since the library subsequently loaded from cache cleanly every time after).

### What is not yet confirmed (reported honestly, not glossed over)

- Neither the Chrome extension's network-request capture nor the browser's own Performance Resource Timing buffer recorded an explicit outbound request to `google-analytics.com/g/collect` during this check, despite the `dataLayer` evidence that `gtag` queued a `page_view` event.
- Two `runRealtimeReport` queries against property `558903217` (via the Data API, using the same verified `collaborativeconstructiongc@gmail.com` credentials from the Part A connection work), taken a few minutes apart, both returned **zero rows / zero active users**.
- This gap is reported rather than assumed away: it is consistent with (a) normal GA4 Realtime propagation lag, (b) a browser-extension-level content blocker in the specific Chrome profile used for this check silently intercepting the collection beacon while still allowing the gtag library itself to load, or (c) some other delivery issue. The tooling available in this session cannot distinguish between these with certainty.
- **Per the owner's own anticipation of this exact scenario** ("If GA4 reporting is delayed, distinguish successful browser collection from confirmed Analytics reporting"): client-side tag initialization is confirmed; end-to-end delivery into GA4 is not independently confirmed by this agent in this session. The owner is best positioned to resolve this ambiguity directly — sign in to the GA4 console as `collaborativeconstructiongc@gmail.com`, open Realtime for property `558903217`, and visit the live site in a normal (non-extension-modified) browser window while granting consent. That is a stronger, unambiguous signal than anything obtainable through this session's tooling.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 00c4ba2e-dee6-4c69-9771-954ac685cd8d --name collaborativeconstructionllc-com --message "Revert GA4 measurement-ID activation; restore prior analytics config"
```

This restores the immediately-prior Worker version (the header-cleanup/FAQ release) and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Note: a rollback here reverts the *measurement ID*, not the GA4 property setup itself — it would simply point the live site back at `G-13DBV8V3BE`.

## Still open (not resolved by this release)

- Independent, owner-side confirmation of GA4 Realtime/DebugView receipt (see caveat above) — this is the one remaining item before the GA4 connection can be called fully closed end-to-end.
- The unrelated redesign/docs commits on `design/site-refresh-2026-10` ahead of `ff8cfb4` (everything except `9fb6ac8`) remain unreviewed/undeployed, exactly as intended — this release did not touch them.
- None of the 7 gallery projects has confirmed attribution — still true, unrelated to this release.
- The independent Claude review from 2026-10-11 is still **not** completed (account weekly limit) — unrelated to this release.

## Cross-references

- `docs/research/19-ga4-connection-and-diagnosis.md` — full GA4 connection, root-cause diagnosis, and canonical-source declaration.
- `docs/research/06-data-access.md` — GA4 section, updated to reflect this connection.
- `docs/releases/2026-10-13-design-motion-faq-release.md` — the immediately-prior release (`ff8cfb4` → `00c4ba2e-...`), this release's rollback target and cherry-pick base.
