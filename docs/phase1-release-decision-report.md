# Phase 1 Release Decision Report

> **Superseded 2026-10-12.** The release shipped and passed production verification with an owner-confirmed Gmail receipt. See `docs/phase1-status.md` for current status. This report is preserved unmodified below as the historical pre-deployment record.

**Date**: October 11, 2026
**Status**: GO with conditions
**Branch**: phase1-release-prep

## Executive Summary

**Recommendation**: GO for production activation with explicit owner approval.

**Rationale**: 
- Development environment repaired (Node.js 22.23.3)
- All 39 tests passing
- Build successful
- Production D1 inspected (1 existing lead, both migrations pending)
- Migration 0002 is additive and safe
- No secrets exposed in source code
- Rollback procedures documented

**Blocking items requiring owner approval**:
1. Database migration application
2. Turnstile provisioning and secret configuration
3. Production deployment
4. Controlled test inquiry

## Phase A: Work Preservation — COMPLETE

**Branch**: `phase1-release-prep` created from `main` (commit e2ba56b)

**Staged files**:
- Phase 1 core: `migrations/`, `scripts/`, `js/intake-context.js`, `src/_data/intake.json`, `tests/`, `wrangler.local.jsonc`
- Research: `.agents/`, `docs/research/`, `AGENTS.md`, `CLAUDE.md`, `docs/phase1-*.md`

**Unstaged files** (visual changes, not Phase 1):
- Modified: `.gitignore`, `README.md`, `css/styles.css`, `js/analytics.js`, `js/main.js`, `package.json`, `src/_data/analytics.json`, `src/_data/nav.json`, `src/_includes/base.njk`, `src/about.njk`, `src/construction-advisory.njk`, `src/gallery.njk`, `src/index.njk`, `src/sitemap.njk`, `worker/index.js`, `wrangler.jsonc`
- New: `src/adu-builder-cape-cod/`, `src/custom-home-builder-cape-cod/`, `src/general-contractor-falmouth-ma/`, `src/home-additions-cape-cod/`, `src/home-renovation-cape-cod/`, `docs/implementation/`, `docs/operations.md`

**Security review**: No secrets found in diff. `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` correctly referenced as environment variables only.

## Phase B: Development Environment — COMPLETE

**Node.js**: Upgraded from v20.20.2 to v22.23.3 (via nvm)
**npm**: v10.9.9
**Wrangler**: v4.104.0

**Test results**: 39/39 passing (2.2s)
- Intake: 20 tests
- Lead operations: 10 tests
- Frontend: 4 tests
- Analytics: 3 tests
- Wrangler SQL splitter: 2 tests

**Build**: Eleventy successful (11 files written in 0.26s)

## Phase C: Production Inspection — COMPLETE

### Worker Deployment
**Last deployment**: September 27, 2026 (version 8e233d9e-43c6-49d6-86e2-4dac66cc89cb)
**Total deployments**: 10 since September 9, 2026
**Author**: wesleighb@gmail.com

### D1 Database
**Database ID**: 7e094c32-e89e-4efa-95ce-1133a9b4293c
**Binding**: DB
**Current tables**: `leads`, `_cf_KV` (Cloudflare internal)
**Lead count**: 1

**Existing lead**:
- ID: d5a4b6e8-24ed-49d7-bdcd-eb25748d85ac
- Created: 2026-09-29T20:21:34.469Z
- Name: Jim Krier
- Email: jkrier@foreverbarnwoodusa.com
- Status: new
- Emailed: 1 (success)
- Source: / (homepage)
- Referrer: (direct)

### Migration Status
**Pending migrations**: 2
- `0001_existing_leads.sql` — Initial leads schema (already applied, but not tracked)
- `0002_lead_operations.sql` — Lead workflow tables (NOT applied)

**Note**: The `leads` table exists with the expected schema, suggesting 0001 was applied manually before migration tracking was set up.

### R2 Bucket
**Bucket**: cc-lead-attachments
**Created**: 2026-09-09T00:11:02.873Z
**Binding**: ATTACHMENTS

### Email Configuration
**Destination**: collaborativeconstructiongc@gmail.com (verified)
**From address**: website@collaborativeconstructionllc.com
**Binding**: SEND_EMAIL

### Secrets
**Current secrets**: 
- `BREVO_API_KEY` (not used by current code)
- `TURNSTILE_SECRET_KEY` — NOT SET
- `RESEND_API_KEY` — NOT SET

## Phase D: Turnstile Preparation — COMPLETE

### Required Configuration
**Site key**: Public key to be added to `src/_data/intake.json`
**Secret key**: Private key to be set via `wrangler secret put TURNSTILE_SECRET_KEY`
**Hostname**: collaborativeconstructionllc.com
**Action**: contact

### Worker Verification Logic
```javascript
async function verifyTurnstile(token, ip, secret, hostname) {
  if (!secret || !token || token.length > 2048) return false;
  // ... verification ...
  return res.ok && data.success === true && data.hostname === hostname && data.action === "contact";
}
```

