# Ranked business growth, compliance and agent automation backlog

Date: 2026-10-21 (America/New_York)
Sources checked: Current PRs 6/7, source code, GitHub Actions, Metricool and public regulatory/cost sources; research 24–31
BLOCKED: Owner HIC/CSL, authenticated Cloudflare settings, Facebook page identity, lead/unit economics, profit, spending authority, legal review, full website visual regression and live analytics values.
Evidence labels: `verified-source` checked repo/tool/public URL, `reported` inherited statement, `estimate` projection with assumptions, `owner-confirmation-needed` requires approval or private facts. Unknown must never be reported as zero.

## Ranking model

Priority is **impact if real × evidence strength × speed of validation**, discounted for potential irreversible harm and owner dependencies. Effort values are planning estimates: XS less than 2 focused hours, S half-day, M 1–3 workdays, L multiple workdays. External dollar cost is UNKNOWN unless a published fixed price was checked. "Potential" is not a measured ROI.

| Rank | Workstream and acceptance outcome | Owner / doer | Effort estimate | External cash | Dependency / review gate |
|---|---|---|---|---|---|
| P0.1 | Verify HIC registration + CSL role, update correct visible registration, substantiate licensed/experience claims | Owner + compliance reviewer; Claude code after approval | S | Unknown | MA credential records, legal check, no invented value |
| P0.2 | Read Cloudflare Builds Git deployment setting; document release branch and rollback plan | Owner | XS | $0 expected for manual inspection | No PR #6 merge until checked |
| P0.3 | Fix www 522 with redirect rule and proxied DNS | Owner dashboard, engineering tests | S | Unknown | Cloudflare access, no changes without owner approval |
| P0.4 | Verify Metricool publish destination and canonical Facebook Page; separate old Page | Owner signed-in Meta + reviewer | S | $0 expected | No social publication; avoid account damage |
| P1.1 | Extend health monitor to www, 9 pages, robots, sitemap, API allowed-method check; alerts on degraded | Engineering | M | GitHub minutes unknown | Feature branch, non-mutating tests, failure alerts |
| P1.2 | Review contact form regression and storage/email/Turnstile with controlled authorized real test | Owner + engineering | M | Unknown | Explicit deploy/smoke-test permission |
| P1.3 | Implement complete retention policy and deletion request workflow | Owner + legal + engineering | L | Legal review unknown | D1, R2, company email, backups and evidence audit |
| P1.4 | Prepare /privacy/ page with footer/consent link, correct Cloudflare/GA4 scope | Engineering + legal | M | Legal review unknown | Data-retention facts, publish approval, review branch |
| P1.5 | Review PR #7 consent-safe UTM/referrer; staging and actual deploy overlay | Engineering | M | Unknown | PR #6 merge and explicit deploy authorization |
| P1.6 | Confirm workers.dev route/dependencies; propose false in Wrangler | Owner + engineering | S | $0 expected | Confirm monitors/Turnstile hosts/API aren't affected |
| P1.7 | Obtain permission and truthful attribution for each published photo/project | Owner + marketing | M | Photography cost unknown | No invented job roles or fake project proof |
| P1.8 | Get real GBP reviews without gating/incentives; monitor GBP NAP/hours | Owner + marketing | S/M | $0 for organic review request | Real satisfied clients, no automated outbound until approved |
| P2.1 | Publish original case-study + FAQ series for ADUs/additions/independent oversight | Content agent drafts, owner approves | M | Photography/time unknown | Proof, permission and scope validation |
| P2.2 | Establish weekly anonymized leads/traffic/ROI scorecard | Research agent | M | Tool connector cost unknown | Account access and definitions, no PII |
| P2.3 | Confirm service towns including Nantucket/Edgartown vs Yarmouth/Dennis | Owner | XS | $0 | Travel/logistics and delivery capacity |
| P2.4 | Setup genuine LinkedIn Company Page and trusted Facebook backup admin | Owner social admin | M | $0 expected | Secure access, Page match |
| P2.5 | Referral introductions to chambers, architects, realtors, HBRA | Owner relationship builder | M | Membership cost unknown | No agent-initiated messages/follows |
| P2.6 | Trial Google Search Ads with cap **only after approval** | Owner + ads specialist | M | Owner-approved discretionary cap | Real leads/margin baseline, proper licensing and tracking |
| P2.7 | Scheduled local news/permit-change watch | Research agent | M | API/tool costs unknown | Authoritative state and town sources |
| P3.1 | Lighthouse CI, accessibility and mobile regression coverage | Engineering agent | M | GH minutes and hosting unknown | First performance baseline and acceptance thresholds |
| P3.2 | Self-improving two-agent pipeline | Engineering agent with review | L | Model/API and CI usage unknown | Security, PR branch governance, spend caps, audit log |

## Proposed two-agent operating plan

Agent R (Research): every morning collect GitHub Action failures, official regulation changes, competitor changes and aggregate conversion outcomes; deduplicate by evidence fingerprint and rank at most three material findings. Agent E (Engineering): on another scheduled window read **only accepted** issues from R, implement one bounded code/document change on its own branch, run CI, open a draft PR. Agent R reviews the PR next cycle against source and acceptance tests. Human owner merges and deploys after separate approvals. **No infinite ping-pong.** A state machine and budget must stop when no useful or approved work exists. See the accompanying Claude Code implementation prompt.

## Monthly budget input sheet (private numbers left blank)

| Budget category | Monthly spend | One-time spend | Owner decision needed |
|---|---|---|---|
| Domain/DNS | UNKNOWN | UNKNOWN | Renewal cost and date |
| Cloudflare Workers/D1/R2/email | UNKNOWN | UNKNOWN | Billing plan, allowance and quota |
| Metricool | UNKNOWN | UNKNOWN | Plan and seats |
| LLM/agent model calls | UNKNOWN | UNKNOWN | Max $ per day/month, execution limits and alerts |
| GitHub Actions minutes | UNKNOWN | UNKNOWN | Public/private repo allowance and overage plan |
| Photography / editing | UNKNOWN | UNKNOWN | Photos/rights and content capacity |
| Paid ads trial A (proposed) | $300 | $0 | Requires **explicit approval** |
| Paid ads trial B (proposed) | $750 | $0 | Requires **explicit approval** |
| Paid ads trial C (proposed) | $1,500 | $0 | Requires **explicit approval** |
| Legal / privacy review | UNKNOWN | UNKNOWN | Reviewer, scope and fee |
| Owner time for inquiries | UNKNOWN | UNKNOWN | Hours and opportunity cost |

The ad levels are mutually exclusive test scenarios, not additive expenditures. Do not include guessed business revenue or profit in GitHub. Retain financial source records privately.

### Inputs required for an honest capacity and budget calculation

Average accepted job amount: ______ (private). Contribution margin per project: ______ (private). Monthly qualified inquiries: ______. Closing fraction: ______. Owner response hours: ______. Overhead: ______ (private). Monthly automation cost limit: ______. External marketing cap: ______. Crew/project capacity: ______. Owner decision on target market/towns: ______.

## Next 3 actions

1. Clear HIC and Cloudflare Builds decisions; assign owner and date.
2. Start a safe www/health-monitor proposal branch and add failure tests.
3. Approve an agent-loop spending ceiling and PR governance policy before any recurring execution.
