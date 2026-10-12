# Phase 2 execution plan — GBP, case studies, SEO, analytics, referrals

Created October 12, 2026, immediately after Phase 1's production verification (`docs/phase1-status.md`). This is a research and prioritization document, not a work log of completed marketing actions. No public content, GBP profile, or outbound message has been changed or sent as part of producing this file. All figures about demand, rankings, or revenue are explicitly labeled unknown; none are invented.

## How to use this file

Read `00-INDEX.md` first. This file assumes the Phase 1 technical facts in `phase1-status.md` and the unresolved business questions in `11-decisions-and-questions.md` are both current. It does not repeat the full evidence base in `01-company-review.md`, `04-local-opportunities.md`, `06-data-access.md`, or `07-website-and-profile.md` — it draws conclusions from them and names the next action.

---

## Sprint update — October 12, 2026 (Phase 2 execution sprint)

This section records what changed in the same-day execution sprint that followed this plan's creation. It does not replace the sections below; where it corrects an earlier statement in this file, that correction is also made inline at the relevant section with a note.

- **ADU feasibility checklist: implemented locally, not deployed.** `src/adu-builder-cape-cod/index.njk` now has a new "ADU Feasibility Checklist" section citing `mass.gov` (ADU hub, FAQ) and `falmouthma.gov` (zoning) with explicit no-promise disclaimers on permits, cost, and approval odds. Verified via the local preview server (correct heading, 7 `.svc-card` entries, all 3 external links resolve to the intended URLs) and via `npm run build` (static output at `_site/adu-builder-cape-cod/index.html` contains the expected heading, card count, and all three `href` values). `npm test` passes (73/73). **Not deployed to production** — this is a source-only change pending separate deployment approval.
- **ADU image/caption mismatch: re-investigated, found already fixed, not an open defect.** The mismatch this plan's section C describes below (share-image alt text describing an ADU while showing the Belmont house) was real in a *previously deployed* version of the site (confirmed in `docs/research/evidence/live-adu-builder-cape-cod.txt`, an old production HTML snapshot showing `og:image:alt="ADU project by Collaborative Construction on Cape Cod"` paired with `belmont-hero.jpg`). Checking `git log -p --all` on the current page shows its one commit (`04b2ee0`) already carries the corrected, Belmont-accurate alt text (`shareImageAlt: "Cedar-clad modern residence in Belmont, Massachusetts"`) — this was fixed as a side effect of the Phase 1 recovery deployment, not yet recorded as fixed anywhere. **No further image/alt-text edit is needed on this page.**
- **Mobile horizontal-overflow item (`phase1-status.md` known-issue #2): investigated and closed as not a real defect.** Root cause reproduced and documented directly in `phase1-status.md` — a pre-scroll-animation `translateX` offset plus decorative pseudo-element width, not an actual reachable overflow. No CSS changed. See `phase1-status.md` for the full writeup.
- **Real measurement baseline pulled from the one genuinely connected data source (D1).** `node scripts/leads.mjs report --remote --from 2026-01-01T00:00:00Z --to 2026-12-31T23:59:59Z` (run under Node 22) returned: `total_inquiries: 2`, `overdue: 1` (new actionable finding — one of the two tracked leads is past its follow-up window), all economic/customer/external-metric fields `null`, grouped as `{source:"website", service:"unknown", stage:"new", inquiries:2}` for the full 2026 calendar year to date. This does not change the scorecard's existing "0 real qualified web inquiries" conclusion (both of the 2 D1 rows are excluded by the scorecard's own definition — 1 historical, 1 flagged test), but it surfaces a new actionable item: **confirm who should be following up on the `overdue` lead and why it is overdue** before assuming the pipeline's "next action" logic is being acted on.
- **GBP/GSC/GA4 access: still not connected.** No change from section A/D below — the owner's two stated personal next steps (granting GBP/GSC/GA4 access; verifying Falmouth photo/attribution) were explicitly not yet done as of this sprint.
- A new ranked-channels section (**section F**) and a Falmouth case-study owner-verification worksheet (`docs/research/15-falmouth-case-study-worksheet.md`, blank, pending owner input) were added this sprint.

---

## A. Google Business Profile (GBP)

