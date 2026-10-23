# Source Registry — AI Intelligence Sources

**Last updated:** October 23, 2026  
**Purpose:** Track all AI report producers, their schedules, and where their outputs live

## Active sources

| Source | Agent/Platform | Responsibility | Schedule | Output location | Last verified run | Freshness expectation | Privacy | Critical? |
|--------|---------------|----------------|----------|----------------|-------------------|---------------------|----------|-----------|
| `daily-health-report` | Claude Cloud Routine + local scheduled-task backup | Website health, uptime, performance, SEO checks | Cloud: ~6:52 AM ET daily; Local: cron `52 6 * * *` | `docs/health/runs/<run-id>/` on `claude/<run-id>` branches | Not yet verified | Daily | Public findings only | Yes |
| `competitor-scan` | Claude Cloud Routine + local scheduled-task backup | Competitor research, market intelligence, positioning opportunities | Cloud: ~7:11 AM ET daily; Local: cron `11 7 * * *` | `docs/competitive/runs/<run-id>/` on `claude/<run-id>` branches | Not yet verified | Daily | Public findings only | Yes |
| `github-actions-health` | GitHub Actions | Independent website availability checks | Per workflow definition (see `.github/workflows/`) | Workflow run artifacts and logs | Check Actions tab | Per workflow schedule | Public only | Yes |
| `github-actions-competitor` | GitHub Actions | Falmouth competitor monitoring | Per workflow definition | Workflow run artifacts and logs | Check Actions tab | Per workflow schedule | Public only | Optional |
| `grok-communications` | Grok (local scheduled) | Business communications analysis, project coordination | Schedule TBD (not yet configured) | TBD (likely `reports/company-communications/`) | Not configured | Daily | Private summaries only | Yes |
| `grok-profitability` | Grok (local scheduled) | Profitability analysis, growth metrics | Schedule TBD (not yet configured) | TBD (likely `reports/profit-review/`) | Not configured | Weekly | Private summaries only | Yes |
| `grok-content-research` | Grok (local scheduled) | Content research, homeowner questions, portfolio opportunities | Schedule TBD (not yet configured) | TBD (likely `reports/grok-content-research/`) | Not configured | Weekly | Public findings only | Optional |
| `chatgpt-watchdog` | ChatGPT (local scheduled) | Communications oversight, social research, validation | Schedule TBD (not yet configured) | TBD (likely `reports/social-intelligence/`) | Not configured | Daily | Public findings only | Optional |

## Source status definitions

- **Not yet verified:** Source exists in design but has no confirmed successful run
- **Not configured:** Source is planned but not yet set up
- **Active:** Source is running and producing reports
- **Degraded:** Source is running but experiencing issues
- **Unavailable:** Source is not running (subscription, connector, or service outage)

## Output location patterns

### Claude Cloud Routines + local backups
- **Branch pattern:** `claude/<run-id>` where run-id = `<YYYYMMDDTHHMMSSZ>-<cloud|local>-<suffix>`
- **Local disk pattern:** `docs/health/runs/<run-id>/` or `docs/competitive/runs/<run-id>/`
- **Files per run:** `report.md`, `sources.json`, `next-tasks.md`
- **Sync script:** `node scripts/sync-reports.mjs`
- **Index script:** `node scripts/build-research-index.mjs`

### GitHub Actions
- **Location:** GitHub Actions tab → workflow runs
- **Artifacts:** Downloadable from each run
- **Logs:** Available in GitHub UI
- **No local sync required:** Read directly from GitHub

### Grok/ChatGPT local scheduled tasks
- **Location:** To be determined (likely `reports/` subdirectories)
- **Format:** Markdown reports with structured metadata
- **Sync:** Manual or future automated ingestion

## Privacy classification rules

### Public-safe (can be in repository)
- Website performance metrics
- SEO findings and recommendations
- Competitor public-page analysis
- Market opportunity research
- Technical implementation proposals
- Aggregated funnel statistics (no individual records)

### Private summaries only (aggregates only, no raw data)
- Communications themes and patterns
- Project profitability trends
- Growth metrics and KPIs
- Customer inquiry categories (counts, not content)

### Never in repository
- Raw customer emails
- Individual lead records
- Private financial data
- Personal contact information
- Credentials and API keys
- Unredacted project notes

## Connector dependencies

| Source | Required connector | Fallback if unavailable |
|--------|-------------------|-------------------------|
| Claude Cloud Routines | Claude Cloud account | Local scheduled-task backups |
| Claude local tasks | Claude Code app on Mac | Manual trigger when Mac available |
| GitHub Actions | GitHub repository (always available) | None — runs independently |
| Grok tasks | Grok access + Gmail connector | Manual review when Grok unavailable |
| ChatGPT tasks | ChatGPT access + connectors | Other agents may cover partial |

## Known limitations

- **Claude Cloud Routines:** Require one-time manual activation at claude.ai/code/routines
- **Local scheduled tasks:** Require Claude Code app to be open on the Mac at scheduled time
- **Grok/ChatGPT connectors:** Not yet verified; connector access may fail
- **Gmail access:** Requires authenticated connector; no independent fallback
- **Private data storage:** Not yet verified for Grok Project Delivery Manager

## Adding a new source

When adding a new AI report source:

1. Add a row to the table above with all required fields
2. Define the output location pattern
3. Specify the privacy classification
4. Document connector dependencies and fallbacks
5. Note any known limitations
6. Update the intelligence protocol to recognize the new source format

## Source health monitoring

To check source health:

```bash
# Check Claude Cloud Routines status (manual: visit claude.ai/code/routines)
# Check local scheduled-task status (manual: review ~/.claude/scheduled-tasks/)
# Check GitHub Actions (visit GitHub Actions tab)
# Sync and check reports
node scripts/sync-reports.mjs
node scripts/build-research-index.mjs
cat docs/research/22-research-report-index.md
```

## Last checkpoint

- **Date:** October 23, 2026
- **Reports synced:** None yet (system initialization)
- **Sources verified:** GitHub Actions only (others not yet configured)
- **Known issues:** Grok and ChatGPT scheduled tasks not yet set up
