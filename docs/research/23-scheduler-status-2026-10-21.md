# Scheduler and automation status, October 21, 2026

Checked from the Claude cloud session on October 21, 2026 with the GitHub and Metricool connectors. What could not be checked is listed at the end. Nothing here changed any setting.

## GitHub Actions (checked, verified-source)

| Workflow | Trigger | Result so far |
|---|---|---|
| Public Website Health (`public-website-health.yml`) | every 6 hours (`17 */6 * * *`) | 5 scheduled runs, Oct 19 22:19Z to Oct 20 21:34Z, all success. GitHub's gaps ran 4.6 to 7 hours, so timing drifts. No run seen after Oct 20 21:34Z when checked. |
| Falmouth Contractor Watch (`falmouth-competitor-watch.yml`) | weekly, Mondays 08:13 UTC | 1 run, caused by a push on Oct 19, success. The first scheduled run is due Monday Oct 26. Not yet proven. |
| Release Check (`release-check.yml`) | every pull request | Passing on PR #6 and PR #7 heads. Does not run on `main` pushes or on a schedule. |

Known weak spots:
- The health monitor reports success while `https://www.collaborativeconstructionllc.com` returns HTTP 522. It does not appear to watch the `www` host. Confirm in `scripts/monitor_public_site.py`.
- Scheduled GitHub workflows can be delayed or skipped, and GitHub pauses scheduled runs on repositories with no activity for 60 days.
- The competitor watch config lists 26 sites after this update. Two were added today and are marked "to be verified".

## Claude cloud routines

`list_triggers` returned no scheduled tasks for this account. The cloud health and competitor routines described in `docs/automation/claude-cloud-activation-steps.md` are either not activated or live under another account. Needs the owner to check.

## Local scheduled tasks on the owner's Mac (not checked)

`cc-daily-health-report-local`, `cc-daily-competitor-scan-local` and `cc-reports-sync-local` run only when Claude Code is open on that Mac. Their health cannot be seen from the cloud. Check `docs/research/22-research-report-index.md` for the newest report date.

## Metricool

No posts are scheduled between Oct 21 and Dec 31, 2026. The October 20 introduction post is published. The Facebook page identity match is still unverified.

## Open

1. Read the Cloudflare Builds setting (Git auto deploy on `main`).
2. Confirm the cloud routines are active, or decide to rely on GitHub Actions.
3. Make the health monitor watch `www`, the privacy page and the contact endpoint.
4. After Monday Oct 26, check that the competitor watch ran on schedule.
