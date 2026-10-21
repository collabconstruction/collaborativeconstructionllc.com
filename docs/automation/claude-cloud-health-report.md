# Claude cloud health-report setup

Prepared October 13, 2026; updated October 14, 2026 (Section 1 completed, cadence changed to daily per owner decision). This is a setup package, not evidence that a routine has been created, connected, or run — Section 6's commissioning checklist is still unmet until an actual routine runs.

## Outcome

A Claude Code **Cloud Routine** checks the deployed website, repository, authorized reporting APIs and business evidence, then pushes a dated report branch to `collabconstruction/collaborativeconstructionllc.com`. Reports identify findings, missing access and the next bounded implementation tasks. They do not merge, deploy, send messages or change provider settings.

Official setup references: [Routines](https://code.claude.com/docs/en/routines), [cloud environments](https://code.claude.com/docs/en/claude-code-on-the-web). These features are in research preview; check the current documentation when configuring them.

## 1. Make the cloud copy usable — done October 14, 2026

`CLAUDE.md`, `.agents/skills/*/SKILL.md`, and the `.claude/skills/*` symlinks are now committed (commit `319972f`) and pushed to `origin/design/site-refresh-2026-10` (tip `319972f`, 30 commits ahead of `origin/main`). `.claude/settings.local.json`, `.claude/launch.json`, and `.claude/worktrees/` remain gitignored and were deliberately excluded — confirmed via `git check-ignore -v` before staging, not assumed.

**Use `design/site-refresh-2026-10` as the routine's starting branch, not `main`.** `origin/main` is still `e2ba56b` and does not reflect production: it predates the header/FAQ release, the GA4 measurement-ID switch, and this automation work. `design/site-refresh-2026-10` matches what is actually deployed to `https://collaborativeconstructionllc.com` as of the most recent release (see `docs/releases/2026-10-14-ga4-measurement-id-activation.md`). This setup still does not authorize merging `design/site-refresh-2026-10` or any recovery branch into `main` — that remains a separate, explicit owner decision.

Include this guide and `docs/research/prompts/claude-cloud-health-report.txt` (both now on the pushed branch). After reports are reviewed and merged, future runs can use them for comparisons. Unmerged report PRs must be discovered separately; they will not appear in a fresh clone of the starting branch.

## 2. Create the routine

1. Open https://claude.ai/code/routines and choose **New routine**. In Claude Desktop, use Code → Routines → New routine → **Cloud**.
2. Name it **Collaborative Construction — daily project health**.
3. Select only `collabconstruction/collaborativeconstructionllc.com`, branch `design/site-refresh-2026-10` (not `main` — see Section 1), and a dedicated environment.
4. Start daily at **6:52 AM America/New_York** (deliberately off the hour), plus manual **Run now** for commissioning. Confirm the schedule displayed by Claude. **Owner decision, 2026-10-14: daily, explicitly chosen over the weekly default this guide originally proposed** — daily is the right cadence for the operational checks (leads, site errors, GA4/GSC) this report covers; be aware a daily run against mostly-unchanging sources (GSC's finalized data lags ~2-3 days; GBP/competitor data moves slowly) will often repeat yesterday's findings almost verbatim, which is expected, not a malfunction.
5. Paste the complete prompt from `docs/research/prompts/claude-cloud-health-report.txt` into Instructions. Select the model and usage budget you want; runs consume your Claude allowance — daily cadence means roughly 7x the token spend of the original weekly proposal, budget accordingly.
6. Remove unnecessary connectors. The routine documentation says connected connectors are included by default and can expose write tools without approval. Use reporting-only tools where possible.
7. Save, then use **Run now** once. Inspect its actual report, branch and push result before trusting the recurring job.

Do not add repository-event triggers initially: report pushes should not trigger another reporting run. Do not enable auto-merge or a deployment trigger for report branches. Inspect repository Actions and Cloudflare Git integrations before the first push; a docs-only push must not deploy production.

## 3. Configure the environment

Use the lockfile with `npm ci` for dependencies and provide Node compatible with the project's current package/CI configuration. Python is needed by the SQLite-backed tests. No setup command should run migrations, deploy or submit production leads. Cloud setup scripts may be cached; the run must still check dependency availability against its checked-out lockfile.

Allow outbound access to the production apex and `www` host, GitHub, package registries, official research sources and the specific reporting API hosts below. Extend the allowlist when an approved source requires it; record blocked domains rather than bypassing restrictions. Cloud network access is not account authorization.

The owner enters secrets directly in provider-managed connector authentication or the environment's supported secret facility. Never paste credentials into prompts, tracked files, shell arguments or ordinary environment fields visible to other users. Anthropic documents network secrets for supported plans; confirm availability and request matching for the exact environment. OAuth refresh, scoped reporting tools and secret handling require a working adapter or connector: a network allowlist or a measurement ID alone does not implement authentication.

Local `~/.claude.json`, gcloud ADC, Wrangler sessions and `~/.cc-private/` are not portable cloud connections. Do not copy those files into GitHub. Prefer a company-owned reporting connector or a separately maintained authenticated reporting service. It should expose only allowlisted reports, validate property IDs and dates, strip private fields, and manage token renewal outside the agent-visible environment. No such cloud reporting service is installed by this guide.

## 4. Connect each source and verify it in the cloud

| Source | Approved scope / identity | First verification and report |
|---|---|---|
| GitHub | Selected repository; branch contents write and PR creation where available | Clone SHA, branch, repository identity, Actions status, open PRs and report push result. No workflow administration or main writes. |
| Public website | Public GET/HEAD only | Apex/www, sitemap, robots, canonical pages, redirects, assets, structured data and live analytics ID. No form submissions or synthetic analytics events. |
| Search Console | `webmasters.readonly`; `sc-domain:collaborativeconstructionllc.com` | Property listing, recent finalized daily totals and separate query/page/device reports; read-only URL Inspection where supported. Hosts: `www.googleapis.com`, `searchconsole.googleapis.com`, OAuth host only if needed by the adapter. |
| GA4 | `analytics.readonly`; business identity; property `558903217`, stream `16124097872`, measurement ID `G-PNS7LJP5QB` | Admin property/stream mapping and aggregate Data API report. Hosts: `analyticsadmin.googleapis.com`, `analyticsdata.googleapis.com`. Record property time zone and distinguish localhost/test hits. |
| GBP | Confirm company listing and API project approval first | Performance daily metrics and monthly keyword impressions. `business.manage` is broader than read-only: expose reporting methods through an enforced adapter. API host `businessprofileperformance.googleapis.com`; other discovery endpoints only as needed. Manual approved aggregate export is an alternative. |
| Cloudflare | Account/resource-scoped read permissions only | Worker deployment metadata, aggregate traffic/error metrics and relevant read-only DNS/redirect/bot settings if permitted. Host `api.cloudflare.com`. A 401/403 is an access gap. No deployment token. |
| D1/intake | Sanitized aggregate reporting service/export only | Counts excluding known tests/spam, notification exceptions, stages and response-time coverage. No raw SQL tool or general production D1 token. Read `docs/operations.md` first. |
| Company Drive/Gmail | Correct company identity, explicitly scoped approved documents or aggregate mailbox reconciliation | Verify identity before content. Existing local records identify personal/school connectors; exclude these. No broad inbox sweep, customer messages or attachments in GitHub. |
| Job costs/capacity/referrals | Owner-approved sanitized summaries | Report coverage and dated aggregate constraints. Missing source remains unknown. |
| Local market | Public official sources | Material local opportunities or competitor changes with URLs, event dates and practical relevance. |

GA4's newer connection record supersedes the old handoff's “unknown”: `docs/research/19-ga4-connection-and-diagnosis.md`. It verifies local API access but does not prove cloud access or today's production tag. GSC's documented testing-mode refresh token may expire around October 19; the owner must manage OAuth publishing/renewal directly. Recheck both instead of copying historical status into new reports.

An ordinary prompt cannot enforce read-only access to a connector with writes or hide private data from a general-purpose production token. Configure those boundaries in the connector/service and provider permissions before attaching it.

## 5. GitHub report delivery

Report ownership is restricted to `docs/health/`. Each run writes `docs/health/runs/<UTC-run-id>/report.md`, `sources.json` and `next-tasks.md` on its assigned `claude/` branch. This follows Claude's cloud branch restrictions. Push only these reviewed files, and open a draft PR if a supported PR tool is available. Otherwise supply the pushed branch's comparison URL and explicitly state that PR creation is pending. Never claim a PR exists without a returned URL.

Keep default-branch protections and human review. Use one report writer per run. If the automation overlaps another run, each uses a unique run ID and branch; no shared latest-report file is overwritten. Merging a report PR makes it available to the next default-branch run. The next work session can also read open report PRs directly. Do not store raw API responses or customer data in reports.

## 6. Commissioning acceptance

- Cloud instructions/skills are present at the actual cloned SHA.
- Correct company identities and exact properties are verified, or marked blocked without content reads.
- Report states API success/failure, data periods, time zones, completeness and last successful observations.
- Website and local checks have actual results; failures/timeouts are retained.
- Sources and arithmetic support the conclusions; unknown is never zero.
- Git diff contains only sanitized `docs/health/` deliverables; branch push succeeds and its SHA/link is recorded.
- No production mutation, raw customer read, credential exposure, merge or deploy occurs.

A partial report is useful and should still be pushed when a source is unavailable. Commissioning is not complete until the actual cloud run and delivery are inspected. Schedule failures and authorization expiration must appear in the next review; do not imply the laptop's connections guarantee unattended success.
