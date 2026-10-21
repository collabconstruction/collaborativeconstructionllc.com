# Social accounts: status, decisions and rules

Last updated October 21, 2026. Read this before touching Facebook, LinkedIn or Metricool. It was written from a report by the browser agent that worked in the owner's signed-in Chrome, plus checks from the project.

## The official links (use only these)

- Facebook company page: https://www.facebook.com/profile.php?id=61595651094549
- LinkedIn: https://www.linkedin.com/in/collaborative-construction-56761b444/ (leave off `?isSelfProfile=true`)

These live in `src/_data/business.json` (`social.facebook`, `social.linkedin`) and feed the footer and the hidden structured data. `scripts/build-live-overlay.mjs` rewrites any older Facebook link on the live pages to the current one and stops with NOT READY if it is missing.

## Do not link this page

`https://www.facebook.com/profile.php?id=61593017512930` is a SEPARATE older page named "Collaborative Construction LLC | Falmouth MA". Its contact email uses a personal first name, and the public site must not carry that name. For a few hours on October 21, 2026 the live site pointed to it by mistake. The owner should merge or close it so customers do not find two pages. Do not edit it without asking.

## Facebook page (done by the browser agent, October 21, 2026)

Changed:
- Profile picture: navy house logo (`profile-logo-navy.png`).
- Service area: 10 towns. Kept Mashpee and Falmouth; the agent ADDED Barnstable, Sandwich, Bourne, Edgartown, Nantucket, Plymouth, Duxbury, Hingham. Facebook allows only 10 places and would not take "Cape Cod". **Open question for the owner:** Edgartown and Nantucket are not in the community list on the website, and the project rule is never to state a service area the owner has not confirmed. Either confirm them or swap them for towns the website already names (for example Yarmouth, Dennis, Woods Hole).

Already correct, left alone: cover photo, Call now button (508) 440-6981, website, phone, email, address, hours (Mon to Fri 7 to 4, Sat 7 to 12, Sunday closed), reviews on, services list, existing bio.

Not changed and still open: page name and category (still "Collaborative Construction" and "Construction Company"), price range, founding date, credentials, social links (no confirmed facts to use).

Followed as the page (5): Falmouth Chamber of Commerce, Cape Cod Chamber of Commerce, Cape Cod Commission, Home Builders & Remodelers Association of Cape Cod, Mass Save. The Town of Falmouth, MA was skipped because no clearly official page was found (search showed Falmouth, Maine and Falmouth, UK).

## LinkedIn (done by the browser agent)

This is a personal-type profile named "Collaborative Construction", not a Company Page. A Company Page is blocked until a more established personal account administers it.

Set: headline, About (exact approved text), location East Falmouth MA, five skills (Residential Construction, Home Renovation, Home Additions, Accessory Dwelling Units, Construction Management), profile photo, banner, website. Followed (5): Falmouth Chamber of Commerce, Cape Cod Chamber of Commerce, Cape Cod Commission, National Association of Home Builders, Home Builders & Remodelers Association of Cape Cod.

## Metricool

- Account owner: marcusbehn10@gmail.com (a personal Gmail). One brand, "Collaborative Construction", id 7490851, created October 17, 2026.
- Facebook is connected as page id 1409900735535950 and LinkedIn as a personal profile. **Not yet confirmed:** that the connected Facebook page is the official page above (61595651094549) and not the older one. Check the page name on Metricool's connections screen.
- One text post was scheduled for October 20, 2026, 9:38 PM Eastern (post id 401667125). Confirm which page it landed on.
- Claude can schedule posts and read analytics through the connector. It cannot edit page details or pictures.

## Rules for any agent working on these accounts

- Never ask the owner for passwords or login codes. The owner signs in; the agent acts in the signed-in browser and stops at any login, code, CAPTCHA or warning.
- Use only facts from `src/_data/business.json` and the live website. No years of experience (the 30 years is a personal career figure), no licences, awards or project claims, and no project photos (roles on projects are not confirmed).
- Go slowly. New pages that behave like bots get restricted. Follow at most 10 accounts per platform per session. No bulk follow, no mass invites, no comments, no messages, no connection requests to strangers, no ads, no spending.
- Only change fields the owner asked about. Report what changed.

## Follow-up browser prompt

The prompt for the next round (follow more, analyze, recommend) is in `BROWSER-PROMPT-2.md`.
