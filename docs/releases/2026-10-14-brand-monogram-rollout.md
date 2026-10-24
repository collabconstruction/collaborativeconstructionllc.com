# New CC monogram: site-wide brand rollout, production release, 2026-10-14

Status: **Deployed and verified live.** No database migration, no Git push to `origin`, no new customer inquiry, no credential rotation, no new Worker custom domain. The owner supplied the mark as an image attachment with the request: "Here is the logo I want to be used across the entire website please implement it now ignore color scheme line ups just get the logo across the entire website." Deployment and the two bundled cleanups were approved explicitly before the release candidate was cut.

## What was approved

A new brand mark: a square gold (`#bda16a`) "CC" monogram, 1024×1024, transparent background, no lettering. It replaces the gold **house outline** identity everywhere it appeared.

The owner waived color-scheme and alignment polish ("ignore color scheme line ups"). The gold mark already reads well on the charcoal header and footer, so no recolouring was needed.

Two cleanups were approved alongside the rollout: deleting the orphaned `assets/c-icon-old.png`, and recording the asset pipeline in `AGENTS.md`.

## Why the header needed markup changes, not just a file swap

The old identity shipped as two unrelated exports:

- `logo-header.png`, a **wide 1762×552 lockup** with the house icon, the company name, *and* the "EXPERIENCE · QUALITY · TRUST" tagline all baked into the pixels.
- `c-icon.png`, a square badge pairing the house with maroon "CC" letters.

Because the new mark carries no lettering, dropping it into the old `<img>` would have left the header with a small square icon and **no company name at all**, the header's only wordmark lived inside that PNG. The header is now a mark plus real HTML text (`.brand-wm`), which is the same mark-beside-wordmark lockup `.footer-logo` already used. The name is now selectable, searchable, and sharp at every breakpoint instead of being resampled artwork.

## Files changed

- `brand/cc-monogram.png`, **new.** The owner's pristine master, version-controlled but deliberately outside both Eleventy's `src/` input dir and the passthrough-copy list, so it is never published. Confirmed absent from `_site/` and from production.
- `scripts/build-brand-assets.mjs`, **new, 93 lines.** Derives all four renditions from that one master. Reads the alpha channel directly to find the trim box, because sharp's own `.trim()` thresholds on colour distance from a corner pixel and cannot distinguish a transparent pixel from a faint antialiased one. Always resamples from the master, never from another rendition, an earlier draft chained them and compounded softening on every run. Verified idempotent: two consecutive runs produce byte-identical output.
- `assets/logo.png`, `logo-header.png`, `c-icon.png`, `favicon.png`, regenerated. Filenames deliberately reused so every existing reference picks up the new mark and no URL breaks, per the asset-URL principle in `eleventy.config.js`.
- `assets/c-icon-old.png`, **deleted.** 93 KB, zero references in `src/`, `css/`, `js/`, or built output, and it was the previous brand's badge.
- `src/_includes/base.njk`, header brand lockup → mark + `.brand-wm` text. `alt=""` on the mark since the name is now readable beside it; the anchor keeps its `aria-label`.
- `css/styles.css`, `.brand .logo` → fixed 52px square, new `.brand-wm`; 940px breakpoint drops the `max-width`/`object-fit`/`object-position` rules that existed only to squeeze the old wide lockup into a narrow bar (mark → 44px, wordmark → 1.05rem), and loses a stray duplicate `.brand .logo { height: 40px }` from the bottom of the same block; 380px breakpoint hides the wordmark and shows the mark alone at 40px; `.footer-logo .c-badge` loses its `position:relative; top:5px` optical nudge, which existed because the old house icon sat high in its own canvas. Two stale comments describing the house mark refreshed.
- `AGENTS.md`, three lines under Frontend context recording that brand renditions are generated, not hand-exported, and listing the six consuming surfaces.

### Size effect

| File | Before | After |
|---|---|---|
| `logo.png` | 149,695 B | 4,501 B |
| `logo-header.png` | 144,988 B | 2,435 B |
| `c-icon.png` | 8,898 B | 1,587 B |
| `favicon.png` | 2,646 B | 1,156 B |
| `c-icon-old.png` | 93,779 B | deleted |

~400 KB → 9.7 KB. Flat colour on transparency palettises extremely well; small renditions also get proportionally less padding (96% fill at 64px vs 86% at 1024px) because whitespace that reads as breathing room on the large mark just wastes pixels on a favicon.

### A sixth brand surface that no template grep finds

`.adu::after` (`css/styles.css`) paints `url('../assets/c-icon.png')` as a 360px watermark at `opacity:.05` behind the ADU section. It is a **CSS background**, so it does not appear in any search for logo markup in templates. It picked up the new mark automatically only because the filename was reused. The full set is: `<link rel="icon">`, `<link rel="apple-touch-icon">`, the header lockup and footer badge (all `base.njk`), the gallery intro mark (`gallery.njk`), and this watermark. This is now recorded in `AGENTS.md` so a future rename does not silently miss it.

## Preflight, before touching production