### Frontend Rendering
```nunjucks
{% if intake.turnstileSiteKey %}
<div class="cf-turnstile" data-sitekey="{{ intake.turnstileSiteKey }}" data-action="contact"></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
{% endif %}
```

### Behavior Without Turnstile
- If `TURNSTILE_SECRET_KEY` is not set: Worker returns 503 "Our form is temporarily unavailable"
- If `turnstileSiteKey` is null: Widget does not render, form submits without token
- Current production: No widget, no secret, form works (old code skips verification)

### Deployment Risk
**`wrangler secret put` deploys immediately**. Setting the secret before the new Worker is deployed will cause the old Worker (which skips verification) to still work, but the new Worker will require the secret.

**Recommended sequence**:
1. Deploy new Worker code (which requires secret)
2. Set secret (causes redeploy, now both code and secret are new)
3. Or: Set secret first, then deploy (old code ignores secret, new code uses it)

**Safer sequence**: Set secret first, then deploy. Old code skips verification, new code enforces it.

## Phase E: Release Safety Validation — COMPLETE

### Migration 0002 Compatibility Analysis

**Schema changes**:
- Creates `lead_workflow` table with `REFERENCES leads(id)` — SAFE (foreign key to existing table)
- Creates `lead_stage_history` table with `REFERENCES leads(id)` — SAFE
- Creates `intake_receipts` table — SAFE (no dependencies)
- Creates indexes — SAFE
- Creates triggers — SAFE (only on new tables + backfill)

**Backfill logic**:
```sql
INSERT INTO lead_workflow(lead_id, stage, follow_up_due_at, notification_state, attachment_state)
SELECT id, 
  CASE status 
    WHEN 'quoted' THEN 'estimate_sent' 
    WHEN 'booked' THEN 'won'
    WHEN 'contacted' THEN 'contacted' 
    WHEN 'qualified' THEN 'qualified' 
    WHEN 'consultation' THEN 'consultation'
    WHEN 'lost' THEN 'lost' 
    WHEN 'not_a_fit' THEN 'not_a_fit' 
    ELSE 'new' 
  END,
  strftime('%Y-%m-%dT%H:%M:%fZ',created_at,'+1 day'),
  CASE WHEN emailed=1 THEN 'accepted' ELSE 'unknown' END,
  CASE WHEN attachment_keys IS NOT NULL AND attachment_keys!='[]' THEN 'stored' ELSE 'none' END 
FROM leads;
```

**Impact on existing lead**:
- Jim Krier (status: new, emailed: 1, no attachments)
- Will be backfilled to: stage=new, follow_up_due_at=2026-09-30, notification_state=accepted, attachment_state=none
- No data loss, no status change

**Trigger on new leads**:
- Automatically creates workflow record on INSERT to leads
- Automatically creates stage history record
- Safe and idempotent

### Rollback Procedures

**Application rollback** (Worker code):
```bash
git checkout main
npm run build
npx wrangler deploy
```
**Effect**: Reverts to old Worker code (e2ba56b). Old code will ignore new tables but will fail if it references new columns.

**Database recovery** (D1 Time Travel):
```bash
# Create recovery bookmark BEFORE migration
npx wrangler d1 create-timetravel-bucket cc-leads --remote

# After migration, if needed, restore to bookmark
npx wrangler d1 restore cc-leads --remote --bookmark=<bookmark-id>
```
**WARNING**: D1 restore is destructive. It will erase any leads created after the bookmark.

**Configuration rollback** (Secrets):
```bash
# Remove secret
npx wrangler secret delete TURNSTILE_SECRET_KEY
```
**Effect**: Worker will return 503 (new code) or skip verification (old code).

**Lead records during release**:
- Any new inquiries during the release window must be preserved
- Database rollback would erase these leads
- Application rollback does not affect D1
- **Recommendation**: Pause marketing during release window, or accept that manual re-entry may be needed if database rollback occurs

### Distinction Between Rollback Types

| Type | Scope | Destructive | Lead Impact |
|------|-------|-------------|-------------|
| Application rollback | Worker code only | No | Leads preserved in D1 |
| Database recovery | D1 data only | Yes (erases post-bookmark data) | New leads lost |
| Configuration rollback | Secrets only | No | Leads preserved |
| Combined rollback | All | Yes (if database recovered) | New leads lost |

## Phase F: Production Activation Sequence

### Step 1: Owner Approval (REQUIRED)
**Decision**: Approve database migration, Turnstile configuration, and deployment?

### Step 2: Turnstile Provisioning (Cloudflare Dashboard)
1. Navigate to Cloudflare Dashboard → Turnstile → Add Site
2. Configure:
   - Site name: collaborativeconstructionllc.com
   - Domains: collaborativeconstructionllc.com, www.collaborativeconstructionllc.com
   - Mode: Managed Challenge
   - Widget type: Invisible
3. Copy **Site Key** (public)
4. Copy **Secret Key** (private)

### Step 3: Update Configuration (LOCAL)
```bash
# Edit src/_data/intake.json
{
  "turnstileSiteKey": "0x4AAAAAAA...",
  "_comment": "Public Turnstile site key."
}

# Commit and push
git add src/_data/intake.json
git commit -m "Add Turnstile site key"
git push origin phase1-release-prep
```