**Current state: unknown, not a technical gap.** No authenticated GBP access exists in this environment. `06-data-access.md` already documents the correct path: owner identifies the Google login that manages the listing, grants manager/owner access or shares a manual Performance export, and only then can categories, hours, photos, reviews, and search-term performance be audited with evidence instead of inference.

What is already known without that access, from public/secondary sources checked during this research pass:
- Third-party directories (Angi, BuildZoom, chamberofcommerce.com) show a listing exists and has at least 2 reviews (Angi: 5.0/5, 2 reviews) and a BuildZoom score of 93 — these are **secondary-source observations**, not the authoritative Google record, and should not be reported as GBP's own review count.
- `src/_data/business.json` hours (`Mo-Fr 07:00-16:00, Sa 07:00-12:00`) are flagged in that file's own comment as copied from GBP, with the owner separately believing Saturday may actually run to 4pm, not noon. This is a live discrepancy between the site's structured data and the owner's belief about the profile — resolve by checking the actual GBP listing, not by guessing which is right.
- Whether the public address (16 Terry Lou Ave, East Falmouth) is eligible as a customer-facing storefront or should be hidden as a service-area business remains open per Google's representation guidelines (`07-website-and-profile.md`), and directly affects whether that address belongs on GBP at all.

**Checklist to run once owner grants access** (no edits until each item has evidence and explicit sign-off):
1. Confirm listing verification status, exact business name (no keyword-stuffed suffix), and primary/secondary categories.
2. Reconcile hours against the owner's stated belief and the site's `business.json`; fix whichever is wrong, in both places, not just one.
3. Confirm storefront-vs-service-area address eligibility; if service-area, hide the address per Google's guidance rather than leaving it ambiguous.
4. Pull Performance export (search/Maps impressions, website clicks, call clicks, direction requests) for the longest available window; record account/property IDs and retrieval date per the manifest format in `06-data-access.md`.
5. Inventory current photos and reviews; identify gaps (no recent project photos, no review-response habit) without assuming any specific count until observed.
6. Draft proposed edits as a before/after table for owner sign-off; **do not submit any edit without explicit per-change authorization**, consistent with this round's authorization boundaries.

**Required access**: owner grants Google Business Profile manager access, or supplies a manual Performance export. **Cost**: none beyond owner time. **Effort**: half a day once access exists.

---

## B. Case study candidates

All seven gallery projects (`src/gallery.njk`) currently carry **unverified attribution** — no existing record distinguishes a Collaborative Construction LLC contract from Wesleigh Behn's prior employment work, and `11-decisions-and-questions.md` already lists this as an open conflict ("Portfolio LLC ownership versus owner's prior employment experience"). This plan does not resolve that conflict by assumption; it uses the "Company project proof record" template from `12-templates.md` to make the gap explicit per project, and separately proposes which two are worth owner review first based on fit with the business's current stated focus (residential, Falmouth/Upper Cape, Cape Cod/South Shore) and plausibility of scale, not on any confirmed role.

| Project (gallery label) | Town | Scale/type | In declared service area? | Attribution | Photos available | Notes |
|---|---|---|---|---|---|---|
| Custom Residence | Belmont, MA | Residential, 6 photos | No (outside Cape/South Shore) | Unverified — owner confirmation needed | Yes, 6 | Residential scale is plausible for either the LLC or personal work |
| Commercial Dispensary | Dudley, MA | Commercial retail, 2 photos | No | Unverified — owner confirmation needed | Yes, 2 | Commercial retail fit-out; scope/role unclear |
| Residential Exterior | Falmouth, MA | Residential exterior/deck, 5 photos | **Yes — Cape Cod** | Unverified — owner confirmation needed | Yes, 5 | Only project physically inside the core declared market |
| Custom Bath Suite | Newton, MA | Residential renovation, 3 photos | No | Unverified — owner confirmation needed | Yes, 3 | Small residential scope, plausible LLC job despite location |
| Modern Custom Residence | Carlisle, MA | Residential new build, 3 photos | No | Unverified — owner confirmation needed | Yes, 3 | New custom home is a larger undertaking; role unclear |
| Lovell Dormitory | Rockland, MA | Institutional, 50,000 SF residence hall, 5 photos | Yes — South Shore | Unverified — owner confirmation needed | Yes, 5 | Scale (50,000 SF dormitory) is far larger than the company's current stated residential/GC focus; plausibly prior commercial-employment work rather than an LLC contract, but this is an inference, not a confirmed fact |
| CubeSmart Self Storage | Hingham, MA | Commercial, self-storage facility, 3 photos | Yes — South Shore | Unverified — owner confirmation needed | Yes, 3 | Same scale concern as Lovell Dormitory |

