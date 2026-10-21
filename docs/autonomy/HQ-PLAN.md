# Plan v2: Public site search fixes + Collaborative HQ (private dashboard and MCP)

Approved by the owner on Oct 21, 2026 after ChatGPT review. Milestone 1 code is in draft PR #10. M2 onward waits on the owner setup tasks listed below.

Revised Oct 21, 2026 after ChatGPT's review ("approve with revisions"). Architecture, stack, private repo, free-first data and phased rollout are kept. This version adds the missing contracts: auth, Search Console ingestion, MCP security, evidence model, repo-to-repo ingestion, bot settings, acceptance tests, costs and rollback.

## Context

The owner wants to know what Google and other crawlers see on collaborativeconstructionllc.com (titles, H1s, canonicals, Open Graph), why Sitechecker flagged an H1, how to research search intent and ads cheaply, and whether we can build our own Semrush-style tool as a private dashboard on the company domain with an MCP server for approved AI agents.

Owner decisions: new private repo; sign-in with company Gmail only; free data sources first; allow AI search and answer bots but keep training bots blocked.

## Verified vs assumed

| Item | Status |
|---|---|
| All 9 pages: 200, one H1 in raw HTML (not added by JS), unique title, description, absolute canonical equal to URL, og tags, JSON-LD parses, no noindex, no X-Robots-Tag | Verified by Claude from raw HTML, Oct 21 2026 |
| Sitemap lists the 9 canonical URLs; `/about` answers one 301 | Verified by Claude, Oct 21 |
| 9 of 9 pages indexed | Observed in Search Console Oct 13 (`docs/research/16-gsc-seo-baseline.md`); must be rechecked |
| `www` returns HTTP 522 | Verified by Claude (monitor run Oct 21) and by ChatGPT |
| Live robots.txt holds Cloudflare's managed block about 9 times | Verified by Claude (curl, Oct 21). Cause is a hypothesis: the overlay deploy copies the live file and Cloudflare prepends again. Cloudflare documents that managed robots.txt prepends to the origin file |
| Sitechecker H1 warning cause | Unknown. Raw HTML has an H1 on every page. Needs the exact URL and message |
| Cloudflare AI Crawl Control categories (Search, Training, Agent) and "most restrictive wins" for multi-purpose crawlers | Reported in public coverage; must be checked in the dashboard |
| Access JWT check: header `Cf-Access-Jwt-Assertion`, keys at `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`, verify issuer and AUD tag, keys rotate | Cloudflare docs |
| Search Console API v1 rowLimit up to 25,000 with `startRow` paging, `dataState` final or all, `aggregationType` byProperty or byPage | Google API reference |
| Anonymized queries are left out of query rows but counted in totals | Google help |
| URL Inspection API reports the indexed version, not a live render | Google docs (per review) |
| Service account as a restricted Search Console user works with the API | Assumption; prove with a real API call before finalizing |
| workers-oauth-provider with Access (SaaS OIDC app) as upstream login for MCP | Pattern in Cloudflare library and templates; confirm against the official README when building |
| Workers Paid is $5 per month minimum; Access free up to 50 users, 24 hour logs on Free | Cloudflare docs and plan page; D1 and R2 included quotas not yet confirmed |

## Milestones (each ends in a draft PR with acceptance tests, security tests and rollback steps)

### M1. Verified public site fixes (existing repo, branch from PR #6 work)

Order matters: crawlability first, copy last.
1. **`www` 522.** Owner task in Cloudflare: proxied `www` record and a 301 Redirect Rule to the apex keeping path and query. Verify HTTPS cert covers `www`, no loop, one hop. The new monitor in PR #9 (`scripts/site_health.py`) turns OK only when this is true.
2. **robots.txt.** First confirm in the dashboard whether Cloudflare's managed robots.txt is on. Then make the build idempotent: deploy the repo's own `robots.txt` (add it to the built list in `scripts/build-live-overlay.mjs`, never copy the live one). Test the generated file (no `BEGIN Cloudflare Managed` text, one `Sitemap:` line, `Disallow: /api/`) and separately test the live response after deploy (managed block appears at most once).
3. **Bot settings.** Read AI Crawl Control and WAF/bot rules in the dashboard. Goal: search and answer bots reach the site, training bots blocked, Googlebot never blocked. Robots.txt alone does not prove reachability; test with the monitor using allowed user agents where policy permits.
4. **Copy (owner approved only).** Titles and H1s gain place and intent only for confirmed towns and services, in natural wording. About H1 gets a space before `<br>` and is checked in rendered text. Gallery description fixed. Per page og:image later (lower priority).
5. **Tests.** A meaningful H1 exists per page, canonical equals URL, og tags present, robots rules above. Title length is an editorial warning, not a failure.
6. **Content rule.** No agent writes claims about projects, customers, addresses, licences, reviews or prices unless the fact is confirmed by the owner.

Rollback: revert the branch; for deploys `npx wrangler rollback`.

