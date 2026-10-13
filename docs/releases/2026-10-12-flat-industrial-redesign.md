# Flat charcoal/orange redesign — production release — 2026-10-12 (night)

Status: **Deployed and verified live.** No database migration, no Git push to `origin`, no new customer inquiry, no credential rotation, no new Worker custom domain. The owner approved the full visual redesign and its publication in chat ("Full redesign to match the screenshot" + explicit "publish...on the real site" / "can you publish this on the real website every change you made please"); this record exists to capture exactly what happened.

## What was approved

A full flat "Contractor Industrial" visual redesign (header, hero, cards, footer; charcoal `#2b2d31` + orange `#d9531e` palette; removal of the ambient gold-sparkle background and "bubble panel" section styling) across the whole site — home, about, gallery, construction-advisory, and all 5 service pages — matching an owner-supplied reference screenshot of the real site content rendered in that style. Separately, removal of the custom trailing cursor (site now uses the plain OS/browser default cursor), and two documentation-only additions (Frontend/Backend context sections in `AGENTS.md`, not deployed — docs aren't part of the Worker assets).

Deployed exact commit `df04548` on branch `phase1-release-prep`.

## Preflight, before touching production

- Confirmed the active production Worker version was `af880324-009c-48b2-80b0-eba3bf891f72` (created 2026-10-12T23:29:56.461Z, 100% traffic) via `wrangler deployments list` — this is the version from the prior same-day SEO/redirect release, unchanged since then, no drift.
- Confirmed account `0fadcd0965374caa75a44c3aa9784042` (`Wesleighb@gmail.com's Account`) via `wrangler whoami`.
- Local Node was v20.20.2 (too old for Wrangler's `>=22` requirement); switched to the already-installed Node v22.23.3 via `nvm` for every Wrangler/test command in this release.
- Committed only the 4 files belonging to this change (`css/styles.css`, `js/main.js`, `src/_includes/base.njk`, `AGENTS.md`) with a precise pathspec `git add` — not `git add -A`. The repo had ~88 unrelated pre-existing uncommitted files (prior research/skills work, a local lead-dashboard viewer, a color-palette preview page) that were deliberately left untouched and are not part of this release.
- Created a **fresh, isolated `git worktree`** at `/tmp/cc-release-deploy-df04548`, detached at the exact deployed SHA. Confirmed a clean working tree (0 uncommitted changes) and no `.env`/secret-looking files present.
- In that isolated checkout, under Node 22.23.3:
  - `npm ci` — clean, 163 packages.
  - `npm test` — **84/84 pass, 0 fail, 0 skipped.** (Confirms the "42 failing" result seen earlier in the session under Node 20 was a local Node-version artifact, not a real regression — same test file, same code, 0 failures under the Wrangler-supported Node version.)
  - `npm run build` — 11 files written, no errors.
  - `node scripts/verify-release-build.mjs` — passed: 50 public files, trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants all held across 9 pages.
  - `npx wrangler deploy --dry-run` — succeeded; bindings matched the known-good set exactly (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS` env vars) — no drift from the prior release's preflight.

## Deployment

```sh
cd /tmp/cc-release-deploy-df04548   # isolated worktree at df04548
npx wrangler deploy
```

- **New Worker version:** `32a7e4de-f01e-40fa-8261-44f64f3f5113`
- **Created:** 2026-10-12 (this session, immediately after the command above)
- **Traffic:** 100%
- **Assets uploaded:** 11 new/modified (the 9 canonical HTML pages, `css/styles.css`, `js/main.js`), 39 already-uploaded assets unchanged, 62 total read from `_site`.
- **Production URL:** `https://collaborativeconstructionllc.com` (custom domain) / `https://collaborativeconstructionllc-com.wesleighb.workers.dev` (workers.dev)
- Bindings reported at deploy time matched the preflight dry-run exactly.

## Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`)

- **Homepage**: `200`.
- **All 8 other canonical pages** (`/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages): `200`, unaffected by the styling change.
- **New palette live**: `curl`'d `/css/styles.css` directly — `--maroon: #2b2d31;` and `--amber: #d9531e;` confirmed in the live `:root` block.
- **Custom cursor removed**: `js/main.js` and `css/styles.css` on the live site contain no functional `.cc-cursor` rules or cursor-creation code — the only remaining matches for "cc-cursor" are the two explanatory code comments documenting the removal, confirmed by inspecting the surrounding lines directly from the live files.
- **New particle colors live**: live `js/main.js` click-burst `COLORS` array reads `["#d9531e", "#e8793a", "#f3b68c", "#2b2d31"]`.
- **`theme-color` meta tag**: live homepage `<meta name="theme-color" content="#2b2d31">`, matching the new charcoal palette.
- **Unaffected systems, spot-checked**: `/sitemap.xml` (`200`), `/robots.txt` (`200`), `GET /api/contact` (still `405 Method Not Allowed`, unaffected by a styling-only release). **No test customer inquiry was submitted** — not needed for a pure asset/styling change, and consistent with the standing instruction not to submit a live inquiry without separate authorization.
- Local verification (Claude Preview, before this deploy) already covered: homepage scroll-through (hero, inquiry-path cards, services grid, about/advisory blurb, quote band, ADU section, contact form, footer), the about page (bio card, pull-quote, value-circles grid), the gallery page (intro + carousel), one service page (`/adu-builder-cape-cod/`, hero + service cards), and construction-advisory (pinned step cards, Clerk of the Works, ambient ::before/::after glow sections) — all rendered correctly in the new palette with no leftover maroon/gold and no layout breakage from the bubble-panel/sparkle removal.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback af880324-009c-48b2-80b0-eba3bf891f72 --name collaborativeconstructionllc-com --message "Revert flat charcoal/orange redesign; restore prior maroon/gold theme with custom cursor"
```

This restores the immediately-prior Worker version (the SEO/redirect-release code with the maroon/gold theme and custom cursor still present) and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback. Recheck bindings/secrets before rolling back if anything else changed in between.

## What was explicitly not part of this release

- `AGENTS.md`'s new Frontend/Backend context sections were committed in the same commit (`df04548`) for convenience but have no runtime effect — `AGENTS.md` is not part of `_site/` and was not uploaded as a Worker asset.
- The local-only lead-dashboard viewer (`scripts/dashboard.mjs`, `scripts/lib/dashboard-render.mjs`, `tests/dashboard-render.test.mjs`) and `docs/design/color-palette-preview.html` remain uncommitted, as before — unrelated to this release, left untouched per the precise-pathspec-commit discipline above.
- No change to `main`, no push to `origin`, no merge — same standing constraints as every prior release this session.

## Cross-references

`docs/releases/2026-10-12-seo-redirect-release.md` — the immediately-prior release (rollback target for this one). This session's conversation — the redesign's design rationale, the full list of CSS/JS files touched, and the Claude Preview verification walkthrough.