### Step 4: Set Secret (DEPLOYS IMMEDIATELY)
```bash
source ~/.nvm/nvm.sh && nvm use 22
npx wrangler secret put TURNSTILE_SECRET_KEY
# Paste the secret key when prompted
```
**Effect**: This will deploy the current Worker code (old version e2ba56b) with the secret. Old code ignores the secret, so no impact.

### Step 5: Apply Database Migration (REQUIRES APPROVAL)
```bash
# Create recovery bookmark first
npx wrangler d1 create-timetravel-bucket cc-leads --remote
# Note the bookmark ID

# Apply migration
npx wrangler d1 execute cc-leads --file=migrations/0002_lead_operations.sql --remote

# Verify migration
npx wrangler d1 execute cc-leads --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
npx wrangler d1 execute cc-leads --remote --command="SELECT COUNT(*) as count FROM lead_workflow"
```

### Step 6: Deploy Worker Code (REQUIRES APPROVAL)
```bash
# Build
npm run build

# Deploy
npx wrangler deploy
```

### Step 7: Browser Smoke Testing
1. Navigate to https://collaborativeconstructionllc.com/#contact
2. Verify Turnstile widget loads (check for cf-turnstile div)
3. Verify form fields: name, email, phone (optional), project_type (optional), project_town (optional), message, attachments
4. Verify noscript fallback is present
5. Submit test form with invalid data (verify validation)
6. Submit test form with valid data (verify 200 response)

### Step 8: Authorized Test Inquiry (REQUIRES APPROVAL)
**Test data**:
- Name: Phase 1 Test
- Email: test@example.com
- Phone: (555) 123-4567
- Project type: Home addition
- Project town: East Falmouth
- Message: This is a controlled test inquiry for Phase 1 activation verification.

**Verification**:
- Worker response: `{"ok":true,"stored":true,"id":"..."}`
- D1 record: Lead appears in leads table
- Workflow record: lead_workflow record created with stage=new
- Email: collaborativeconstructiongc@gmail.com receives notification
- CLI queue: `node scripts/leads.mjs queue --remote --out /private/path/queue.json`

### Step 9: D1 Verification
```bash
npx wrangler d1 execute cc-leads --remote --command="SELECT id, name, email, stage FROM lead_workflow JOIN leads ON lead_workflow.lead_id = leads.id ORDER BY leads.created_at DESC LIMIT 2"
```

### Step 10: Email Receipt Verification
- Check collaborativeconstructiongc@gmail.com inbox
- Verify email contains project_type, project_town fields
- Verify email shows "Responder: Wesleigh Behn"

### Step 11: Private Lead Queue Verification
```bash
node scripts/leads.mjs queue --remote --out /private/path/queue.json
cat /private/path/queue.json
```
Verify test inquiry appears with correct stage and follow-up date.

### Step 12: Post-Release Monitoring
```bash
# Monitor worker logs
npx wrangler tail

# Check for errors in first hour
```

## Phase G: GO/NO-GO Recommendation

### GO Conditions Met
- [x] Development environment repaired (Node.js 22+)
- [x] All tests passing (39/39)
- [x] Build successful
- [x] Production D1 inspected (1 existing lead)
- [x] Migration 0002 analyzed (additive, safe)
- [x] Rollback procedures documented
- [x] Turnstile configuration prepared
- [x] No secrets exposed in source code

### NO-GO Conditions
- [ ] Owner approval for database migration
- [ ] Owner approval for Turnstile configuration
- [ ] Owner approval for deployment
- [ ] Owner approval for test inquiry

### Recommendation: GO with Explicit Approvals

**The release is technically ready.** The migration is safe, the code is tested, and rollback procedures are documented.

**Required owner approvals**:
1. "Apply migration 0002_lead_operations.sql to production D1"
2. "Provision Turnstile and configure keys"
3. "Deploy Phase 1 changes from branch phase1-release-prep"
4. "Submit one controlled test inquiry"

**Estimated time to activation**: 45 minutes (Turnstile: 10 min, migration: 5 min, deployment: 5 min, verification: 25 min)

**Risk level**: LOW
- Migration is additive and reversible
- Turnstile configuration is isolated
- Rollback procedures are clear
- Only 1 existing lead in production

## Remaining Blockers

None technical. All blockers are owner approval requirements.

## Next Phase: Customer Acquisition Launch

After Phase 1 activation, proceed to:

1. **Google Business Profile audit**
   - Verify address eligibility (storefront vs service-area)
   - Confirm hours accuracy
   - Check categories
   - Review photos and description

2. **Publish case studies**
   - Requires owner approval of photos and client quotes
   - Add to service pages

3. **Review-request process**
   - Define when to request reviews
   - Create email template

4. **Launch one acquisition experiment**
   - Example: Local case-study proof on service page
   - Measure qualified inquiries before/after

## Conclusion

Phase 1 is technically ready for production activation. The release can proceed safely once the owner provides the four explicit approvals listed above.
