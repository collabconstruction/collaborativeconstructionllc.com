# Google Search Console — first SEO baseline

**Connected and verified 2026-10-12.** Status: **Search Console only** moves from "Unknown — not connected" to **connected, read-only, verified with live data**. GA4 and Google Business Profile are still unconnected — see `06-data-access.md`. This file is the source of truth for the GSC connection record and the first baseline; other files link here rather than repeating the numbers.

## Connection record

- **Package**: `mcp-server-google-search-console` (community package, reviewed before install).
- **Access method**: added via `claude mcp add --scope local` (stdio transport). A Claude Code session restart is required before the MCP tool wrapper itself appears in a live session's own tool list — see "Limitation" below. Until a restart happens, the identical read-only REST API was called directly with the saved OAuth token to verify the connection and pull this baseline without waiting.
- **Authenticated account**: `collaborativeconstructiongc@gmail.com`.
- **Google Cloud project**: `collaborative-construction-ai` (project number `497707730594`).
- **OAuth scope**: `https://www.googleapis.com/auth/webmasters.readonly` only. Confirmed read-only: the server log reports write tools disabled/not registered, and the saved token's `scope` field contains only the readonly scope.
- **GSC property**: `sc-domain:collaborativeconstructionllc.com` — a Domain-type property, `siteFullUser` permission, the only property on the account (no ambiguity with a URL-prefix property).
- **Credential storage**: `~/.cc-private/gsc/oauth-client.json` (OAuth client, moved out of the repo root) and `~/.cc-private/gsc/token.json` (access + refresh token). Both files mode `600`, directory mode `700`. Neither lives in this repository. `.gitignore` also excludes `client_secret*.json`, `*.apps.googleusercontent.com.json`, `oauth-client.json`, `token.json`, `credentials.json`, and `.cc-private/` as defense in depth.
- **Reconnection / troubleshooting**: if the OAuth callback fails or hangs, run `lsof -i :3847` to find a stray listener and `kill <pid>` it, then rerun the server with the same `GSC_OAUTH_CLIENT_FILE`, `GSC_OAUTH_TOKEN_FILE`, and `GSC_SCOPES` environment variables and re-approve in the browser within 5 minutes — the local callback listener has a hardcoded 5-minute timeout. **Correction**: the refresh token does *not* keep working indefinitely — see "OAuth refresh-token expiration risk" below for the real 7-day Testing-mode limit.

## What this does and doesn't unblock

**Unblocks**: real GSC performance data (clicks/impressions/CTR/position by query, page, device) and read-only URL indexing checks.
**Still not connected**: GA4 (measurement ID exists in code; no reporting access) and Google Business Profile (no connector at all). Both remain owner-granted-access blockers — see `06-data-access.md`.

## Baseline data

Retrieved 2026-10-12. GSC dates are Pacific Time; a 2–3 day reporting-lag buffer was applied to the end date.

### Site totals

| Window | Dates | Clicks | Impressions | CTR | Avg. position |
|---|---|---|---|---|---|
| 28-day | 2026-09-12 to 2026-10-09 | 9 | 405 | 2.22% | 7.10 |
| 90-day | 2026-07-12 to 2026-10-09 | 32 | 1,594 | 2.01% | 10.99 |

Read cautiously: 9–32 total clicks is a thin sample. Don't treat short-term swings in these numbers as a trend.

### By device (90-day)

| Device | Clicks | Impressions | CTR | Avg. position |
|---|---|---|---|---|
| Desktop | 17 | 1,319 | 1.29% | 12.28 |
| Mobile | 15 | 266 | 5.64% | 4.74 |
| Tablet | 0 | 9 | 0% | 5.89 |

Mobile gets roughly 5x fewer impressions than desktop but converts them to clicks over 4x better, and ranks noticeably higher on average. Directional only — 266 mobile impressions is a thin sample — but worth a mobile page-experience look.

### Top pages by clicks (90-day)

| Page | Clicks | Impressions | CTR | Avg. position |
|---|---|---|---|---|
| `/` (homepage) | 25 | 1,468 | 1.70% | 6.64 |
| `/about` | 7 | 96 | 7.29% | 19.20 |
| `/gallery` | 1 | 140 | 0.71% | 52.73 |
| `/#contact` | 0 | 7 | 0% | 3.71 |
| `/about.html` | 0 | 10 | 0% | 4.40 |
| `/construction-advisory` | 0 | 4 | 0% | 3.25 |
| `/construction-advisory.html` | 0 | 10 | 0% | 4.40 |
| `/gallery.html` | 0 | 10 | 0% | 4.40 |
| `/gallery/` | 0 | 13 | 0% | 26.77 |

