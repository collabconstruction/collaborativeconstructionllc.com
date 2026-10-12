# Complete URL inventory & Google indexing audit

**Audit date:** October 12, 2026 (same day as, and immediately following, the SEO + AI-discoverability sprint in `17-seo-sprint-report.md`).
**Production Worker version at time of audit:** `28d3bb86-6417-4266-a3b0-c12e28f8c37f`, deployed 2026-10-12T16:34:30.692Z (confirmed via `wrangler deployments list`, read-only). This audit's production checks (curl, GSC) reflect that version. **The local code changes from the SEO sprint (trailing-slash links, `Service` JSON-LD, new tests) are not yet in this deployment** — they remain local/uncommitted, per that sprint's explicit no-deploy constraint.
**Search Console property:** `sc-domain:collaborativeconstructionllc.com` (domain property, permission: `full`, read-only `webmasters.readonly` OAuth scope — no write/indexing-request call was made at any point in this audit).
**Companion docs (not duplicated here):** `16-gsc-seo-baseline.md` (original GSC connection record, first 9-page re-check, sitemap-status explanation) and `17-seo-sprint-report.md` (the code fixes shipped the same day). This file adds the parts those two did not cover: the full legacy/duplicate-URL inventory, the www-host defect, the `/about` stale-index finding, and the consolidated action checklist.

## Methodology

1. Enumerated every Eleventy page template under `src/` and every entry Eleventy actually emits (`npx @11ty/eleventy --to=json`, 11 items total: 9 HTML pages + `/sitemap.xml` + `/llms.txt`).
2. For every canonical page and every plausible legacy/duplicate URL form (no-trailing-slash, `.html`, `www.` host), ran `curl -sD -` directly against production to record the real HTTP status, redirect target, and headers — not source filenames.
3. Cross-checked the built `_site/` output and `sitemap.xml` against that enumeration.
4. Used the read-only Search Console MCP (`batch_inspect_urls`, `get_search_analytics`, `list_sitemaps`) against the live `sc-domain:collaborativeconstructionllc.com` property for every URL form found in steps 1–2.
5. No sitemap resubmission, no "Request Indexing" call, no Cloudflare setting change, no deploy, no git push. All of this was read-only production inspection plus local file creation, as authorized.

## Section 1 — Complete URL inventory

**9 canonical, indexable HTML pages** (every one has its own `canonical` front-matter value, is in `sitemap.xml`, and is server-rendered-linked from the homepage — confirmed by `scripts/verify-release-build.mjs`, which asserts exactly this):

| # | Page | Canonical URL |
|---|---|---|
| 1 | Home | `https://collaborativeconstructionllc.com/` |
| 2 | About | `https://collaborativeconstructionllc.com/about/` |
| 3 | Gallery | `https://collaborativeconstructionllc.com/gallery/` |
| 4 | Construction Advisory / Management | `https://collaborativeconstructionllc.com/construction-advisory/` |
| 5 | ADU Builder (Cape Cod) | `https://collaborativeconstructionllc.com/adu-builder-cape-cod/` |
| 6 | Custom Home Builder (Cape Cod) | `https://collaborativeconstructionllc.com/custom-home-builder-cape-cod/` |
| 7 | Home Additions (Cape Cod) | `https://collaborativeconstructionllc.com/home-additions-cape-cod/` |
| 8 | Home Renovation (Cape Cod) | `https://collaborativeconstructionllc.com/home-renovation-cape-cod/` |
| 9 | General Contractor (Falmouth, MA) | `https://collaborativeconstructionllc.com/general-contractor-falmouth-ma/` |

**No orphans, no missing nav links, no page present in production but absent from the sitemap, and no page referenced internally but missing from the build.** This is a negative finding worth stating plainly: the site has exactly these 9 pages, all 9 are in `collections.all` with a `canonical`, all 9 are in `sitemap.xml`, and all 9 are reachable from the homepage without JavaScript.

**17 legacy/duplicate URL forms** — every one of these returns HTTP 307 directly to its canonical counterpart (verified live, October 12, 2026); none serves independent content:

