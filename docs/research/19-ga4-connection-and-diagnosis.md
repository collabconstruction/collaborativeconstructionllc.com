# GA4 connection and missing-data diagnosis — October 13-14, 2026

Owner-confirmed configuration (from the GA4 Admin interface, business account `collaborativeconstructiongc@gmail.com`):

| Setting | Value |
|---|---|
| GA4 Property ID | `558903217` |
| Stream ID | `16124097872` |
| Measurement ID | `G-PNS7LJP5QB` |
| Google Cloud project | `collaborative-construction-ai` |
| GA4 account | `accounts/411958882` |

## Part A — GA4 MCP connection: done, verified read-only, this session

- **Reused the existing Desktop OAuth client** at `~/.cc-private/gsc/oauth-client.json` (client ID `497707730594-dltg9mm2l0ssoq4hs7m3mmq0no35uu7v.apps.googleusercontent.com`, project `collaborative-construction-ai`) — same client already used for the Search Console connection. Did not modify that file or its paired `token.json`; those remain exclusively owned by the GSC MCP tool.
- Installed prerequisites via Homebrew: `pipx` 1.17.14, `google-cloud-sdk` cask (`gcloud` 589.0.0). Neither was present before this session.
- Before running anything, confirmed no pre-existing Application Default Credentials file and no `GOOGLE_APPLICATION_CREDENTIALS` env var, so there was nothing to overwrite.
- Ran `gcloud auth application-default login --scopes analytics.readonly,cloud-platform --client-id-file=<the GSC oauth client>`. This opened a real browser on the owner's machine; the owner signed in and granted consent personally — I never touched a password. Credentials were written to gcloud's own default path, `~/.config/gcloud/application_default_credentials.json` — a file distinct from anything the GSC connection uses.
- **Verified Data API access**: `POST analyticsdata.googleapis.com/v1beta/properties/558903217:runReport` for the last 7 days returned a valid response (200, correct `currencyCode`/`timeZone` metadata) with no `rows` — i.e., access works, and GA4 has zero sessions/users to report for that property in that window. This is itself evidence, not a connection failure.
- **Admin API was initially disabled** on project `497707730594` (`SERVICE_DISABLED`, 403). Enabled it via the Service Usage API using the same ADC token (confirms the signed-in account has Editor/Owner on this Cloud project), waited ~15s for propagation, then re-queried: `GET analyticsadmin.googleapis.com/v1beta/properties/558903217` returned `displayName: "Collaborative Construction LLC"`, account `411958882` — both APIs now genuinely work, not just configured.
- Installed the **official** Google Analytics MCP server (`googleanalytics/google-analytics-mcp` on GitHub, `analytics-mcp` on PyPI) via `pipx install analytics-mcp` — chosen over two community alternatives found on npm specifically because it is read-only (`run_report`, `run_realtime_report`, `get_account_summaries`, `get_property_details`, `get_custom_dimensions_and_metrics`, `run_funnel_report`, `list_google_ads_links` — no event-send/write tool exists in it at all), unlike one community package that also supports sending Measurement Protocol events, which is more capability than this project's read-only authorization allows.
- Registered it as an MCP server for this project only, in `~/.claude.json`'s per-project `mcpServers` block (binary at `~/.local/bin/analytics-mcp`, env `GOOGLE_APPLICATION_CREDENTIALS` + `GOOGLE_PROJECT_ID=collaborative-construction-ai`). Did not touch any other project's MCP configuration.
- Confirmed the binary starts cleanly and idles on stdio (the correct behavior for an unconnected MCP server waiting for a client) with no startup errors.
- **New tools require a Claude Code restart to appear** — confirmed via `ToolSearch` that they are not yet visible in the running session, as expected for an MCP server registered after the session started.

## Part B — Why GA4 shows "no data received": root cause found, not hypothetical

Direct evidence, collected this session:

1. **`curl https://collaborativeconstructionllc.com/` → the only measurement ID present in the live HTML is `G-13DBV8V3BE`.** The production site has never been sending events to `G-PNS7LJP5QB`. This alone is sufficient root cause for "no data received."
2. **Why**: on 2026-10-13, `src/_data/analytics.json`'s `ga4MeasurementId` was switched from `G-13DBV8V3BE` to `G-PNS7LJP5QB` locally (commit `9fb6ac8`, branch `design/site-refresh-2026-10`) — but that commit has never been deployed. `wrangler deploy` is file-based from whatever is built locally at deploy time; a local commit does nothing to production until someone runs the release procedure.
3. **The consent-gating script itself is not the problem.** `curl`'d the live `js/analytics.js` and hashed it (`sha256`) against the local file: byte-identical. The loader logic deployed in production is current; only the config value it reads differs.
4. **No CSP exists anywhere** (`grep` of `worker/index.js` for `Content-Security-Policy`, and a live header check) — ruled out as an interference cause entirely.
5. **Consent-gating itself was tested against the local build** (not production, to avoid touching real traffic data) using the Claude Preview tool at `localhost:8787`:
   - Before consent: zero requests to any Google domain. The privacy gate works as designed.
   - After clicking "Accept": `gtag/js?id=G-PNS7LJP5QB` loaded (200), and a `page_view` hit posted to `google-analytics.com/g/collect` with `tid=G-PNS7LJP5QB`, reaching Google's collection endpoint (204 response recorded, though the browser's own network-log flagged it `net::ERR_ABORTED` — a logging artifact of the tab closing/navigating during capture, not a delivery failure; the 204 from Google's edge was already recorded before that flag).
   - **Caveat, disclosed plainly**: because the correct measurement ID is only present in the *local* build, this test's one `page_view` hit was a real request to the real property `558903217`, sent from `localhost:8787`, not from production, and not a lead/conversion event — it may show up transiently in GA4 Realtime as a `localhost` hit. This was a deliberate, minimal wiring check (exactly what Part B's test list asked for), not a synthetic conversion and not customer data.