**Recommended top two for owner review, and why:**

1. **Residential Exterior — Falmouth, MA.** The only one of the seven physically inside the core declared market (Cape Cod), residential in scope, and the kind of deck/exterior project that matches the business's current stated services (renovations, additions). If the role turns out to be a confirmed LLC job, this is the single highest-value case study to finish first because it needs no geography caveat.
2. **Custom Bath Suite — Newton, MA.** Residential, small enough in scope to plausibly be a direct LLC contract rather than large-scale prior commercial employment, and bathroom renovation is a common target service. Outside the declared geography, so if approved for publication it would need a caption that doesn't imply local service availability in Newton.

The two large institutional/commercial projects (Lovell Dormitory, CubeSmart) are **not** recommended as the first two case studies even though they are visually impressive and within the South Shore service area, because their scale is inconsistent with the business's current residential-GC positioning and the role/employer question is most consequential exactly there — publishing them as company case studies without confirmed attribution carries the highest misrepresentation risk per `11-decisions-and-questions.md`'s existing flag.

**Before any publication**, complete a "Company project proof record" (`12-templates.md`) for each of the two selected projects: company contractual role, Wesleigh's role/employer at the time, scope performed vs. performed by others, photo owner/credit/permission, client quote permission if any, and facts approved by/date. **Do not fabricate** scope, customer problem, outcome, or any client quote. If the owner cannot confirm LLC attribution for either, select the next-best candidate rather than publishing an unverified claim.

**Required access/approval**: owner confirms role and permission per project; no case study page is drafted or published without that sign-off.

---

## C. Local SEO — existing page assessment

No new town pages or scaled content are proposed (`08-growth-plan.md`'s "Hold until justified" already rules this out, and Google's spam policy on doorway/scaled content applies). Five service pages already exist:

| Page | Size (bytes) | Assessment |
|---|---|---|
| `src/custom-home-builder-cape-cod/index.njk` | 13,468 | Largest page; likely most developed content |
| `src/home-renovation-cape-cod/index.njk` | 11,571 | Second largest |
| `src/adu-builder-cape-cod/index.njk` | 10,723 | Directly aligned with the highest-evidence local demand signal (LOCAL-01/LOCAL-02: 2,084 statewide ADU approvals since 2025, active state regulation comment period closed Oct 9, 2026) |
| `src/general-contractor-falmouth-ma/index.njk` | 9,823 | Core positioning page for the primary geography |
| `src/home-additions-cape-cod/index.njk` | 9,684 | Smallest; may need the most content work |

**Highest-opportunity page: `adu-builder-cape-cod`.** This is the one service line with a dated, sourced, high-confidence local demand signal already in `04-local-opportunities.md` (LOCAL-01, LOCAL-02) rather than a general inference. `07-website-and-profile.md` had flagged a concrete defect on this exact page: the share-image alt text describing a Cape Cod ADU while the default share image is actually a Belmont house. **Correction (2026-10-12 sprint): this mismatch no longer exists in current source or production** — it was present in an older deployed version (see `docs/research/evidence/live-adu-builder-cape-cod.txt`) but was already corrected as a side effect of the Phase 1 recovery deployment (commit `04b2ee0`). The remaining opportunity was the content gap: adding the ADU feasibility checklist content already scoped in `04-local-opportunities.md` (state definitions vs. local implementation vs. wastewater/conservation constraints vs. project economics, each dated). **That checklist has now been added locally** (see sprint update above) — lower-effort and higher-relevance than producing new pages, and pending deployment approval.

**Second priority: `general-contractor-falmouth-ma`.** This is the page carrying the core "Falmouth/Upper Cape" identity claim the research base has repeatedly centered on (`01-company-review.md` D02); it should link to whichever case study is approved from section B once ready, since `07-website-and-profile.md` already recommends "add service-specific proof... and related case-study links" as a P2 item.

No page is proposed for rewrite or new publication in this document — this section only orders the existing backlog items (`07-website-and-profile.md` P1/P2 rows) by evidence strength.