### M2. HQ foundation (new private repo `collabconstruction/collaborative-hq`)

Created only after owner approval. Node 22, TypeScript, React + Vite dashboard served by a Worker, one shared domain-service package for business rules.

**Dashboard auth contract (`admin.collaborativeconstructionllc.com`)**
- Cloudflare Access app, policy: email equals collaborativeconstructiongc@gmail.com, Google login (MFA set on the Google account), session 24 hours.
- Worker verifies `Cf-Access-Jwt-Assertion` on every request including static assets: RS256 signature via the team JWKS (cached, refreshed on unknown key id), `iss` = team domain, `aud` = app AUD tag, `exp` and `nbf`, then email is looked up in the `users` table with a role. No match is 403.
- Roles in release 1: `owner` only (table supports `viewer` later). Authorization is decided in the shared domain service for each resource and action, never in the UI.
- Revocation: remove the user row (immediate) and the Access policy (Access session ends at its expiry); document both.
- `workers_dev: false`, no preview URLs, custom domain only. Tests prove direct Worker hostnames refuse requests.

**Data**
- New D1 `cc-intel` with numbered migrations (`migrations/0001_...sql`), applied first to a local and a staging database. Forward-only migrations plus a tested down script per release.
- R2 `cc-intel-archive` for immutable raw evidence (HTML, API responses), keyed by SHA-256, with retention rules.
- `cc-leads` is never written. Release 1 has no lead access at all.

Acceptance: no token, wrong email, expired token, wrong AUD, and a valid token for a removed user all get 403 on pages, API and assets; owner gets 200.

### M3. Evidence pipeline

**Tables**
- `data_sources` (provider, property or account id, access scope, schedule, status)
- `ingestion_runs` (source, requested period, started, finished, rows received, pages fetched, status: complete, partial, failed; error)
- `evidence_artifacts` (R2 key, sha256, content type, fetched_at, source_url, retention_until; immutable)
- Raw observations: `page_snapshots`, `search_metrics`
- Derived metrics: `page_facts` (title, H1 text, canonical, og, robots, JSON-LD types computed from a snapshot), `metric_rollups`
- AI or rule assessments: `seo_findings` (finding_type, severity, confidence, first_seen, last_seen, status, evidence_id, ingestion_run_id, resolution_reference), `recommendations`
- `users`, `agent_identities`, `agent_runs` (agent id, scope, model and version, tool calls, cost if known, outcome, proposal id), `audit_events` (append only: actor, action, resource, outcome, time)
- Confidence labels: verified, observed, inference, hypothesis, unknown.

**Rules:** imports are idempotent (unique keys on source, date, dimensions); a failed or partial run never overwrites good rows and never writes zero; the UI shows stale, incomplete and true zero differently.

**Public repo to HQ contract:** the public monitor (`scripts/site_health.py`, schema `site-health/2`) and competitor watch already write JSON artifacts in GitHub Actions. An HQ ingestion job pulls the latest artifact through a GitHub App installed on the public repo with `actions: read` and `contents: read` only, validates the schema version, stores it in R2 and imports it. No personal token. HQ failures cannot affect the public site or lead intake.

### M4. Live SEO Intelligence

**Page Inspector, three views per URL:** raw HTML (fetched by the HQ crawler), rendered DOM (Playwright in a GitHub Action in the HQ repo, result uploaded through the ingestion contract), and Search Console URL Inspection (indexed version: coverage state, Google canonical, last crawl). Labeled clearly: the third is not a live render.

**Search Console ingestion spec**
- Property: `sc-domain:` or URL prefix as verified; service account added as restricted user (prove with a test call first).
- Daily job for each date D from D-3 to D-1 with `dataState=final`, plus a separate "fresh" pull with `dataState=all` marked provisional.
- Levels stored separately: site totals (`aggregationType=byProperty`, no dimensions), by page, by query, by query and page, by device and country.
- Paging with `rowLimit=25000` and `startRow` until fewer rows return; `ingestion_runs` records pages and rows.
- Store clicks and impressions; CTR = clicks / impressions over the selected range; position averaged weighted by impressions. Never average ratios.
- Query rows never sum to site totals (anonymized and long-tail queries are left out); the dashboard shows the gap as "not shown by Google".
- Weekly recheck of URL Inspection for the 9 pages within quota.

Acceptance: a fixture where the API fails mid-run leaves prior data intact and the run marked partial; totals and query sums are shown separately.

### M5. MCP server, read only (`mcp.collaborativeconstructionllc.com`)

**Auth contract:** separate Worker using Cloudflare's `workers-oauth-provider`; upstream login through an Access for SaaS OIDC app limited to the company Gmail. MCP tokens are issued by this provider with scopes (`intel:read`, `audit:request`, `proposals:write`). Dashboard Access JWTs are rejected by MCP and MCP tokens are rejected by the dashboard API (different audience and issuer, tested both ways). Token lifetime short with refresh; revocation by deleting the grant. Scheduled agents get their own `agent_identities` row, own scopes, own rate limit and budget, revocable.