6. **`generate_lead` (the contact-form conversion event) is correctly gated**: `js/main.js:536` only calls `window.ccTrack("generate_lead")` after the server response satisfies `response.ok && data.ok === true && data.stored === true && typeof data.id === "string" && data.id` — a real confirmed-storage success, not a client-side guess. No PII is attached (`ccTrack` only ever sends `form_location`). Verified by reading the code; did not submit a live test inquiry to confirm end-to-end, consistent with the standing rule against submitting test leads without separate authorization.
7. **What remains genuinely unknown, not fabricated**: whether `G-13DBV8V3BE` belongs to another live property that *is* receiving the real traffic (i.e., whether analytics data exists but is just sitting in the wrong, unlisted property) — this needs the owner (or the new MCP connection, once restarted) to check the GA4 account switcher for a property using that measurement ID. Not confirmed either way yet.

## Root cause

**Confirmed, not hypothesized**: production has simply never been pointed at the new measurement ID. The fix already exists, locally, tested, and is a one-line config value already committed (`9fb6ac8`) — it has not been deployed because no deploy was authorized. This is explanation #1 from the owner's prompt, independently confirmed by direct inspection rather than assumed.

No evidence supports explanation #2 (consent blocking) as the cause of the 48-hour "no data" warning — the consent system was found working exactly as designed, and a correctly-configured, consented page view did reach Google successfully in the one controlled test run above.

## Smallest safe correction

No code change needed beyond what's already committed locally. The smallest safe action is: deploy commit `9fb6ac8` (or whatever HEAD includes it) through the normal release procedure (isolated worktree → `npm ci` → `npm test` → `npm run build` → `verify-release-build.mjs` → `wrangler deploy --dry-run` → real deploy → post-deploy verification). **Not performed yet — deployment requires separate owner approval**, consistent with this round's explicit authorization boundaries.

## Update — October 13-14, 2026: canonical source confirmed, identity re-verified, deploy still pending

The owner sent a follow-up explaining item 7 above: **`G-13DBV8V3BE` was an Analytics setup the owner personally accessed using their *school* email, not the business account.** This resolves the open question from Part B item 7 — the old ID was never "the wrong unlisted business property," it belongs to a different, personal/school Google identity entirely. The owner then gave an explicit, standing decision:

> Collaborative Construction's website tracking and long-term business reporting will be managed through `collaborativeconstructiongc@gmail.com` / property `558903217` / measurement ID `G-PNS7LJP5QB`, going forward.

**This is now recorded as the canonical GA4 configuration for this project. Future agents and docs should treat `G-PNS7LJP5QB` / property `558903217` as authoritative and `G-13DBV8V3BE` as legacy/historical only** — not delete it, not change its permissions, not treat it as an equivalent or backup data source for this site's reporting.

