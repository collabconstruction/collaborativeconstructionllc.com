# Automation and analytics audit

Checked October 17, 2026, America/New_York (API requests extended into October 18 UTC). Read-only investigation; no schedules, account settings, deployment or GitHub PRs changed. Credentials were consumed programmatically from existing authorized stores and were not printed or copied. No customer records were accessed.

## Verdict

Local GA4 and GSC reporting work, but no verified end-to-end automated analytics reporting pipeline exists. Scheduled-task definitions, account connections, event code and actual successful recurring reports are different evidence levels. Do not treat any one as proof of all the others.

## Fresh verified observations

- GA4 Data API property 558903217 returned HTTP 200. October 1–16, America/New_York: production hostname 6 sessions, 2 users, 57 events; localhost 5 sessions, 1 user, 35 events. Hostname rows are not guaranteed additive for deduplicated users or sessions. Very small sample, likely includes owner/test activity; not business traction.
- GA4 event report for that period returned page_view 45, user_engagement 25, session_start 11, scroll 8, first_visit 3. No click_to_call, click_to_email, form_start or generate_lead rows. Absence does not establish zero real inquiries or identify the cause.
- GA4 Admin API keyEvents currently lists close_convert_lead, qualify_lead and purchase (ONCE_PER_EVENT). **generate_lead is not listed as a key event.** Its successful collection and its designation as a conversion/key event are separate checks. The listed downstream names do not prove qualification/sales events are actually emitted.
- GSC dedicated OAuth refresh and Search Analytics API succeeded. Final web-search totals September 17–October 14: 432 impressions, 15 clicks, 3.47% CTR, average position 8.31. GSC reporting dates use Pacific time. Different period/source from GA; not a conversion denominator.
- Current source measurement ID is G-PNS7LJP5QB, not G-13DBV8V3BE cited in the pasted audit. The old ID was superseded October 13 per the account record.
- Public homepage returns HTTP 503, Retry-After 3600, Cache-Control no-store/must-revalidate. This matches intentional maintenance. Local previews do not demonstrate a restored public website.
- GitHub repository default branch is main. PR #1 remains open/unmerged: automation/website-health-monitor -> main. Actions API total_count is 0. Default tree has no .github directory.
- Proposed workflow runs at minute 17 every six hours (UTC), with manual dispatch, read-only repository permission and 30-day artifacts. It checks only root/robots/sitemap. It does not ingest GA/GSC, reconcile leads, analyze competitors or produce a company scorecard. It exits failure on homepage non-200; current intentional 503 would be reported as failure if activated as-is.
- Report ingestion dry run fetched origin successfully, scanned zero qualifying report branches and would sync zero completed runs. Only one remote claude/* branch was found, a redesign branch. Current health/competitor REPORT.md files identify themselves as setup/preflight, not completed cloud routine runs. Research report index has no completed runs.
- Metricool get-brand-settings succeeded for brand 7490851; timezone America/New_York, Facebook and LinkedIn network connections present. Facebook identifier reported by Metricool is not the supplied public Page ID; this may be an API-scoped identifier and must be resolved rather than assumed wrong or assumed correct. LinkedIn is a person URN, not a company organization URN. No post schedule or analytics metrics were queried in this audit.

## Scheduler inventory and proof limits

| Scheduler | Definition/status observed | Execution evidence |
|---|---|---|
| GitHub public monitor | PR #1 only; six-hour cron | Zero Actions runs; not active on default branch |
| Claude cloud health | Activation instructions target 06:52 Eastern daily | No verified routine UI/runtime or completed report push |
| Claude cloud competitor | Activation instructions target 07:11 Eastern daily | No verified routine UI/runtime or completed report push |
| Claude local health backup | ~/.claude/scheduled-tasks/cc-daily-health-report-local/SKILL.md | Instruction file exists; scheduler registration/history not verified |
| Claude local competitor backup | cc-daily-competitor-scan-local/SKILL.md | Same limitation; local app availability required |
| Claude local report sync | cc-reports-sync-local/SKILL.md; docs say 08:00 daily | Manual dry run works; recurring execution not verified |
| Codex monthly social review | ACTIVE local automation config; first day monthly, 09:00 | Draft-review task, not publishing or analytics ETL; no first-run result established |
| Codex weekly social review | ACTIVE config; Monday 09:15, targets another chat | Includes Metricool brand 7490851; different Facebook and LinkedIn public URLs from this chat; reconcile intended identity before trusting output/actions |
| ChatGPT daily site / weekly competitor tasks | Pasted audit says enabled | Not independently inspected in this environment; pasted counts/notifications are reported evidence only |
| Cloudflare scheduled analytics job | No cron triggers or scheduled handler found in current Worker/config | No cloud analytics reporting job established by website source |

Codex weekly prompt references Facebook Page 61595651094549, while this chat supplied 61593017512930; do not silently redirect work. It also references a differently named LinkedIn path. This may reflect work in another chat, but must be reconciled with the owner/current connected identity. Existing weekly follow authorization belongs to that task; this audit performed no follows.

## Code-level assessment

Consent-gated analytics has an explicit business-event allowlist and sends only a normalized page path, not customer fields or lead IDs. grant() disables automatic page_view then emits one explicit page_view. Custom generate_lead is emitted only after response.ok, data.ok, data.stored and a nonempty server-generated ID. This is a useful durable-storage contract; email notification and follow-up remain separate states.

The main workspace js/analytics.js currently has no production-hostname gate. Historical localhost rows prove development contamination already exists. A prior isolated preview audit describes a hostname gate, but it is not in this audited checkout; do not assume that preview fix is released. Current public maintenance prevents a meaningful restored-site conversion journey test. D1 data and real form submission were deliberately not inspected/submitted here; latest historical successful pipeline test is October 12, not fresh end-to-end evidence.

Tests against current workspace: 107 total, 104 passed, 3 skipped, 0 failed. Passing tests do not prove live event delivery, account ownership, email delivery or cloud scheduler execution.

## Priority next actions

1. Reconcile current release source and intentional maintenance before activation. Do not merge or deploy as part of this audit.
2. Review GA4 key-event policy; register generate_lead as the actual inquiry conversion after owner-authorized account change. Keep call/email clicks as intent metrics, not confirmed leads or calls.
3. Integrate and verify the production-hostname gate, and filter historical GA reports by production hostname. Do not silently delete historical data.
4. After restoration, perform one explicitly approved synthetic inquiry with consent, verify durable storage, notification and GA event independently, and exclude it from business totals. Test declined consent separately; D1 and GA totals should not be expected to match because consent/blocking reduces GA coverage.
5. Review/activate the GitHub monitor with an explicit maintenance state and run it once; inspect its artifact. This does not activate authenticated analytics reports.
6. Verify the actual Claude cloud scheduler and credentials inside its execution environment. Run health/competitor lanes once and confirm dated report.md/sources.json/next-tasks.md were pushed and ingested. Local ADC does not transfer to cloud routines.
7. Reconcile social identities and consolidate monthly/weekly draft-review responsibilities to avoid duplicates. Metricool being connected does not itself schedule posts.
8. Add a single private metrics collection/reporting owner with dated source manifests, periods/timezones, completeness, production filter and test exclusions. Cloudflare/GBP remain missing metrics. GSC refresh succeeded now; the previously documented October 19 Testing-app expiry risk is still a future risk, not resolved by today's success.

## Evidence methods

Read-only Google Data/Admin REST calls with existing ADC; dedicated GSC refresh and searchAnalytics.query; gh api for repo/PR/Actions/default-tree/workflow; git ls-remote and sync-reports --dry-run; current source/config review; Metricool brand settings. No secrets, raw customers or bearer links retained. ChatGPT/Claude cloud scheduling UIs, live Cloudflare traffic, D1 lead totals and Metricool post analytics remain untested.
