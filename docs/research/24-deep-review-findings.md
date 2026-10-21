# Deep review, first and second passes

Date: 2026-10-21 (America/New_York)
Sources checked: Repository AGENTS.md, HANDOFF.md, PR #6/#7, live pages, Metricool connected brand, MA official HIC guidance, 2026-10-21
BLOCKED: Signed-in Cloudflare Builds and Facebook page identity, MA credentials, local financial records, all live link targets.
Evidence labels: `verified-source` = directly opened document, repository code, run or URL (not certification of third-party claims); `reported` = secondhand assertion; `estimate` = explicit assumption or calculation; `owner-confirmation-needed` = requires authorized account, record or decision. Unknown never means zero.

## First-pass discrepancies and corrections

| Item | File or surface | Claim or expectation | What was independently checked | Label | Fix |
|---|---|---|---|---|---|
| MA credentials | live home and About; `src/_data/business.json` | "licensed Massachusetts builder" and "over 30 years" | Both phrases appear on live home/About; `hicNumber` and `cslNumber` are null in source. Null does not prove absence of license. | verified-source for text; owner-confirmation-needed for proof | Verify active HIC and, if applicable, CSL through [MA Contractor Hub](https://www.mass.gov/info-details/hic-contractor-resources); add correct number; recheck all service pages. |
| HIC advertising | site | Registration number optional | [Official HIC resources](https://www.mass.gov/info-details/hic-contractor-resources) say applicable contractor advertising and websites must display active HIC number; [state consumer guidance](https://www.mass.gov/info-details/home-improvement-contractor-scams) agrees. | verified-source | Treat as immediate legal review. HIC registration is not the same as CSL. |
| Credentials chronology | research prompt | CSL since 2000; university education | No official certificate, license record, or institution evidence independently checked. | owner-confirmation-needed | Do not publish extra biographical claims. |
| Affordable / competitive | user goal | Company pricing is "affordable and competitive" | No verified company rate card, job-margin data, or like-for-like comparison. | owner-confirmation-needed | Avoid unsupported superlatives or price promises; compare identical scope, location, finishes, timing, warranties. |
| Facebook identity | official profile 61595651094549; Metricool | It is the same page as `facebookData=1409900735535950` and published post path `122094671283521703` | Metricool connector shows brand 7490851 and different numerical identifiers; this alone does **not** establish different pages. Older profile 61593017512930 remains separate per prior report, not reverified. | verified-source for IDs; owner-confirmation-needed for mapping | In signed-in Meta Business Suite inspect canonical Page ID, access and Metricool destination; hold social publishing. |
| LinkedIn | repo social link and Metricool | A LinkedIn company page is connected | Metricool shows `urn:li:person:3hOP6rIUb1`, a personal identity, not verified Company Page. | verified-source | Create a proper Company Page after owner approval. |
| www health | live `www`, monitor Python | Site monitor success means whole domain healthy | External fetch returned HTTP 522 on `www` and 200 on apex; Python checks apex `/`, robots and sitemap and only homepage fails the job. | verified-source | Add expected 301 check of www, path and query, and non-mutating API method check. |
| Cloudflare Git deploy | PR #6 | Merge is safe without production publish | GitHub Release Check passed, but only Cloudflare Builds screen can establish Git integration. [Cloudflare documents automatic deployment on push](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/). | owner-confirmation-needed | No merge until owner confirms Builds, production branch and auto-deploy behavior. |
| Turnstile privacy | Worker source | IP not retained anywhere | `worker/index.js` sends source IP to Turnstile and limiter but no D1 `leads` IP column. Cloudflare may independently process/store IP at edge. | verified-source for app code | Describe uses narrowly; review vendor policy. |
| D1 schema | draft privacy inventory | GA client id, country, user agent are saved on every lead | SQL schema supports these nullable columns, but current Worker INSERT does not populate them. Historical rows unknown. | verified-source | Distinguish schema capacity from current writes. |
| Photo claims | projects, gallery | Every photo is an authorized completed company project | No source/usage rights review completed for every image. | owner-confirmation-needed | Create permission/provenance register and keep conceptual images separate from portfolio claims. |
| Site locality | Facebook vs business data | Edgartown/Nantucket are accepted towns | Service area excludes confirmed town-level owner decision; broad region text includes Islands. | owner-confirmation-needed | Ask owner before edits; do not invent capacity. |
| workers.dev | planned config | Turning off route in dashboard is permanent | Wrangler `workers_dev` is not disabled on deployed config; prepared separate branch exists, not deployed. | verified-source for repo | Confirm dependencies; propose `workers_dev:false` release change with owner permission. |
| Retention | `docs/marketing/data-inventory.md` | 12 month / 90 day deletion is policy | Explicitly proposal, not implemented. Backup, D1, R2, mailbox coverage unknown. | verified-source | No retention promise until deletion procedure, legal review, and owner signoff. |
| Competitor identity | `config/competitor-watch.json` | `capecodbuilder.com` unknown builder | Opened homepage identifies REEF Cape Cod Builders; `rwandersonandsons.com` failed retrieval. | verified-source / owner-confirmation-needed | Validate legal business identity and update label on a separately approved config PR; leave failed URL unverified. |
| Scheduler freshness | `docs/research/23-...` | Five runs, none after Oct 20 | New GitHub health run at 2026-10-21 04:41Z succeeded; prior status note is a dated snapshot. | verified-source | Update next audit with live workflow history. |

## Priority decisions

Priority 0: Confirm HIC registration, CSL relevance, owner-approved claims, and Cloudflare Builds behavior. Priority 1: Fix www and strengthen independent health checks. Priority 2: Verify Facebook destination and collect genuine photo permissions. Priority 3: Test form intake and data retention before releasing analytics/privacy copy. Priority 4: Run measured organic content experiments before paid ads.

## Final second-pass review

Rechecked the above against current repository branch, live home/About, directly read 26 competitor URLs, connected Metricool brand, HIC authority and GitHub runs. **Not resolved:** credential numbers, Facebook profile-ID equivalence, Cloudflare dashboard settings, claim support and historical data. "No records accessible" is never rendered as "zero". This file does not authorize publishing or release.

## Next 3 actions

1. Owner verifies MA HIC number, CSL holder/scope and documentation.
2. Owner checks Cloudflare Builds and confirms whether Git pushes auto deploy.
3. Engineering proposes a non-mutating www and contact API health check in a separate PR.
