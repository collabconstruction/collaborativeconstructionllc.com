# News, community questions and open-source watch

Date: 2026-10-21 (America/New_York)
Sources checked: Mass.gov ADU current guidance and proposal, Falmouth bylaws, October 19 2026 Reuters housing report, recent Reddit r/HomeImprovement threads, GoogleChrome/dequelabs/pa11y GitHub repositories, Google local ads docs
BLOCKED: X handle-level results, comprehensive Cape-specific news, town-by-town permits, lumber price time series, repo latest commit dates for every OSS tool, every local competitor ad. Weak coverage is explicitly marked.
Evidence labels: `verified-source` directly inspected with URL and date; `reported` secondhand or provider's self-claim; `estimate` arithmetic with stated assumptions; `owner-confirmation-needed` requires business decision/records. UNKNOWN is never zero.

## Regulatory and industry signals

| Date of source/event | Source | Finding and relevance | Suggested action | Label |
|---|---|---|---|---|
| 2026-10-14 updated | [MA official ADU FAQ](https://www.mass.gov/info-details/accessory-dwelling-unit-adu-faqs) | Statewide by-right ADU protection is subject to actual site/building code and allowed local controls. | Original homeowner FAQ: zoning vs septic/building review, never promise approval. | verified-source |
| 2026-09-11 proposal; comments closed Oct 9 | [HLC proposed ADU amendments](https://www.mass.gov/info-details/accessory-dwelling-units) | 760 CMR 71 proposed revisions do not automatically equal final effective regulation. | Monitor final adoption/publication only; update site after official effective date. | verified-source |
| Amended approved 2026-03-31 | [Falmouth ADU bylaw](https://ecode360.com/45540294) | Local ADU provisions are actively evolving alongside state law. | Keep a dated town-by-town legal-source matrix; seek town verification on site-specific permit questions. | verified-source |
| 2026 Mashpee publication | [Mashpee official zoning bylaw PDF](https://www.mashpeema.gov/DocumentCenter/View/4906/2026-Zoning-Bylaws?bidId=) | Town requirements include additional procedural details; historical provisions may conflict with newer statewide protection. | Have qualified reviewer reconcile latest local text with state regulation; do not publish blanket claims. | verified-source |
| 2026-10-19 | [Reuters on US builder sentiment](https://www.reuters.com/business/us-homebuilder-sentiment-tumbles-near-14-12-year-low-october-2026-10-19/) | US housing sentiment weak; broad context not Cape Cod job demand estimate. | Monitor local permit activity and actual leads before changing ad prices. | verified-source |
| 2026-10-13 thread | [Reddit bathroom quotes discussion](https://www.reddit.com/r/HomeImprovement/comments/1x4y1m4/experience_with_three_quotes_from_contractors/) | A single consumer compares $15k/$16.5k/$19.5k bathroom quotes and contrasts presentation, reviews, warranties and proof. **Anecdote, not regional price research.** | Create original proposal checklist: line-item scope, warranty, permit and insurance verification. | verified-source for thread, anecdotal |
| 2026-09-28 thread | [Reddit remodel contract worries](https://www.reddit.com/r/HomeImprovement/comments/1ws3qgl/comparing_my_remodel_estimate_to_the_actual/) | Homeowner worries about surprise changes and difference between estimates vs contracts. | Explain change-order process and allowances without promising no surprises. | verified-source for thread, anecdotal |

## Online-source limitations

Checked sample Reddit discussions, not a representative survey; do not describe complaints as consensus. No reliable current X competitor trend data retrieved, so X monitoring is BLOCKED and no hearsay/social claims made. Town-by-town zoning documents can lag state-law supersession; not legal advice. Material prices and tariff impact need time-series from sources such as Bureau of Labor Statistics/NAHB, with exact series/date and local job-specific material mix, not a generic "prices went up" assertion.

## GitHub tools and licensing

| Tool | Intended application | License observed | Latest commit date | Source/next gate |
|---|---|---|---|---|
| Lighthouse CI | Scheduled and PR page performance checks | Apache-2.0 | NOT VERIFIED | [repository](https://github.com/GoogleChrome/lighthouse-ci); test compatibility before adding |
| axe-core | Browser accessibility test coverage | MPL-2.0 | NOT VERIFIED | [repository](https://github.com/dequelabs/axe-core); needs browser and manual keyboard test |
| web-vitals | Field CWV instrumentation if privacy/legal approved | Apache-2.0 | NOT VERIFIED | [repository](https://github.com/GoogleChrome/web-vitals); do not add telemetry without consent review |
| Pa11y | Optional CI accessibility alternative | LGPL-3.0-only | NOT VERIFIED | [repository](https://github.com/pa11y/pa11y); check license constraints and overlap before adopting |

**No software adoption approved.** Reverify each repository LICENSE and last commit timestamp with a dated GitHub API response before selecting it in a code PR. No scraping service needs a new dependency until existing Python checks are evaluated.

## Next 3 actions

1. Monitor publication of final 760 CMR 71 revision and Falmouth ADU municipal changes.
2. Draft owner-approved FAQ answering price-scope and change-order trust concerns, without guarantees.
3. Validate OSS license/last commit and performance test value on an isolated branch before installation.