**Tools (inputs validated with strict schemas; outputs are JSON with `confidence` and `evidence_id`):**

| Tool | Input | Output | Scope |
|---|---|---|---|
| `get_site_health` | none | latest site-health/2 summary, run time, freshness | intel:read |
| `get_page_inspection` | `path` from the 9 known paths | raw facts, rendered facts, index facts, findings | intel:read |
| `get_search_performance` | `level`, `start`, `end` (max 90 days), optional `page` | rows plus completeness and freshness | intel:read |
| `list_findings` | `status`, `severity`, `limit` (max 50) | findings | intel:read |
| `get_competitor_report` | `competitor_id` from the watch list | latest snapshot summary | intel:read |
| `request_audit` | `path` on the allowlist only | queued run id | audit:request |
| `submit_recommendation` | `title`, `finding_ids`, `proposal` (max 2,000 chars) | proposal id, status needs-owner | proposals:write |

No tool takes a free URL, SQL, file path or shell input. The crawler only fetches `https://collaborativeconstructionllc.com` and the 26 watched competitor hosts, resolves DNS and refuses private, loopback, link-local and metadata addresses before every request and after every redirect, caps size and time, and never follows redirects off the allowlist. Per tool rate limits and audit rows. Outside text is data; the existing instruction-pattern check (`scripts/autonomy/evidence.py`) is an extra signal, not the boundary. No release 1 tool can deploy, merge, change budgets, touch lead or financial data, or post.

Acceptance: a valid read-only token calling `submit_recommendation` is refused; a crafted path or redirect to `169.254.169.254` or `10.0.0.1` is refused; a revoked grant fails on next call.

### M6. Research and approvals
Keyword intent table (query, service, town, intent, decision stage, Keyword Planner volume and CPC as estimates, Search Console position as observed, target page, confidence, action), negative intents (jobs, DIY, suppliers, unserved towns, commercial work not offered), competitor snapshots reusing `config/competitor-watch.json` and `scripts/monitor_competitors.py`, and a simple proposals list that can open a GitHub issue. A richer Approval Center comes later.

### M7. Google Ads economics and AI visibility
Only after tracking (PR #7), `www`, licence numbers and service area are settled. Ads judged by cost per qualified lead, later gross profit. AI visibility: fixed prompts, record platform, model, date, prompt, response; mentions and citations kept separate; no combined score.

## Threat model (summary)

Prompt injection from pages and tool results; SSRF through audit tools; token confusion between dashboard and MCP; exposed preview or workers.dev hosts; secrets in logs; silent data loss or false zeros; runaway agent cost; an agent change reaching production. Controls are listed in each milestone above. Not designed for yet: compromised Google account, malicious npm dependency (mitigate with lockfiles and Dependabot).

## Scope control
One company, one identity, one role in release 1. Tables allow more users later. No multi-tenancy, no custom SSO, no full Semrush clone.

## Estimated running costs (to confirm on Cloudflare's pricing pages)
- Workers Paid: $5 per month minimum per account (may already be on it; unknown).
- Access: free up to 50 users.
- D1 and R2: expected within included amounts at this size; quotas not yet confirmed.
- Search Console API, Keyword Planner (needs a Google Ads account, no spend), Trends: free.
- GitHub Actions minutes for Playwright in a private repo: within the free monthly allowance expected; to confirm on the account.
- Paid SEO data: none until week 4 to 6 review.

## Rollback and recovery
Public site: revert branch, `npx wrangler rollback`. HQ: Workers rollback per Worker; D1 Time Travel restore point taken before each migration; R2 evidence is immutable so it survives app rollbacks; ingestion can be replayed from R2.

## Owner-only setup tasks
1. Sitechecker: exact URL and warning text.
2. Cloudflare: Settings > Builds; `www` record and redirect; AI Crawl Control and WAF bot settings; Access team name; Access apps for `admin.` and the MCP SaaS OIDC app; DNS for `admin.` and `mcp.`.
3. Search Console: add the service account email as restricted user.
4. Create the private repo and install the GitHub App (Claude can prepare everything else).
5. Confirm towns served; official HIC and CSL numbers.

## Verification
- M1: `npm test`, `npm run build`, `node scripts/verify-release-build.mjs`, `python3 -m unittest discover -s tests`; raw HTML audit script over 9 pages; after owner deploy, `python3 scripts/monitor_public_site.py` and `curl robots.txt` against live.
- M2 to M5: Vitest unit tests for JWT and OAuth checks, role and scope checks, SSRF guard, ingestion idempotency and partial-run handling; local D1 migration tests; staging integration tests with no token, wrong identity, wrong audience, revoked user; Playwright smoke test behind Access in staging; MCP client test from Claude Code.
- Nothing is deployed or merged without the owner. Each milestone opens one draft PR.
