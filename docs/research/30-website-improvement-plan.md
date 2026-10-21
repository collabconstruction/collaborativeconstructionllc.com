# Website improvement and technical acceptance plan

Date: 2026-10-21 (America/New_York)
Sources checked: Live apex home and service pages, repo Eleventy 9-page routes, Worker, tests, GitHub Release Check, public www HTTP 522, MA HIC state guidance, Cloudflare Workers docs
BLOCKED: No authenticated performance Core Web Vitals, real device Lighthouse or full axe accessibility scan, Cloudflare Builds, www DNS/redirect config, production form end-to-end submit, privacy deployment, full image-rights register.
Evidence labels: `verified-source` directly inspected with URL and date; `reported` secondhand or provider's self-claim; `estimate` arithmetic with stated assumptions; `owner-confirmation-needed` requires business decision/records. UNKNOWN is never zero.

## Nine route inventory

Repo canonical pages: `/`, `/about/`, `/gallery/`, `/construction-advisory/`, `/general-contractor-falmouth-ma/`, `/home-additions-cape-cod/`, `/adu-builder-cape-cod/`, `/home-renovation-cape-cod/`, `/custom-home-builder-cape-cod/`. Verify every canonical and sitemap path in production, not only homepage.

| Priority | Evidence/issue | Precise recommendation | Acceptance test | Rough effort / approval |
|---|---|---|---|---|
| P0 | Live "licensed builder" claim; unknown HIC/CSL numbers | Verify records and publication of applicable HIC number; no invented credentials | Independent MA HIC check; copy/number review by owner/legal counsel | S, owner decision |
| P0 | Cloudflare Git auto deploy unknown, PR #6 held | Inspect Worker Builds; declare manual-only safe release process; confirm no other auto deploys | Document screenshot/settings with no secrets; review branch protection | S, owner dashboard |
| P0 | www returns HTTP 522 | Proxied www record, Cloudflare apex 301 preserving path/query; avoid chains | HTTP request www/about?tag=test returns one redirect, final 200, apex API unchanged | S, owner DNS/rules |
| P1 | Health job ignores www, exits only if apex home fails | Add www, all 9 canonical URLs, privacy when enabled, static asset check, allowed API method | Unit mock failure returns nonzero; test expected statuses and redirects | M, engineering PR |
| P1 | Privacy page is in separate disabled branch | Confirm real storage/retention/deletion workflows and publish reviewed /privacy/ with footer and consent link | No placeholders, page builds, sitemap entry, owner approves legal/tech accuracy | M, owner/legal |
| P1 | workers.dev default access risk | Inspect dependencies, then set `workers_dev:false` on isolated approved release | Old workers.dev no longer publicly serves; custom domain and API unaffected | S, owner deployment |
| P1 | Live contact form is revenue-critical | Staging test Turnstile state, duplicate-receipt handling, 503/403, real no-PII logs | Controlled consented test AFTER authorized deploy; D1 saved once, email once | M, explicit permission |
| P1 | Image provenance unclear | Inventory client-approved real projects vs illustrative images, permissions, town/role | All public photos have owner-side authorization and honest alt/caption | M, owner content |
| P2 | Core Web Vitals/SEO not measured here | Lighthouse CI and field CWV by device; reserve image dimensions, optimize LCP, font loading | Baseline + regression gating on core URLs, mobile/device report | M, engineering |
| P2 | WCAG 2.1 AA audit incomplete | axe-core + keyboard/focus manual walkthrough and contrast on navy/gold, forms, mobile menu | No automated critical violations; documented manual checklist | M, engineering |
| P2 | SEO claims and internal links need ongoing tests | Canonical, JSON-LD, no accidental `noindex`, service-to-gallery links, sitemap, original local FAQs | 9-route assertions; no fabricated Review schema | S/M |
| P2 | Lead source visibility partial | Review PR #7 UTM/referrer consent behavior and no data leakage | Test tagged→untagged navigation, Accept/Decline, GA real-time before/after | S/M, separate draft PR |
| P3 | Educational content opportunity | Original ADU feasibility, permit, oversight and change-order guides with dated updates | Editor/owner review, source/permission register, 30-day measurement | M, owner approvals |

## Engineering notes

Use Playwright for browser smoke tests and axe-core for automated accessibility, with human keyboard testing. [Google Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) is Apache-2.0 licensed in public repo and suited for gated performance snapshots; [axe-core](https://github.com/dequelabs/axe-core) MPL-2.0. Verify dependency version, pinned license and actual latest commit before adopting. The current release script dry-runs **`_site`**, not the live-copy **`_deploy`** overlay; the live overlay needs full site access and a READY report before any approved deploy. Never let routine automation trigger deployment.

## Next 3 actions

1. Solve HIC verification and Cloudflare Builds release gate, document owner decision.
2. Add non-mutating www/route/API and accessibility checks on a feature branch with tests.
3. Inventory project photo sources and obtain permission for one detailed, honest case study.
