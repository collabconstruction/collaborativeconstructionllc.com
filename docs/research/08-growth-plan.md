# 90-day growth plan and work queue

Created October 11, 2026. Days are relative to the owner's kickoff, not promises of completed work. Initial assumption: prioritize Falmouth/Upper Cape and profitable residential work; confirm before campaign production. Owner, marketing and operations roles below are proposed responsibilities, not confirmed hires.

## Days 1–14: establish facts, response and measurement

| ID | Priority / owner | Task | Dependency and definition of done |
|---|---|---|---|
| G01 | P0 / owner | Confirm preferred jobs, towns, budget bands, available starts and supervision capacity | Written decisions in company facts; no guessed financial targets |
| G02 | P0 / owner + analyst | Inventory GBP, GSC, GA4, Cloudflare and lead access | Exact account/property identifiers privately recorded; first dated exports or documented blocker |
| G03 | P0 / operations | Establish a complete inquiry queue including calls and referrals | Every new inquiry has owner, stage, next action and received/response time; failed email visible |
| G04 | P1 / web agent | Fix attribution through redirects and internal contact navigation | Tests cover UTM redirects/navigation; privacy behavior reviewed; implementation separately reviewed before deployment |
| G05 | P1 / owner + researcher | Verify credentials, business address eligibility and portfolio roles | Evidence recorded; approved publishable wording distinct from private records |
| G06 | P1 / analyst | First weekly scorecard | Report distinguishes unavailable, zero, partial, and observed results; reconcile D1 and notifications |

### Status update — 2026-10-12

- **G03 (inquiry queue): COMPLETE and production-verified.** A real inquiry now flows through: stored once in D1, assigned to Wesleigh Behn, retrievable via the private CLI, notification confirmed delivered to Gmail. See `docs/phase1-status.md`.
- **G04 (attribution through redirects/navigation): technically implemented and tested.** `worker/index.js` preserves `url.search` through both the `.html`→clean and `www`→non-www redirect branches; `js/intake-context.js` carries UTM/referrer/source-page across internal navigation, with its own test coverage. Not yet confirmed against real campaign traffic, since there is none yet — mark fully done once a tagged visit is observed converting.
- **G02 (access inventory): partial.** Cloudflare account and D1 access are confirmed working (verified directly via `wrangler` during Phase 1 closeout). GBP, GSC, and GA4 account-level reporting access are still not connected — this remains an owner-granted-access blocker, not a technical one. See `docs/research/06-data-access.md`.
- G01, G05, G06 are unchanged: still waiting on owner decisions and real account access, not on further engineering.

## Days 15–30: improve a complete customer journey

| ID | Priority / owner | Task | Definition of done |
|---|---|---|---|
| G07 | P1 / owner + content | Two approved residential case studies | Actual scope/role, local relevance, photo release, specific process proof; owner approves facts |
| G08 | P1 / web + content | Improve the highest-priority service page and contact journey | Clear scope, process, relevant proof and next step; mobile review and functional checks |
| G09 | P1 / profile owner | Complete GBP audit and proposed edits | Before/after evidence, eligible address/categories, correct contact/hours; edits executed only under explicit account authorization |
| G10 | P1 / sales | Standard intake and follow-up process | Pilot response target agreed by owner; follow-ups appear in private queue; no automatic messages without authorization |
| G11 | P2 / researcher | Ten suitable local partner cards and capabilities sheet draft | Why each partner fits, source, owner of relationship, next proposed action; no unsolicited sending |
| G12 | P2 / estimator | Review available completed jobs and estimate variance | Redacted service-level margin/capacity lessons; no fabricated average project value |

## Days 31–60: run bounded growth experiments

| ID | Owner | Experiment | Review condition |
|---|---|---|---|
| E01 | Content + analyst | Local case-study proof on one service page | Compare 28-day windows, relevant traffic and qualified inquiries; account for low sample and seasonality |
| E02 | Sales + owner | Defined response ownership and follow-up | Compare response distribution and stage progression; aim for zero unassigned overdue inquiries |
| E03 | Owner + researcher | ADU feasibility offer with current official references | Qualified consultations versus poor-fit demand, estimating time and capacity consumed |
| E04 | Owner | Approved partner outreach pilot | Track actual conversations/referrals by partner; stop repeated outreach when declined |
| E05 | Operations | Milestone photo/decision capture on one active job | Usable proof collected without disrupting delivery or disclosing client details |

Run two experiments at a time. Select the first pair based on measured bottlenecks, not every agent's favorite tactic. Use weekly observations to decide whether to continue, adjust or stop. A 28-day window is a reporting convention, not proof of statistical significance.

## Days 61–90: scale what earns suitable work

Increase investment only in sources producing qualified prospects and acceptable closed-job economics. Document which offers attract the wrong work. Add project management or estimating capacity before marketing creates unserviceable demand. Automate stable data collection after successful manual reconciliations, then let agents generate exception reports and draft recommendations.

At day 90, review booked jobs, expected and realized contribution, cash collection, owner estimating hours, response time, client satisfaction and backlog. If traffic rose but qualification fell, revise targeting. If quotes rose but wins did not, examine fit, scope, timing and loss reasons. If jobs increased but margin or delivery slipped, prioritize operations over more acquisition.

## Capacity and acquisition math

Planning relationships, not forecasts:

- Required qualified leads = desired wins ÷ observed qualified-lead-to-win rate.
- Required total inquiries = required qualified leads ÷ observed qualification rate.
- Proposed acquisition ceiling per qualified lead = owner-approved acquisition allowance per won job × observed win rate.
- Available starts must respect supervision, crew/trade availability, procurement and cash constraints, not just calendar space.

Illustration only: four desired wins at a 25% qualified-lead close rate require sixteen qualified leads. This is not this company's historical rate or target. Do not use a high contract price as if it were profit.

## Hold until justified

Mass town-page production; broad paid campaigns; a new CRM purchase before understanding current workflow; automated estimating without verified quantities/rates; dozens of concurrent agents; and bulk scraping of homeowner contact details. These are poor initial uses of effort for the currently evidenced bottlenecks.
