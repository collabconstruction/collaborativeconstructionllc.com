# Company review: what we know and how to grow

Author: Codex. Reviewed October 11, 2026. This is the completed company review for this research run; [Claude's independent review remains pending](02-claude-company-review.md).

## Executive assessment

Collaborative Construction has usable raw material for a credible local brand: a named owner, substantial stated experience, real-looking project photography, residential and commercial experience, and an existing inquiry system. The current evidence does **not** establish how many prospects see the company, how many calls arrive, how many estimates become contracts, or which job types make money. Those gaps prevent an honest diagnosis that demand is absent, marketing is failing, or the website is the main constraint.

The first growth system should join five things: a focused service offer, verifiable local proof, discovery through search and relationships, reliable human follow-up, and job economics. More content or more agents cannot substitute for those inputs. A defensible initial hypothesis is to prioritize Falmouth/Upper Cape renovations and additions, with ADU feasibility as a separate offer and owner representation as a separate buyer journey. This remains provisional until the owner confirms geography, capacity and profitable work.

## Company fact inventory

| Topic | Evidence observed | Confidence / unresolved item |
|---|---|---|
| Business identity | `src/_data/business.json`: Collaborative Construction, LLC; domain collaborativeconstructionllc.com | Repository/public branding; exact registered legal name remains null |
| Leadership | `src/_data/people.json` and `src/about.njk`: Wesleigh Behn, owner/founder | Company claim, not an independently checked employment record |
| Experience | Biography claims 30+ years, CSL active since 2000, BU degree and postgraduate Boston Architectural Center studies | Do not convert personal experience into company age; credential numbers not supplied |
| Location | East Falmouth; public site and data contain a residential street address | Storefront/service-area eligibility needs confirmation, not merely owner willingness to publish |
| Contact | Public telephone (508) 440-6981 and business Gmail inbox | Account ownership, inbox coverage and call answering process not tested |
| Geography | Cape Cod, Islands and South Shore in prose; `areaServed` array omits Islands | Current operating radius and travel economics unknown |
| Offers | General contracting, renovations, additions, custom homes, ADUs; OPM, Clerk of the Works and advisory | Need target project size and services the business is actually staffed to deliver |
| Portfolio | Seven visible projects: Belmont, Dudley, Falmouth, Newton, Carlisle, Rockland, Hingham | Four are outside the declared Cape/South Shore focus; employer/LLC roles and photo permissions unverified |
| Formal credentials | `cslNumber`, `hicNumber`, `insurance`, `founded`, `legalName` are null | Absence of data does not mean no license/insurance; collect records before stronger claims |
| Team and capacity | Public copy says family owned/run | Employee/subcontractor mix, available crews, workload and estimating time unknown |
| Pricing and profit | No supplied business records | No defensible revenue, margin, average contract value or acquisition budget |
| Existing demand | Sept 8 baseline records zero leads in a newly created database | Historical database count is not current demand or pre-fix lead history |

The visible gallery contains a custom residence, dispensary, residential exterior, bath suite, modern residence, dormitory and self-storage facility. Residential buyers may value this breadth, but unexplained commercial projects can dilute a homeowner's sense that the company routinely does their kind of work. Add accurate scope and role, not stronger unsupported claims.

## What the project already provides

The site uses Eleventy templates and shared business data, then Cloudflare Worker delivery. `lib/schema.js` generates structured data from shared records. Service pages now exist for Falmouth contracting, Cape Cod additions, ADUs, renovations and custom homes. A generated sitemap reduces accidental omission of new pages. These are useful foundations and should be improved incrementally.

`worker/index.js` validates contact submissions, can save them in D1, stores optional attachments in R2, and attempts email notification. `schema.sql` has lead status and attribution fields. `js/main.js` waits for a successful application response before triggering its lead event. These are valuable improvements over the historical form described in the baseline.

`src/_data/analytics.json` contains GA4 measurement ID G-13DBV8V3BE and a note that Cloudflare analytics was enabled through edge injection. The live homepage snapshot contains GA4 configuration. These observations establish implementation evidence; they do not establish healthy reporting, account permissions, consent correctness, or complete conversion counts.

## Corrections to stale assumptions

- `docs/BASELINE.md` describes Sept 8, not October performance. Its 71 mobile performance score and 11.9-second LCP are historical. No fresh Lighthouse test was run in this research task.
- The baseline says no analytics is installed; current code includes GA4. Preserve the historical baseline and annotate future reports with the newer observation.
- The live robots response collected October 11 allows crawling except `/api/`. It does not contain the AI crawler exclusions described in the older baseline. A response to one user agent does not prove all edge behaviors.
- Blocking a model-training crawler is not the same as preventing every search or AI citation. An `llms.txt` file and schema are neither proof of visibility nor a ranking guarantee.
- Service pages are present locally, and two were fetched successfully from production. Untracked local files do not automatically imply unpublished pages.
- Describing an address as public and consented to does not establish Google's storefront eligibility. Resolve the underlying business facts first.

## The likely business bottlenecks to test

**Discovery:** Is the company receiving non-branded impressions for its target services and towns? Search Console can help distinguish low visibility from weak click-through. GBP data adds Maps/Profile discovery; it is not interchangeable with website search impressions.

**Trust:** Can a prospect verify who will manage the job, what comparable projects were completed, how decisions and changes are handled, and what previous clients experienced? Seven photo galleries without scope, role or process provide less decision support than two well-evidenced case studies.

**Qualification:** Does the inquiry describe location, scope, timing and rough budget fit? Today the principal form is simple and lacks structured qualification. Add optional fields or collect them during the first call; avoid a burdensome form before measuring abandonment.

**Sales execution:** Who owns every inquiry, including calls and referrals? A stored lead can be missed if its notification fails. A click-to-call event does not prove an answered call, and an estimate sent is not revenue. A named owner and next-action date are the minimum operating system.

**Delivery economics:** Could the company actually deliver additional contracts at acceptable contribution and cash timing? Unknown backlog, travel, supervision load and subcontractor availability mean unlimited lead volume is not yet a sensible goal.

## Small versus larger construction companies

This is an operating model comparison, not a verified census of the named competitors. Headcount alone does not determine service quality or profit.

| Function | Typical owner-dependent constraint | Repeatable system to introduce now |
|---|---|---|
| Sales | Owner answers between site visits; follow-up lives in memory | Shared inquiry queue, named responder, response target, scheduled follow-up |
| Estimating | Every quote starts from scratch; scope gaps and unpaid revisions | Scope templates, assumptions/exclusions, dated subcontractor quotes, estimate-to-actual review |
| Production | Owner coordinates every trade and interruption | Weekly look-ahead, responsibility list, procurement dates, issue/RFI log |
| Financial control | Bank balance substitutes for job profitability | Job cost categories, committed costs, changes, receivables and cash forecast |
| Trust | Reputation concentrated in one person's network | Permissioned case studies, genuine reviews, consistent process and visible team roles |
| Marketing | Irregular posts when work slows | Evidence collection at milestones; monthly review of sources that yield qualified work |
| Quality | Problems resolved informally | Inspection/punch-list evidence, client decisions, documented closeout and warranty handoff |
| Delegation | Assistants must ask the owner everything | Approved fact base and narrow role access to the needed records |

The advantage of a small firm can be direct owner access, faster communication and a tighter project focus. Those become brand attributes only when the experience is dependable and demonstrable. Avoid pretending to have a large staff; show how a smaller team manages risk and communicates clearly.

## Proposed positioning and offers

Working positioning hypothesis: **Owner-led residential construction with a clear plan, documented decisions, and direct accountability.** It uses the company name's collaborative theme but gives the buyer tangible evidence to request. Confirm that the operating process supports it before publication.

Use three separate conversion paths:

1. **Renovation/addition:** project scope conversation → fit check → site visit when warranted → documented proposal. Proof should feature relevant home transformations and how the owner dealt with constraints.
2. **ADU:** property and goals intake → feasibility discussion with identified zoning/septic/design questions → defined preconstruction scope. Do not promise approval, rental returns or a universal build price.
3. **Owner representation:** discuss the owner's project stage, design team and oversight need → define reporting cadence, scope and potential conflicts. Keep independent advisory positioning clear when the same company could also act as builder.

A paid preconstruction service may reduce speculative estimating and improve planning, but it is an option for owner approval. It is not a recommendation to silently replace the current free-estimate promise.

## Growth beyond the website

A credible referral system can be built with local architects, designers, realtors, property managers and appropriate trades. Start with partners whose clients fit the desired scopes, geography and standards. Record relationship owner, relevant work, referrals and closed outcomes. Draft useful introductions and a one-page capabilities sheet, then have the business choose whom to contact.

Turn completed projects into reusable proof: accurate role, challenge, scope, approved photography, a client quote with permission, and a concrete explanation of the process. Use that same verified story on the relevant service page, in a profile update and in a partner conversation. Avoid multiplying unverified claims across channels.

Track current local permitting, housing and infrastructure developments as reasons to explain a service, not as automatic leads. A policy change may enable discussion but does not mean a particular homeowner is eligible, funded or looking to hire.

Use job controls to make growth sustainable: weekly pending decisions, change-order status, next trade commitments, long-lead materials, estimated versus actual labor/cost and aged invoices. Agents can summarize exceptions and prepare drafts; the project lead confirms site reality and commitments.

## What must be learned before claiming results

Current inquiries by source; answered/missed calls; qualified leads; site visits; proposals; wins and losses; job contribution and capacity; client reviews; actual account access; and the authentic role on each portfolio project. None was available as a current business dataset in this run.

Start with a four-week operating baseline and retrospective review of available historical jobs. Set growth targets against measured capacity and conversion, then run two controlled improvements at a time. See [growth plan](08-growth-plan.md) for the concrete queue.
