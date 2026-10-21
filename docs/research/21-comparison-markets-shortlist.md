# Comparison markets & companies — proposed shortlist (DRAFT, awaiting owner approval)

**Status: proposed, not yet approved.** The owner asked for companies that "rose in different locations" to see what could be mimicked on Cape Cod, and explicitly chose to have a shortlist proposed first rather than let the recurring competitor-scan routine (`docs/automation/claude-cloud-competitor-scan.md`) search open-endedly every run. This file is that proposal. Once the owner approves, trims, or replaces entries below, the routine's prompt should be updated to reference the locked-in list by name, and this file's status line changed to "approved."

Every entry below came from a live web search conducted 2026-10-14 (listed sources at the end) — none of this is invented or assumed. Several are useful for a *concrete, citable lesson*, not because they are a construction competitor in the geographic sense.

## Why these five, not a random list

Cape Cod/Falmouth's relevant traits for comparison purposes: seasonal/tourist-driven demand, high-end second-home and renovation work, historic-district-adjacent zoning constraints, a fragmented market of small-to-midsize general contractors, and short building seasons that create urgency. The list below favors markets or companies that share at least two of those traits, plus one genuinely different case chosen purely for its marketing-attribution lesson (a lesson that does not depend on geography at all).

## 1. REA Homes (St. Louis, MO) — not coastal, included for one specific lesson

Not a geographic comparison — St. Louis has none of Cape Cod's seasonality. Included because it is the single most concretely *measured* example found: a 2025-era case study (agency: Lasso Up) reports a local-SEO/content strategy producing 20 website form leads → 10 sales-qualified → 5 new signed clients, with website-sourced leads attributed to **$7,550,000 in revenue** and a reported 1,715% ROI on the marketing spend.
**Lesson for CC, not an endorsement of the vendor:** the leverage point wasn't a new tactic, it was **attribution** — tying individual leads through to signed-contract revenue, which is exactly the gap flagged in `docs/operations.md`/the growth-measurement skill for this project (GA4's `generate_lead` event currently confirms storage, not revenue). Closing that attribution loop, even manually at first, is the highest-value, lowest-cost thing to copy here — no new channel required.

## 2. Coastal Haven Design + Build (Tampa Bay / Clearwater, FL)

Launched April 2025 by the co-founder of Home Team Luxury Rentals, an already-fast-growing local vacation-rental management company — i.e., the construction business was built on top of an existing adjacent-industry audience rather than starting lead generation from zero.
**Lesson:** Cape Cod has a dense vacation-rental/property-management/realtor ecosystem of its own. A deliberate referral relationship with a handful of local property managers or realtors (who already see renovation-ready second homes constantly) is a plausible low-cost channel parallel to this case, worth testing before assuming paid search/SEO is the only lever.

## 3. Martha's Vineyard / Nantucket builders (Waterfront Builders MV, J.G. Early Contractor and Builder, Martha's Vineyard Construction Company)

Real-estate trade press (Bisnow, 2026) describes capital and buyer attention shifting toward Nantucket/Martha's-Vineyard-style markets even as nearby Hamptons sales softened, with a documented trend toward smaller, more efficient high-end builds (average new-home size fell from 2,309 sq ft in Q3 2022 to 2,171 sq ft in Q3 2024 nationally, and the trend is explicitly noted reaching MV).
**Lesson:** these builders compete almost entirely on reputation/portfolio, not digital-marketing aggressiveness — validates continued investment in CC's gallery/project-presentation work over, say, paid ads. The shrinking-but-better-detailed home trend is also a possible future angle for the custom-home/ADU service pages, worth watching rather than acting on immediately.

## 4. Coastal Maine builders (Graystone Builders of Maine, Maine Coast Builders, Sylvain + Sevigny Custom Builders)

The closest true geographic/cultural analog found: New England coastal, seasonal, historic-district-adjacent, multi-decade family-run firms. Notably, Sylvain + Sevigny's portfolio has been placed in regional outlets (*Maine Home + Design*, *Down East*, and even the *Boston Globe* and *Dwell*).
**Lesson:** earned regional press placement is a realistic, bounded growth lever that doesn't require new technology or ad spend — pitching completed Falmouth-area projects to a Cape Cod-focused or South Shore/regional shelter publication is a concrete, low-risk experiment to propose.

## 5. The national ADU demand trend (not a single company)

Market research (several 2025-2026 sources, cross-checked) consistently shows accessory dwelling units as the fastest-growing remodeling subcategory nationally — one estimate puts the ADU market at ~$19.65B in 2025 growing toward ~$21.46B in 2026, with roughly 61% of municipalities now permitting ADUs and rising rents cited by nearly half of homeowners building one.
**Lesson:** this isn't a company to mimic, it's a market-timing fact that reinforces an asset CC already has — the dedicated ADU service page. The actionable next step is concentrating more SEO/content/ad emphasis specifically there, since the structural tailwind is already blowing in that direction independent of anything a competitor does.

## What this list deliberately leaves out

- No direct Cape Cod/Falmouth competitor is listed here — that's the existing competitor set in `docs/research/03-competitors.md`, which the competitor-scan routine should also keep refreshing; this file is specifically the "elsewhere, to mimic here" angle the owner asked for separately.
- No company's internal financials, staffing, or non-public strategy is claimed — only what each company's own public case study, press coverage, or market-research citation states.

## Sources (2026-10-14 web search)

- [Custom Home Builder, Inbound Marketing & SEO — Lasso Up](https://lasso-up.com/case-studies/custom-home-builder-inbound-marketing-and-search-engine-optimization/)
- [Coastal Haven Design + Build Launches in Tampa Bay](https://www.accessnewswire.com/newsroom/en/real-estate/coastal-haven-design-build-launches-in-tampa-bay-bringing-luxury-remodeling-and-design-1016513)
- [The Hamptons Are So Last Year — Bisnow](https://www.bisnow.com/boston/news/construction-development/the-hamptons-are-so-last-year-real-estate-is-better-at-this-other-posh-beach-town-92783)
- [The Homebuilder Trend Buyers Love on Martha's Vineyard — O'Hanlon Group](https://ohanlongroup.com/blog/smaller-homes-bigger-opportunities-the-homebuilder-trend-buyers-love-on-marthas-vineyard)
- [Waterfront Builders MV](https://waterfrontbuildersmv.com/) · [J.G. Early Contractor and Builder](https://jgemv.com/) · [Martha's Vineyard Construction Company](https://marthasvineyardconstruction.com/)
- [Graystone Builders of Maine](https://graystonebuildersofmaine.com/) · [Maine Coast Builders — Maine Home + Design profile](https://mainehomedesign.com/profile/balanced-building/)
- [The ADU Boom Is Real — BuilderMuse](https://buildermuse.com/residential/the-adu-boom-is-real--what/)
- [22 Home Addition & ADU Statistics (2026) — ProHouse Maintenance](https://www.prohousemaintenance.com/blog/home-addition-statistics/)
- [Remodelers on the Rise — Eye on Housing / NAHB](https://eyeonhousing.org/2025/11/remodelers-on-the-rise-how-renovation-is-reshaping-residential-construction/)

## Next step

Owner reviews this list and either approves it as-is, trims/replaces entries, or asks for a different angle entirely. Once approved, `docs/research/prompts/claude-cloud-competitor-scan.txt` should reference these five by name instead of re-discovering comparison targets from scratch each run — keeping the recurring routine bounded and cheap rather than an unbounded open-ended search every time.
