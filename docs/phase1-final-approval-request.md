# Phase 1 Final Approval Request

> **Superseded 2026-10-12.** Deployment, migration and test-inquiry approvals were granted and executed; production verification passed with owner-confirmed Gmail receipt. See `docs/phase1-status.md` for current status. This request is preserved unmodified below as the historical pre-deployment record.

**Date**: October 11, 2026
**Status**: GO — Ready for owner approval
**Branch**: phase1-release-prep (commit e2ba56b)

## Migration Reconciliation — RESOLVED

**Finding**: Production has the `leads` table but the `d1_migrations` tracking table is empty.

**Root Cause**: Migration 0001 was manually applied via `wrangler d1 execute cc-leads --file=schema.sql --remote` before migration tracking was established. The `d1_migrations` table exists but contains no records.

**Impact**: `wrangler d1 migrations apply --remote` would attempt to run 0001, which would fail because the `leads` table already exists (even though it uses `CREATE TABLE IF NOT EXISTS`).

**Solution**: Manually insert a record for 0001 into `d1_migrations` to mark it as applied, then apply only 0002.

**Safe Command**:
```bash
source ~/.nvm/nvm.sh && nvm use 22
npx wrangler d1 execute cc-leads --remote --command "INSERT INTO d1_migrations (name, applied_at) VALUES ('0001_existing_leads.sql', datetime('now'))"
```

**Verification**:
```bash
npx wrangler d1 execute cc-leads --remote --command "SELECT * FROM d1_migrations"
npx wrangler d1 migrations list cc-leads --remote
```

**Expected Result**: Only 0002 appears in pending migrations.

## Current Production State

**Worker Version**: 8e233d9e-43c6-49d6-86e2-4dac66cc89cb (deployed September 27, 2026)
**D1 Database**: 1 existing lead (Jim Krier, status: new)
**Migration Tracking**: Empty (needs manual 0001 record)
**Turnstile**: Not provisioned, secret not set
**Email**: collaborativeconstructiongc@gmail.com verified

## Rollback Readiness

**Current Worker Version**: 8e233d9e
**Rollback Command**:
```bash
git checkout main
npm run build
npx wrangler deploy
```

**Rollback Effect**: Reverts Worker to commit e2ba56b. Old Worker will ignore new tables but will fail if it references new columns. D1 data is preserved.

**D1 Recovery**:
```bash
# Create bookmark BEFORE migration
npx wrangler d1 create-timetravel-bucket cc-leads --remote

# Restore if needed (DESTRUCTIVE - erases post-bookmark leads)
npx wrangler d1 restore cc-leads --remote --bookmark=<bookmark-id>
```

**Recommendation**: Do NOT restore D1 unless absolutely necessary. Prefer Worker rollback only. New leads arriving during release window are preserved.

## Approval Items

### A. Production D1 Migration

**Commands**:
```bash
source ~/.nvm/nvm.sh && nvm use 22

# Step 1: Mark 0001 as manually applied
npx wrangler d1 execute cc-leads --remote --command "INSERT INTO d1_migrations (name, applied_at) VALUES ('0001_existing_leads.sql', datetime('now'))"

# Step 2: Verify only 0002 is pending
npx wrangler d1 migrations list cc-leads --remote

# Step 3: Apply 0002
npx wrangler d1 execute cc-leads --file=migrations/0002_lead_operations.sql --remote

# Step 4: Verify migration
npx wrangler d1 execute cc-leads --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
npx wrangler d1 execute cc-leads --remote --command "SELECT COUNT(*) as count FROM lead_workflow"
```

**Effect**:
- Creates `lead_workflow`, `lead_stage_history`, `intake_receipts` tables
- Backfills existing lead (Jim Krier) to stage=new, follow_up_due_at=2026-09-30
- Creates triggers for automatic workflow record creation on new leads
- Existing lead is preserved and enhanced

**Rollback**: D1 Time Travel restore (destructive, erases new leads)

---

### B. Turnstile Provisioning and Secret Configuration

**Cloudflare Dashboard Actions**:
1. Navigate to Turnstile → Add Site
2. Configure:
   - Site name: collaborativeconstructionllc.com
   - Domains: collaborativeconstructionllc.com, www.collaborativeconstructionllc.com
   - Mode: Managed Challenge
   - Widget type: Invisible
3. Copy **Site Key** (public)
4. Copy **Secret Key** (private)

**Local Configuration**:
```bash
# Edit src/_data/intake.json
{
  "turnstileSiteKey": "0x4AAAAAAA...",
  "_comment": "Public Turnstile site key."
}

# Commit
git add src/_data/intake.json
git commit -m "Add Turnstile site key"
```

**Secret Configuration** (DEPLOYS IMMEDIATELY):
```bash
source ~/.nvm/nvm.sh && nvm use 22
npx wrangler secret put TURNSTILE_SECRET_KEY
# Paste the secret key when prompted
```

