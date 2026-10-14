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

## Owner actions still open

1. Approve deploying commit `9fb6ac8` so the live site actually starts sending to `G-PNS7LJP5QB`.
2. **Restart Claude Code** so the newly registered `google-analytics` MCP tools become available in a session (confirmed not yet visible in this one).
3. Check the GA4 account switcher for any other property using `G-13DBV8V3BE`, to rule in/out whether historical data exists somewhere else under a different property.
4. Once restarted and deployed, allow some real traffic time, then use the new MCP connection to pull a first real GA4 baseline alongside the existing GSC one.
