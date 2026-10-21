# SEO + AI-discoverability engineering sprint — report

**Date: October 12, 2026.** Scope: audit production SEO/crawl behavior, review and extend structured data, check AI-search-crawler access, audit the 5 service pages' content/linking, add regression tests, implement only the small/safe/confirmed fixes. Explicit constraints honored throughout: no site rebuild, no Google Indexing API, no deploy, no Cloudflare security change, no sitemap submission/indexing request, no new unverified business claims, no touching customer-intake/Turnstile/D1/email code. Full GSC evidence and numbers live in `16-gsc-seo-baseline.md`; this file is the implementation record.

## Before / after

| Area | Before | After |
|---|---|---|
| Internal links to `/about`, `/gallery` | Bare paths (`href="/about"`, `href="/gallery"`) in `nav.json` and 7 templates — every click/crawl took a 307 redirect hop to the canonical trailing-slash URL. Also meant the header's "active page" highlight silently never matched on these two pages (comparison was against `canonical`, which has the trailing slash). | All internal links point directly at the canonical trailing-slash form. No redirect hop; "active" nav state now correctly matches on About/Gallery. |
| Structured data on the 5 dedicated service pages (ADU, custom home, additions, renovation, Falmouth GC) | `WebPage` + `BreadcrumbList` only — no `Service` entity, despite each page's whole purpose being to describe one service. | Each page emits one `Service` node (`provider → #business`, `areaServed` from the existing verified list, `name`/`description` reused verbatim from that page's own already-published `<title>`/meta description — no new claims), and the page's own `WebPage.mainEntity` now points at it. |
| Automated regression coverage for SEO/structured-data invariants | None. | New `tests/structured-data.test.mjs` (9 cases, unit-level, runs under plain `npm test`, no build required) plus new build-level assertions added to `scripts/verify-release-build.mjs` (sitemap well-formedness/domain/lastmod, per-page canonical/noindex/title/description, JSON-LD parse + no cross-page `@id` type collisions, no fabricated review markup, sitemap URLs reachable from server-rendered homepage HTML). |
| Understanding of the "6 of 9 pages unindexed" / sitemap "Couldn't fetch" reports | Treated as two separate, only partially explained problems; the original baseline doc had only checked 2 of the 9 sitemap URLs and had mis-described the legacy `.html`/no-slash URLs as live duplicates. | Documented precisely in `16-gsc-seo-baseline.md`: all 9 URLs re-checked (6 unindexed, 2 crossed over to indexed *during this sprint* with zero code change, 1 — the homepage — already indexed); confirmed no per-page technical defect on any of the 6; confirmed the legacy URLs already 307-redirect (not live duplicates — baseline corrected); confirmed the sitemap file itself is valid/well-formed/unblocked for GPTBot/OAI-SearchBot/Googlebot, and that `isPending:true` most plausibly reflects "auto-discovered via `robots.txt`, never explicitly resubmitted" rather than a fetch defect; explicitly distinguished "URL Inspection on the sitemap.xml file itself is meaningless" from "the sitemap fetch failed." |
| Cloudflare AI Crawl Control configuration | Unknown; not checked. | Checked directly via the Cloudflare API with the project's existing wrangler OAuth credential. Result: that credential's scopes (`zone:read`, `account:read`, `workers:*`, `d1:write`, etc.) can read basic zone metadata but get `401 Unauthorized to access requested resource` on every bot/firewall endpoint (`bot_management`, `firewall/rules`, `rulesets`, `settings/bot_fight_mode`, `settings/ai_optimization`). This is a real access limitation, not a non-finding — see "Remaining gaps" below. |
| `llms.txt` | Assumed not yet evaluated. | Found already implemented and live (`src/llms.njk` → `/llms.txt`, HTTP 200), generated from the same verified data files as everything else. No action needed. |

## Exact files changed

- `lib/schema.js` — added `pageServiceNode()`; wired a new `schemaType === "service"` branch into `jsonld()` that emits one `Service` node per page and links it from that page's `WebPage.mainEntity`. No existing node/branch (`home`, `about`, `gallery`, `services`) changed behavior.
- `src/_includes/base.njk` — passes `description` into the `jsonld` filter context (needed by the new `Service` node); updated the front-matter doc-comment to document the new `schemaType: service` option; `/gallery` → `/gallery/` in 3 footer links.
- `src/_data/nav.json` — `/about` → `/about/`, `/gallery` → `/gallery/`.
- `src/index.njk` — `/about` → `/about/`, `/gallery` → `/gallery/`.
- `src/adu-builder-cape-cod/index.njk`, `src/custom-home-builder-cape-cod/index.njk`, `src/home-additions-cape-cod/index.njk`, `src/home-renovation-cape-cod/index.njk`, `src/general-contractor-falmouth-ma/index.njk` — added `schemaType: service` to front matter; `/gallery` → `/gallery/` in each page's gallery CTA.
- `scripts/verify-release-build.mjs` — added SEO/structured-data invariant checks (sitemap, canonical, robots/noindex, JSON-LD parse + `@id` consistency, no fabricated reviews, sitemap↔homepage-link reachability). Runs as part of `npm run release:check`.
- `tests/structured-data.test.mjs` — new file, 9 unit tests against the real `lib/schema.js` + real `src/_data/*.json` (not synthetic fixtures), run by plain `npm test`.
- `docs/research/16-gsc-seo-baseline.md` — added the full sprint findings (see above); corrected two stale claims (refresh-token wording, legacy-URL duplication framing); marked the MCP-tool-visibility limitation resolved.
- `docs/research/00-INDEX.md` — added a row for this report (see below).
- No changes anywhere in `worker/`, `migrations/`, intake/Turnstile/D1/email code, or any Cloudflare account/security setting. Nothing was deployed, pushed, or submitted to Search Console.

