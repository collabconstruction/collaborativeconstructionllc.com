# Phase 1: Customer Flow Activation — Deployment Checklist

> **Superseded 2026-10-12.** Deployment and external configuration (Turnstile, migration, email routing) are complete and production-verified. See `docs/phase1-status.md` for current status. This checklist is preserved unmodified below as the historical pre-deployment record.

**Date**: October 11, 2026
**Status**: Implementation complete, awaiting external configuration

## What Was Built

All core functionality is implemented and tested (37/37 tests passing):
- Inquiry pipeline with D1, email, Turnstile, R2
- Lead queue with stages, CLI operations tool
- Analytics with GA4 consent banner and event tracking
- Mobile-friendly contact form with retry logic

## External Configuration Required

### 1. Turnstile Provisioning (HIGH PRIORITY)

The contact form requires Cloudflare Turnstile for bot protection. The site key is currently null in `src/_data/intake.json`.

**Steps**:
1. Log into Cloudflare dashboard
2. Navigate to Turnstile → Add Site
3. Configure:
   - Site name: `collaborativeconstructionllc.com`
   - Domains: `collaborativeconstructionllc.com`, `www.collaborativeconstructionllc.com`
   - Mode: Managed Challenge (recommended balance)
   - Widget type: Invisible (already integrated in form)
4. Copy the **Site Key** (public)
5. Update `src/_data/intake.json`:
   ```json
   {
     "turnstileSiteKey": "0x4AAAAAAA...",
     "_comment": "Public Turnstile site key. Provision and set before production intake activation; the Worker separately requires its private secret."
   }
   ```
6. Copy the **Secret Key** (private)
7. Set as Wrangler secret:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   # Paste the secret key when prompted
   ```

**Verification**: After deployment, the Turnstile widget should load on the contact form. Test submission to ensure verification passes.

### 2. Database Migration (ONE-TIME)

The D1 database schema has two migrations. If not already applied to production:

```bash
# Apply initial schema
npx wrangler d1 execute cc-leads --file=migrations/0001_existing_leads.sql --remote

# Apply lead operations migration
npx wrangler d1 execute cc-leads --file=migrations/0002_lead_operations.sql --remote
```

**Verification**: Run `npx wrangler d1 execute cc-leads --remote --command="SELECT name FROM sqlite_master WHERE type='table'"` to confirm tables exist.

### 3. Email Routing Verification

Cloudflare Email Routing must be configured for the destination address.

**Current configuration** (from `wrangler.jsonc`):
- Destination: `collaborativeconstructiongc@gmail.com`
- From address: `website@collaborativeconstructionllc.com`

**Verification steps**:
1. In Cloudflare dashboard → Email → Routing
2. Confirm `collaborativeconstructiongc@gmail.com` is a verified destination
3. Confirm routing rules allow `website@collaborativeconstructionllc.com`
4. Send a test email to `website@collaborativeconstructionllc.com` and verify delivery

### 4. Data Access for Measurement (MEDIUM PRIORITY)

To produce the first weekly scorecard, access is needed to:
- Google Analytics 4 (Property: Collaborative Construction LLC, Stream ID: 15756853352)
- Google Search Console (property: collaborativeconstructionllc.com)
- Cloudflare Web Analytics (already enabled on zone)

**Verification steps**:
1. Confirm GA4 is receiving data (real-time report)
2. Confirm GSC is indexed (URL inspection)
3. Confirm Cloudflare Web Analytics is recording pageviews

## Deployment Steps

### Pre-Deployment Checklist

- [ ] Turnstile site key added to `src/_data/intake.json`
- [ ] Turnstile secret key set as Wrangler secret
- [ ] Database migrations applied to remote D1
- [ ] Email Routing destination verified
- [ ] Node.js 22+ available (for CLI operations)
- [ ] Wrangler authenticated with correct account

### Build and Deploy

```bash
# Build the site
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy _site --project-name=collaborativeconstructionllc-com

# Or use the existing Workers integration (configured in wrangler.jsonc)
npx wrangler deploy
```

### Post-Deployment Verification

1. **Form submission test**:
   - Navigate to https://collaborativeconstructionllc.com/#contact
   - Submit a test inquiry with valid data
   - Confirm 200 response with `{"ok":true,"stored":true,"id":"..."}`
   - Check email inbox for notification

2. **CLI operations test**:
   ```bash
   # View queue (requires Node.js 22+)
   node scripts/leads.mjs queue --remote --out /private/path/queue.json
   ```

3. **Analytics verification**:
   - Visit site and accept consent banner
   - Check GA4 real-time report for pageview
   - Submit form and check for `generate_lead` event

## Owner Decisions Needed for Full Activation

Per the growth plan, these three decisions are sufficient to begin targeting:

1. **Which projects does the company most want?**
   - Confirm service priorities (ADU, additions, renovations, custom homes, advisory)
   - Confirm project size preferences

2. **Who answers new inquiries?**
   - Confirm assigned owner (currently defaults to "Wesleigh Behn")
   - Confirm response time SLA

3. **Which towns does it genuinely serve?**
   - Confirm service area (currently claims Cape Cod, Islands, South Shore)
   - Update `src/_data/business.json` if needed

## Known Limitations

1. **No web UI for lead queue** — CLI-only currently. A simple admin interface can be added later if needed.
2. **Node.js 22+ required** for CLI operations. Local testing blocked on Node.js 20.
3. **Turnstile key missing** — form will show error until site key is provisioned.
4. **No automated reporting** — scorecard must be generated manually via CLI until automation is added.

## Rollback Plan

If issues arise after deployment:

1. **Disable intake**: Set `INTAKE_RATE_LIMITER` to 0 in wrangler.jsonc and redeploy
2. **Check logs**: `npx wrangler tail` to see worker errors
3. **Revert code**: Git checkout previous commit and redeploy
4. **Database**: D1 writes are transactional; partial failures roll back automatically

## Success Criteria

Phase 1 is complete when:
- [ ] One verified end-to-end inquiry submission
- [ ] Email notification received
- [ ] Lead appears in CLI queue output
- [ ] Analytics events fire (form_start, generate_lead)
- [ ] Turnstile verification passes
- [ ] No errors in worker logs

## Next Phase: Customer Acquisition Launch

After Phase 1 activation, proceed to:
1. Verify Google Business Profile (address, hours, categories)
2. Publish approved case studies (requires owner approval of photos/quotes)
3. Prepare review-request process
4. Launch one small measurable acquisition experiment (e.g., local case-study test on service page)
