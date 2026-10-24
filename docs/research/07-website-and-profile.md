# Website, Google profile and marketing audit

Reviewed October 11, 2026. Evidence: working-tree source and public GET receipts in [evidence](evidence/live-site-receipt.json). No production form submissions, profile changes, Lighthouse run or authenticated analytics inspection occurred.

## Prioritized findings

| Priority | Finding and evidence | Improvement / acceptance check |
|---|---|---|
| P0 | Current lead counts and inbox delivery are unverified. Worker returns success after storage and sends email asynchronously (`worker/index.js`). | Confirm a permitted end-to-end test reaches storage and human inbox; make failed delivery visible and establish a daily queue owner. Distinguish stored, notified, contacted and booked. |
| P1 | Both `.html` and `www` redirect branches drop `url.search` in `worker/index.js`. | Preserve query parameters in redirect targets; test UTM-bearing URLs including combined redirects. This is a source finding, not an executed production failure test. |
| P1 | Attribution is collected from the submission page's query string (`js/main.js`, `attribution()`), while service-page CTAs link to `/#contact`. | Define first/last-touch semantics and retain approved attribution across internal navigation; verify a tagged service-page visit followed by contact. Avoid putting customer data in URLs. |
| P1 | `generate_lead` calls `gtag` directly, unlike the consent-aware helper in `js/analytics.js`. | Test accept, decline and unset consent paths. Align implementation with stated privacy behavior and measure network requests, not merely cookies. |
| P1 | Credentials are claimed publicly but numbers/insurance remain null in business data. | Owner provides current records and exact publishable wording; independently verify appropriate registry entries before expanding claims. |
| P1 | Gallery shows seven projects with little scope/role evidence; four are outside current Cape/South Shore focus. | Produce two approved case studies with actual company/person role, location, scope, constraints and permitted photographs. Distinguish past career work from LLC projects. |
| P1 | ADU page share-image alt text describes a Cape Cod ADU while default image is a Belmont house. | Match caption/alt/share text to the actual image; don't imply it depicts an ADU project without evidence. |
| P1 | Public home address and owner consent are recorded, but storefront eligibility is unverified. | Establish whether clients are received at a staffed, signed business location; choose correct profile representation and consistent site disclosure. |
| P2 | Lead form offers no structured town, project type, timing or budget fields; no named response promise is evidenced. | Test a short optional qualification set or collect on first call. State a response expectation only if staffing supports it. |
| P2 | Service pages exist but depend heavily on generic service descriptions and reused project imagery. | Add service-specific proof, actual process, common constraints and related case-study links. Prioritize quality over producing every town/service combination. |
| P2 | `areaServedDisplay` includes Islands but `areaServed` does not; historical projects span other regions. | Resolve actual service geography and revise relevant visible copy/shared data together in a separate implementation task. |
| P2 | No current performance measurement was captured. | Run mobile performance/accessibility checks on priority pages, review image sizes and font loading; compare with dated baseline, not assumed improvement. |

Denied consent can still permit cookieless pings under advanced Consent Mode. Loading the tag is not equivalent to sending no data. The audit recommends checking the intended behavior, without declaring current legal compliance or a proven leak. [Google consent documentation](https://developers.google.com/tag-platform/security/concepts/consent-mode).

## Google Business Profile audit to perform with owner access

Capture the canonical listing URL/location ID, verified status, primary and additional categories, actual service area, hours, business description, services, website URL, photographs and review history. These were not available as authenticated records in this run; no review count or Maps position is asserted.

Google describes local visibility through relevance, distance and prominence. Accurate information, suitable categories and legitimate evidence are useful; a wider service-area selection does not make the business physically closer to everyone. [Local ranking guidance](https://support.google.com/business/answer/7091).

For a business that travels to customers without an eligible storefront, Google says to hide the address. Confirm the operating facts before making changes. Don't append service keywords to the real business name, create fictitious offices or duplicate town listings. [Representation guidelines](https://support.google.com/business/answer/3038177).

Proposed improvements after verification: consistent services and contact information; recent authentic project photos with permission; clear descriptions of the work actually offered; a tagged website link whose campaign tags survive navigation; and a routine for responding to reviews. Ask eligible clients consistently for honest feedback. Do not invent, incentivize or selectively solicit only positive reviews. Google’s [fake-engagement policy](https://support.google.com/contributionpolicy/answer/7400114) should be checked before implementing the review process.

## Content priorities

1. One Falmouth/Upper Cape renovation or addition case study with verified role and process.
2. One homeowner guide to the actual sequence from first call through scope, estimate, contract, changes and closeout.
3. An ADU feasibility checklist explaining what must be checked, with dated official sources, rather than promised approvals or return on investment.
4. A distinct owner-representation page showing deliverables, reporting and responsibility boundaries.
5. Additional town pages only where actual service coverage and distinctive useful evidence justify them.

Google's spam policies identify doorway and scaled-content abuse. The practical response is to give each page a genuine customer purpose, not to mass-produce near-identical local pages. [Official policy](https://developers.google.com/search/docs/essentials/spam-policies).

## Marketing channels and experiments

| Channel | First practical experiment | Success measure |
|---|---|---|
| Existing client referrals | Owner-reviewed closeout and referral request process | Qualified referred inquiries and booked contribution |
| Architect/designer/property-manager relationships | Ten carefully selected partner research cards; draft a capabilities sheet | Accepted conversations, relevant referrals, wins |
| GBP and organic search | Improve one service journey with actual proof | Relevant clicks → qualified inquiries; annotate publication date |
| Project storytelling | One evidence-backed story reused appropriately across approved channels | Attributed inquiries and useful sales conversations |
| Paid search | Consider only after tracking, response and capacity are known; narrow geography/service | Qualified acquisition cost and won-job economics, not cheap form fills |

No advertising budget is recommended as a company-specific fact. Calculate an affordable acquisition ceiling using contribution, close rate and capacity first. Low traffic means sequential experiments may be more informative than underpowered A/B tests. Review raw counts and lead quality alongside rates.
