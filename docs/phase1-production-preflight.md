# Phase 1 Production Preflight Report

> **Superseded 2026-10-12.** Phase 1 has since deployed and passed production verification, including an owner-confirmed Gmail receipt. See `docs/phase1-status.md` for current status. This report is preserved unmodified below as the historical pre-deployment record.

**Date**: October 11, 2026
**Status**: Critical findings - production is behind local implementation

## Executive Summary

**CRITICAL FINDING**: Production deployment is at commit `e2ba56b` (October 2026). The local repository contains uncommitted Phase 1 changes that are NOT live. The 37 passing tests are against local code, not production.

**Production is missing**:
- Lead workflow table (`lead_workflow`, `lead_stage_history`, `intake_receipts`)
- Enhanced form fields (phone, project_type, project_town)
- Turnstile widget and strict verification
- URL redirects (.html → clean, www → non-www)
- CLI operations tool
- Attribution tracking (intake-context.js)

**Production has**:
- Basic form (name, email, message, file attachments)
- Simple Turnstile logic (skips verification if not provisioned)
- R2 attachment storage
- Email notification via Cloudflare Email Routing
- Basic leads table

## Production vs Local Differences

### Form Fields

| Field | Production (e2ba56b) | Local (uncommitted) |
|-------|-------------------|---------------------|
| Name | ✓ | ✓ (maxlength: 120) |
| Email | ✓ | ✓ (maxlength: 254) |
| Message | ✓ | ✓ (maxlength: 5000) |
| Phone | ✗ | ✓ (optional, maxlength: 40) |
| Project Type | ✗ | ✓ (optional, select) |
| Project Town | ✗ | ✓ (optional, maxlength: 100) |
| Budget Range | ✗ | ✓ (optional) |
| Desired Timeline | ✗ | ✓ (optional) |
| Turnstile Widget | ✗ | ✓ (conditional on site key) |

### Worker Logic

| Feature | Production (e2ba56b) | Local (uncommitted) |
|---------|-------------------|---------------------|
| Turnstile verification | Skips if secret missing | Requires secret, validates hostname + action |
| URL redirects | None | .html → clean, www → non-www |
| Error handling | Basic | Try-catch with 503 fallback |
| Email notification | ✓ | ✓ (enhanced with project fields) |
| Lead workflow table | ✗ | ✓ (stages, assignment, follow-up) |
| Deduplication | ✗ | ✓ (intake_receipts table) |
| Rate limiting | ✗ | ✓ (INTAKE_RATE_LIMITER) |
| Attachment failure tracking | Basic | Enhanced (attachment_state, warning) |

### Database Schema

**Production (e2ba56b)**:
- `leads` table only (id, created_at, name, email, phone, message, attribution, attachments, emailed, email_error, country, user_agent, status, booked_at, reported_to_ga)

**Local (uncommitted)**:
- `leads` table (same)
- `lead_workflow` table (project_type, project_town, budget_range, desired_timeline, acquisition_source, assigned_to, stage, last_contact_at, first_response_at, next_action, follow_up_due_at, outcome, loss_reason, estimated_value, estimating_hours, expected_contribution, realized_contribution, customer_key, notification_state, notification_attempted_at, attachment_state, attachment_warning)
- `lead_stage_history` table (audit trail)
- `intake_receipts` table (deduplication)

### JavaScript

**Production (e2ba56b)**:
- `main.js` (form submission without retry logic)
- `analytics.js` (consent-gated GA4)
- No `intake-context.js`

**Local (uncommitted)**:
- `main.js` (enhanced with retry logic, submission identity preservation)
- `analytics.js` (same)
- `intake-context.js` (attribution tracking: UTM, referrer, source_page)

### Configuration

**Production (e2ba56b)**:
- `src/_data/analytics.json` (GA4 enabled)
- No `src/_data/intake.json`

**Local (uncommitted)**:
- `src/_data/analytics.json` (same)
- `src/_data/intake.json` (Turnstile site key: null)

## Production Verification Results

### API Endpoint Test
```bash
curl -X POST https://collaborativeconstructionllc.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@example.com","message":"test"}'
```

**Response**: `{"ok":false,"error":"Could not read the form data."}`

**Analysis**: Production worker expects `multipart/form-data`, not JSON. This is correct behavior. The endpoint is live and responding.

### Form Inspection
Production contact form (via URL extraction):
- Has: name, email, message, file attachments
- Missing: phone, project_type, project_town, Turnstile widget
- No noscript fallback for JavaScript-disabled users

## Blockers

### 1. Node.js Version (BLOCKING)
- **Current**: Node.js 20.20.2
- **Required**: Node.js 22.0.0+ (for wrangler CLI operations)
- **Impact**: Cannot inspect production D1 schema, cannot run CLI operations tool, cannot test locally with wrangler dev

**Resolution**: Upgrade Node.js to 22+ before proceeding with any wrangler operations.

### 2. Uncommitted Changes (BLOCKING)
- **Status**: 20+ files modified, 10+ new files untracked
- **Impact**: Production is not running Phase 1 code
- **Risk**: Deploying without review could break existing functionality

**Resolution**: Review changes, commit to a feature branch, then deploy.