---

## D. Analytics and attribution baseline

Distinguishing **unknown** from **verified zero**, using only what is actually reachable right now:

| Source | Status | Evidence |
|---|---|---|
| Cloudflare / wrangler | **Connected, verified working** | Confirmed directly during Phase 1 closeout (`08-growth-plan.md` G02 status update); used to query D1 and inspect deployments |
| D1 (`cc-leads`) | **Connected, verified working** | 2 leads total: 1 historical (2026-09-29), 1 flagged verification test (2026-10-12); both excluded from "web inquiries" by the scorecard's own definition — current real qualified-inquiry count for this reporting period is **0**, not unknown, because the mechanism works and simply has not received a real customer inquiry yet (`10-scorecard.md`). Re-confirmed 2026-10-12 via `node scripts/leads.mjs report --remote --from 2026-01-01T00:00:00Z --to 2026-12-31T23:59:59Z`: `total_inquiries: 2`, **`overdue: 1`** (new finding — one tracked lead has passed its follow-up window; confirm ownership/reason before the next report), all economic/customer fields `null`, both grouped under `{source:"website", service:"unknown", stage:"new"}`. |
| Google Search Console | **Unknown — not connected** | Property ID and access unverified (`06-data-access.md`); no clicks/impressions data exists in this environment |
| GA4 | **Unknown — not connected** | Measurement ID exists in code but reporting access is unverified; consent-accepted conversion firing was not even exercised in the one real test submission (`phase1-status.md`) |
| GBP Performance | **Unknown — not connected** | See section A |
| UTM/attribution-through-redirect mechanism | **Technically verified working, not yet observed on real traffic** | `worker/index.js` preserves `url.search` through both redirect branches; `js/intake-context.js` carries UTM/referrer/source-page across internal navigation, with its own test coverage (`08-growth-plan.md` G04) — this closes a real defect `07-website-and-profile.md` had flagged, but it has not yet been confirmed against an actual tagged campaign visit converting, because there is no campaign traffic yet |

**The only current bottleneck this data actually supports:** the pipeline works; demand has not yet been generated or measured. It does **not** support any claim about ranking position, impression volume, or conversion rate, because none of those three sources (GSC, GA4, GBP) are connected. Do not backfill those with assumptions.

**Required access to close this gap**: owner grants GSC, GA4, and GBP reporting access per `06-data-access.md` section 1. No engineering work is blocking this.

---

## E. Referral opportunities

No new research was performed for this section; it consolidates existing evidence rather than re-researching, per the task scope.

- **HBRACC (Home Builders & Remodelers Association of Cape Cod)** — `04-local-opportunities.md` LOCAL-08: official link hub lists events, career-day activity, and 2026 programming. Medium relationship value. Next action already defined there: verify current dates/membership cost from the linked official pages, pick one appropriate event, draft an objective and follow-up plan for owner review. **No registration or outreach has occurred.**
- **Architect/designer/property-manager relationships** — `07-website-and-profile.md` marketing-channels table proposes ten carefully selected partner research cards and a draft capabilities sheet as the first practical experiment; success measure is accepted conversations and relevant referrals, not volume of contacts made.
- **Realtors and trades** — not separately researched in the existing base; would need the same card format (why each partner fits, source, relationship owner, proposed next action) before any contact, per `08-growth-plan.md` G11.
- **Existing-client referrals** — `07-website-and-profile.md` identifies an owner-reviewed closeout/referral-request process as the first practical experiment for this channel, ahead of any new partner outreach, since it requires no new relationships and uses jobs already completed.

**Constraint carried forward from this round's authorization**: draft outreach materials only; no contact with any partner, architect, realtor, or association without a separate owner approval.

---

## F. Ranked customer acquisition opportunities (2026-10-12 sprint)

Ranking the four channels covered above by evidence of qualified demand, effort, potential cost, and current delivery capacity — using only what sections A–E already established, not new research. Paid advertising is intentionally excluded from this ranking per this sprint's own constraint: response ownership (who actually answers a new lead) and project capacity (how much work can be taken on) are both still unknown (`11-decisions-and-questions.md`), and spending to generate more inquiries before either is resolved risks leads arriving with no one positioned to handle them well.