Re-verification performed this round (all read-only, all additive to Part A's checks, nothing above was reversed or contradicted):

- **Re-ran `gcloud auth application-default login`** with `userinfo.email`+`openid` added to the scope list specifically to get a hard answer on which Google identity the existing ADC token belongs to (the owner's new message raised a legitimate doubt about this, since two personal/business Google accounts are both in play). Queried `https://www.googleapis.com/oauth2/v2/userinfo` with the resulting token: **confirmed `collaborativeconstructiongc@gmail.com`** — the business account, not the school one. This is a definitive identity check, not an inference from "the API calls happened to work."
- **Re-confirmed the property↔stream↔measurement-ID mapping directly from the Admin API's `dataStreams` endpoint** (`GET analyticsadmin.googleapis.com/v1beta/properties/558903217/dataStreams`), which returned `properties/558903217/dataStreams/16124097872` → `measurementId: "G-PNS7LJP5QB"` — an authoritative, machine-verified confirmation of the owner-reported table at the top of this document, not just trust in what was typed into chat.
- **Re-confirmed no double-send risk exists structurally**: grepped the full repo (excluding `node_modules`/`_site`) for both measurement IDs — the only live code reference is the single `ga4MeasurementId` value in `src/_data/analytics.json`; grepped `worker/index.js` for any Measurement-Protocol/server-side send pattern — none exists. There is exactly one place in the codebase a measurement ID can be read from, so sending to both properties simultaneously is not possible with the current code, regardless of deploy state.
- **Re-ran the full pre-deploy verification chain without deploying**: `npm test` (95/95 pass), `npm run build`, `node scripts/verify-release-build.mjs` (passed), `npx wrangler deploy --dry-run` (succeeded, bindings matched the known-good set with no drift). Current live Worker version at time of this check: `00c4ba2e-dee6-4c69-9771-954ac685cd8d` (100% traffic) — this is the rollback target if/when a real deploy is approved and run.
- **No file changes were needed this round.** `src/_data/analytics.json` already has `ga4MeasurementId: "G-PNS7LJP5QB"` from commit `9fb6ac8` (the prior round's "smallest local change"). That commit is still unmerged/undeployed; nothing new was committed to application code this round, only to this documentation and to `docs/research/06-data-access.md`'s GA4 section (updated same day to drop its stale "not yet obtained" framing).

**Still true, unchanged from Part A/B above**: production (`https://collaborativeconstructionllc.com`) is still serving `G-13DBV8V3BE` as of this check — the corrected tag exists only in the local commit, not live. Deployment has deliberately not been run, per explicit instruction not to deploy without separate approval.

### Controlled deployment and verification procedure (prepared, not run)

This is the exact procedure that will be followed once the owner gives separate deploy approval — written out explicitly rather than left as "the normal release procedure" shorthand, per the owner's request. Steps 1-5 have already been dry-run/rehearsed this round (not against production); step 6 onward requires approval first.

1. Create a fresh, isolated `git worktree` detached at the exact commit to deploy (HEAD including `9fb6ac8`) — never deploy from the main working tree, consistent with every prior release in `docs/releases/`.
2. In that worktree: `npm ci` (clean install), `npm test` (must be 95/95 or whatever the current full count is, 0 fail, 0 skip), `npm run build`, `node scripts/verify-release-build.mjs` (checks public file set, trap/challenge contracts, canonical/sitemap/JSON-LD invariants). All four already passed this round against this exact commit.
3. `npx wrangler deploy --dry-run` — confirms bindings (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL`, rate limiter, env vars) match the known-good set with zero drift. Already passed this round.
4. Record the current live Worker version via `npx wrangler deployments list` as the rollback target before deploying. Recorded this round: `00c4ba2e-dee6-4c69-9771-954ac685cd8d`, 100% traffic.
5. **Stop here without separate owner approval.** Steps 1-4 are non-destructive dry runs/local checks only; nothing below this line touches production.
6. **(Pending approval)** Run the real `npx wrangler deploy` from the isolated worktree.
7. **(Pending approval)** Post-deploy `curl` checks: confirm the live HTML's only measurement ID is now `G-PNS7LJP5QB` (not `G-13DBV8V3BE`), confirm homepage and all canonical pages still return 200, confirm `css/styles.css`/other assets are intact.
8. **(Pending approval) Per the owner's explicit instruction**: verify using a clean browser (fresh profile or private window, no stale `cc-consent` localStorage key from testing) — grant analytics consent via the real banner on the live site, then confirm the hit appears in GA4 **Realtime** or **DebugView** for property `558903217`, under a session that is clearly identifiable as a verification check (not conflated with real customer traffic in any report).
9. Write a dated release record under `docs/releases/` (same format as `2026-10-13-design-motion-faq-release.md`) documenting the deployed commit, new Worker version ID, rollback command, and post-deploy verification results — this is the standing convention for every production change in this repo.
10. Rollback path if anything goes wrong: `npx wrangler rollback 00c4ba2e-dee6-4c69-9771-954ac685cd8d --name collaborativeconstructionllc-com --message "<reason>"` — restores the prior version, touches no D1/R2 data.

## Owner actions still open

1. Approve deploying commit `9fb6ac8` (or current HEAD including it) so the live site actually starts sending to `G-PNS7LJP5QB`. **Once approved, verify post-deploy using a clean browser with explicit analytics consent granted, checked against GA4 Realtime or DebugView for property `558903217`** — per the owner's explicit verification instruction.
2. ~~Restart Claude Code so the newly registered `google-analytics` MCP tools become available~~ — superseded by this round's direct REST/ADC verification (identity, property, and dataStreams all confirmed without needing the MCP tool surface itself to be loaded). Restarting is still worthwhile to get the convenience of the MCP tool surface (`run_report`, `get_account_summaries`, etc.) for future reporting, but is no longer blocking any open verification question.
3. ~~Check the GA4 account switcher for any other property using `G-13DBV8V3BE`~~ — resolved by the owner directly: that property belongs to the owner's school Google account, not a misplaced business property. No further lookup needed. Per standing instruction, it is being preserved untouched (no deletion, no permission change).
4. Once deployed, allow some real traffic time, then use the MCP connection (or the same raw REST calls used in this diagnosis) to pull a first real GA4 baseline for `558903217` alongside the existing GSC one.
