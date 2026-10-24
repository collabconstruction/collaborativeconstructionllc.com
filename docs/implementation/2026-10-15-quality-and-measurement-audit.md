# Website quality, measurement and routine audit

Observed October 15, 2026. Frontend source: `/private/tmp/cc-midnight-brass`, branch `design/midnight-brass`. The main workspace has extensive unrelated work and was preserved. Public maintenance remains active; this audit does not restore the public frontend.

Frontend committed locally as `96e5873`; portable diff saved as `2026-10-15-quality-refresh.patch`. Not pushed or deployed. Main-workspace audit, activation and prompt edits remain local alongside existing work.

## Implemented frontend

- Contact section: paired navy information panel and white form with brass frames, useful enquiry guidance, direct phone action at the bottom. Form field names, validation, upload, Turnstile and submission contracts preserved. Contact lives at `/#contact`; there is no separate contact page.
- Shared closing Get in Touch sections: framed navy panel comparable to the estimate card, centered heading/body/action, no repeated owner portrait.
- Gallery: All / Residential / Commercial filters with pressed states and an announced result count. All seven projects remain visible without JavaScript. Consistent cards and brass accents; project attribution note retained. No claim that every photograph is an LLC project.
- About: shorter, direct account of Wesleigh's personal experience and education. Removed license-currentness claim from this bio pending fresh credential evidence; existing credential claims elsewhere still need owner verification.
- Service copy: removed “bring your vision to life,” vague lifestyle phrasing and the assertion that advisory work keeps a project on budget and schedule. Replaced with the actual activities offered.
- Footer: straight brass separator with a faint second line instead of the oversized curved outline.
- Analytics: production hostname allowlist prevents localhost and preview hosts from loading GA or sending events, even with saved consent. This is local until the frontend is released. Historical preview data remains in GA.

## Measurement results

Sanitized API evidence: `evidence/2026-10-15-quality-audit/measurement.json`, collected 2026-10-15T12:33Z. No customer records were accessed.

| Source | Evidence | Limits / next action |
|---|---|---|
| GA4 | Admin and Data APIs HTTP 200; property 558903217, Collaborative Construction LLC, America/New_York | Reporting connection works locally. Cloud runtime credentials are a separate provisioning task. |
| GA4 traffic | Oct 1–14: production hostname 6 sessions / 2 users / 50 events; localhost 5 sessions / 1 user / 35 events | Tiny sample includes development activity; do not describe as business traction. Filter past reporting to production hostname. Host-group rows need not sum to a deduplicated property total. |
| GA4 conversions | Event query returned page_view, user_engagement, session_start, scroll and first_visit | No custom call/email/form/lead events returned. This does not prove zero inquiries. Code tests pass; production conversion delivery and key-event configuration still need verification after restoration, using an explicitly authorized synthetic test. |
| GSC | Read-only API HTTP 200; finalized Sept 15–Oct 12: 415 impressions, 9 clicks, 2.17% CTR, average position 7.04 | This is property-level search activity, not leads. Existing records warn that the Testing OAuth refresh token may expire around Oct 19; publishing status was not changed or verified today. |
| Cloudflare deployment | Latest deployment e93485d0-6bd4-4c70-8745-98225614a7dc; public root HTTP 503 with Retry-After 3600 and no-store | Intentional maintenance confirmed. Availability and organic discovery remain affected until restored. No deployment performed. |
| Cloudflare traffic analytics | Dashboard redirected to login | Traffic totals, Web Analytics beacon settings and bot controls are unverified. Existing source deliberately leaves cloudflareToken null because edge injection owns that beacon; do not add a duplicate. |

Planned downtime should use 503 for temporary unavailability, but extended closure can affect search visibility. [Google guidance](https://developers.google.com/search/docs/crawling-indexing/pause-online-business). GA reporting dimensions/metrics were queried using the [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/basics).

## Claude cloud reports

GitHub was fetched successfully. No health/competitor report branches or PRs were found; local ingestion synced zero report runs, and the research report index still reports no runs. Local Claude scheduled-task instruction files exist, but their existence does not establish an active schedule or a successful run. Cloud schedules could not be inspected: Claude routines redirected to sign-in.

The owner has been asked to sign in. Do not describe the routines as enabled or receiving data until the saved schedule and first delivered report are observed.

Prepared fixes:
- Health prompt now recognizes intentional maintenance, separates expected 503 responses from unexplained outages, does not demand GA on the maintenance page, and distinguishes local preview analytics from production.
- Activation instructions no longer claim a 19-minute offset prevents overlapping 45-minute runs. Separate environments, branches and unique output directories are the isolation mechanism.

After login, use `docs/automation/claude-cloud-activation-steps.md`:
1. Inspect for existing routines first; update instead of duplicating.
2. Health daily 06:52 America/New_York; competitor daily 07:11 America/New_York. Confirm displayed timezone and enabled state. These are intended times, not verified saved schedules.
3. Repository `collabconstruction/collaborativeconstructionllc.com`, source branch `design/site-refresh-2026-10`. Confirm the remote includes the current prompts before configuring; local prompt edits are not automatically available to cloud runs. Dedicated environments; health gets only authorized reporting connectors; competitor gets public research tools only. Local ADC/MCP/Wrangler sessions do not transfer to cloud.
4. Use the complete health/competitor prompt files. Only sanitized reports on separate claude/ branches; no production edits, main writes, merges or deployments. Inspect CI before first report push.
5. Run each once and inspect the three output files in `docs/health/runs/<run-id>/` or `docs/competitive/runs/<run-id>/`: report.md, sources.json, next-tasks.md. A saved schedule alone is insufficient.
6. Run report sync/index, confirm a real dated run appears, then review findings. Cloud routines depend on account usage and configured tool access; unavailable sources must be reported explicitly.

[Anthropic routine documentation](https://code.claude.com/docs/en/routines) explains cloud scheduling and environment/connector selection. Local backup instructions are not proof of cloud activation.

## Wording research and remaining factual work

Used concise descriptive headings and concrete actions, consistent with [USWDS content guidance](https://designsystem.digital.gov/page-templates/docs/) and [Digital.gov headings guidance](https://digital.gov/guides/plain-language/design/headings). Company facts must still come from company evidence, not competitors' claims.

Before publication, verify current CSL/HIC/insurance wording, free-estimate policy, and project-by-project company versus prior-career attribution. Do not fabricate testimonials, completion statistics or response guarantees. Broader nearby-town listing does not establish capacity in every town; keep location availability subject to enquiry. Retain the sourced ADU checklist and recheck dated primary law/local guidance when changing its claims.

## Verification

96 tests passed; clean Eleventy build; release verifier passed 177 public files and 9 canonical pages. Browser checks: desktop contact presentation, all/residential/commercial filtering (7/4/3), no horizontal overflow at the observed 1280px viewport. Requested 390px viewport override was ignored by the browser backend, which still reported 1280x720; mobile appearance was not verified in this run. No lead submitted and no production settings changed. Static preview is not a backend delivery test.
