# Company health report

Status: setup/preflight only; no completed Claude Cloud run verified.
Checked: 2026-10-16. Repository: collabconstruction/collaborativeconstructionllc.com.

## Current verified access

| Source | Local check | Cloud check |
|---|---|---|
| GA4 property 558903217 | Reporting API HTTP 200; Oct 9–15: 11 sessions, 92 events | Not verified; local ADC does not transfer |
| Search Console domain property | Dedicated existing OAuth: reporting API HTTP 200; finalized Oct 6–12: 4 clicks, 90 impressions | Not verified; local credentials do not transfer |
| Public website | HTTP 503; compare with intentional-maintenance records before classifying outage | Must test each run |
| GitHub | Remote branch listing and report sync dry-run succeeded; no report runs found | Verify routine repository access and first pushed commit |
| GBP / Cloudflare analytics / intake aggregates | Not tested in this preflight; unknown | Not verified |

GA4 and GSC periods differ; do not compare their totals as a funnel. Counts include possible owner/test activity and do not establish qualified leads. The default Google ADC returned GSC 403; the dedicated GSC credential succeeded. Use the correct source-specific authorization.

## Routine contract

Daily 06:52 America/New_York. Use `docs/research/prompts/claude-cloud-health-report.txt`.
Each run updates this file on its own assigned report branch with a short dated summary and relative links to its immutable `runs/<run-id>/report.md`, `sources.json`, and `next-tasks.md`. Record source coverage, collection status and delivery status separately. Preserve this preflight as history in the commit log.

This file on the setup branch does not update itself when another branch is pushed. Read the latest report branch or run the local sync and read `docs/research/22-research-report-index.md`. No main merge is needed to read a report. No credentials or customer records belong here.
