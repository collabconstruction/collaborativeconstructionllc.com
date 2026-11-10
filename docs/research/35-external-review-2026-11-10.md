# External site review — November 10, 2026

Independent live-site review (raw HTML + curl, no Search Console/GA4 access) cross-checked against the repo and prior audits (`16`, `17`, `18`, `34`). Purpose: give the next implementation agent a verified findings list reconciled with what is already known or planned — not a repeat of `34-crawl-audit-2026-10-21.md` or `17-seo-sprint-report.md`.

Scope note: the private business research series (01, 02, 04, 05, 07, 12, 13 and 24–33) now lives in `collaborative-hq/docs/business/research/`; this repo's `00-INDEX.md` still links the old paths — index hygiene item, see "Housekeeping" below.

## Verified live today (new observations, not in prior audits)

### 1. `llms.txt` on the live site is stale relative to the repo — deploy drift or cache

- Live `/llms.txt` emits only **5 page links**: `/`, `home-additions`, `home-renovation`, `custom-home-builder`, `gallery`.
- Repo `src/_data/nav.json` now lists **all 9 pages** (6 service dropdown entries + Projects + About), and `src/llms.njk` iterates `nav.items` expanding dropdown children — a current build would emit all 9.
- Live "Company" paragraph also differs from the current `src/llms.njk` template text ("serving Cape Cod and the South Shore" vs. the template's "Pricing is affordable and competitive…"), confirming the live copy predates current source.
- HANDOFF.md claims repo and live are in step as of Oct 21 — either `nav.json`/`llms.njk` changed after that without a deploy, or the edge is serving a cached copy. **Action**: rebuild, compare `_site/llms.txt` against live, deploy or purge cache, then re-verify all 9 URLs appear. If it is only cache, confirm TTL behavior so this doesn't silently recur.

### 2. `www` redirect is fixed

`https://www.collaborativeconstructionllc.com/` now returns `301 → https://collaborativeconstructionllc.com/` (was HTTP 522 in the Oct audits). The owner-side DNS/redirect action landed. No action needed; recorded so future audits don't re-flag it.

### 3. robots.txt AI-crawler policy needs an intent check (owner item, already partially open)

Live robots.txt = Cloudflare managed block + repo rules. The managed block disallows several AI crawlers by name (observed: NavuBot, SemrushBot-SWA, WARDBot, magpie-crawler, KimiBot, CitibotSiteCrawler) while `User-agent: *` allows everything else and `Disallow: /api/` is preserved.

PLAN.md records the owner decision as **"allow AI search and answer bots but keep training bots blocked."** Some names in the managed block may be answer/search crawlers rather than training bots (e.g. KimiBot is an assistant crawler) — worth one dashboard pass (Security → AI Crawl Control / Bots) to confirm the managed list matches that intent. This was already an open owner action in `17-seo-sprint-report.md`; today's pull shows it still matters because llms.txt exists specifically for answer engines.

### 4. Schema enrichment candidates — only where no new claims are needed

Current state matches the Oct 12 sprint: `GeneralContractor`/`HomeAndConstructionBusiness` + `WebSite` + `WebPage` on home; `Service`+`WebPage`+`BreadcrumbList` on the five service landing pages; `CollectionPage`+`BreadcrumbList` on gallery. Gaps worth considering, all claim-safe:

- **`Service.image`** — each service page could reference the project photo already used on that page (no new claim, just a pointer).
- **`hasMap`** on the LocalBusiness node — the GBP maps CID URL is already published in `sameAs`; `hasMap` can reuse it.
- **`sameAs` addition** — the official LinkedIn URL is recorded in HANDOFF.md (`linkedin.com/in/collaborative-construction-56761b444/`). Adding it is reasonable **only after owner confirms** it is the intended company profile (it is an `/in/` slug, not `/company/`).
- **`offers`/`priceRange`/`AggregateRating`/`geo`/`founder` — do NOT add speculatively.** No pricing facts exist in `business.json`; `towns.json` deliberately carries no lat/lng ("inventing coordinates would publish false geo data"); the public site names no individual; and `verify-release-build.mjs` already guards against fabricated review markup. Each of these stays blocked on owner-supplied facts — same status as `17-seo-sprint-report.md`'s "Remaining business-information gaps."

### 5. Project detail pages — data model mostly exists; three real blockers

`src/_data/projects.json` already holds 8 structured projects (`title`, `location`, `category`, `shows`, `images`, `compact`, `footerThumb`) and `towns.json` carries `inServiceArea` flags (true: **Falmouth, Hingham, Rockland**). Per-project pages are closer than they look, but:

- **Attribution is still unresolved** — `14-phase2-execution-plan.md` + `15-falmouth-case-study-worksheet.md` gate any role/scope claim on owner confirmation. No `role`/`builtBy` field may be added before that (the `projects.json` `_comment` says so explicitly). Template work can proceed; publishing cannot.
- **`projects.json.location` is free text, not a `towns.json` slug** — the towns file's own comment says project front matter should reference towns "by slug," but the actual items store `"Belmont, MA"` strings. Two towns used by projects — **New Seabury** and **Monomoscoy Island** — appear not to exist in `towns.json` at all. Data-model reconciliation needed before location-aware project pages.
- **5 of 8 projects sit outside the declared service area** (`inServiceArea: false` towns). Project pages must not imply service-area coverage — either keep them gallery-scoped (no location-page linkage) or gate location claims the same way `towns.json` does.

Suggested shape when unblocked: `/projects/{slug}/` (or `/gallery/{slug}/`) rendered from `projects.json`, linked from gallery tiles and the relevant service page — matching `14-phase2`'s "Residential Exterior — Falmouth" as the priority candidate. `CreativeWork`/`Article` schema only after attribution is confirmed (already the sprint's stated position).

