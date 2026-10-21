# Weekly growth scorecard

Baseline status: October 11, 2026; current business metrics **unknown**. Sept 8's zero D1 leads belongs only to that historical baseline. No current account data was imported.

## 2026-10-12 update: pipeline now verified, business metrics still unknown

The intake pipeline passed production verification on 2026-10-12 (`docs/phase1-status.md`): D1 is confirmed reachable and queryable, the private CLI works, and notifications reach Gmail. This is an **infrastructure fact, not a business metric.** D1 currently holds 2 leads total: 1 pre-existing historical lead (received 2026-09-29, before this reporting period) and 1 explicitly-flagged verification test inquiry, which the scorecard's own definition of "web inquiries" excludes ("exclude known tests/spam"). **Current real qualified-inquiry count for this reporting period remains 0** — not because the form is broken, but because no actual customer has submitted one yet since it started working. Do not report "2 leads" as business traction. GBP discovery, GSC organic clicks, and GA4 session data remain unconnected and unknown, same as the baseline.

## Definitions

| Metric | Definition and grain | Current value |
|---|---|---|
| Organic discovery | GSC clicks/impressions for specified property, search type and date | Unknown |
| GBP discovery/actions | Profile impressions and each action metric, separately | Unknown |
| Web inquiries | Unique legitimate accepted/stored web inquiries; exclude known tests/spam with documented rules; notification delivery reported separately | Unknown |
| All inquiries | Deduplicated web, phone, email, partner and direct inquiries | Unknown |
| Qualified leads | Owner-approved service/geography/budget/timing fit; definition frozen per report | Unknown |
| First response time | First human response timestamp minus received timestamp; median, p90 and overdue count | Unknown |
| Consultations / proposals | Counts reaching stage; preserve stage dates and report cohort | Unknown |
| Signed wins | Signed contracts in period, with original inquiry cohort; repeat jobs count as contracts | Unknown |
| New customers | Unique first-time contracted customers, deduplicated privately; distinct from signed-job count | Unknown |
| Notification exceptions | Stored inquiries with unsuccessful email notification; human follow-up checked separately | Unknown |
| Win rate | Wins ÷ decided opportunities (wins + losses), with pending separately; cohort version also reported | Unknown |
| Qualified-lead close rate | Eventual wins ÷ qualified leads from mature inquiry cohort | Unknown |
| Acquisition cost | Attributed acquisition spend ÷ new wins; distinguish media-only from fully loaded | Unknown |
| Booked value | Signed scope value; separate changes and cancellations | Unknown |
| Contribution | Revenue basis defined by owner minus consistently defined direct/variable job costs | Unknown |
| Cash collected | Accounting-reconciled receipts, not quote/contract value | Unknown |
| Backlog/capacity | Committed work and available starts/supervision by period | Unknown |
| Delivery quality | Schedule exceptions, rework, open punch items and client feedback | Unknown |

## Weekly reporting rules

Use equal reporting windows and explicit time zones. GSC uses Pacific dates; other systems may differ. Compare previous period and year-ago only when available and comparable. Include absolute numerators and denominators; zero denominators yield “not calculable.” Low samples require cautious interpretation. Pipeline stage counts from different cohorts cannot be multiplied into a reliable funnel.

Track branded/non-branded query classifications as a maintained rule, with ambiguous queries flagged. Do not sum suppressed query counts to claim complete traffic. Keep GBP call clicks, website phone clicks, answered calls, qualified leads and contracts separate. D1 counts can exceed consented analytics events without a broken form. Booked value is not earned revenue, profit or collected cash.

## First report template

- Period and comparison period:
- Data sources / last successful refresh / missing periods:
- Counts: inquiries → qualified → consultations → proposals → signed wins (cohort labels):
- Unassigned/overdue inquiries and notification failures:
- Source quality, response time and loss reasons:
- Capacity and job economics:
- Experiment observations and limitations:
- One supported bottleneck:
- Up to three owner decisions:
- Next actions, owners, dates:

## Initial experiments register

| ID | Hypothesis | Baseline | Primary outcome | Guardrail | Status |
|---|---|---|---|---|---|
| E01 | Relevant case studies improve inquiry quality | Missing | Qualified inquiries by landing journey | No false scope/role claims | Proposed |
| E02 | Assigned prompt follow-up improves progression | Missing | Consultations and mature-cohort wins | Owner workload and no unwanted messages | Proposed |
| E03 | Feasibility framing attracts better ADU prospects | Missing | Qualified ADU consultations | Estimating time, capacity, no approval promises | Proposed |

Do not announce percentage improvement until a baseline, comparable period and traceable observation exist.