| Rank | Channel | Evidence of qualified demand | Effort | Potential cost | Capacity fit | Why this rank |
|---|---|---|---|---|---|---|
| 1 | **ADU content/local SEO** (section C) | Highest of any channel researched: dated, sourced, state-level demand data (854 H1-2026 approvals, 2,084 since 2025, active regulatory attention) directly matching an existing service page | Low — content already drafted and locally verified this sprint; only deployment approval remains | None (no paid spend; existing page, existing hosting) | Fits — a reader who self-qualifies against public demand data and existing permit rules, with no implied promise of approval, needs no additional estimating/PM capacity to attract | **#1**: the only channel here with dated external demand evidence *and* a near-zero-cost, already-built next step |
| 2 | **GBP optimization** (section A) | Unknown pending owner-granted access; secondary-source signals (Angi 5.0/2 reviews, BuildZoom 93) suggest an existing, functioning listing worth improving rather than building from zero | Low once access exists (half a day per the existing checklist) | None beyond owner time | Fits — GBP mainly affects how existing searchers find and trust an already-discoverable business; does not itself create new demand beyond local search intent that already exists | **#2**: likely high leverage per the general pattern that GBP is often the single highest-ROI local-search lever, but currently blocked entirely on access, which this sprint could not resolve |
| 3 | **Case studies / referrals** (sections B, E) | Falmouth project is the only gallery project inside the core market, but attribution and permissions are still unverified (worksheet created this sprint, not yet returned); referral evidence (HBRACC, partner cards) is a plan, not yet executed | Medium — owner confirmation + proof-record work, then drafting; referral outreach needs relationship-building time | None required for the case study; referral/association activity may have minor membership/event costs, not yet committed | Fits well if role attribution turns out to be a confirmed LLC job; otherwise this channel stalls until a different case study exists | **#3**: highest long-term trust value (a real local case study converts better than generic copy) but currently gated on an owner action (the worksheet) that has not yet happened, so it cannot move today |
| — | **Paid ads** | Not evaluated | — | — | — | **Explicitly not ranked.** Per this sprint's constraint, paid ads are not recommended until lead-response ownership (who follows up, confirmed — currently defaults unconfirmed to Wesleigh Behn on every lead) and real project capacity are both known. Spending to generate more inquiries before either is resolved would convert the existing `overdue: 1` finding from a one-lead anomaly into a systemic problem. |

