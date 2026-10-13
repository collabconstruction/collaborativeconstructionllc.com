# Header logo recolor (gold house / white text / red tagline) — production release — 2026-10-13

Status: **Deployed and verified live.** No database migration, no Git push to `origin`, no new customer inquiry, no credential rotation, no new Worker custom domain. The owner approved this in chat in two steps: first "in the top left the collaborative contruction text needs to be white instead please make that stuff visible" (addressed, then reviewed by the owner), then "well can you make the house gold still and the experience quality and trust different colors like red something like that" (refinement), then explicit "push the changes please to the real page". This record exists to capture exactly what happened.

## What was approved

A fix for the header "Collaborative Construction" wordmark, which had become illegible after the prior night's flat charcoal/orange redesign (`df04548`) flattened the header background to a near-black solid (`var(--maroon-900)` = `#1a1a1a`) — the logo is a raster PNG (`assets/logo.png`) with black text and a dark maroon tagline baked into the pixels, so it had very poor contrast against the new background.

Two iterations happened in this session:
1. First pass: a CSS `filter: brightness(0) invert(1)` on `.brand .logo`, which forced the entire raster image (house icon included) to pure white. Shown to the owner in local preview.
2. Owner asked to keep the house icon gold and give the tagline a distinct color ("like red"). The CSS-filter approach can't selectively recolor regions of a flat raster image, so it was replaced with a dedicated recolored image asset instead (see "How the new asset was made" below), and the CSS filter was removed.

Final result, confirmed in local preview and now live: house icon unchanged (gold gradient), "Collaborative Construction" text white, "EXPERIENCE · QUALITY · TRUST" tagline red (`#dc2626`) — all legible against the charcoal header.

Deployed exact commit `07ac854` on branch `phase1-release-prep`.

## How the new asset was made

`assets/logo.png` (1762×552 PNG, RGBA) was read with the `sharp` library already available in the project's `node_modules` and recolored by a one-off Node script (not committed — run ad hoc from the repo root) that reclassified every opaque pixel by color and replaced only two of the three regions:

- Near-black, low-saturation pixels (the serif text + the thin vertical divider bar) → forced to white `(255,255,255)`.
- Pixels where `R - G > 40` (the dark maroon tagline letters — this is a much stronger red/green split than anything in the gold house icon, which tops out around `R - G ≈ 35` even at its darkest) → forced to red `(220,38,38)` / `#dc2626`.
- Everything else (the gold/tan house-icon gradient, transparent padding) → left untouched.

Alpha channel was preserved throughout, so edges/anti-aliasing are unaffected. Output written to `assets/logo-header.png`. The original `assets/logo.png` (master brand asset, black text, usable on light backgrounds) was **not modified** — it remains on disk for any future light-background use.

## Files changed

- `assets/logo-header.png` — **new file**, the recolored header-only variant described above.
- `src/_data/business.json` — added `images.logoHeader: "/assets/logo-header.png"`; `images.logo` (master asset) unchanged.
- `src/_includes/base.njk` — the header `<img class="logo">` now sources `business.images.logoHeader` instead of `business.images.logo`.
- `css/styles.css` — removed the interim `filter: brightness(0) invert(1)` from `.brand .logo` (no longer needed — the new asset carries its own colors) and left an explanatory comment pointing at `assets/logo-header.png`.

## Preflight, before touching production

