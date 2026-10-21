# Where inquiry data lives (inventory) and proposed retention

Written October 21, 2026 from the repo (`schema.sql`, `migrations/`, `worker/index.js`, `wrangler.jsonc`, `docs/research/20-accounts-and-integrations.md`). Nothing was checked in the Cloudflare dashboard or the company mailbox.

## Where data lives

| Place | What is in it | Checked how |
|---|---|---|
| D1 database `cc-leads`, table `leads` | name, email, phone, message, source page, referrer, campaign tags, optional GA client id, country, user agent, attachment keys, status | `schema.sql`, `migrations/0001` |
| D1 `lead_workflow`, `lead_stage_history`, `intake_receipts` | project type, town, budget range, timeline, stage, follow up dates, outcome, loss reason, a request fingerprint | `migrations/0002` |
| R2 bucket `cc-lead-attachments` | photos and plans sent with inquiries (private) | `wrangler.jsonc`, `worker/index.js` |
| Company mailbox | one email per inquiry, a full copy of the submission | `wrangler.jsonc` (`LEAD_INBOX`) |
| Cloudflare logs | coded errors only. Request bodies and customer fields are not logged. Invocation logs are off | `wrangler.jsonc` comment |
| Backups | not known. D1 time travel and mailbox backups need checking | not checked |
| Google Analytics | page, campaign tags, referrer site name, four actions. Only after Accept | `js/analytics.js` |
| Cloudflare Web Analytics | cookieless visit counts, automatic edge setup | `src/_data/analytics.json` comment |

The IP address is used for the bot check and the rate limit. It is not a column in D1.

## Proposed retention (a proposal, not what the system does today)

| Information | Proposed period |
|---|---|
| Inquiries that do not become projects | 12 months after last meaningful contact |
| Photos and plans for inquiries that do not proceed | 90 days after the inquiry is closed |
| Active customer and project records | A separate legal and business retention policy |

## Before the notice promises anything

1. Check whether D1 time travel and mailbox backups keep deleted data, and for how long.
2. Check any record keeping rules for contractors in Massachusetts. I have not verified them.
3. Build the delete process (D1 rows, R2 files, the mailbox copy) and test it once.
4. Then publish a retention period. Until then, the notice should not name one.
