# Business data and API connection plan

Reviewed October 11, 2026. Status: **designed, not connected**. Public HTML is available; authenticated account reports, customer records and financial records were not fetched. Account ownership and identifiers must be confirmed before an integration can be tested.

## Data agents should see

“All the data they should be seeing” means enough current evidence for their assigned decision. It does not mean giving every marketing agent the full inbox, financial accounts and customer attachments.

| Dataset / system | What it answers | Minimum access and first deliverable | Current state |
|---|---|---|---|
| Search Console | Which searches/pages produce impressions and clicks? | Read-only verified property access; daily totals and query/page/device tables | **Connected and verified 2026-10-12** — see `16-gsc-seo-baseline.md` for the connection record and first baseline |
| Google Business Profile | Search/Maps visibility, website/call clicks, search terms | Owner/manager-authorized reporting adapter; monthly export first | Listing resource ID, categories, reviews, performance unknown |
| GA4 | Landing pages, channels, events, user paths | Viewer access to numeric property ID; aggregate reports | Measurement ID exists; reporting access unknown |
| Cloudflare Web Analytics | Independent site traffic/performance view | Dashboard read access/export | Prior configuration note says automatic injection enabled; not revalidated in dashboard |
| D1 inquiries | Real received web submissions and email delivery state | Read-only aggregate query/export; no raw messages for marketing | Schema/code present; current DB counts unqueried |
| Phone/referral intake | Inquiries absent from website form | Manual secure intake log or existing CRM export | No system supplied |
| CRM / sales ledger | Qualification, next action, proposals, wins/losses | Pseudonymous funnel export | D1 status field alone lacks full stage history |
| Estimates and job costs | Which jobs deserve more marketing? | Estimator/owner role; redacted job-level summaries for growth analyst | No files supplied |
| Capacity / schedule | How much work can be promised? | Available project slots and supervision/trade constraints | Unknown |
| Approved project proof | What can be published honestly? | Role/scope/photos/testimonials with release status | Gallery exists; evidence/permission records missing |
| Google Drive (company docs/photos) | Available project documentation, portfolio photos/permissions | Company-account access, read-only | **Connected to the wrong account** — see "Drive/Gmail connector status" below |
| Gmail (company mailbox) | Customer inquiries, missed follow-ups, vs. D1 lead comparison | Company-account access, read-only | **Connected to the wrong account** — see "Drive/Gmail connector status" below |

### Drive/Gmail connector status (checked 2026-10-12)

`claude mcp list` reports both the Google Drive and Gmail connectors as "✓ Connected," but a minimal, read-only identity check (one file-metadata lookup, one inbox-metadata lookup — no content/snippets read) shows they are authenticated as the **wrong accounts**: Drive resolves to `mbehn@mail.endicott.edu` and Gmail resolves to `marcusbehn10@gmail.com` — both personal/school accounts of the site operator, not the company mailbox (`collaborativeconstructiongc@gmail.com`) or any company-owned Drive. **No company business-data inventory (project docs, portfolio permissions, customer inquiries, D1-vs-Gmail lead comparison) has been attempted from these connectors** — reading from the wrong account would either pull irrelevant personal data or simply find nothing, and per a prior session's explicit instruction, that audit is deliberately on hold until reconnection is confirmed.