### 6. Geo-modified titles/H1s — the blocker may be smaller than the audit implied

`34-crawl-audit` lists "titles and H1s carry no place" as an owner-blocked item pending confirmed service towns. `towns.json` now marks Falmouth/Hingham/Rockland `inServiceArea: true` — Falmouth is already strong enough that `/general-contractor-falmouth-ma/` uses "General Contractor in Falmouth, MA" as its H1. Proposal for the implementing agent: extend geo modifiers **only** to pages/towns where `inServiceArea` is true, starting with the service pages already targeting Cape Cod (they say "Cape Cod" in URL but not always in title/H1 — verify each page's `<title>`/`<h1>` before editing). Do not touch pages whose service area isn't confirmed.

### 7. Content engine — optional, lower priority than the queued work

No blog/resources section exists. Answer-engine queries ("cost of an ADU in Massachusetts," "how to hire a general contractor Cape Cod") are winnable with genuinely useful content and would feed `llms.txt` over time — but `08-growth-plan.md` G07/G08 (case studies + service-page proof) are higher-value and partially unblocked already. Record as a backlog idea for the owner, not a recommended next sprint.

## Collaborative HQ (`collaborative-hq`) — dashboard review

Foundation-only repo (nothing deployed, per its README): Access JWT verification (13 tests, fail-closed) and D1 `cc-intel` migrations 0001/0002 (tested on SQLite + Miniflare) are built; `apps/admin`, `workers/api`, `workers/mcp` are stubs. Architecture is sound for the stated goal — private Semrush-style evidence pipeline + read-only MCP for approved agents, no customer PII in tables, secrets in Worker/GitHub secrets only.

Website-repo implications: **none blocking.** `scripts/seo_audit.py` already emits `raw_sha256` per response, which is the hook HQ's ingestion design expects — keep that output stable. The dashboard's value arrives when GSC/GA4 exports flow through `cc-growth-measurement`; until then its main use is organizing the research that already lives in `docs/business/`.

## Housekeeping findings (doc hygiene, not code)

- `docs/research/00-INDEX.md` links `01-`, `02-`, `04-`, `05-`, `07-`, `12-`, `13-` — all moved to `collaborative-hq/docs/business/research/`. Index needs path updates or a pointer note.
- HANDOFF.md section 4's "address publication unknown" item was already flagged as resolved in `17-seo-sprint-report.md` (`business.json` comment confirms owner approval) — still uncorrected in HANDOFF.
- Live-vs-repo drift on `llms.txt` (item 1) is the only verified case where live ≠ repo claims; everything else spot-checked today matches.

## Suggested order for the implementing agent

1. Verify `npm run build` emits 9 URLs in `_site/llms.txt`; deploy or purge cache; re-curl live. (Smallest, certain.)
2. Owner checklist additions: confirm LinkedIn sameAs, confirm AI-crawler managed list vs. "allow answer bots" intent, supply any priceRange/geo facts if wanted.
3. `Service.image` + `hasMap` additions — claim-safe schema enrichment.
4. Reconcile `projects.json.location` ↔ `towns.json` slugs; prep (not publish) project-page template behind the attribution gate.
5. Geo-title pass limited to `inServiceArea: true` towns.
6. Fix `00-INDEX.md` moved-doc links; correct HANDOFF.md address item.
