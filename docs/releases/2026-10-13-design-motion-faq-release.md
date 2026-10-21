# Header cleanup + service-page FAQ pattern — production release — 2026-10-13

Status: **Deployed and verified live.** No database migration, no `worker/index.js` change, no new binding, no customer data touched, no Git push to `origin`, no merge to `main`. The owner reviewed the local-preview summary in chat and gave explicit authorization to publish ("publish it") after being told exactly what that would do (deploy the already-committed local changes to the live Cloudflare Worker).

Deployed exact commit `ff8cfb4` (branch `design/site-refresh-2026-10`, not merged into `main`).

## What was approved

1. **Header cleanup** — removed a duplicate small logo badge rendered next to the wordmark in the top-left `.brand` element (`.brand .c-badge` / `.brand:hover .c-badge` CSS rules). The header now renders exactly one logo element. This did not touch the separate, intentional `.c-badge` usages in the footer brand lockup (`.footer-logo .c-badge`) or the about-page owner photo (`.owner-photo .ph-inner .c-badge`) — those are different markup locations using the same CSS class name for an unrelated purpose and were left alone.
2. **Native-disclosure FAQ pattern** — a new shared Nunjucks macro (`src/_includes/faq.njk`) rendering accessible, zero-JS `<details>/<summary>` FAQ sections, added to all 6 service/advisory pages (general contractor, home additions, ADU, home renovation, custom home, construction advisory). Every answer restates content already present elsewhere on the same page or in already-approved business facts; no new claim, price, promise, or credential was introduced. Pattern idea adapted (not copied) from the MIT-licensed pattern lab already present in `~/.claude/skills/creative-website-design/assets/pattern-lab/`; all markup/CSS/copy here is original and scoped to this site's own design tokens.
3. Supporting CSS for `.faq-item` etc. in `css/styles.css`, including a scoped `prefers-reduced-motion` override consistent with this file's existing per-component convention (not a sitewide rule).

Full implementation detail, source/license notes, and verification narrative: `docs/implementation/2026-10-13-design-motion-handoff.md`.

## What was explicitly not part of this release

- No visual-direction overhaul — the existing identity was judged coherent; only the two defects above were addressed.
- No before/after comparison slider (no matching asset pairs exist).
- No video or hero change (hero stays a static image; an autoplaying hero video was previously removed at the owner's request after it caused an 11.9s LCP regression — not reintroduced).
- No change to `worker/index.js`, intake/Turnstile/honeypot logic, migrations, or any D1/R2 binding.
- No merge to `main`, no push to `origin` — same standing constraint as every prior release.
- The usual unrelated uncommitted working-tree files (research notes, local lead-dashboard viewer, etc.) remain untouched.

## Preflight, before touching production

- Confirmed active production Worker version was `77344f5d-dcbf-4ed3-90b7-0a45d4514b44` (created 2026-10-13T21:28:34Z, 100% traffic) via `wrangler deployments list` — this is the rollback target for this release.
- Used Node v22.23.3 (via `nvm`) for every Wrangler/test command, same as every prior release.
- Created a **fresh, isolated `git worktree`** at `/tmp/cc-release-deploy-ff8cfb4`, detached at the exact deployed SHA (`ff8cfb4`). Confirmed a clean working tree and no `.env`/secret-looking files present.
- In that isolated checkout:
  - `npm ci` — clean, 163 packages.
  - `npm test` — **88/88 pass, 0 fail, 0 skipped.**
  - `npm run build` — 11 files written, no errors.
  - `node scripts/verify-release-build.mjs` — passed: 51 public files, trap/challenge contracts, message bounds, private-file exclusion, local link resolution, sitemap/canonical/robots/JSON-LD invariants held across 9 pages.
  - `npx wrangler deploy --dry-run` — succeeded; bindings matched the known-good set exactly (D1 `cc-leads`, R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS` env vars) — no drift from the prior release's recorded bindings.

## Deployment

```sh
cd /tmp/cc-release-deploy-ff8cfb4   # isolated worktree at ff8cfb4
npx wrangler deploy
```

- **New Worker version:** `00c4ba2e-dee6-4c69-9771-954ac685cd8d`
- **Traffic:** 100%
- **Assets uploaded:** 11 new/modified (9 canonical HTML pages, `css/styles.css`, `sitemap.xml`), 40 already-uploaded assets unchanged, 63 total read from `_site`.
- **Production URL:** `https://collaborativeconstructionllc.com` / `https://collaborativeconstructionllc-com.wesleighb.workers.dev`
- Bindings reported at deploy time matched the preflight dry-run exactly.

## Post-deploy production verification (live, against `https://collaborativeconstructionllc.com`)

- Homepage and all 8 other canonical pages (`/about/`, `/gallery/`, `/construction-advisory/`, and all 5 service pages): **200** each.
- `css/styles.css` live contains the new `.faq-item` rules (12 matches on `faq-item`).
- `/general-contractor-falmouth-ma/` live HTML contains 4 `class="faq-item"` elements — the FAQ pattern is rendering.
- Homepage live HTML contains exactly one `class="c-badge"` (the footer lockup) and exactly one `class="logo"` (the header) — the duplicate header icon is gone and the unrelated footer/about-page usages are intact.
- No test customer inquiry was submitted — not needed for a pure markup/styling change, consistent with the standing instruction not to submit a live inquiry without separate authorization. The intake path (`worker/index.js`, Turnstile, D1, R2, email) was not touched by this release; its existing test coverage (`tests/intake.test.mjs`, `tests/honeypot-regression.test.mjs`, `tests/lead-operations.test.mjs`, `tests/d1-read.test.mjs`) passed as part of the 88/88 run above.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 77344f5d-dcbf-4ed3-90b7-0a45d4514b44 --name collaborativeconstructionllc-com --message "Revert header-cleanup/FAQ release; restore prior header and service pages"
```

This restores the immediately-prior Worker version and does not touch D1, R2, or any stored lead/workflow data. Do not run database migrations, restore a snapshot, or rotate credentials as part of a rollback.

## Still open (not resolved by this release)

- None of the 7 gallery projects has confirmed attribution — still true, still flagged, not addressed here.
- License/insurance exact wording on the site — still open.
- The independent Claude review from 2026-10-11 is still **not** completed (account weekly limit).

## Cross-references

- `docs/implementation/2026-10-13-design-motion-handoff.md` — full design/motion handoff deliverables doc for this round.
- `docs/releases/2026-10-13-header-logo-recolor.md` — the immediately-prior release (header text recolor), whose Worker version (`bf2a57a5-...`) is the release-before-last and unaffected by this one.