**To reconnect correctly**: at claude.ai → Settings → Connectors (or `claude.ai/customize/connectors`), find the Google Drive and Gmail connector entries, disconnect/sign out of the current personal-account session for each, then reconnect and sign in as `collaborativeconstructiongc@gmail.com` (or whichever Google identity actually owns the company's Drive/Gmail), approving only the scopes needed (read-only where offered). Confirm correct connection with the same kind of minimal identity check before running any content read — don't assume "Connected" means "connected to the right account."

## Connect in this order

### 1. Establish ownership and exports

Owner identifies the Google login that manages the business, current Search Console property, GA4 property and GBP listing. Use invitations or the provider's OAuth screen; never put passwords, refresh tokens or service-account keys into Markdown or chat. If APIs are delayed, export the available reports manually and record dates, filters and account/property identifiers in a private manifest.

Keep raw data in an owner-controlled private location outside this repository. A separate OS account/container and tool-enforced directory restrictions are appropriate for agents with customer data. Written instructions and `.gitignore` are not access controls. Publish only minimal aggregate summaries to this knowledge base; even small aggregates may identify clients in a tiny business.

### 2. Search Console

**Status: connected and verified 2026-10-12.** The full connection record (package, auth account, Cloud project, scope, property, credential storage, reconnection commands) and the first real baseline (totals, device split, top pages, topic-group queries, a URL-indexing gap finding, and three ranked SEO improvements) live in `16-gsc-seo-baseline.md` — read that file rather than duplicating the record here. The steps below are kept as the general procedure/design reference; they are no longer "to do" for Search Console specifically.

Verify the existing property first. Prefer an already verified Domain property where available; domain verification may require authorized DNS changes. Enable the Search Console API in an owner-controlled Google Cloud project and use OAuth scope `https://www.googleapis.com/auth/webmasters.readonly`. Discover the accessible exact property instead of guessing: the Domain property would be `sc-domain:collaborativeconstructionllc.com`, whereas a URL-prefix property is a different identifier.

Use `searchAnalytics.query` for finalized daily totals and separate query/page/device reports. API batches allow up to 25,000 rows with `startRow` pagination, but pagination does not guarantee every underlying query row is available. Dates are Pacific Time. Keep totals separate from dimensional extracts and mark incomplete/omitted data. [Official query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).

Proposed collection: initial available history in manageable windows; daily refresh of recent finalized dates; retain request parameters and retrieval time. Avoid fetching the entire historical range every day. Use exponential backoff on transient failures and respect [load and rate limits](https://developers.google.com/webmaster-tools/limits). A failed request must remain “unavailable,” not become a zero-traffic day.

Acceptance: authorized property listing succeeds; one report matches the interface for the same dates/search type/filters closely enough to explain differences; report records time zone, filters and completeness; credentials stay out of repository/logs. Do not use a sitemap submission endpoint merely to read performance.

### 3. Google Business Profile

Use a manual Performance export while API approval is pending. Google's current prerequisites require an eligible verified, active profile and project access approval; owning a listing alone does not complete API setup. Apply through the documented project process and verify quota/access rather than assuming success. [Prerequisites](https://developers.google.com/my-business/content/prereqs), [basic setup](https://developers.google.com/my-business/content/basic-setup).

The Performance API's daily series can retrieve supported impressions and actions for `locations/{locationId}`. It requires `business.manage`, a scope broader than read-only. Therefore use an adapter exposing only allowlisted reporting requests and do not expose general HTTP or write methods to the analyst. Scope naming must not be misrepresented as read-only. [Daily performance endpoint](https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries).

Fetch monthly keyword impressions separately. Preserve whether Google supplies an exact value or a below-threshold value; never turn a threshold into an exact count. [Monthly keyword endpoint](https://developers.google.com/my-business/reference/performance/rest/v1/locations.searchkeywords.impressions.monthly/list).

Acceptance: the correct verified listing is identified; a completed period is exported; displayed metric definitions are retained; account permissions and read-only adapter limits are tested. A call click is not an answered call or customer. Profile reviews and metadata may use different API surfaces; don't assume Performance provides them.

### 4. GA4

**Resolved, October 13-14, 2026 — see `docs/research/19-ga4-connection-and-diagnosis.md` for full detail.** The canonical, owner-confirmed, business-owned GA4 destination for this site going forward is property `558903217` ("Collaborative Construction LLC", account `411958882`, owned under `collaborativeconstructiongc@gmail.com`), stream ID `16124097872`, measurement ID `G-PNS7LJP5QB`. This mapping is not just owner-reported — it was independently confirmed via the Admin API's `dataStreams` endpoint, which returned `properties/558903217/dataStreams/16124097872` → `measurementId: "G-PNS7LJP5QB"` directly.

`G-13DBV8V3BE` (the ID this section previously described as "the site's" stream) was the prior, school-email-associated property. It is intentionally being superseded, not merged or treated as equivalent — the owner identified it as tied to a different (school) Google account, not the business account, and asked that it be preserved untouched (no deletion, no permission change) while the business property becomes authoritative. Do not treat the two measurement IDs as interchangeable in any future analysis; `G-13DBV8V3BE` is legacy/historical only.

Read-only access is live: the official `google-analytics-mcp` (PyPI `analytics-mcp`) is registered as an MCP server for this project, authenticated via Application Default Credentials (`gcloud auth application-default login`, scopes `analytics.readonly`+`cloud-platform`) as `collaborativeconstructiongc@gmail.com` — confirmed by an explicit `userinfo` identity check, not assumed. Both the Data API (`runReport`) and Admin API (`properties`, `dataStreams`) were verified working against `558903217` with real 200 responses. Consent-gated event delivery was also verified end-to-end against a local build (not production): no network calls pre-consent, and a real `page_view` reaching `google-analytics.com/g/collect` with the correct `tid` post-consent.

As of 2026-10-13, production itself was still sending to the old `G-13DBV8V3BE` tag — the corrected measurement ID exists only in a local, uncommitted-to-production commit. Check `docs/research/19-ga4-connection-and-diagnosis.md` and the latest release notes under `docs/releases/` for whether that deploy has since been authorized and completed before assuming which ID production is actually using at any given moment.

First reports once real production traffic exists under `G-PNS7LJP5QB`: landing page × session channel, relevant event counts, and traffic by device. Confirm whether `generate_lead` is configured as a key event rather than assuming its name alone does so. Keep personal names, emails, messages and addresses out of Analytics. Session attribution and consent restrictions will cause differences from D1 counts; investigate, don't force equality.

Acceptance: report access works (done); correct property and time zone are recorded (done — verified via Admin API); a known test can be distinguished from real business reporting (done — the one local-build verification page_view is documented as such in `19-ga4-connection-and-diagnosis.md`, not conflated with real traffic); configuration and received data are documented separately (done, this section + `19-ga4-connection-and-diagnosis.md`). Still open: real production traffic under the new ID, which depends on a separately-approved deploy.

### 5. D1 and sales data

Start with a read-only aggregate export using the existing schema. Review query permissions before exposing production access to an agent. This illustrates useful queries, not an executed export:

```sql
SELECT substr(created_at, 1, 10) AS day, status, emailed,
       COUNT(*) AS inquiries
FROM leads
GROUP BY day, status, emailed;
```

Do not expose `message`, email, phone, user agent, attachment keys or full referrer URLs to general marketing analysis. Aggregate campaign fields may also contain arbitrary user input and should be validated.

Add a **separate private sales ledger** initially, keyed by stable lead ID where available, with inquiry channel, project town, service, budget band, qualification decision, first response timestamp, stage timestamps, next action, proposal value, decision date and loss reason. Phone/referral leads need their own IDs. A later schema migration should be a reviewed implementation task; this document does not modify D1.

Record bookings as signed-contract events; reconcile revenue and collected cash with accounting. Track estimate revisions and expected/actual contribution at job level. Do not upload bank statements or customer contracts to every agent simply because they exist.

## Ingestion contract

Every private raw export needs: provider, account/property/location ID, source period, source time zone, retrieval timestamp, exact report/filters, schema version, row count, completeness/errors, checksum, access classification and retention owner. Preserve raw files immutably; normalize into separate tables; generate Markdown summaries from those tables. Do not overwrite raw history to hide revisions.

Partition a future warehouse into `gsc_daily`, `gsc_query_page`, `gbp_daily`, `gbp_keywords_monthly`, `ga4_daily`, `lead_stage_events`, `job_economics` and `capacity_weekly`. These tables have different grains. Join inquiry/job records only through approved internal IDs; do not infer that a search query identifies an individual customer. Never add impressions, sessions and leads as if they were the same population.

## Operations and recovery

Proposed refresh cadence: lead delivery exceptions daily, source metrics weekly initially, GBP keywords monthly, job economics at estimating/closeout milestones. This is a design, not an installed schedule. After two manual reconciliations, automate the collector and report generation; agents review anomalies and decisions. Record failure, retry count and last successful observation. Stale data must be visibly dated. Secret rotation and retention are owned by the company account administrator.
