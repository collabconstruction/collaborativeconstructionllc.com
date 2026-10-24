# Projects page photo reorganization, production release, 2026-10-22

Status: **Deployed and verified live.** No database migration, no credential rotation, no test
customer inquiry, no push to `origin`/`main`. The owner's request (via screenshots of the live
gallery): remove the lead exterior photo from "Modern Custom Residence" and split its remaining
photos into separate kitchen/bath/pool projects; merge Exteriors, Decks and railings, and Porches
and balconies into one "Decks and railings" section; split the Coastal Bath Remodel into two
projects (first two photos / last two photos); fold a stray cobblestone-kitchen photo into the
matching kitchen project. Then, explicitly: "now what i want everything live."

## The actual hazard this release had to solve

The source branch (`claude/projects-new-photos` in the `cc-gallery-photos` worktree, commit
`4effd80`, already pushed to `origin`) contains the correct gallery reorg, but the worktree as a
whole is **not** a safe wholesale deploy candidate: it was branched before several since-deployed
production changes landed elsewhere (a `.brand-wm` sizing increase, a redesigned hero-figure
border, a reweighted `.svc-path` grid), and it separately carries an unrelated, never-deployed
"affordable and competitive pricing" copy rewrite across the About/service pages and `llms.txt`
that the owner never asked to ship today. Deploying `_site` from that worktree as-is would have
both regressed live CSS and silently shipped unrelated, unapproved marketing copy.

Cloudflare Workers Static Assets deploys upload the **entire** `_site/` directory as one atomic
unit — there is no partial/per-page update — so the deploy source had to be a complete, correct
snapshot of the intended end state, not just a diff.

## Approach: mirror live, patch only the two things that actually changed

1. Fetched every live page (`/`, `/about/`, `/construction-advisory/`, all 5 service pages,
   `/gallery/`), `robots.txt`, `sitemap.xml`, `llms.txt`, and `css/styles.css` directly from
   `https://collaborativeconstructionllc.com`.
2. Froze a fresh Eleventy build of `cc-gallery-photos` (`npm run build`, 374 files).
3. Verified empirically, not assumed: extracted every `/assets`, `/css`, `/js` reference from all
   9 live pages plus every `url()` in live CSS (73 unique paths), and separately every image URL
   referenced by the new gallery build (319 URLs). Fetched live byte sizes for all 392 and
   compared against the worktree's build output. Result: **100% identical except `css/styles.css`**
   (live 158,218 bytes vs. worktree 159,449 bytes, the known pre-existing drift). This confirmed
   the worktree's `assets/`, `js/`, and `robots.txt` (origin-authored portion; Cloudflare injects
   an additional AI-crawler/content-signals block at the edge on top, confirmed by diffing live's
   robots.txt against the worktree's unmodified version) could be reused with zero risk, and that
   no new image assets needed uploading at all.
4. Found a second blast-radius point the original template grep missed: two service pages
   (`custom-home-builder-cape-cod`, `home-additions-cape-cod`) hardcode `modern-home-4.jpg` as an
   in-page "selected work" photo, independent of `projects.json`. Confirmed this is unaffected:
   the raw file is untouched (same bytes, still 200 live), it's just no longer part of the formal
   gallery grouping.
5. Assembled `/tmp/deploy-tree`: live bytes for everything, with exactly two patches:
   - `gallery/index.html` replaced with the worktree's freshly built version (the actual change).
   - The shared `footer-project` thumbnail snippet in `base.njk`'s "Recent Work" strip (present on
     all 8 non-gallery pages) patched from `modern-home-4.jpg` to `modern-interior-1.jpg`, since
     that photo left the "Modern Custom Residence" project per the room-split. Patched by
     substituting the exact line Eleventy itself generated for the new footer, so there is no
     hand-transcription risk.
   - `css/styles.css` and `llms.txt` taken verbatim from live (the pending pricing-copy rewrite
     and CSS drift are excluded from this release entirely).
   - `sitemap.xml` taken from live with only the `/gallery/` `<lastmod>` bumped to today.
6. Verified the assembled tree against live file-by-file: all 8 non-gallery pages differ by
   exactly the one footer-thumbnail line (4-line diff each); `gallery/index.html` differs by the
   intended 128 lines (room-split, merged sections, no town names); `css/styles.css` and
   `llms.txt` are byte-identical to live; the file set is identical (374 files, zero missing,
   zero extra).

