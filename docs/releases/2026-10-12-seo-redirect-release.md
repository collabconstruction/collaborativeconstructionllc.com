# SEO/canonical-URL production release — 2026-10-12 (evening)

Status: **Change A (Worker deploy) completed and verified live.** **Change B (`www` Redirect Rule) not applied — blocked on Cloudflare API scope, handed to the owner as dashboard instructions, awaiting owner action.** No database migration, no Git push, no new customer inquiry, no credential rotation, no new Worker custom domain. Approved explicitly by the owner in chat before any production change was made; this record exists to capture exactly what happened, not to re-argue the approval.

## What was approved

Deploy exact commit `d0bd6607a57c96cc91554f4a86212ea79d7863ac` (SEO sprint `db6e247` + the 17-URL 301 legacy-redirect fix) to production, and create a Cloudflare Redirect Rule resolving the `www` hostname's HTTP 522. Both changes were pre-verified locally and via a real `wrangler dev --local` integration test before this release (see `docs/research/18-indexing-audit.md` Sections 1a/1b/6a).

## Change A — Worker deployment (completed)

**Preflight, before touching production:**
- Confirmed the active production Worker version was still `28d3bb86-6417-4266-a3b0-c12e28f8c37f` (created 2026-10-12T16:34:30.692Z) — unchanged since the last audit, no drift.
- Confirmed account `0fadcd0965374caa75a44c3aa9784042` (`Wesleighb@gmail.com's Account`) and zone `5a7f4b95bbd85c1ec0931a6fdd3e1e6d` (`collaborativeconstructionllc.com`, status `active`).
- Confirmed existing bindings live: D1 `cc-leads` (`7e094c32-e89e-4efa-95ce-1133a9b4293c`), R2 `cc-lead-attachments`, `SEND_EMAIL` (destination `collaborativeconstructiongc@gmail.com`), rate limiter namespace `10041` (5/60s). Confirmed secrets `TURNSTILE_SECRET_KEY` and `BREVO_API_KEY` are present (names only checked, values never read).
- Created a **fresh, isolated `git worktree`** at `/tmp/cc-release-deploy-d0bd660`, detached at the exact approved SHA. Confirmed clean working tree, confirmed no `.env`/secret/credential-looking files tracked.
- In that isolated checkout: `npm ci`, `npm test` (**84/84 pass, 0 fail, 0 skipped** under Node 22), `npm run build` (11 files written, no errors), `node scripts/verify-release-build.mjs` (passed — 50 public files, all invariants held across 9 pages), `npx wrangler deploy --dry-run` (succeeded, correct bindings, no upload).
- The dirty original workspace (79 other uncommitted/staged files from unrelated research work) was never touched by any of this — the deploy ran from the isolated worktree only.

**Deployment:**
```sh
cd /tmp/cc-release-deploy-d0bd660   # isolated worktree at d0bd6607a57c96cc91554f4a86212ea79d7863ac
npx wrangler deploy
```
- **New Worker version:** `af880324-009c-48b2-80b0-eba3bf891f72`
- **Created:** `2026-10-12T23:29:56.461Z`
- **Traffic:** 100%
- **Production URL:** `https://collaborativeconstructionllc.com` (custom domain) / `https://collaborativeconstructionllc-com.wesleighb.workers.dev` (workers.dev)
- Bindings reported at deploy time matched the preflight check exactly (no drift).

**Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`):**
- **17/17 legacy redirects**: all return `301`, exact canonical `Location` with query string preserved (`?utm_source=google&utm_campaign=x` round-tripped on every one), and resolve in exactly **1** redirect hop to a final `200`.
  - **Transient note:** the very first pass, taken ~10–20 seconds after deploy, showed 3 of the 17 paths (`/construction-advisory`, `/adu-builder-cape-cod.html`, `/home-additions-cape-cod.html`) still returning the old `307` with a relative `Location` — consistent with Cloudflare edge-propagation lag immediately after a deploy, not a code defect (the other 14 of 17 were already correct in that same pass). A retest ~20 seconds later showed all 3 corrected. A full clean re-run after that showed **17/17 pass, 0 fail**.
- **9/9 canonical pages** (`/`, `/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages): `200`, not redirected.
- **No redirect loops**: spot-checked that `/about/`, `/gallery/`, `/construction-advisory/` (the redirect *targets*) return `200` directly, not another redirect.
- **`/sitemap.xml`, `/robots.txt`, `/css/styles.css`**: all `200`, unaffected.
- **`/api/contact`**: `GET` still returns `405 Method Not Allowed` with `Allow: POST`, unaffected by the routing change. **No test customer inquiry was submitted** — the owner's explicit instruction was not to submit another live inquiry without separate authorization; the previously-established end-to-end baseline stands.
- Monitoring: attached `wrangler tail` for a short live window immediately after deploy and generated a few requests; no exceptions were observed in that window. This is a thin signal (the tail session's connection timing did not clearly overlap every generated request), so the stronger evidence of health is the functional verification above, not the tail session itself.

## Change B — `www` Redirect Rule (not applied; owner action required)

- **Confirmed before attempting anything:** `www.collaborativeconstructionllc.com` still resolves via DNS to the same Cloudflare anycast IPs as the apex (still proxied/orange-cloud, unchanged). A direct TLS handshake against `www` succeeds and presents a certificate with SAN `*.collaborativeconstructionllc.com`, which **covers `www`** — certificate coverage is valid; the 522 is not a certificate problem. `http://www.../` now returns a `301` to `https://www.../` (the zone's existing "Always Use HTTPS" edge behavior, unrelated to this change, applied before reaching any backend) and `https://www.../` still returns `522` — consistent with the already-documented root cause (no Worker custom domain/route bound to `www`; Cloudflare has a proxied connection with nothing to connect to).
- **Attempted the API write** (`PUT /zones/{id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`) with the existing wrangler OAuth token, specifically to check whether it could apply the change — it returned `401`/`10000 Authentication error`, identical to the earlier read-only check. **This confirms, rather than assumes, that the credential cannot write Redirect Rules; nothing was created.** A follow-up read of the same endpoint still returns the same `401`, consistent with no change having occurred.
- Per the explicit instruction not to grant additional API permissions or create a new Worker custom domain, this change was **not applied**. Exact dashboard steps were handed to the owner in chat (Rules → Redirect Rules → Create rule → Single Redirect → wildcard pattern `http*://www.collaborativeconstructionllc.com/*` → target `https://collaborativeconstructionllc.com/${2}` → 308, Preserve query string enabled).
- **Owner action required**, independent of Change A. The www Redirect Rule rollback (future: disable/delete the rule in the dashboard) is independent of the Worker rollback below.

## Rollback (Change A only; preserves all customer data)

```sh
npx wrangler rollback 28d3bb86-6417-4266-a3b0-c12e28f8c37f --name collaborativeconstructionllc-com --message "Emergency SEO-redirect release rollback; retain all D1 and R2 data"
```
This restores the previous Worker code/assets version (the one with 307 legacy redirects, functionally safe, just non-optimal for SEO) and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Recheck bindings/secrets before rolling back if anything else changed in between.

## Search Console / indexing state (unchanged — preserved deliberately)

No indexing request was submitted and the sitemap was not resubmitted, per explicit instruction. State remains as recorded in `docs/research/18-indexing-audit.md` Sections 3a/4a: 8 of 9 canonical pages indexed, `/about/` pending (owner plans to request once the daily quota resets), sitemap `isPending: true` with 0 errors/warnings (confirmed via Google's own API docs to mean "not yet processed," not "never submitted"). This release does not resolve the sitemap processing status and does not claim to.

## Cross-references

`docs/research/18-indexing-audit.md` (Sections 1a, 1b, 3a, 4a, 6a, 7) — the pre-deployment local verification this release was built on. `docs/releases/2026-10-12-intake-release.md` — the unrelated, earlier intake-system release baseline (different commit lineage; not touched by this release).