| Legacy URL | → Redirects to |
|---|---|
| `/index.html` | `/` |
| `/about` | `/about/` |
| `/about.html` | `/about/` |
| `/gallery` | `/gallery/` |
| `/gallery.html` | `/gallery/` |
| `/construction-advisory` | `/construction-advisory/` |
| `/construction-advisory.html` | `/construction-advisory/` |
| `/adu-builder-cape-cod` | `/adu-builder-cape-cod/` |
| `/adu-builder-cape-cod.html` | `/adu-builder-cape-cod/` |
| `/custom-home-builder-cape-cod` | `/custom-home-builder-cape-cod/` |
| `/custom-home-builder-cape-cod.html` | `/custom-home-builder-cape-cod/` |
| `/home-additions-cape-cod` | `/home-additions-cape-cod/` |
| `/home-additions-cape-cod.html` | `/home-additions-cape-cod/` |
| `/home-renovation-cape-cod` | `/home-renovation-cape-cod/` |
| `/home-renovation-cape-cod.html` | `/home-renovation-cape-cod/` |
| `/general-contractor-falmouth-ma` | `/general-contractor-falmouth-ma/` |
| `/general-contractor-falmouth-ma.html` | `/general-contractor-falmouth-ma/` |

**1 broken host variant, newly found this audit:** `https://www.collaborativeconstructionllc.com/` does **not** redirect to the apex domain — it returns **HTTP 522 (Cloudflare: connection timed out)**, reproduced 3/3 times. See Section 6.

**Non-page infrastructure URLs** (correctly excluded from indexing consideration per the audit's own Step 1 instruction not to treat these as ordinary pages): `/sitemap.xml`, `/llms.txt`, `/robots.txt`, `/api/contact` (the last is a POST-only JSON API route, confirmed returning `405 Method Not Allowed` with `Allow: POST` on a GET, and is the only route `run_worker_first` sends to the custom Worker — see Section 6's note on dead redirect code).

## Section 2 — Production verification detail

All 9 canonical pages: `200 OK`, absolute production-domain canonical tag with no query/fragment, no `noindex`, valid non-empty `<title>`/description, parseable JSON-LD, reachable from the homepage via a plain `<a href>` — all independently re-confirmed by `scripts/verify-release-build.mjs` against the latest **local** build (this checks the code, not the live deployment; the live deployment's HTML was separately spot-checked via curl for the same canonical/status facts and matches).

`robots.txt` (live): `Allow: /`, `Disallow: /api/`, points at the real sitemap — no blanket block on any of the 9 pages.

## Section 3 — Google Search Console comparison

Classification taxonomy requested: Already indexed / Discovered but not indexed / Crawled but not indexed / Unknown to Google / Excluded by canonical or redirect / Blocked or unavailable / Not yet checked. Mapped from the GSC URL Inspection API's own `verdict`/`coverageState` fields (no "Discovered but not indexed," "Crawled but not indexed," or "Blocked" states were actually observed in this property — only the three below were):

| Canonical page | `coverageState` | Classification | Last crawl |
|---|---|---|---|
| `/` | Submitted and indexed | **Already indexed** | 2026-10-11 |
| `/about/` | URL is unknown to Google | **Unknown to Google** | — |
| `/gallery/` | Submitted and indexed (rich result: Breadcrumbs) | **Already indexed** | 2026-10-12 |
| `/construction-advisory/` | URL is unknown to Google | **Unknown to Google** | — |
| `/adu-builder-cape-cod/` | Submitted and indexed (Breadcrumbs) | **Already indexed** | 2026-10-12 |
| `/custom-home-builder-cape-cod/` | Submitted and indexed (Breadcrumbs) | **Already indexed** | 2026-10-12 |
| `/home-additions-cape-cod/` | Submitted and indexed (Breadcrumbs) | **Already indexed** | 2026-10-12 |
| `/home-renovation-cape-cod/` | Submitted and indexed (Breadcrumbs) | **Already indexed** | 2026-10-12 |
| `/general-contractor-falmouth-ma/` | Submitted and indexed (Breadcrumbs) | **Already indexed** | 2026-10-12 |

**Improvement since `16-gsc-seo-baseline.md`'s last check (same day, earlier): two more pages (ADU, gallery) crossed over to indexed with zero code change — ordinary crawl-schedule progress, not caused by anything in this audit.** Only `/about/` and `/construction-advisory/` remain genuinely unindexed.

All 17 legacy/duplicate URLs were also inspected directly (not assumed), to see whether Google is tracking them separately:

| Legacy URL | `coverageState` | Classification |
|---|---|---|
| `/index.html` | Page with redirect (Google canonical: `/`) | **Excluded by canonical or redirect** |
| `/gallery` (no slash) | Page with redirect (Google canonical: `/gallery/`) | **Excluded by canonical or redirect** |
| `/about.html`, `/gallery.html`, `/construction-advisory.html`, `/construction-advisory` (no slash) | URL is unknown to Google | **Unknown to Google** (never crawled; harmless) |
| all 5 service-page no-slash and `.html` forms (10 URLs) | URL is unknown to Google | **Unknown to Google** (never crawled; harmless) |
| **`/about` (no slash) — see finding below** | **Submitted and indexed**, Google's own chosen canonical = itself (`.../about`, no slash) | **Already indexed, but at a stale non-canonical URL** |

**Finding — `/about` legacy duplicate is independently indexed under the wrong URL.** Unlike every other legacy URL (which Google either never crawled, or correctly folded into the real canonical via the redirect), `https://collaborativeconstructionllc.com/about` (no trailing slash) is itself "Submitted and indexed," last crawled 2026-08-19, with Google's own selected canonical pointing at itself — not at `/about/`. This is almost certainly a stale crawl from before the current redirect behavior was in place (August predates this sprint's work). It is corroborated by live Search Analytics data for the last 29 days: the no-slash `/about` is getting real impressions and clicks in Google search results (2 clicks / 22 impressions, average position 3.5), while the real canonical `/about/` gets none — Google is actively serving searchers the wrong URL for this page, which then 307-redirects them, instead of showing/ranking the canonical URL directly. A similar but harmless split exists for gallery: `/gallery` (no slash) shows 32 impressions and `/gallery/` shows 13, split across two tracked variants of the same page, though `/gallery` already correctly reports "Page with redirect" rather than being independently indexed. No other page shows this split. This is the single most actionable, concrete indexing-hygiene finding in this audit — addressed in Section 5's checklist (request indexing specifically on `/about/` to push Google to recrawl and consolidate).