- Confirmed the active production Worker version was `32a7e4de-f01e-40fa-8261-44f64f3f5113` (created 2026-10-13T01:13:59.707Z, 100% traffic) via `wrangler deployments list` — this is the version from the immediately-prior same-night flat-redesign release, unchanged since then, no drift. This is the rollback target for this release.
- Local Node was v20.20.2 (too old for Wrangler's `>=22` requirement); switched to the already-installed Node v22.23.3 via `nvm` for every Wrangler/test command, same as every prior release this session/project.
- Committed only the 4 files belonging to this change (`assets/logo-header.png`, `css/styles.css`, `src/_data/business.json`, `src/_includes/base.njk`) with a precise pathspec `git add` — not `git add -A`. Confirmed via `git diff --stat` before committing that no unrelated file was swept in; the repo still has its usual ~80+ unrelated pre-existing uncommitted files (research/skills work, local dashboard viewer, color-palette preview page) which were left untouched.
- Created a **fresh, isolated `git worktree`** at `/tmp/cc-release-deploy-07ac854`, detached at the exact deployed SHA. Confirmed a clean working tree (0 uncommitted changes) and no `.env`/secret-looking files present.
- In that isolated checkout, under Node 22.23.3:
  - `npm ci` — clean, 163 packages (audit warnings pre-existing, unrelated to this change).
  - `npm test` — **84/84 pass, 0 fail, 0 skipped.**
  - `npm run build` — 11 files written, no errors.
  - `node scripts/verify-release-build.mjs` — passed: 51 public files, trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants all held across 9 pages.
  - `npx wrangler deploy --dry-run` — succeeded; bindings matched the known-good set exactly (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS` env vars) — no drift.

## Deployment

```sh
cd /tmp/cc-release-deploy-07ac854   # isolated worktree at 07ac854
npx wrangler deploy
```

- **New Worker version:** `bf2a57a5-f4e9-4466-8c67-abdd73bec4de`
- **Created:** 2026-10-13 (this session, immediately after the command above)
- **Traffic:** 100%
- **Assets uploaded:** 11 new/modified (the 9 canonical HTML pages, `css/styles.css`, `assets/logo-header.png`), 40 already-uploaded assets unchanged, 63 total read from `_site`.
- **Production URL:** `https://collaborativeconstructionllc.com` (custom domain) / `https://collaborativeconstructionllc-com.wesleighb.workers.dev` (workers.dev)
- Bindings reported at deploy time matched the preflight dry-run exactly.

## Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`)

- **Homepage**: `200`.
- **All 8 other canonical pages** (`/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages): `200`.
- **New asset live**: `GET /assets/logo-header.png` → `200`, 144,988 bytes — byte-identical to the locally generated file.
- **Wiring confirmed**: `curl`'d the live homepage HTML — `<img class="logo" src="/assets/logo-header.png" alt="Collaborative Construction">`, confirming `business.json`/`base.njk` changes took effect.
- **Pixel content confirmed**: downloaded the live `assets/logo-header.png` and visually inspected it — house icon gold, text white, tagline red, matching the local source exactly.
- **No test customer inquiry was submitted** — not needed for a pure asset/styling change, consistent with the standing instruction not to submit a live inquiry without separate authorization.
- Local verification (Claude Preview, before this deploy) already covered: full header render at native size and at a cropped/zoomed viewport confirming all three colors (gold house, white text, red tagline) are simultaneously legible against the charcoal `.site-header` background, at both desktop and mobile widths.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 32a7e4de-f01e-40fa-8261-44f64f3f5113 --name collaborativeconstructionllc-com --message "Revert header logo recolor; restore all-white filtered logo"
```

This restores the immediately-prior Worker version (the flat charcoal/orange redesign with the all-white-filtered logo) and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Recheck bindings/secrets before rolling back if anything else changed in between.

## What was explicitly not part of this release

- `assets/logo.png` (the master brand asset) was read but never modified — it is untouched on disk and in the deployed assets (already live from a prior release, unchanged byte-for-byte).
- No change to `main`, no push to `origin`, no merge — same standing constraints as every prior release.
- The usual uncommitted, unrelated files (local lead-dashboard viewer, `docs/design/color-palette-preview.html`, assorted research docs) remain uncommitted, untouched — not part of this release.

## Cross-references

`docs/releases/2026-10-12-flat-industrial-redesign.md` — the immediately-prior release, which introduced the charcoal header background that made the original logo illegible (rollback target for this one). This session's conversation — the two-step design iteration (all-white, then gold/white/red) and the Claude Preview verification walkthrough.
