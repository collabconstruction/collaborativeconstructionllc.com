# Lead measurement plan

## What counts as a lead

A real person asking about real work in or near the service area. Count each one once.

Sources to count:

1. Contact form (GA4 event `generate_lead`)
2. Phone calls (`click_to_call` shows taps on the site only, not calls from Google or Facebook)
3. Emails (`click_to_email`)
4. Facebook or LinkedIn messages
5. Google Business Profile calls and messages
6. Word of mouth

Spam, sales pitches and job seekers are not leads.

## Weekly report fields

| Field | Where it comes from |
|---|---|
| Website visits | GA4 |
| Form starts and form sends | GA4 `form_start`, `generate_lead` |
| Call and email taps | GA4 |
| Facebook posts and reach | Metricool |
| Google Business Profile views, calls, directions | Google Business Profile |
| New reviews | Google Business Profile |
| Leads by source (counts only) | Owner's own notes |
| Leads that fit the service area and scope | Owner's own notes |

Never put customer names, phones, emails or addresses in a report.

## Known limit: link tags may not register

`js/analytics.js` sends `page_location` as the origin plus the page path. It leaves out the query string. UTM tags such as `?utm_source=facebook` would be dropped, so GA4 may not credit a visit to Facebook.

Proposal, not done: keep only the `utm_` values in `page_location`, or send them as separate fields. This touches tracking and consent, so it needs the owner's approval first.

Until then, GA4 can still show Facebook and LinkedIn as referrers in many cases, but not always.

## Questions for the owner

1. Who counts and records leads each week?
2. Should we change the analytics so link tags register?

## Referrer tradeoff (proposal branch)

The old setting `page_referrer: ""` hid where visitors came from. That removed credit for ordinary links with no UTM tag, such as a Facebook post or a chamber website. The proposal sends the referring site's origin only (for example `https://www.facebook.com`), never a path or query, and only after consent. Our own site is left out. If you prefer not to share even that, say so and we keep it empty.

UTM tags are read from the address of the page being viewed, not from memory. A later page in the same visit is not given tags it never had. GA4 keeps the first tags for the whole visit.

Privacy notice: say that, after consent, the site shares campaign tags and the referring site's name with Google Analytics. Not yet added to the site. Owner to approve wording.
