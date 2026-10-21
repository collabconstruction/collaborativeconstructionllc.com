# Scheduler and automation audit

Date: 2026-10-21 (America/New_York)
Sources checked: GitHub Actions REST runs and workflows; repo scripts/monitor_public_site.py, docs/research/23-scheduler-status-2026-10-21.md and report-ingestion.md; Metricool scheduled-post connector
BLOCKED: Claude Cloud routines under other accounts; Mac local schedules, Cloudflare cron and external automation account settings; archive/download of every run artifact.
Evidence labels: `verified-source` = directly opened document, repository code, run or URL (not certification of third-party claims); `reported` = secondhand assertion; `estimate` = explicit assumption or calculation; `owner-confirmation-needed` = requires authorized account, record or decision. Unknown never means zero.

## Live GitHub Actions

| Workflow | Trigger | Last verified outcome | Next expected trigger | Main weakness | Owner |
|---|---|---|---|---|---|
| [Public Website Health](https://github.com/collabconstruction/collaborativeconstructionllc.com/actions/workflows/public-website-health.yml) | `17 */6 * * *`, default branch | successful scheduled run 2026-10-21 04:41Z, [run](https://github.com/collabconstruction/collaborativeconstructionllc.com/actions/runs/39545375516) | next cron slot after prior run; execution may drift | Ignores www; reports success unless apex homepage fails; no contact API endpoint check | Engineering |
| [Falmouth Contractor Watch](https://github.com/collabconstruction/collaborativeconstructionllc.com/actions/workflows/falmouth-competitor-watch.yml) | Monday schedule plus selected pushes | One verified success on a 2026-10-19 push; scheduled trigger not proven | Monday 2026-10-26 around 08:13 America/New_York **if current timezone-aware workflow**; inspect current workflow before relying on clock | Script's competitor URL identity, stale baseline and zero/unknown mix | Research agent |
| [Release Check](https://github.com/collabconstruction/collaborativeconstructionllc.com/actions/workflows/release-check.yml) | PR updates and manual dispatch | Latest available run for PR #6 and #7 branches green as of this audit; dates vary with concurrent updates | next PR change | Not a continuous production health monitor; no deploy; full live overlay untested | Engineering |

The original scheduler report described first five health runs. That was correct at time observed, but subsequent GitHub runs supersede it. A successful GitHub job means the job's own limited assertions passed, not the website is healthy. [GitHub warns scheduled Actions may run late or be dropped and may auto-disable on inactive public repos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows). Do not claim the next run will fire at the exact cron minute.

## Other scheduling systems

| System | Observation | Label | Needed verification |
|---|---|---|---|
| Claude cloud routines | Other agent reported zero triggers for its checked account on Oct 21 | reported | Owner confirms correct account and Routines UI. |
| Local Mac Claude tasks | `cc-daily-health-report-local`, `cc-daily-competitor-scan-local`, `cc-reports-sync-local` described in report-ingestion.md. | verified-source as documentation, not actual execution | Inspect the Mac/app log and most recent generated report. |
| Metricool | Connector returned no future posts between Oct 21 and Dec 31 for brand 7490851. | verified-source | Confirm destination Page identity before reactivating. |
| Cloudflare Cron | No dashboard access, triggers not established. | owner-confirmation-needed | Inspect Worker triggers and deployment settings. |
| External workflows | None independently audited; absence from GitHub is not evidence they do not exist. | owner-confirmation-needed | Inventory calendars, scripts, schedulers and API budgets. |

## Recommended monitoring coverage

Apex: GET /, /about/, all 9 canonical pages, robots and sitemap with expected status, page title, canonical and no accidental index blocks. Www: expect one 301 to same apex path/query, not a 200/522. Form: GET or HEAD /api/contact expected documented 405/404; **never submit customer-like data on a timer**. Privacy: check /privacy/ only after enabled and deployed. Browser synthetic checks: noninvasive smoke navigation, separate staging only for form submissions. Alert on a change from baseline, with backoff, rate limits and severity, not on every healthy run.

## Failure, gap and next run report contract

Every scheduler run must output `checked_at_utc`, `scheduled_for`, `started_at`, `result`, `degraded`, `checks_attempted`, `missing_checks`, `source_run_id`, `oldest_artifact_age`. If the scheduler itself fails, GitHub Actions job status is the source. Use daily reconciliation of expected-versus-actual run IDs, never assume every scheduled slot occurred. The generated local research index may lag the remote report branches by days.

## Next 3 actions

1. Open engineering issue for www 301 and improved monitor error semantics.
2. Check competitor workflow scheduled execution after October 26; inspect artifact and alert on missed run.
3. Owner confirms Cloudflare and Claude routine inventories and operating budget.
