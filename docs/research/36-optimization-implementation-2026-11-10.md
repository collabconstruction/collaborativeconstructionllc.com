# 36 — Optimization implementation record (2026-11-10)

Companion to [35-external-review-2026-11-10.md](35-external-review-2026-11-10.md). That doc catalogued every optimization opportunity found by comparing this site against the HireClix career-site fleet and the sqwysh pSEO teardown. This doc records what was actually changed, what was verified as already-optimal, and what remains gated on owner facts or data — so a future agent does not re-litigate decisions.

**Scope rule applied throughout:** no new business claims. Every change reuses facts already published on the site or already present in `src/_data/`. Anything needing a new fact (reviews, pricing, coordinates, attribution) is listed under "Blocked / owner-gated," not implemented.

## Implemented in this pass (all claim-safe)

| # | Change | Files | Why |
|---|--------|-------|-----|
| 1 | `Service` JSON-LD nodes now emit `image` | `lib/schema.js`, `src/_includes/base.njk` | `pageServiceNode` previously had no image; now reuses the page's own `shareImage`, which is already the declared og:image. Absent shareImage prunes out via `prune()`. |
| 2 | `LocalBusiness`/`GeneralContractor` node emits `hasMap` | `lib/schema.js` | Reuses `business.address.mapUrl` — the same owner-published Google Maps URL already used for `sameAs`/NAP. No new claim. |
| 3 | Per-page og:image on five service pages | `src/home-additions-cape-cod/`, `src/home-renovation-cape-cod/`, `src/custom-home-builder-cape-cod/`, `src/adu-builder-cape-cod/`, `src/general-contractor-falmouth-ma/`, `src/construction-advisory.njk` | Every page previously shared `belmont-hero.jpg`. Now each uses a relevant existing project photo with correct width/height/alt from `projects.json` image metadata. ADU page deliberately keeps `belmont-hero` — no ADU-specific photo exists, and using a garage-exterior shot could imply an ADU project that isn't confirmed. This also feeds change #1's `Service.image`. |
| 4 | Geo-modified titles, H1s, descriptions on four Cape Cod service pages | same five service dirs | "Home Additions on Cape Cod", "Home Renovation on Cape Cod", "Custom Home Builder on Cape Cod", "ADU Construction on Cape Cod" (H1) / "ADU Builder on Cape Cod" (title). Consistent with the already-published `areaServed` claim and the existing `/general-contractor-falmouth-ma/` pattern. `schemaName`/breadcrumb names left unchanged (Massachusetts-level service names remain accurate). Only the four pages whose copy already says "Cape Cod" were touched; the Falmouth page was already geo-targeted. |
| 5 | Branded 404 page + Cloudflare wiring | `src/404.njk` (new), `wrangler.jsonc` | `"not_found_handling": "404-page"` serves `_site/404.html` with a real 404 status. Self-contained template (navy/brass palette, links home/gallery/about/contact) — deliberately NOT built on `base.njk` so it emits no canonical/JSON-LD/H1-invariant baggage. No `noindex` meta: the release verifier forbids page-level noindex and the 404 status itself prevents indexing. |
| 6 | Release verifier updated for the 404 page | `scripts/verify-release-build.mjs` | `404.html` excluded from the per-page canonical/OG/H1 invariant loop with an explanatory comment — it is a system page, never canonicalized. All other invariants unchanged. |

**Verification:** `npm test` 104/104 pass; `npm run build` clean; `node scripts/verify-release-build.mjs` passes (245 files, 9 pages). Built `_site/llms.txt` contains all 9 page links — confirming the live staleness reported in doc 35 is deploy drift/edge cache, not a source bug.

## Verified already-optimal — no change warranted

These were audited and intentionally left alone:

- **Performance**: hero/font preloads, `srcset`+WebP responsive images with explicit dimensions, lazy loading below the fold, ~47KB homepage HTML, minimal JS. Matches or beats the career-site fleet baseline.
- **Analytics**: consent-gated GA4, strict event allowlist (`click_to_call`, `click_to_email`, `form_start`, `generate_lead`), no PII/UTM leakage into GA4, session-only intake-context capture. Ahead of typical client setups.
- **Conversion plumbing**: Calendly booking, `/api/contact` Worker with lead persistence before email, Turnstile, file-type/size limits, explicit legacy-path 301 map in the Worker (avoids Cloudflare's hard-coded 307s).
- **SEO plumbing**: unique titles/descriptions, canonicals, OG/Twitter tags, XML sitemap with lastmod, clean keyword-aligned URLs, www/http→https 301s (www 522 confirmed fixed live).
- **Schema architecture**: centralized `lib/schema.js` with `prune()` of null/empty fields, stable `@id`s, `@graph` linking, claim-safe omission of unconfirmed facts. The system worked as designed — changes #1/#2 flowed through it without template edits beyond passing `shareImage`.
- **llms.txt source**: emits all 9 pages correctly at build time.

## Rejected after verification (do not re-try)

- **LinkedIn in `sameAs`**: `business.social.linkedin` is owner-confirmed data and was briefly wired in, but `tests/structured-data.test.mjs` pins the October 21 owner decision that the company LinkedIn is *not* the business identity. Reverted; comment added in `schema.js` pointing at the test.
- **`noindex` on the 404 page**: the release invariant forbids page-level noindex anywhere in `_site`; a real 404 status is the correct mechanism anyway.
- **`AggregateRating`/`Review` schema**: no confirmed review source wired in; inventing ratings violates the claim-safe rule. Revisit only with real GBP review data + owner approval.
- **`priceRange`/`offers` on Service nodes**: "competitive pricing" exists in page copy, but formal Offer schema asserts a price posture the owner has not confirmed. Deferred.
- **`geo` coordinates on LocalBusiness**: derivable from the published street address, but lat/lng should be confirmed against a maps source rather than eyeballed. Deferred.
- **`founder`/`Person` node**: explicitly prohibited — owner decision + pinned by test.

## Blocked / owner-gated (documented, not implemented)

| Item | Blocker |
|------|---------|
| Project detail pages (`/projects/...`) | `projects.json` is structured but `location` is free text, not `towns.json` slugs; New Seabury and Monomoscoy are missing from `towns.json`; 5 of 8 projects sit outside the declared service area; per-project attribution is still owner-gated (worksheet pending). Template work can proceed; publishing cannot. |
| `towns.json` entries for New Seabury / Monomoscoy | Need authoritative county/region data — Barnstable vs. other counties must not be guessed. |
| `projects.json` location → `towns.json` slug normalization | Depends on the towns.json additions above. |
| Review aggregation (schema + on-page testimonials) | Needs real Google Business Profile review export + owner approval to publish counts/quotes. |
| Per-town landing pages beyond Falmouth | Doorway-page risk; only justified where real project content exists per town — which loops back to project detail pages. |
| Blog/resources content engine | Needs a content owner and cadence; "cost of an ADU in MA", "how to hire a GC", "Cape Cod permit timelines" are the identified AEO angles. |
| `llms.txt` live staleness | Build is correct; needs owner deploy + Cloudflare edge-cache purge, then re-verify live. |
| robots.txt AI-crawler policy | Cloudflare managed block may disallow answer/search crawlers (e.g., KimiBot), conflicting with the stated allow-answer-bots intent. Owner decision — the managed block lives at the Cloudflare edge, not in this repo. |
| `docs/research/00-INDEX.md` moved-doc links | Several linked docs moved to `collaborative-hq/docs/business/research/`; index paths need reconciliation (flagged in doc 35). |
| `docs/HANDOFF.md` address item | Still uncorrected per doc 35; left for the doc owner. |

## Comparison rationale (why these and not more)

The career-site fleet optimizes for *inventory scale* (sqwysh: hundreds of thousands of pSEO pages). A contractor's equivalent is *depth per page*: real projects, real reviews, real expertise content. This pass therefore prioritized (a) making every existing page carry more weight — unique og imagery, geo titles, richer schema — and (b) closing crawl/conversion gaps (404, schema completeness) over anything resembling scaled page generation, which would be spam for this business.

## Deploy note

All changes are local commits only. Per `AGENTS.md`, the owner deploys — Claude has no Cloudflare login. After the next deploy, re-verify: live `llms.txt` page count, `www` 301, robots.txt managed block, and the new geo titles in search results over following weeks.