`www.collaborativeconstructionllc.com/` in GSC: "URL is unknown to Google" — consistent with it never having served real content (see Section 6; it currently errors before any content is served).

## Section 4 — Sitemap audit

**No code fix was needed.** Eleventy's own `--to=json` output lists exactly 11 collection items (9 canonical pages + `/llms.txt` + `/sitemap.xml`); `sitemap.xml`'s `<loc>` list is exactly the 9 canonical pages, each with a valid `<lastmod>`. There is no canonical page missing from the sitemap, and no sitemap entry pointing at a page that doesn't exist. `src/sitemap.njk`'s own design — generate from `collections.all`, opt in via `item.data.canonical` — is already correct and complete; this audit re-confirms rather than changes that conclusion from `16-gsc-seo-baseline.md`.

The GSC "Couldn't fetch" / `isPending: true`, `submitted: 0` sitemap status (`list_sitemaps` still shows this, unchanged, as of this audit) is explained in full in `16-gsc-seo-baseline.md`'s sprint-update section: the sitemap file itself is valid, well-formed, and reachable; `isPending: true` most plausibly reflects "auto-discovered via `robots.txt`, never explicitly resubmitted in the Search Console UI" rather than an actual fetch failure. This audit did not find new evidence changing that conclusion, and — per this audit's own instruction not to resubmit without approval — did not resubmit it.

## Section 5 — Complete indexing checklist

*(Reproduced in full in the chat response per the "print directly, don't just link" instruction — this is the same table.)*