**Effect**:
- Setting secret deploys current Worker code (old version e2ba56b)
- Old Worker ignores the secret (no impact)
- New Worker will require the secret and enforce verification

**Rollback**: `wrangler secret delete TURNSTILE_SECRET_KEY` (deploys current code)

---

### C. Phase 1 Deployment

**Commands**:
```bash
source ~/.nvm/nvm.sh && nvm use 22

# Build
npm run build

# Deploy
npx wrangler deploy
```

**Effect**:
- Deploys new Worker code with enhanced form, lead workflow, rate limiting, strict Turnstile verification
- Deploys new site build with phone, project_type, project_town fields
- Deploys intake-context.js for attribution tracking
- Deploys CLI tool (not used by Worker, available for local operations)

**Rollback**:
```bash
git checkout main
npm run build
npx wrangler deploy
```

---

### D. One Controlled Test Inquiry

**Test Data**:
- Name: Phase 1 Test
- Email: test@example.com
- Phone: (555) 123-4567
- Project type: Home addition
- Project town: East Falmouth
- Message: This is a controlled test inquiry for Phase 1 activation verification.

**Verification Steps**:
1. Navigate to https://collaborativeconstructionllc.com/#contact
2. Verify Turnstile widget loads
3. Submit test form
4. Verify Worker response: `{"ok":true,"stored":true,"id":"..."}`
5. Verify D1 record:
   ```bash
   npx wrangler d1 execute cc-leads --remote --command "SELECT id, name, email FROM leads ORDER BY created_at DESC LIMIT 1"
   ```
6. Verify workflow record:
   ```bash
   npx wrangler d1 execute cc-leads --remote --command "SELECT lead_id, stage, assigned_to FROM lead_workflow ORDER BY lead_id DESC LIMIT 1"
   ```
7. Verify email receipt at collaborativeconstructiongc@gmail.com
8. Verify CLI queue:
   ```bash
   node scripts/leads.mjs queue --remote --out /private/path/queue.json
   ```

**Effect**: Proves end-to-end flow works correctly.

**Rollback**: Delete test lead manually via CLI or D1.

---

## Failure Scenarios

### Migration Fails
- **Detection**: Command returns error
- **Impact**: No changes to D1
- **Recovery**: Review error, fix migration SQL, retry
- **Rollback**: Not needed (no changes applied)

### Deployment Fails
- **Detection**: `wrangler deploy` returns error
- **Impact**: No changes to Worker
- **Recovery**: Review error, fix code, retry
- **Rollback**: Not needed (no changes applied)

### Form Submissions Fail
- **Detection**: Worker returns 500/503/403
- **Impact**: Customers cannot submit inquiries
- **Recovery**: Check Worker logs (`wrangler tail`), rollback to previous version
- **Rollback**: `git checkout main && npm run build && wrangler deploy`

### Email Notification Fails
- **Detection**: Worker returns `{"ok":true,"stored":true,"notification":"failed"}`
- **Impact**: Lead saved in D1, notification_state="failed", staff not notified
- **Recovery**: Check email routing configuration, retry notification via CLI
- **Rollback**: Not needed (lead preserved, can notify manually)

### New Leads Arrive After Deployment
- **Detection**: Normal operation
- **Impact**: New leads stored with workflow records
- **Recovery**: None (expected behavior)
- **Rollback**: If D1 restore is needed, new leads are lost. Prefer Worker rollback only.

## GO/NO-GO Recommendation

**GO** — All technical readiness criteria met:

- [x] Migration history reconciled (0001 manually applied, needs tracking record)
- [x] Rollback procedures documented
- [x] Turnstile configuration prepared
- [x] 39/39 tests passing
- [x] Build successful
- [x] No secrets in source code
- [x] Production D1 inspected (1 existing lead)
- [x] Worker version recorded (8e233d9e)

**Required Owner Approvals**:

A. "Mark migration 0001 as applied and apply migration 0002_lead_operations.sql to production D1"
B. "Provision Turnstile in Cloudflare Dashboard and configure secret"
C. "Deploy Phase 1 changes from branch phase1-release-prep"
D. "Submit one controlled test inquiry"

**Estimated Time to Activation**: 30 minutes (migration: 5 min, Turnstile: 10 min, deployment: 5 min, verification: 10 min)

**Risk Level**: LOW
- Migration is additive and reversible
- Turnstile configuration is isolated
- Rollback procedures are clear
- Only 1 existing lead in production

## Post-Activation Next Steps

After successful deployment and verification:

1. **Google Business Profile audit**
   - Verify address eligibility
   - Confirm hours accuracy
   - Check categories

2. **Publish case studies**
   - Requires owner approval of photos and client quotes

3. **Review-request process**
   - Define when to request reviews
   - Create email template

4. **Launch one acquisition experiment**
   - Example: Local case-study proof on service page
   - Measure qualified inquiries before/after

**Stop infrastructure work. Start measuring actual inquiries.**
