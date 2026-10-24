# Source register and reproducibility

Research observation date: 2026-10-11. URLs in each research document support the adjacent claims; this register supplies the common technical sources and local evidence locations. Sources are not perpetual guarantees of current policy.

## Company and implementation evidence

- `src/_data/business.json`, `people.json`, `services.json`, `towns.json`, `analytics.json`: current working-tree facts/configuration and explicit unknowns.
- `src/index.njk`, `about.njk`, `gallery.njk`, service-page folders, `_includes/base.njk`: visible claims, page journeys and analytics configuration.
- `js/main.js`, `js/analytics.js`, `worker/index.js`, `schema.sql`: attribution, events, form/storage/email behavior.
- `lib/schema.js`, `eleventy.config.js`, `src/sitemap.njk`, `robots.txt`: metadata/build/crawling implementation.
- `docs/BASELINE.md`: historical September 8 measurements, not current metrics.
- [Public website](https://collaborativeconstructionllc.com/); [live receipt](evidence/live-site-receipt.json) includes response status, retrieval time, URL, SHA-256 and local snapshot path. Five GET responses were retained; no form was submitted.
- [Claude attempt response](evidence/claude-attempt.txt): actual account-limit response, not a successful model review.

## Primary platform references

| Source | Use |
|---|---|
| [Search Console query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query) | Scope, property format, dates, pagination and result limits |
| [Search Console quotas](https://developers.google.com/webmaster-tools/limits) | Collector design and retry policy |
| [GBP prerequisites](https://developers.google.com/my-business/content/prereqs) | Eligibility and project approval |
| [GBP setup](https://developers.google.com/my-business/content/basic-setup) | OAuth and API enablement |
| [GBP daily performance](https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries) | Daily metrics endpoint and broader OAuth scope |
| [GBP monthly search terms](https://developers.google.com/my-business/reference/performance/rest/v1/locations.searchkeywords.impressions.monthly/list) | Monthly grain and threshold handling |
| [Analytics Data API setup](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart) | Property authorization and reporting setup |
| [Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode) | Distinction between cookie denial and network behavior |
| [Google local visibility](https://support.google.com/business/answer/7091) | Relevance, distance, prominence |
| [Business representation](https://support.google.com/business/answer/3038177) | Profile name, categories, address and service-area eligibility |
| [Review-content policy](https://support.google.com/contributionpolicy/answer/7400114) | Genuine feedback and prohibited manipulation |
| [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies) | Doorway/scaled-content risks |
| [Claude skills documentation](https://code.claude.com/docs/en/skills) | Project skill format and discovery |

## Specialized source indexes

See [competitors](03-competitors.md) for direct company sources and [local opportunities](04-local-opportunities.md) for municipal, Massachusetts and regional sources. See [GitHub review](05-github-skills.md) and [machine-readable receipts](evidence/github-repositories.json) for canonical URLs, pinned commits, selected-source observations and license files. Source snapshots are evidence only; they are not installed plugins or vetted executable dependencies.

## Limits

No exhaustive South Shore/Islands competitor census, historical ranking series, customer survey, authenticated Google statistics, current financial dataset, engineering assessment or legal eligibility determination was completed. The documents identify exactly how to fill these gaps. Recommendations are prioritized hypotheses where outcomes are not yet measured.
