# Company health and growth assessment — October 18, 2026

## Assessment

The company’s online presence is in an early measurement stage. Google reporting access is working, but the public website remains unavailable to visitors and the current sample cannot establish lead conversion or company financial performance. Social branding and first posts are live; no sustained audience growth can be inferred on launch day. Restore a usable public website before spending to send more visitors there.

## Fresh source results

| System | Verified observation | Interpretation |
|---|---|---|
| Public website | Homepage, general contracting, additions, ADU and advisory all HTTP 503 with Retry-After 3600; robots and sitemap HTTP 200 | Intentional maintenance is still a real acquisition and indexing blocker |
| GSC | Final web search Sept 18–Oct 15, Pacific dates: 430 impressions, 15 clicks, CTR 3.49%, average position 9.30 | Prior equal 28 days: 493 impressions, 9 clicks, 1.83% CTR, position 9.10. Six more clicks with 63 fewer impressions; sample is too small for a growth claim |
| Search pages | Homepage 13 clicks, about legacy URL 1, advisory 1; dedicated service pages each 0 | Homepage dominates; improve and measure specific service journeys after reopening |
| URL Inspection | Homepage indexed (last crawl Oct 14); general contracting indexed (Oct 12); ADU server error/5xx (Oct 18 14:19 UTC) | Historical indexed status does not override today’s live 503. Only these three URLs inspected |
| Sitemap | Downloaded Oct 17; zero reported errors/warnings, 9 submitted | Legacy indexed=0 field contradicts URL Inspection; do not interpret as zero indexed pages |
| GA4 | Business property 558903217, America/New_York; Sept 20–Oct 17 exact production hostname: 6 sessions, 2 users, 57 events, all Direct | Property created Oct 14, so requested window includes pre-property dates. Likely owner/test contamination; not verified demand. Localhost separately has 5 sessions/1 user/35 events |
| GA4 events | Production page_view 23, user_engagement 21, session_start 6, scroll 5, first_visit 2; no click_to_call, click_to_email, form_start or generate_lead rows | No collected inquiry signal; not evidence of zero calls or customers |
| GA4 key events | close_convert_lead, qualify_lead, purchase; generate_lead absent | Need an actual stored-inquiry conversion definition and subsequent delivery verification |
| Metricool Facebook | Oct 1–18 request: Oct 17 follower metric 0; Oct 18 2 posts and 0 interactions; many metrics null | Partial launch-day collection; cover changes may be included. Do not present 2 posts as two marketing introductions. Today’s follower metric missing |
| Metricool LinkedIn | Oct 18: 0 followers, 1 post, 0 API-reported impressions/reactions/comments/net follower change | Member-profile API restrictions and sync lag apply. Earlier native UI showed impressions; do not replace with an authoritative zero |
| D1 inquiry aggregates | Supported CLI report attempted under Node 22; failed with privacy-safe error | Current lead, qualified, proposal, win, response and notification totals unavailable, not zero. Wrangler account authentication succeeds; cause of report failure unresolved. No raw customer records read |
| GBP | No current authorized performance report retrieved | Maps visibility, calls, reviews and listing state unverified this turn; prior duplicate/suspension issue must be reviewed with owner |
| Cloudflare | Public responses verified; Wrangler authentication succeeds; private traffic/performance report not collected | Cannot infer traffic/bots/Core Web Vitals from status checks |
| GitHub scheduler | Actions total_count=0 | No verified cloud monitor execution; this is distinct from local scheduled analysis |

Google Search date windows and GA4 property dates differ. Their counts are not a conversion denominator. Query/page extracts are top rows with privacy omissions; totals are separate. Fresh API source JSON is stored beside this report. Requests did not edit Google settings, submit forms, deploy, push Git, or read private customer content.

## Improvements in priority order

1. Restore an approved, usable public website. Review and release the persistent website worktree through existing release checks and owner deployment approval; alternatively prepare an accurate indexable interim company page. Google recommends whole-site 503 only for very short outages and warns that prolonged closure harms search. After release, verify representative pages, contact journey, redirects and canonical tags, then request recrawls through supported tools. ADU indexing already reports a 5xx.
2. Make measurement trustworthy. Use the business GA4 property, exclude preview/localhost collection in the release, register generate_lead as the inquiry key event using existing appropriate access, then verify one approved synthetic stored inquiry separately from notification delivery and consented analytics. Do not invent a monetary lead value. Repair the aggregate-report failure and reconcile known tests before reporting lead totals. Establish GBP reporting and a correct LinkedIn company Page under a genuine authorized manager profile.
3. Build evidence and local referrals. Publish two verified local case studies with accurate company/project role, approved photos, town, scope, constraints and outcome. Improve the Falmouth contracting and ADU pages rather than generating thin town copies. Run a 30-day experiment of two useful posts/week and a small reviewed set of local referral relationships. Measure qualified conversations and inquiry quality, not follower count alone. Confirm business capacity before increasing volume or buying ads.

Competitor observation (self-published, not independent quality evidence): Cape Associates pairs service-specific pages with portfolio, customer proof and named design/photo credits. REEF publishes process/planning content and portfolio paths. Adopt specific proof and useful planning explanations; do not copy their awards, staffing, history or project claims. Company positioning should stay residential construction/renovation and independent oversight, with exact scope and towns confirmed by owner.

## Scheduler now configured

Created ACTIVE local heartbeat `construction-daily-company-health-and-growth-analysis`, daily 08:30 America/New_York, targeting this chat. Reads GA4/GSC/public collection, Metricool, available GBP/Cloudflare and sanitized inquiry aggregates; records access failures, analyzes changes and writes dated reports for future runs to read. On Mondays it refreshes official guidance and local research. Existing weekly social routine remains Monday 09:15 and owns its bounded authorized follows; monthly routine remains content drafting. No duplicate posting authority added.

The daily automation definition was created and viewed successfully. The collector was run manually successfully today. The first scheduler-triggered run is still pending; ACTIVE is not execution proof. These are local tasks requiring the Mac and desktop app running and workspace available. This is not a verified cloud-hosted Claude routine; existing cloud/GitHub/report-ingestion paths still lack completed-run evidence. Routine unchanged results stay quiet; meaningful changes/failures/new required owner actions notify this chat.

## Minimum owner inputs

- Decide timing for the public website release after reviewing the prepared website; deployment was not performed in this audit.
- Identify the genuine manager LinkedIn account for administering a proper company Page; perform any identity/terms steps yourself.
- Provide access through the Google Business Profile owner dashboard or a sanctioned aggregate Performance export for the correct active listing; no passwords in chat. Resolve the previously recorded duplicate/suspension issue if still present.
- Confirm priority services/towns, earliest available start/capacity and minimum suitable project size; provide two project-photo/attribution approvals.
- For a real company-performance diagnosis, supply sanitized counts for calls/referrals/inquiries, estimates, signed work and consistent job-cost/capacity aggregates. Online clicks alone cannot establish revenue, profit or business health.

## Sources (reviewed October 18)

- Google website closures: https://developers.google.com/search/docs/crawling-indexing/pause-online-business
- GA4 key-event configuration: https://support.google.com/analytics/answer/13128484
- GBP local ranking guidance: https://support.google.com/business/answer/7091
- Local scheduled-task requirements: https://learn.chatgpt.com/docs/automations?surface=app
- Cape Associates: https://www.capeassociates.com/
- REEF: https://capecodbuilder.com/
- API evidence: google-public.json, indexing.json, metricool-facebook.json, metricool-linkedin.json
