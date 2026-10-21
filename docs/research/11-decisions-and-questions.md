# Decisions, assumptions and owner questions

Updated October 11, 2026; retirements noted October 12, 2026. Pending questions do not invalidate the completed research; they constrain implementation and targets.

## Retired as of 2026-10-12

- **Inquiry queue existing/working** (was implicit in question 4 below): resolved. Phase 1 production verification confirmed the queue works end-to-end, including Gmail delivery. See `docs/phase1-status.md`. The remaining open part of question 4 is narrowed below — it was never about whether the system works, but about response-time commitment.
- **Cloudflare/D1 access** (part of question 3): resolved. Confirmed working directly via `wrangler` during Phase 1 closeout. GBP/GSC/GA4 access remains open — question 3 is narrowed below.

## Decisions made for this research

| ID | Decision | Basis / status |
|---|---|---|
| D01 | Optimize qualified profitable customers and delivery capacity | Interprets customer-growth goal in a sustainable operating context; owner may refine targets |
| D02 | Use Falmouth/Upper Cape as initial research center | Current East Falmouth identity; actual service priorities remain unconfirmed |
| D03 | Retain historical baseline and explicitly flag newer evidence | Current source/live observations differ from Sept 8 notes |
| D04 | Create original narrow skills, retain upstream tools as references | Repository licensing, write operations and takeoff assumptions need review before adoption |
| D05 | Begin with exports/read-only reporting | No authenticated business reports supplied; GBP scope requires additional adapter controls |
| D06 | Preserve existing website changes; deliver an implementation backlog | Research task produced documentation and skills, not a site redesign/deployment |
| D07 | Label Claude review pending | Actual Claude invocation returned a weekly usage limit; no review was produced |

## Owner decisions needed first

1. Which services should fill the next six months, what project size fits, and which towns are profitable to serve?
2. How many projects can start, and who has available estimating/project-management capacity?
3. Who can access GBP, GSC, and GA4 reporting, current customer tracking and job-cost records? (Cloudflare/D1 access is resolved — see "Retired" above.)
4. The technical default responder is "Wesleigh Behn" on every new lead. Is that the actual intended owner, and what response-time commitment, if any, should the business state publicly or operate to internally?
5. What is the exact role of this LLC and of Wesleigh personally on each of the seven portfolio projects? Are photographs and client quotes approved for publication?
6. What are the registered name, current CSL/HIC details and insurance facts that may be published?
7. Is the public address an eligible customer-facing business location or a service-area business operating from home? What are the actual hours?
8. Are the Islands and South Shore strategic priorities, and how are travel, trade coverage and supervision handled?
9. Does the owner want free introductory estimates, paid preconstruction planning, or distinct options? No pricing-policy change has been made.
10. What marketing spend and software budget, if any, is approved after baseline economics are known?

## Unresolved evidence conflicts

| Conflict | Resolution needed |
|---|---|
| Historical “no analytics” vs current GA4 configuration | Verify actual received reports; preserve dated historical record |
| Historical crawler blocking vs current permissive robots response | Recheck relevant edge/user-agent behavior if visibility is investigated |
| Islands in prose but not structured service area | Owner confirms actual coverage, then update related facts together |
| “Fully licensed” and active CSL claim vs missing identifiers | Obtain records; don't infer credentials absent or valid from a null field |
| Portfolio LLC ownership versus owner's prior employment experience | Assign accurate roles and credits before case-study publication |
| Personal-address publication consent vs GBP eligibility | Verify storefront facts against current Google rules |

## Future decision record

Date; decision ID; question; evidence/source dates; options; selected option; owner; rationale; affected facts/files; implementation status; measurable review date; supersedes ID if applicable. Do not erase prior decisions; mark superseded and explain why.