### 3. Turnstile Configuration (BLOCKING)
- **Current**: No Turnstile widget in production
- **Local**: Site key is null in `src/_data/intake.json`
- **Secret**: Not set as Wrangler secret
- **Impact**: Form will show error if deployed with Turnstile enabled but not configured

**Resolution**: Provision Turnstile in Cloudflare, add site key to intake.json, set secret via wrangler.

### 4. Database Migration (BLOCKING)
- **Unknown**: Whether `migrations/0002_lead_operations.sql` has been applied to production D1
- **Impact**: Cannot deploy enhanced worker without schema
- **Risk**: Migration could fail or break existing data

**Resolution**: Inspect production D1 schema (requires Node.js 22+), backup if needed, apply migration with approval.

## Deployment Plan

### Phase A: Preparation (Requires Node.js 22+)

1. **Upgrade Node.js**
   ```bash
   # Using nvm (recommended)
   nvm install 22
   nvm use 22
   ```

2. **Inspect Production D1**
   ```bash
   npx wrangler d1 execute cc-leads --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
   npx wrangler d1 execute cc-leads --remote --command="SELECT sql FROM sqlite_master WHERE name='leads'"
   ```

3. **Backup Production D1** (if migration needed)
   ```bash
   npx wrangler d1 export cc-leads --remote --output=/private/path/backup.sql
   ```

4. **Provision Turnstile**
   - Cloudflare Dashboard → Turnstile → Add Site
   - Site name: collaborativeconstructionllc.com
   - Domains: collaborativeconstructionllc.com, www.collaborativeconstructionllc.com
   - Mode: Managed Challenge
   - Widget type: Invisible
   - Copy site key to `src/_data/intake.json`
   - Set secret: `npx wrangler secret put TURNSTILE_SECRET_KEY`

### Phase B: Code Review and Commit

1. **Review all changes**
   ```bash
   git diff HEAD
   git status
   ```

2. **Commit to feature branch**
   ```bash
   git checkout -b phase1-activation
   git add .
   git commit -m "Phase 1: Add lead workflow, enhanced form, Turnstile, CLI operations"
   ```

3. **Run tests**
   ```bash
   npm test
   ```

### Phase C: Database Migration (Requires Approval)

1. **Apply migration to production**
   ```bash
   npx wrangler d1 execute cc-leads --file=migrations/0002_lead_operations.sql --remote
   ```

2. **Verify migration**
   ```bash
   npx wrangler d1 execute cc-leads --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
   ```

### Phase D: Deployment

1. **Build site**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   npx wrangler deploy
   ```

### Phase E: Verification

1. **Test form submission**
   - Navigate to https://collaborativeconstructionllc.com/#contact
   - Submit test inquiry with all fields
   - Verify 200 response with `{"ok":true,"stored":true,"id":"..."}`

2. **Verify email notification**
   - Check collaborativeconstructiongc@gmail.com inbox
   - Verify email contains project_type, project_town fields

3. **Verify lead queue**
   ```bash
   node scripts/leads.mjs queue --remote --out /private/path/queue.json
   ```

4. **Verify analytics**
   - Check GA4 real-time report
   - Submit form and verify `generate_lead` event

## Rollback Plan

If deployment fails:

1. **Revert Worker**
   ```bash
   git checkout main
   npx wrangler deploy
   ```

2. **Revert Database** (if migration applied)
   ```bash
   # Restore from backup
   npx wrangler d1 execute cc-leads --remote --file=/private/path/backup.sql
   ```

3. **Check logs**
   ```bash
   npx wrangler tail
   ```

## Owner Decisions Required

1. **Approve database migration** - Apply `migrations/0002_lead_operations.sql` to production D1?
2. **Approve Turnstile activation** - Provision Turnstile and configure site key/secret?
3. **Approve deployment** - Deploy Phase 1 changes to production?
4. **Approve test inquiry** - Submit one controlled test inquiry to verify end-to-end flow?

## Minimum Explicit Approval Required

Before proceeding, the owner must approve:

1. **Database migration** - "Apply migration 0002_lead_operations.sql to production D1"
2. **Turnstile configuration** - "Provision Turnstile and configure keys"
3. **Deployment** - "Deploy Phase 1 changes from feature branch phase1-activation"
4. **Test inquiry** - "Submit one controlled test inquiry"

## Success Criteria

Phase 1 activation is complete when:

- [ ] Node.js 22+ installed
- [ ] Production D1 schema verified
- [ ] Turnstile provisioned and configured
- [ ] Database migration applied (if not already)
- [ ] Phase 1 code deployed to production
- [ ] Form submission test passes (200 with stored=true)
- [ ] Email notification received
- [ ] Lead appears in CLI queue
- [ ] Analytics events fire
- [ ] No errors in worker logs

## Next Phase: Customer Acquisition Launch

After Phase 1 activation:

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

**Production is NOT ready for Phase 1 activation.** The local implementation is complete and tested, but production is running older code (commit e2ba56b). Critical blockers:

1. Node.js version (20 vs required 22+)
2. Uncommitted Phase 1 changes
3. Turnstile not provisioned
4. Database migration status unknown

**Estimated time to activation**: 2-3 hours (including Node.js upgrade, Cloudflare configuration, migration, deployment, verification).

**Risk level**: Medium. Database migration is the highest-risk operation. Turnstile configuration is low-risk but required for form functionality.