**Immediate next action implied by this ranking**: deploy the already-built ADU content (channel #1) once approved, in parallel with the owner granting GBP access (channel #2) and returning the Falmouth worksheet (channel #3) — these three can proceed simultaneously since they depend on different people/approvals, not on each other.

---

## Three highest-value next actions

Each framed for a 30–90 day window. None assumes revenue, ranking, or demand that is not already evidenced above.

### 1. Connect GBP, GSC, and GA4 reporting access

- **Why**: every other action in this plan (which case study to publish where, which service page to improve, whether a campaign converts) is currently unmeasurable without this. It is the single blocker shared by sections A and D.
- **Evidence**: `06-data-access.md` already has the exact procedure; nothing here is newly invented. Cloudflare/D1 access was resolved this way during Phase 1 closeout, demonstrating the pattern works once the owner grants access.
- **Benefit**: converts three "unknown" rows in the scorecard to measurable baselines, enabling every subsequent experiment in `08-growth-plan.md` (E01–E05) to have a denominator.
- **Effort and cost**: owner time only (account invitations); no new paid tool required for read-only access.
- **Required access**: owner's Google login credentials/invitations for the GBP listing, GSC property, and GA4 property.
- **Approvals needed**: none beyond owner granting the access itself — this is not a public-facing action.
- **Deliverable**: one dated manifest entry per source (account/property ID, access type, retrieval date) in a private location per `06-data-access.md`'s format; first GBP Performance export and first GSC/GA4 report pulled.
- **Success criterion**: all three rows in section D move from "unknown" to a dated, sourced baseline number (even if that number is low) within 30 days of access being granted.

### 2. Fix the ADU page's image/caption mismatch and complete its feasibility content

- **Why**: this is the one service line with sourced, dated local demand evidence (2,084 statewide ADU approvals since 2025, active regulation attention) and a concrete, already-identified defect (alt text describing an ADU while showing a Belmont house) that actively undermines the page's credibility to a reader who notices.
- **Evidence**: `04-local-opportunities.md` LOCAL-01/LOCAL-02; `07-website-and-profile.md` P1 row on the ADU page mismatch.
- **Benefit**: removes a credibility defect and adds the already-scoped checklist content (state definitions vs. local implementation vs. wastewater/conservation vs. economics, each dated) without creating a new page or making a new unverified claim.
- **Effort and cost**: small — one image/caption correction, one content addition to an existing page; no new page template, no paid spend.
- **Required access**: none beyond normal repository write access already in use.
- **Approvals needed**: content/implementation review before deployment, per the existing `G04`-style pattern of "implemented and tested, then separately reviewed before deployment" — **no public deployment without separate approval**, consistent with this round's explicit denial of new production deployments.
- **Deliverable**: dated ADU feasibility checklist section citing the official state sources already gathered, held locally pending deployment approval. **Status as of 2026-10-12: done and locally verified** — the image/alt-text mismatch itself turned out to already be fixed in current source (see sprint update above), so the remaining work was the feasibility checklist, which is now written into `src/adu-builder-cape-cod/index.njk`, builds cleanly (`npm run build`), passes the existing test suite (`npm test`, 73/73), and renders correctly in the local preview server. **Not yet deployed to production.**
- **Success criterion**: the page's image matches its own alt text and caption (already true); the feasibility checklist cites only official, dated sources with no promised approval or ROI claim, matching `04-local-opportunities.md`'s own guardrail (met — sources are `mass.gov` and `falmouthma.gov`, with explicit no-promise disclaimers).

### 3. Resolve the Falmouth residential exterior case study's attribution and publish it if confirmed

- **Why**: it is the only one of seven gallery projects physically inside the declared core market, and the business has zero published case studies with verified role/process despite this being the top P1 content-priority item in `07-website-and-profile.md` for three consecutive research passes.
- **Evidence**: section B above; `07-website-and-profile.md` content-priority #1 ("One Falmouth/Upper Cape renovation or addition case study with verified role and process").
- **Benefit**: gives the highest-priority existing service pages (`general-contractor-falmouth-ma`, and potentially `home-additions-cape-cod`) something `07-website-and-profile.md` already recommends — a real case-study link with actual proof — instead of generic service description and reused imagery.
- **Effort and cost**: owner time to confirm role/permission (likely under an hour); writing time to draft the "Company project proof record" and a public-facing summary once confirmed; no paid spend.
- **Required access**: owner confirmation of contractual role, scope, photo permission, and any client quote permission for this specific project.
- **Approvals needed**: owner sign-off on the completed proof record before any public page is drafted, and a separate approval before that page is deployed publicly.
- **Deliverable**: a completed "Company project proof record" for the Falmouth project; if approved, a drafted (not yet deployed) case-study page or section linked from the relevant service pages.
- **Success criterion**: either (a) a confirmed, owner-approved case study ready for a future deployment decision, or (b) an explicit owner determination that this project cannot be attributed to the LLC — either outcome resolves the open conflict in `11-decisions-and-questions.md` rather than leaving it open indefinitely.

---

## What was and was not done to produce this document

**Original research pass (2026-10-12, planning only):** read existing research files cited above; read `src/gallery.njk` in full (all seven projects); confirmed service-page file sizes via the filesystem; cross-checked `business.json` and `01-company-review.md` for consistency. No GBP/GSC/GA4 account access attempted or granted; no outreach to any partner, architect, or association; no new page created or deployed; no image or content change made to the ADU page; no case-study page drafted.

**Execution sprint (2026-10-12, same day, follow-on):** added the ADU feasibility checklist to `src/adu-builder-cape-cod/index.njk` (local source only, verified via preview server, `npm run build`, and `npm test`); re-investigated and closed the mobile horizontal-overflow item in `phase1-status.md` as not a real defect (no CSS changed); pulled a real D1 measurement baseline via the private CLI; created the Falmouth case-study owner-verification worksheet (`15-falmouth-case-study-worksheet.md`, blank, pending owner input); added the ranked-channels section (F) above. Still not done: no GBP/GSC/GA4 account access (owner action, not yet taken); no outreach to any partner, architect, realtor, or association; no production deployment of the ADU content change; no case-study page drafted or published (worksheet must come back from the owner first); no merge or push to `main`.
