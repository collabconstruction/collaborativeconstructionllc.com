# About page simplification: remove quote + value-circle grid, production release, 2026-10-14

Status: **Deployed and verified live.** No database migration, no Git push to `origin`, no new customer inquiry, no credential rotation, no new Worker custom domain. The owner's exact request: "please remove this part of the website and have it be a simple about me page this is too much" followed by the quote text and all 13 value-circle phrases, then explicit "please deploy it".

## What was approved

The About page's `.owner-card` contained, below the owner photo/bio, a centered pull-quote ("Quality is never an accident, it's the result of showing up every day") and a 13-phrase animated "value circle" grid (`Built on Trust`, `Shared Vision`, `Built With Purpose`, `Strong Foundations`, `Details Matter`, `Pride in the Work`, `Creating What Comes Next`, `Turning Ideas Into Reality`, `Built Through Partnership`, `Building What Matters`, `More Than a Project`, `Quality Matters`, `Precision & Purpose`) that dropped into a 5-column grid and bobbed in place on scroll. The owner found this "too much" and asked for a simple About page instead.

Removed entirely: the quote blockquote and the whole `values-grid` block. The page now reads hero → owner photo → name/title → two short bio paragraphs → footer.

## Files changed

- `src/about.njk`, removed the `owner-quote` blockquote and the 13-item `values-grid`/`value-circle` markup (25 lines).
- `js/main.js`, removed the ~47-line value-circle drop/bob animation script (`#values-grid` lookup, `IntersectionObserver`, per-circle stagger-delay stamping). Its only trigger element no longer exists in any template, so this was dead code, not just visually hidden.
- `css/styles.css`, removed `.owner-quote`, `.quote-band__text.owner-quote` (and its mobile override), `.values-grid`, `.value-circle` (base + `v-maroon`/`v-maroon-900`/`v-gold`/`v-outline` variants), `@keyframes circleDrop`/`circleBob`, and the related mobile/`prefers-reduced-motion` overrides (122 lines). Left `.quote-band__text` (the base, unmodified-selector class) untouched, the homepage's own quote band (`src/index.njk`) still uses it independently.

All three files: pure deletions, zero additions (195 lines removed, 0 added).

## Preflight, before touching production

- Confirmed the active production Worker version was `2df7f1c9-d140-45cb-91d3-1ef65f78f42e` (the 2026-10-14 GA4 measurement-ID activation release, still 100% traffic, no drift since) via `wrangler deployments list`; this is the rollback target for this release.
- Local Node was v20.20.2 (too old for Wrangler's `>=22` requirement); switched to the already-installed Node v22.23.3 via `nvm` for every Wrangler/test command, same as every prior release.
- **Isolated the change, same pattern as the 2026-10-14 GA4 release**: the working branch (`design/site-refresh-2026-10`) has since accumulated several docs-only commits beyond what's actually live (GA4 diagnosis notes, accounts/integrations reference, a competitor-scan routine doc) that were never deployed and aren't part of this approved change. Rather than deploy branch HEAD, built a release candidate in a fresh, isolated `git worktree` detached at `ff8cfb4` (the last commit before the GA4 fix, confirmed via `git log ff8cfb4..HEAD -- src/about.njk js/main.js css/styles.css` to have zero intervening changes to these three files, meaning the uncommitted working-tree diff was portable as-is), cherry-picked `9fb6ac8` (the 2-line analytics.json GA4 measurement-ID change, reproducing the exact current production baseline), then committed the three About-page files on top as `70c7916`.
- Confirmed via `git diff --stat` in the worktree that the ported change was byte-identical to the original working-tree diff (195 deletions, 0 additions, same 3 files) before committing, not a hand-edit, a verified copy.
- In that isolated worktree, under Node 22.23.3:
  - `npm ci`: clean, 163 packages (audit warnings pre-existing, unrelated to this change).
  - `npm test`: **88/88 pass, 0 fail, 0 skipped.**
  - `npm run build`: 11 files written, no errors.
  - `node scripts/verify-release-build.mjs`, passed: 51 public files, trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants all held across 9 pages.
  - `npx wrangler deploy --dry-run`: succeeded; bindings matched the known-good set exactly (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS` env vars), no drift.
- Before deploying, showed the owner a local Claude Preview of the simplified `/about/` page (hero, photo, bio, no quote, no value circles) for confirmation.

## Deployment

```sh
cd /tmp/cc-release-about-simplify   # isolated worktree, detached at ff8cfb4 + cherry-pick 9fb6ac8 + commit 70c7916
npx wrangler deploy
```

- **New Worker version:** `4a02db5b-a1ca-494f-8565-1d55898fd21a`
- **Created:** 2026-10-14 (this session, immediately after the command above)
- **Traffic:** 100%
- **Assets uploaded:** 4 new/modified (`/about/index.html`, `/css/styles.css`, `/js/main.js`, `/sitemap.xml`, the last is just a `lastmod` timestamp bump from the build), 47 already-uploaded assets unchanged, 63 total read from `_site`.
- **Production URL:** `https://collaborativeconstructionllc.com` (custom domain) / `https://collaborativeconstructionllc-com.wesleighb.workers.dev` (workers.dev)
- Bindings reported at deploy time matched the preflight dry-run exactly.

## Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`)

- **Homepage**: `200`.
- **All 8 other canonical pages** (`/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages): `200`.
- **Removed content confirmed absent, live**: `curl`'d `/about/`, zero occurrences of the quote text, "Built on Trust", `values-grid`, or `value-circle`. Bio content (`Wesleigh Behn`, `A Local Foundation`) confirmed still present.
- **Dead code confirmed absent from deployed assets**: `curl`'d the live `/css/styles.css` and `/js/main.js`, zero occurrences of `values-grid`, `value-circle`, `circleDrop`, or `circleBob` in either file.
- **No test customer inquiry was submitted**: not needed for a content/styling removal, consistent with the standing instruction not to submit a live inquiry without separate authorization.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 2df7f1c9-d140-45cb-91d3-1ef65f78f42e --name collaborativeconstructionllc-com --message "Revert About page simplification; restore quote and value-circle grid"
```

This restores the immediately-prior Worker version (the 2026-10-14 GA4 measurement-ID activation, which already included everything up through `ff8cfb4` + the GA4 fix) and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Recheck bindings/secrets before rolling back if anything else changed in between.

## What was explicitly not part of this release

- No change to `main`, no push to `origin`, no merge, same standing constraints as every prior release.
- Nothing from the docs-only commits accumulated on `design/site-refresh-2026-10` since the last deploy (GA4 diagnosis notes, accounts/integrations reference, competitor-scan routine doc) was deployed, this release is isolated to exactly the three files listed above, on top of the exact current production baseline.
- The usual uncommitted, unrelated files (local lead-dashboard viewer, assorted research docs) remain uncommitted, untouched, not part of this release.

## Cross-references

- `docs/releases/2026-10-14-ga4-measurement-id-activation.md`, the immediately-prior release (rollback target for this one), and the source of the `ff8cfb4` + `9fb6ac8` baseline this release was isolated on top of.
- This session's conversation: the owner's "too much" feedback, the before/after Claude Preview walkthrough, and the local test/build verification preceding this deploy.
