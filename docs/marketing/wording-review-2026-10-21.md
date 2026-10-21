# Website wording review, October 21, 2026

Scope: all nine public pages (home, About, Construction Management, ADU, Home Additions, Home Renovation, Custom Home Builder, General Contractor in Falmouth, Gallery). Source of the review: the owner's request plus the customer acquisition research of October 21. Wording only. No layout, form, script or data changes.

## Rules used
- Plain, short sentences. No dashes in the copy. Nothing new that is not already a confirmed fact on the site.
- Credentials are written without naming the owner, and the key credentials are bold.
- Headings and buttons use sentence case on every page. Page titles (H1) keep their capitals.
- The "affordable and competitive" message stays in the hero and the closing call to action of each page, but is no longer repeated in the middle of the page.
- The contact form, its labels and its scripts were not touched.

## What changed
| Where | Before | After | Why |
|---|---|---|---|
| Home, credentials line | "over 30 years" in plain text | **licensed Massachusetts builder** and **over 30 years** both bold | Credentials are the main trust signal |
| About, credentials list | plain text | **30 years**, **Construction Supervisor License (CSL)** and **Bachelor's degree, Boston University** bold | Same |
| About, intro | "worked on both sides of the table: building the work, and representing owners" | "has both built the work and represented owners" | Simpler |
| Home, "We build it" card | "all coordinated under one roof" | "coordinated by one team" | Removes a cliche |
| Home, General contracting card | ended with "at an affordable, competitive price" | price phrase removed (it is in the hero and the next section) | Repeated 3 times in one screen |
| Home, advisory card | "advisory: independent oversight" (two colons in a row nearby) | "advisory, as independent oversight" | Easier to read |
| Home, services heading | "Residential construction services." under a label that said the same | "Find the right starting point." and "Choose a service to learn more." | No repeated words |
| Home, contact box | "Request a Free Estimate" | "Discuss your project" | Matches the hero button and suits larger jobs |
| Service pages, three check marks | the same three lines on five pages | One line specific to each page, plus "Trades and inspections coordinated" and "Decisions documented" | Pages no longer read as copies of each other |
| Service pages, headings | Title Case mixed with sentence case | Sentence case, for example "Types of ADUs we build", "Questions about home additions" | Consistent |
| Additions, renovation, ADU, GC, custom pages, project sections | "Custom Home Projects", "Custom Construction Projects", "Recent General Contracting Projects" | "Recent projects" | The photos shown were not always custom homes |
| Service pages, buttons | "View Full Project Gallery", "Contact Us Today" | "View all projects", "Contact us today" | Matches the home page |
| ADU, detached ADUs | "fully private" | "private" | Avoids an absolute claim |
| General Contractor FAQ | extra sentence repeating the pricing message | removed | Repetition |
| Construction Management | curly and straight apostrophes mixed, "&" in a heading | straight apostrophes, "and" | Consistent |
| Custom Home and Renovation H1 | trailing space | trimmed | Tidy |

## Deliberately not changed (needs the owner)
- **Owner's name.** The research draft names the owner in the home page copy. The site does not name any individual, by the owner's earlier decision, so that was not used. Credentials are shown without a name.
- **Brand line "Experience, Quality, Trust".** The research calls it generic. It is the brand tagline and appears in the footer and structured data, so it stays unless the owner chooses a new one. A concrete alternative if wanted: "Licensed. Experienced. Hands on."
- **Place in titles and headings** (for example "Residential Construction on Cape Cod"). This needs the towns the company actually serves to be confirmed. The towns listed on the home page and in the About page are not all the same, which is an open question for the owner.
- **Dedicated advisory messaging for architects, realtors and owners with complex projects.** Worth doing after the service area is confirmed.
- **Concept visualization section.** The research suggests clearly labeled concept designs. That needs real content and a decision; nothing was invented.
- **Reviews.** The research found Google reviews that may come from people close to the business. That is a private matter for the owner and Google, not website copy. No review text was added to the site.
- **"Free estimate".** Removed from the home contact box heading. If the company does offer free estimates on small jobs, say so on the contact form text only.

## Facts that still need the owner
1. Towns served, in one list used everywhere.
2. Official HIC and CSL registration numbers for the footer (the footer shows them only when supplied).
3. Whether the tagline stays.

## Second pass (after the independent review)
- **Check marks are now fully page specific.** All three lines on each of the five service pages are different, and each is taken from that page's own text (for example "Rooflines, siding and windows tied in" on Additions). A test fails if any line repeats on another page.
- **Gallery closing call to action** now uses sentence case ("Discuss your project", "Contact us today") like the other pages.
- **About heading** is now "Over 30 years of residential and commercial construction experience." The line below it says the project is led by a licensed Massachusetts builder, so the years are attributed to the person leading the work, not to the age of the company.
- **Pricing wording** is kept in each hero and closing call to action only. Whether to keep it even there is a positioning decision for the owner: it can make a company sound price driven rather than experience driven.

## Credential claims: evidence and what the owner must confirm
| Claim on the site | Where | Evidence found in the repository | Status |
|---|---|---|---|
| Licensed Massachusetts builder | Home, About | A Construction Supervisor License (CSL) is stated in `src/_data/people.json`. A CSL is a supervisor license, not a Home Improvement Contractor (HIC) registration. | Owner stated. Not checked against ContractorHub. Wording may need review. |
| CSL held since 2000 | About | `people.json`, supplied by the owner. License number is blank in `business.json` (`null`), by design. | Owner stated. Number and expiry not verified. |
| Over 30 years of experience | Home, About | `people.json` calls it a personal career figure. `docs/social-logo/` guidance says it is not the company's history. | Owner stated. Presented as the leader's experience, not the company's age. |
| Bachelor's degree, Boston University; postgraduate studies, Boston Architectural Center | About | `people.json`. The school has been named Boston Architectural College since 2006. | Owner stated. Name choice is the owner's. |
| HIC and CSL numbers | Footer | Both are `null`, so nothing is shown | Owner must supply from ContractorHub.mass.gov. Never guessed. |

Nothing here was verified against public records by Claude. The bold formatting only emphasizes claims that were already on the site. If the owner prefers not to emphasize a claim until it is checked, removing the bold is a one line change per claim.