## Preflight

- Confirmed current production Worker version: `62ee033b-43e7-478f-beda-1a4a86ffe541` (created
  2026-10-22T02:53:07Z), the rollback target for this release.
- `rsync -a --delete` the verified `/tmp/deploy-tree` into `cc-gallery-photos/_site` so
  `wrangler.jsonc`'s `./_site` pointed at the exact verified tree, then confirmed byte-for-byte
  identical via `diff -rq`.
- Node v20.20.2 was the default; switched to v22.23.3 via `nvm` for Wrangler, same as every prior
  release.
- `npx wrangler deploy --dry-run`: bindings matched the known-good set exactly (`ASSETS`, R2
  `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, D1 `cc-leads`,
  rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS`), no drift. 392 files read (374 files + 18
  non-root directories in Wrangler's walk count, reconciled exactly).

## Deployment

```sh
cd /private/tmp/cc-gallery-photos   # wrangler.jsonc's ./_site rsynced to the verified tree above
npx wrangler deploy
```

- **New Worker version:** `af7490e7-3f4c-4855-8a7c-fc3edf649a63`
- **Traffic:** 100%
- **Assets uploaded:** 10 new/modified — `sitemap.xml` and all 9 HTML pages (`/`, `/about/`,
  `/construction-advisory/`, all 5 service pages, `/gallery/`). 364 already-uploaded assets
  unchanged. `css/styles.css` and `llms.txt` required **no upload** (Cloudflare's content-hash
  manifest recognized them as byte-identical to what was already live), independently confirming
  the preflight verification was correct.
- **Production URL:** `https://collaborativeconstructionllc.com`

## Post-deploy production verification (live)

- All 9 canonical pages: `200` (homepage, about, construction-advisory, 5 service pages,
  gallery).
- `/gallery/` headings in order: Custom homes, Kitchen remodels, Bath remodels, Pool projects,
  Decks and railings, Commercial projects.
- Zero town names inside the gallery card grid (checked the same `gallery-stage`..`svc-cta`
  region the local test suite checks); 19 project cards, matching `projects.json` length exactly.
- Footer "Recent Work" thumbnail on the live homepage now shows `modern-interior-1`, zero
  remaining `modern-home-4` footer references.
- `css/styles.css` live byte size unchanged at 158,218 bytes, confirming the already-live
  brand-wm/hero-figure/svc-path work was not regressed.
- Worker logic unaffected: `/index.html` still 301-redirects to `/` (legacy-redirect path through
  `run_worker_first`), confirming the backend/API code (untouched by this release) still runs.
- No test customer inquiry was submitted; not needed for a content-only change.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback 62ee033b-43e7-478f-beda-1a4a86ffe541 --name collaborativeconstructionllc-com --message "Revert gallery photo reorg; restore prior Projects page grouping"
```

Restores the immediately-prior Worker version and does not touch D1, R2, or any stored
lead/workflow data. Asset filenames did not change, so rollback swaps bytes back cleanly.

## What was explicitly not part of this release

- The unrelated "affordable and competitive pricing" copy rewrite sitting uncommitted/pending in
  the `cc-gallery-photos` worktree (About page, construction-advisory page, `llms.txt` meta
  description) — excluded entirely; live still reads "serving Cape Cod and the South Shore."
- No CSS changes of any kind — live's current CSS (brand-wm sizing, hero-figure border, svc-path
  grid weighting) shipped exactly as it already was.
- `claude/projects-new-photos` was not merged to `main` and nothing was pushed as part of this
  deploy; the branch already backs open draft PR #20, unchanged by this release.
- Task B from earlier this session (creating Cloudflare Email Routing rules for `website@` and
  `contact@`) remains open and was not touched.

## Cross-references

- PR #20 ("Add October 2026 project photo intake to the Projects page"), the GitHub-side record
  of the gallery reorg commits this release deploys.
- `docs/releases/2026-10-19-approved-website-launch.md` was found to be stale during this
  release's investigation — it claims live is commit `09fb220`, but that commit's `gallery.njk`
  is an older carousel/tabbed design that does not match what was actually live. At least one
  undocumented deploy happened after 2026-10-19; this doc and `production-baseline.json`
  (dated 2026-10-12) should both be treated as unreliable baselines until someone re-verifies
  them against live directly, the same way this release did.
