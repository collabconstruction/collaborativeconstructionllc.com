# Analytics baseline and weekly scorecard

Date: 2026-10-21 (America/New_York)
Sources checked: Repo analytics.js, intake-context.js, worker/index.js, schema, src/_data/analytics.json; connected Metricool brand/scheduled posts; GitHub run history
BLOCKED: Authenticated GA4 property 558903217, Search Console, Cloudflare analytics dashboard, GBP performance, D1 private aggregates and authenticated Facebook/LinkedIn administrative insights. None accessed; their numerical baselines are UNKNOWN.
Evidence labels: `verified-source` = directly opened document, repository code, run or URL (not certification of third-party claims); `reported` = secondhand assertion; `estimate` = explicit assumption or calculation; `owner-confirmation-needed` = requires authorized account, record or decision. Unknown never means zero.

## What exists, what is measured

| Source | Metric | Observed current value | Evidence and limitation |
|---|---|---|---|
| GA4 | users, sessions, landing pages, engaged sessions | UNKNOWN | Repo identifies measurement ID `G-PNS7LJP5QB`; not an authenticated report. The site requires analytics consent. |
| GA4 | `form_start`, `generate_lead`, tel/email clicks | UNKNOWN | Event names are in `js/analytics.js`, but no GA4 result verified. `generate_lead` is not an actual paying customer. |
| Search Console | clicks, impressions, queries, average position, indexing | UNKNOWN | Prior dated research files provide historical snapshots only. Fetch new API export after permission. |
| Cloudflare Web Analytics | pageviews, visits, web vitals | UNKNOWN | Repo comment says edge-enabled cookieless analytics; dashboard not accessed. |
| GBP | views, calls, directions, photo engagement, reviews | UNKNOWN | Public Maps URL [here](https://www.google.com/maps?cid=10110650788670469074); account performance unavailable. |
| Metricool | connected Facebook data ID | `1409900735535950` | Connector for brand `7490851`, not proof of the canonical Facebook Page identity. |
| Metricool | future scheduled posts | 0 returned from Oct 21–Dec 31, 2026 | Direct `getScheduledPosts` connector call for brand 7490851, timezone America/New_York. |
| Metricool | audience/follower/reach numbers | INCOMPLETE | Connector returned sparse daily rows with null fields. Do not present null as zero or infer reach for periods without coverage. |
| D1 intake | new real leads, stage mix, average follow-up | UNKNOWN | No authorized private aggregate query or owner export; no customer row data in repository. |

## Attribution and privacy caveats

PR #7 adds current-page allowlisted UTM values and origin-only referral after Accept. Historical traffic cannot be retroactively repaired. Session-based attribution stored in intake-context is not equivalent to Google Analytics' acquisition reporting. Decline excludes GA4 by design, so sessions and conversions are consent-conditioned counts; Cloudflare observations use different definitions. Call and email clicks are **intent signals**, not completed calls or sales. Contact form sends should be counted only after server confirms durable storage, and duplicate receipts must not count twice. Metricool does not prove FB profile ID mapping.

## Weekly scorecard template (counts and aggregates only)

| Week starting | Site visits (source) | GSC clicks | GSC impressions | Form starts | Stored unique leads | Call taps | Email taps | Qualified leads | Quotes | Won jobs | Review count | Unknowns / caveats |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 2026-10-19 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Requires authorized read-only aggregated data |

Suggested derived formulas only when denominators and source coverage exist: form completion = unique stored inquiries / form starts; lead qualification = qualified / unique real leads; close rate = won / qualified leads. Report numerator, denominator, time window and consent/exclusions. Never invent unknown zeroes. Periods: preceding 7 complete days, 28-day rolling, and since launch with clearly stated launch date. Keep a source-specific timestamp and a reproducible query for every computed number. Do not publish customer records or client IDs.

## Connecting safely

GA4: authorize a read-only Analytics Data API connector to the correct business-owned property and compare dates/timezone. GSC: verify exact URL-prefix/domain property and request aggregate search analytics and indexing. GBP: use owner's verified Business Profile permission for Performance metrics; separate public reviews. Cloudflare: dashboard analytics export, no token in GitHub. D1: owner runs approved aggregate SQL in private environment; only totals enter research. Metricool: use already connected read-only brand, reconcile destination before publishing. Give each connector a status: `connected`, `no-access`, `insufficient-permission`, `unverified`; never treat these as interchangeable.

## Next 3 actions

1. Owner grants read-only access to GA4, GSC, GBP and Cloudflare analytics where available.
2. Reconcile Facebook/Metricool Page identifiers before relying on social attribution.
3. Populate one complete weekly scorecard with coverage and totals, no identities.