`.html` and trailing-slash duplicates of `/about`, `/gallery`, and `/construction-advisory` are each separately indexed and collecting impressions (4–13 each) that never convert — splitting ranking signal away from the canonical URL. Neither the ADU page nor the Falmouth general-contractor landing page appears anywhere in this top-25-by-clicks list, consistent with the indexing finding below.

### Topic-group query check (90-day, exact-substring filters on the `query` dimension — not guessed from a general ranked list, since GSC's un-ordered top-query response is not reliably sorted by performance)

- **Falmouth / general contractor** — real signal, ranking well, converting poorly: `general contractor near me` (88 impr., pos. 1, 0 clicks), `contractors falmouth ma` (58 impr., pos. 1.1, 0 clicks), `general contractor` (52 impr., pos. 1.8, 0 clicks), `general contractors falmouth ma` (18 impr., pos. 1, 0 clicks), `renovation contractor falmouth ma` (11 impr., pos. 1.5, 0 clicks), plus several smaller terms. One click in this whole group: `builders in falmouth ma` (1 impr., pos. 1, 1 click).
- **Cape Cod construction** — `patio construction cape cod` (16 impr., pos. 1, 0 clicks).
- **Home additions** — no query rows contain "addition" in this window. **Research target, not confirmed zero demand.**
- **ADU / accessory dwelling unit** — no query rows contain "adu" or "accessory dwelling." **Research target, not confirmed zero demand** — see the indexing finding immediately below for the likely reason.
- **Home renovation/remodel** — some signal: `renovation contractor falmouth ma` (11 impr., pos. 1.5) plus several low-impression `remodel*` terms.
- **Custom home / custom residential** — no query rows for "custom home," "custom residential," or "custom build." **Research target, not confirmed zero demand.**

### Indexing check (URL Inspection API, read-only, 2026-10-12)

| URL | Verdict | Coverage state | Last crawl |
|---|---|---|---|
| `/` (homepage) | PASS | Submitted and indexed | 2026-10-11T13:15:34Z |
| `/adu-builder-cape-cod/` | NEUTRAL | **URL is unknown to Google** | never |
| `/general-contractor-falmouth-ma/` | NEUTRAL | **URL is unknown to Google** | never |

**This is the headline finding.** Google has never crawled or indexed the ADU page or the Falmouth general-contractor landing page. That plausibly explains two things at once: (1) why "ADU," "accessory dwelling," and "custom home" produce zero query rows above — there is no indexed page for Google to rank, so those zero rows cannot be read as zero demand; and (2) why the *homepage*, not the purpose-built landing page, is the one ranking position 1–2 for Falmouth/general-contractor terms — the dedicated page for that exact topic isn't in the index at all, so the homepage is absorbing that traffic by brand/domain authority alone.

### Root-cause investigation (2026-10-12, follow-on check): no technical blocker found

Checked every documented technical indexing blocker directly against production. None were found:

| Check | Result |
|---|---|
| HTTP status | Both pages return `200 OK` (checked live, `curl -I`) |
| `robots.txt` | `User-agent: *` / `Allow: /` / `Disallow: /api/` only — neither page is disallowed |
| `<meta name="robots">` tag | Absent from both pages' HTML (absence means indexable, not blocked) |
| `X-Robots-Tag` HTTP header | Absent from both responses |
| Canonical tag | Both pages self-canonicalize correctly (`<link rel="canonical" href="https://collaborativeconstructionllc.com/...">`, matching their own URL — no canonical pointing elsewhere) |
| Sitemap inclusion | Both URLs are present in the live `sitemap.xml` with `lastmod: 2026-10-11`, and `robots.txt` correctly references the sitemap |
| Internal links | Both pages are linked from the homepage HTML (`href="/adu-builder-cape-cod/"`, `href="/general-contractor-falmouth-ma/"`) — not orphaned |
| Sitemap *submission* to Search Console | **Gap found**: `sitemaps.list` (read-only, via the Sitemaps API) returns an empty result — no sitemap has ever been explicitly submitted through Search Console. Google can still auto-discover a sitemap referenced in `robots.txt`, but an unsubmitted sitemap is fetched less predictably than one that's been explicitly submitted and monitored. |
| Page recency | Both page templates only entered this repo's tracked history on 2026-10-11 (commit `04b2ee0`, the Phase 1 recovery reconciliation) — i.e., very recent from a crawl-discovery standpoint, same day as the homepage's one recorded crawl (`2026-10-11T13:15:34Z`) |

