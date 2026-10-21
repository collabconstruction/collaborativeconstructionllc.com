---
name: cc-growth-measurement
description: Analyze Collaborative Construction authorized Google, lead and job-summary exports; reconcile funnel metrics and produce traceable growth scorecards.
---

# Growth measurement

Read `06-data-access.md` and `10-scorecard.md` before interpreting data. Inspect manifest, period, timezone, grain, filters, completeness, refresh time and authorized access. If credentials or exports are absent, document the missing access and prepare the query/report; never invent results or ask for passwords in Markdown.

GSC property IDs, GA4 measurement IDs and numeric GA4 property IDs are different. GSC dates are Pacific; GBP daily actions and monthly search terms have different grains. GBP below-threshold values are censored, not exact numbers. Flag provider/metric mismatches before interpretation, such as GBP thresholded monthly keywords labeled as GSC. Reporting-only GBP wrappers still use the broader business.manage scope and need tool-enforced endpoint restrictions.

Separate impressions, sessions, call clicks, actual calls, inquiries, qualified leads, proposals, contracts and cash. Separate unique new customers from signed jobs: returning clients can sign additional contracts. Use stage history/cohorts and named denominators. Unknown is not zero; zero denominators are not calculable. Do not sum dimensional extracts as guaranteed complete totals or join anonymous search queries to people.

Reconcile D1 storage, email notification and actual follow-up separately. A failed notification is an exception to investigate, not proof of a lost or unattended customer. Flag tests/spam using documented rules. Marketing workers get aggregates, not contact messages, attachments or credentials. Keep private raw exports outside Git and include only approved summaries in the research folder.

Deliver the weekly scorecard with provenance, missing periods, counts, uncertainty, one supported bottleneck and next action. Treat low samples and seasonality honestly; don't claim causal lift from a before/after rate alone.

References: [access](../../../docs/research/06-data-access.md), [scorecard](../../../docs/research/10-scorecard.md).
