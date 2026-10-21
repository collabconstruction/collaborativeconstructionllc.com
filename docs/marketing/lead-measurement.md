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