| Priority | Page name | Full URL | HTTP status | Google indexing status | Sitemap | Action |
|---|---|---|---|---|---|---|
| 1 | About | [`https://collaborativeconstructionllc.com/about/`](https://collaborativeconstructionllc.com/about/) | 200 | Unknown to Google | Yes | **Request indexing now** |
| 2 | Construction Advisory | [`https://collaborativeconstructionllc.com/construction-advisory/`](https://collaborativeconstructionllc.com/construction-advisory/) | 200 | Unknown to Google | Yes | **Request indexing now** |
| 3 | Home | [`https://collaborativeconstructionllc.com/`](https://collaborativeconstructionllc.com/) | 200 | Already indexed | Yes | Already indexed — no action |
| 4 | Gallery | [`https://collaborativeconstructionllc.com/gallery/`](https://collaborativeconstructionllc.com/gallery/) | 200 | Already indexed | Yes | Already indexed — no action |
| 5 | ADU Builder (Cape Cod) | [`https://collaborativeconstructionllc.com/adu-builder-cape-cod/`](https://collaborativeconstructionllc.com/adu-builder-cape-cod/) | 200 | Already indexed | Yes | Already indexed — no action |
| 6 | Custom Home Builder (Cape Cod) | [`https://collaborativeconstructionllc.com/custom-home-builder-cape-cod/`](https://collaborativeconstructionllc.com/custom-home-builder-cape-cod/) | 200 | Already indexed | Yes | Already indexed — no action |
| 7 | Home Additions (Cape Cod) | [`https://collaborativeconstructionllc.com/home-additions-cape-cod/`](https://collaborativeconstructionllc.com/home-additions-cape-cod/) | 200 | Already indexed | Yes | Already indexed — no action |
| 8 | Home Renovation (Cape Cod) | [`https://collaborativeconstructionllc.com/home-renovation-cape-cod/`](https://collaborativeconstructionllc.com/home-renovation-cape-cod/) | 200 | Already indexed | Yes | Already indexed — no action |
| 9 | General Contractor (Falmouth, MA) | [`https://collaborativeconstructionllc.com/general-contractor-falmouth-ma/`](https://collaborativeconstructionllc.com/general-contractor-falmouth-ma/) | 200 | Already indexed | Yes | Already indexed — no action |
| 10 | www apex (host-level defect) | [`https://www.collaborativeconstructionllc.com/`](https://www.collaborativeconstructionllc.com/) | **522** | Unknown to Google | No (correctly excluded) | **Fix before requesting** — owner/Cloudflare DNS action, not a code fix |
| 11 | About (legacy, no slash) | [`https://collaborativeconstructionllc.com/about`](https://collaborativeconstructionllc.com/about) | 307 → `/about/` | Already indexed (stale, wrong URL — see Section 3) | No | **Do not request indexing** — will self-resolve once #1 is recrawled |
| 12 | Gallery (legacy, no slash) | [`https://collaborativeconstructionllc.com/gallery`](https://collaborativeconstructionllc.com/gallery) | 307 → `/gallery/` | Excluded by canonical/redirect | No | Do not request indexing |
| 13 | Construction Advisory (legacy, no slash) | [`https://collaborativeconstructionllc.com/construction-advisory`](https://collaborativeconstructionllc.com/construction-advisory) | 307 → `/construction-advisory/` | Unknown to Google | No | Do not request indexing |
| 14 | `/index.html` | [`https://collaborativeconstructionllc.com/index.html`](https://collaborativeconstructionllc.com/index.html) | 307 → `/` | Excluded by canonical/redirect | No | Do not request indexing |
| 15–30 | All remaining `.html` and no-slash legacy forms (`/about.html`, `/gallery.html`, `/construction-advisory.html`, and both the no-slash and `.html` forms of all 5 service pages — 13 URLs total) | *(see Section 1 table)* | 307 → own canonical | Unknown to Google | No | Do not request indexing |
| — | `/sitemap.xml`, `/llms.txt`, `/robots.txt`, `/api/contact` | *(infrastructure, not pages)* | 200 / 200 / 200 / 405 | Unknown to Google / N/A | N/A | **Not applicable — never request indexing on these** |

## Section 6 — Manual Search Console workflow, in priority order

Prioritized for pages most likely to attract qualified Falmouth/Cape Cod customers, per the audit's instruction. The read-only constraint means every "Request Indexing" step below is something **the owner performs by hand** in the Search Console UI — nothing here was submitted by this audit.

1. **`https://collaborativeconstructionllc.com/about/`** — Test Live URL, then Request Indexing. Highest priority: this is the page carrying Wesleigh Behn's 30-year experience and CSL credential, directly relevant to trust-driven local search, and it's the one page with an active legacy-URL indexing split (see Section 3) — requesting indexing on the *correct* slash URL is the direct fix for that.
2. **`https://collaborativeconstructionllc.com/construction-advisory/`** — Test Live URL, then Request Indexing. Second priority: distinct, higher-margin service (Owner's Project Management / Clerk of the Works) not covered by the 5 trade-specific pages.
3. **`https://collaborativeconstructionllc.com/general-contractor-falmouth-ma/`, `/adu-builder-cape-cod/`, `/custom-home-builder-cape-cod/`, `/home-additions-cape-cod/`, `/home-renovation-cape-cod/`, `/`, `/gallery/`** — **No action.** All 7 are already indexed; requesting indexing again would be a duplicate, wasted action the audit was explicitly told to avoid ("If a page was recently requested for indexing, record that separately to avoid duplicate requests" — these 7 show live crawl dates of 2026-10-11/12, i.e., Google is already actively recrawling them on its own schedule).
4. **`https://www.collaborativeconstructionllc.com/`** — **Fix a technical issue first, do not test/request yet.** This is not a Search Console action at all: the `www` host currently fails at the network level (522) before Google or a browser ever reaches the site. This needs the owner to check Cloudflare DNS/routes for the `www` record (Workers route, DNS proxy status, or a missing redirect rule) — outside this audit's authorization to change. Once fixed, the correct long-term behavior is a redirect to the apex domain, not independent indexing.
5. **All 17 legacy/duplicate URLs** (Section 1) — **No action, ever.** None should be tested or submitted for indexing; they are intentionally non-canonical and already either correctly excluded or (for `.html`/no-slash forms other than `/about`) simply unseen by Google, which is the correct, harmless state.
6. **`/sitemap.xml`, `/llms.txt`, `/robots.txt`, `/api/contact`** — **No action.** Not pages; never submit these for indexing (explicit audit instruction).
7. **Sitemap resubmission** (Sitemaps → `sitemap.xml` → Resubmit) — owner action, independent of the per-URL list above; not performed by this audit (explicit no-resubmit-without-approval instruction), still recommended per `17-seo-sprint-report.md`'s release proposal.

## Unresolved limitations

- **The `www` host 522 is a genuine, newly-found production defect**, not a GSC/indexing artifact — it needs the owner's attention (Cloudflare DNS/Workers-route configuration) independent of anything in Search Console. This audit could not diagnose it further: the wrangler OAuth token available to this session has no Firewall/DNS read scope (same limitation already documented in `16-gsc-seo-baseline.md` for Bot Management), so the *cause* (missing DNS record vs. route misconfiguration vs. something else) is not yet known — only the externally-observable symptom is.
- **The `/about` stale-duplicate-index finding is a hypothesis grounded in dated evidence** (last crawl 2026-08-19, predating this sprint's redirect-consistency work), not a certainty about why Google crawled it that way originally; it should self-correct once Google recrawls `/about/` following a Request Indexing action, but that recrawl has not happened yet and cannot be forced by this audit.
- Everything already flagged as unresolved in `16-gsc-seo-baseline.md` and `17-seo-sprint-report.md` (Cloudflare AI Crawl Control access, CSL/legal-name/insurance fields, project-level case-study schema, 307-vs-301 redirect semantics) is unchanged by this audit and is not repeated in full here.

## Final counts

- **Public HTML URL forms discovered:** 26 (9 canonical pages + 17 legacy/duplicate redirect-only forms), plus 1 additional host-level variant (`www`) that attempts to serve HTML but currently fails at the network level.
- **Unique canonical indexable pages:** 9.
- **Pages already indexed:** 7.
- **Pages needing indexing requests:** 2 (`/about/`, `/construction-advisory/`).
- **Pages excluded as duplicates or redirects:** 17.
- **Pages requiring technical correction:** 1 (`www` apex, HTTP 522) — plus 1 secondary indexing-hygiene item (the `/about` legacy-URL stale-index finding), which is resolved by the normal Request Indexing workflow in Section 6, not by a code or settings change.

---
Written 2026-10-12. Cross-references: `16-gsc-seo-baseline.md` (GSC connection, sitemap-status explanation), `17-seo-sprint-report.md` (code fixes shipped the same day, local-only, not yet in the production Worker version this audit inspected).