**Conclusion: no technical indexing blocker exists.** The most likely explanation is ordinary crawl-discovery lag — Google appears to have resumed/started actively crawling this domain only very recently (the homepage's only recorded crawl is from the day before this baseline was pulled), and inner pages are typically queued behind the homepage for a new or recently-reactivated crawl pattern. This is a **normal delay, not a defect**, compounded by the sitemap never having been explicitly submitted.

**Owner can act on this directly, no MCP write access needed** (consistent with keeping the GSC connector read-only):
1. Search Console → **Sitemaps** report → submit `sitemap.xml` explicitly (it's auto-discovered via `robots.txt` today, but explicit submission gets it checked on a schedule rather than opportunistically).
2. Search Console → **URL Inspection** → paste each of the two URLs → **Test Live URL** → if Google reports the live version as indexable, click **Request Indexing**. Per Google's own documentation, this is not a guarantee, only a priority signal.
3. Re-run the same read-only inspection in 5–7 days to confirm the coverage state changed from "URL is unknown to Google" to "Submitted and indexed" (or diagnose further if it hasn't).

## Three highest-value SEO improvements (grounded only in the data above)

1. **Get the ADU and Falmouth general-contractor pages indexed.** By definition they cannot rank for anything while Google doesn't know they exist. The root-cause check above already confirms both are correctly in the sitemap, linked from internal navigation, not blocked by `robots.txt`/`noindex`/canonical, and simply never crawled — so no code or content fix is required. Remaining step is two owner actions in the Search Console UI (listed above): explicitly submit the sitemap, then use "Request Indexing" per page (an owner/authorized-account write action, deliberately not performed by the read-only MCP connector). This is the single highest-leverage fix in this dataset — it targets the two pages `14-phase2-execution-plan.md` already prioritizes (ADU is its #1-ranked channel; Falmouth is the only in-market gallery case study), and it's the most plausible reason the ADU/custom-home topic groups show no query data at all.
2. **Improve click-through on terms that already rank #1–2.** `general contractor near me` (pos. 1, 88 impressions), `contractors falmouth ma` (pos. 1.1, 58 impressions), and `general contractor` (pos. 1.8, 52 impressions) are each getting essentially zero clicks despite top rankings — 159 impressions, 0 clicks combined across just these three terms. That's not a ranking problem; it's a title/snippet/competing-result problem (candidate causes to check, none confirmed yet: title tag or meta description not matching search intent, the Google Business Profile card or local map pack absorbing the click ahead of the organic result, no review-star rich result). This is free top-of-page traffic already arriving that isn't converting to a visit, and fixing it needs no new content or new rankings.
3. **Consolidate the duplicate/legacy URLs.** `/about.html`, `/gallery.html`, `/gallery/`, and `/construction-advisory.html` are each separately indexed alongside their canonical clean-URL counterparts, collecting 4–13 impressions apiece with zero clicks, splitting ranking signal that should consolidate onto one canonical URL per page. A 301 redirect from each legacy/duplicate URL to its canonical counterpart (after verifying current redirect/canonical-tag behavior) would stop the split with no content change.

## What this does not establish

Not established by this connector: demand for ADU/additions/custom-home services, GA4 session or conversion data, Google Business Profile visibility, or paid-traffic behavior. Treat every "research target, not confirmed zero demand" item above as re-checkable only after improvement #1 (indexing) ships — right now a genuinely-zero-demand query and an unindexed-page query produce identical "no rows" results in this data, and there is no way to tell them apart yet.

## OAuth refresh-token expiration risk (found 2026-10-12, follow-on check) — owner action needed

**Real risk, confirmed against Google's own documented behavior, not previously flagged.** This Google Cloud project's OAuth consent screen (`collaborative-construction-ai`) is in **External / Testing** publishing status. Google automatically expires refresh tokens issued by Testing-status apps after **7 days**, regardless of use — this is documented, intentional behavior, not a bug, and is unrelated to how often the token is used.

- Token issued: 2026-10-12, ~16:11 local time (`~/.cc-private/gsc/token.json` creation time).
- Projected expiration under the 7-day Testing-mode rule: **around 2026-10-19**. After that, the saved refresh token stops working and the full browser OAuth consent flow (the one requiring 5-minute, in-person browser approval) must be repeated — this would silently break any unattended/scheduled SEO reporting.
- **Previous correction needed**: an earlier write-up in this project said the refresh token "should keep working indefinitely" — that was wrong for a Testing-status app and is corrected here.

**Recommendation for owner approval (not performed — this is a Google Cloud Console / OAuth consent-screen setting change, which this agent does not make unilaterally):** move the OAuth consent screen's publishing status from **Testing** to **In production**. This removes the 7-day refresh-token limit and is **low-risk for this specific case**: Google reclassified the `webmasters.readonly` scope as **non-sensitive in 2024**, so publishing to production with only this scope does **not** trigger Google's sensitive/restricted-scope verification review (the "Google hasn't verified this app" warning may still appear for unverified apps generally, but no formal review submission or extra documentation is required purely for this scope). This is a one-time Google Cloud Console setting change the owner makes directly — not something to delegate back to Claude.

## Limitation — MCP tool visibility (resolved 2026-10-12, later session)

**Resolved.** A later session (same day) found the GSC MCP tools (`get_site`, `list_sitemaps`, `get_performance_summary`, `batch_inspect_urls`, `inspect_url`, `list_sites`, `get_search_analytics`) surfaced correctly via `ToolSearch` and returned live data on first call — confirming this was exactly the "needs a genuine new process start" staleness this section predicted, not a deeper connector problem. No more REST-API workaround is needed; call the MCP tools directly.

## Sprint update — October 12, 2026 (SEO + AI-discoverability engineering sprint)

Full Phase A–F sprint (audit → structured data → AI-crawler access → content/linking → regression tests → implementation). Summary below; see `docs/research/17-seo-sprint-report.md` for the complete before/after report, exact files changed, and test evidence.

**Indexing, re-checked with `batch_inspect_urls` across all 9 sitemap URLs (not just the original 2):**

| URL | Coverage state |
|---|---|
| `/` | Submitted and indexed |
| `/adu-builder-cape-cod/` | **Submitted and indexed** (newly crawled since the morning check — Breadcrumbs rich result detected) |
| `/gallery/` | **Submitted and indexed** (newly crawled — Breadcrumbs rich result detected) |
| `/about/` | URL is unknown to Google |
| `/construction-advisory/` | URL is unknown to Google |
| `/custom-home-builder-cape-cod/` | URL is unknown to Google |
| `/general-contractor-falmouth-ma/` | URL is unknown to Google |
| `/home-additions-cape-cod/` | URL is unknown to Google |
| `/home-renovation-cape-cod/` | URL is unknown to Google |

Two pages crossed over to indexed *during this same day*, with no code change and no "Request Indexing" click — direct evidence for the crawl-discovery-lag explanation already in this doc, not a contradiction of it. 6 of 9 pages remain unindexed; all 6 were re-checked individually (HTTP 200, correct self-canonical, distinct title/description, exactly one JSON-LD block, present in sitemap, linked from server-rendered homepage HTML) — **no per-page technical defect found on any of the 6.**

**Sitemap status clarified.** `list_sitemaps` (the live MCP tool, not the REST fallback) returns the sitemap as registered but `isPending: true`, `submitted: 0`, `indexed: 0`, `errors: 0`, `warnings: 0`. Direct checks ruled out a file-level cause: the live `sitemap.xml` is well-formed XML (`xml.etree` parses it cleanly), served as `content-type: application/xml`, HTTP 200, correctly referenced in `robots.txt`, and fetches as HTTP 200 for GPTBot, OAI-SearchBot, and Googlebot's user-agent string alike (tested with `curl -A`, not assumed). `errors: 0`/`warnings: 0` with `isPending: true` reads as "registered via `robots.txt` auto-discovery but never run through an explicit resubmission," which matches the UI's historical "Couldn't fetch" report being a stale/cached status rather than a live, reproducible failure. **Do not confuse this with the per-page URL Inspection result**: running URL Inspection directly on `sitemap.xml` itself returns `NEUTRAL` / "URL is unknown to Google" — but that is expected and uninformative for any XML file, because URL Inspection is a page-indexing tool, not a sitemap-fetch diagnostic. It does not confirm or deny whether the sitemap fetch itself ever failed.

**Correction to improvement #3 above ("Consolidate the duplicate/legacy URLs")**: direct `curl` checks of `/about`, `/about.html`, `/gallery`, `/gallery.html`, and `/construction-advisory.html` all now return **HTTP 307** redirects to their canonical trailing-slash URL. These are not live, separately-rendered duplicate pages splitting ranking signal today — the GSC impressions cited for them are historical/cached index entries from before the redirects existed (or from a crawl that hasn't refreshed yet), not evidence of a current duplication defect. The original 301-redirect recommendation is already partially true in practice (a redirect exists), though it is a 307 (temporary) rather than a 301 (permanent) — whether that distinction is worth a dedicated fix is open; it was not changed this sprint since the redirect already prevents live duplication, and changing redirect semantics touches routing behavior that deserves its own reviewed change, not a side effect of an SEO sprint.

**Structured data**: audited the existing JSON-LD (one `@graph` block per page, generated centrally by `lib/schema.js` from `src/_data/*.json`, already well-designed — `prune()` drops any null/unset fact rather than guessing, no fabricated reviews/ratings existed or were added). Found and closed one real gap: the business's `GeneralContractor`/`HomeAndConstructionBusiness`, `WebSite`, `Organization`-equivalent entity and `Person`/`BreadcrumbList` nodes were already correct and consistently cross-referenced by `@id`, but the 5 dedicated service pages (ADU, custom home, additions, renovation, Falmouth GC) — 4 of which are in the "unknown to Google" list above — had no `Service` entity at all, only a bare `WebPage`. Added a `schemaType: service` front-matter option that emits one `Service` node per page, reusing that page's own already-published title/meta description verbatim (no new marketing claims), linked `provider → #business` and `WebPage.mainEntity → that Service`. Verified build-wide: no duplicate or type-conflicting `@id` anywhere in the site.

**Cloudflare AI Crawl Control — access limitation, not resolved.** The project's only available Cloudflare credential (wrangler's own OAuth token, scopes: `account:read`, `zone:read`, `workers:*`, `d1:write`, etc.) can read basic zone metadata but gets `401 Unauthorized to access requested resource` on every bot/firewall-related endpoint tried (`/zones/{id}/bot_management`, `/firewall/rules`, `/rulesets`, `/settings/bot_fight_mode`, `/settings/ai_optimization`) — `zone:read` does not include Firewall/Bot Management read permission. Confirming or denying a Cloudflare-side AI-crawler block requires either the owner checking the dashboard directly (Security → Bots / AI Crawl Control) or the owner creating a new, narrowly-scoped read-only API token with Zone WAF/Bot Management permission — not something generated unilaterally here, since creating new account credentials is an account-settings action. What *was* confirmed directly: plain `curl -A "GPTBot"` / `-A "OAI-SearchBot"` / `-A "Googlebot"` all get identical, unblocked HTTP 200 responses for `robots.txt`, `sitemap.xml`, and the homepage. This is real evidence of no *User-Agent-string*-level block, but Cloudflare's actual bot-management can also key off IP/ASN verified-bot lists, which a simple curl cannot replicate — so this doesn't fully settle whether the Cloudflare dashboard previously showed GPTBot being blocked at `/sitemap.xml`; it only shows the current simple case is open.

**`llms.txt`**: already implemented (`src/llms.njk`, live at `/llms.txt`, HTTP 200) — generated from the same `business.json`/`services.json`/`nav.json` data as everything else, with its own code comment correctly framing it as "unproven... nothing in this project should depend on it." No action needed; evaluated per Phase C, found already done.

**IndexNow**: evaluated only, per the user's explicit instruction to treat it as an optional, non-guaranteed secondary experiment, not required for Google — not implemented this sprint.

---
Retrieved and written up 2026-10-12. Source: Search Console `searchAnalytics.query`, `urlInspection.index.inspect`, and `sitemaps.list`, read-only scope, property `sc-domain:collaborativeconstructionllc.com`.