- Confirmed the active production Worker version was `4a02db5b-a1ca-494f-8565-1d55898fd21a` (the 2026-10-14 About-page simplification, still 100% traffic) via `wrangler deployments list`; this is the rollback target for this release.
- Local Node was v20.20.2 (too old for Wrangler's `>=22`); switched to Node v22.23.3 via `nvm` for every Wrangler/npm command, same as every prior release.
- **Isolated the change on the exact live baseline.** The working tree carried *two* changes and only one was live: the About-page simplification is already in production but was deployed from a throwaway worktree and never committed to `design/site-refresh-2026-10`, so it still read as uncommitted. Branch HEAD (`668ac24`) meanwhile carried docs-only commits never deployed. Deploying from either would have been wrong. The previous release worktree survived at **`70c7916`**, the precise commit production was built from, so this release needed no cherry-pick reconstruction: a fresh `git worktree` detached at `70c7916` is the live baseline by construction. Verified `git log ff8cfb4..HEAD` shows **zero** intervening commits touching `css/styles.css`, `src/_includes/base.njk`, `assets/`, or `AGENTS.md`, so the working-tree versions were portable as-is.
- **Verified the ported diff isolates correctly before committing.** In the main working tree `css/styles.css` shows 168 changed lines; in the release worktree it shows **46**. The 122-line difference is exactly the About-page value-circle CSS, which is already in the baseline. Confirmed the release's CSS diff contains **zero** occurrences of `values-grid`, `value-circle`, `circleDrop`, `circleBob`, or `owner-quote`, and touches only `.brand`, `.brand-wm`, `.logo`, `.footer-logo`, `.c-badge`, and the `.adu` comment. Committed as `95fc442`.
- In that isolated worktree, under Node 22.23.3:
  - `npm ci`: clean, 163 packages (audit warnings pre-existing, unrelated).
  - `npm test`: **88/88 pass, 0 fail, 0 skipped.** (Fewer total than the main tree's 105 because this baseline predates later test additions, same count as the previous release.)
  - `npm run build`: 11 files written, 39 copied, no errors.
  - `node scripts/verify-release-build.mjs`, passed: **50** public files (was 51; the drop is exactly `c-icon-old.png`), trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants all held across 9 pages.
  - `npx wrangler deploy --dry-run`: succeeded; all 7 bindings matched the known-good set exactly (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, rate limiter 5/60s, `ASSETS`, `LEAD_INBOX`, `LEAD_FROM_ADDRESS`), no drift.
- Before deploying, the simplified header, footer and gallery mark were reviewed in a local Claude Preview at 1280 / 768 / 375px. Both lockups measured **0px** centring offset between mark and wordmark.

## Deployment

```sh
cd /tmp/cc-release-logo-monogram   # isolated worktree, detached at 70c7916 + commit 95fc442
npx wrangler deploy
```

- **New Worker version:** `64aafab0-3f8c-4a3f-a152-d81a3adc1798`
- **Created:** 2026-10-14 (this session, immediately after the command above)
- **Traffic:** 100%
- **Assets uploaded:** 14 new/modified (9 page HTMLs re-rendered with the new header markup, the 4 brand assets, and a `sitemap.xml` `lastmod` bump), 36 already-uploaded assets unchanged, 62 total read from `_site`.
- **Total upload:** 21.88 KiB / 7.17 KiB gzipped.
- **Production URL:** `https://collaborativeconstructionllc.com` (custom domain) / `https://collaborativeconstructionllc-com.wesleighb.workers.dev` (workers.dev)
- Bindings reported at deploy time matched the preflight dry-run exactly.

## Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`)

- **All 9 canonical pages**: `200` (homepage, `/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages).
- **Every brand asset is byte-identical to the locally generated file**, SHA-256 of each live asset compared against the local copy: `logo.png`, `logo-header.png`, `c-icon.png`, `favicon.png` all **MATCH**. Live sizes 4,501 / 2,435 / 1,587 / 1,156 bytes, confirming the new mark shipped rather than a cached old export.
- **Orphaned badge confirmed gone**: `/assets/c-icon-old.png` returns `404`.
- **New header markup live on all 9 pages**: `class="brand-wm"` present 9/9; the live homepage header is the mark `<img>` with `alt=""` plus the `Collaborative<br>Construction` wordmark.
- **Baseline isolation confirmed by the live result**: `/about/` has **zero** occurrences of `values-grid`, `value-circle`, or the removed quote text, and still carries the bio content (`Wesleigh Behn`, `A Local Foundation`). The previous release was neither reverted nor duplicated.
- **No test customer inquiry was submitted**: not needed for a branding/asset change, consistent with the standing instruction not to submit a live inquiry without separate authorization.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 4a02db5b-a1ca-494f-8565-1d55898fd21a --name collaborativeconstructionllc-com --message "Revert CC monogram rollout; restore house-mark branding"
```

This restores the immediately-prior Worker version (the 2026-10-14 About-page simplification), which keeps that simplification live while bringing back the house mark. Because the asset filenames were reused, a rollback simply swaps the bytes back with no dangling references, the only exception is `c-icon-old.png`, which was unreferenced in both directions and so cannot break anything either way. Does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Recheck bindings/secrets before rolling back if anything else changed in between.

## What was explicitly not part of this release

- No change to `main`, no push to `origin`, no merge, same standing constraints as every prior release.
- Nothing from the docs-only commits accumulated on `design/site-refresh-2026-10` since the last deploy was included. This release is exactly `70c7916` + one commit.
- No palette change. `:root` is untouched; the gold mark simply sits on the existing charcoal header and footer, per the owner's "ignore color scheme" instruction.
- The usual uncommitted, unrelated files in the main working tree (local lead-dashboard viewer, assorted research docs) remain uncommitted and untouched.

## Follow-up worth noting

The main working tree still shows the brand change as uncommitted, because, exactly as with the previous release, production was deployed from an isolated worktree and `design/site-refresh-2026-10` has not been updated. Two consecutive releases now live only in `/tmp` worktrees (`70c7916`, `95fc442`). Consider committing both to the branch so the deployed state is recoverable from the repository rather than from temporary directories.

## Cross-references

- `docs/releases/2026-10-14-about-page-simplify.md`, the immediately-prior release, the rollback target for this one, and the source of the `70c7916` baseline this release was built on.
- `AGENTS.md`, Frontend context, the brand-asset pipeline and the six consuming surfaces.
- `scripts/build-brand-assets.mjs`, regenerate every rendition if the mark is ever revised.