## Test evidence

```
npm test     → 82 tests, 80 pass, 2 skipped (pre-existing, unrelated), 0 fail
npm run build → succeeds, 11 files written, no errors
node scripts/verify-release-build.mjs → "Release build verified: 50 public files, matching
  trap/challenge contracts, bounded message, private files excluded, local links resolved,
  sitemap/canonical/robots/JSON-LD invariants held across 9 pages."
```

Manually spot-checked the built `/adu-builder-cape-cod/` JSON-LD: one `Service` node (`@id` ending `#service`), `provider` correctly referencing the single `#business` node, `description` identical to the page's own already-published meta description (no new claim), `WebPage.mainEntity` correctly pointing at the `Service` node, no duplicate `@id` anywhere in the site-wide graph (28 unique `@id`s across 9 pages, each resolved to exactly one consistent `@type`).

## Remaining business-information gaps (not addressed this sprint, by design)

- **Cloudflare AI Crawl Control / bot-management configuration is still genuinely unverified.** The only available Cloudflare credential cannot read it. Closing this needs either (a) the owner opening the Cloudflare dashboard (Security → Bots, or Security → AI Crawl Control) and reporting what's configured, or (b) the owner creating a new, narrowly-scoped read-only API token (Zone → Firewall Services: Read, or Zone → Bot Management: Read) in the Cloudflare dashboard and sharing only that token's permission grant — not something generated unilaterally here, since creating new account credentials is an account-settings action requiring the owner.
- **The publicly-published street address** (`16 Terry Lou Ave, East Falmouth, MA`) is already live in both the JSON-LD and page footer, and `business.json`'s own code comment says the owner already confirmed publishing it and that it matches the Google Business Profile. This directly resolves the open question `docs/HANDOFF.md` section 4 still lists as "unknown: whether the public address is storefront-eligible or should be hidden" — the data file says it's resolved; `HANDOFF.md` has not been updated to match. Flagging this discrepancy rather than silently picking a side: `HANDOFF.md` should be corrected to say this is confirmed-published-by-owner, sourced from `business.json`'s comment, not re-litigated.
- **CSL license number, legal name, founding date, and insurance details** remain `null` in `business.json` and are correctly omitted from JSON-LD (never fabricated) — still an open owner-input item, unchanged by this sprint.
- **Verified project/case-study attribution** (the 7 gallery projects' confirmed role/scope) remains unresolved — `Service` nodes were added at the page level only; no `CreativeWork`/project-level structured data was added, deliberately, since that would need the same attribution evidence `14-phase2-execution-plan.md` already flags as missing.
- **Whether a 307 (temporary) vs. 301 (permanent) redirect matters** for the legacy `.html`/no-slash URLs was identified but not changed — changing redirect semantics is a routing-behavior decision that deserves its own reviewed task, not a side effect of this sprint.
- **IndexNow** was evaluated only, per instruction, and not implemented.

## Expected benefit (grounded, not promised)

- The internal-link trailing-slash fix removes an unnecessary redirect hop on every click/crawl of the two most-referenced non-home pages and fixes a latent "active nav" display bug — small, certain, zero-risk.
- The new `Service` entities give Google (and any AI crawler reading the same markup) an explicit, correctly-linked statement of what each of the 5 pages' service actually is, using only words already published and reviewed — this is a completeness fix, not a ranking guarantee; Google's own documentation does not promise rich results or ranking changes from adding Service schema.
- The new regression tests convert "will GSC tell us about this in 3–5 days" into "did the build just break this," for the specific defect classes GSC surfaces slowly (sitemap malformation, canonical drift, JSON-LD breakage, noindex regressions, orphaned sitemap entries).
- None of this is expected to directly move the two pages that are still "URL is unknown to Google" into the index — that depends on Google's own crawl schedule and (per the three-highest-value-improvements list in `16-gsc-seo-baseline.md`) the owner's two UI actions (explicit sitemap resubmission, per-page Request Indexing), which remain owner actions by design.

## Prioritized production-release proposal

This sprint's changes are local-only (not deployed, not pushed, not merged) per the explicit constraint. Recommended order if/when the owner approves moving forward:

1. **Review and merge this sprint's changes** (nav/template trailing-slash fix, Service schema addition, new tests) — all are additive, all tests pass, all preserve the existing intake/Turnstile/D1/email code untouched. Lowest risk item in this list.
2. **Owner: open Search Console → Sitemaps → explicitly (re)submit `sitemap.xml`.** No code dependency; can happen independently of #1.
3. **Owner: Search Console → URL Inspection → Test Live URL → Request Indexing**, for the still-unindexed pages, once comfortable the technical audit above found nothing to fix first.
4. **Owner: check Cloudflare dashboard Security → AI Crawl Control / Bots directly**, or create a scoped read-only API token so a future session can verify programmatically — closes the one access gap this sprint could not close itself.
5. **Owner: correct `docs/HANDOFF.md` section 4's "address publication" item** to match what `business.json` already states as confirmed (see "Remaining gaps" above) — a documentation correction, not a code or business decision.
6. Everything else in this report (301 vs. 307 redirect semantics, project-level case-study schema, CSL/legal-name/insurance fields) stays exactly where `14-phase2-execution-plan.md` and `11-decisions-and-questions.md` already place it: waiting on owner-supplied facts, not on more engineering.

---
Written 2026-10-12, same sprint as `16-gsc-seo-baseline.md`'s "Sprint update" section (read that section for the full technical evidence this report summarizes).
