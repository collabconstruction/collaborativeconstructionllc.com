# Service-page project location tags removed, production release, 2026-10-23

Status: **Deployed and verified live.** No database migration, no credential rotation, no test
customer inquiry, no push to `origin`/`main`. The owner's request, with a screenshot of the live
`adu-builder-cape-cod` page: the "Custom Residence" project card showed a "BELMONT, MA" location
tag under its heading while the neighboring "Traditional Kitchen" card had none, making the two
`.project-head` blocks different heights side by side. Verbatim: "please make it so this doesnt
look weird like this we dont need the location this is across all service pages please take a
look and change it."

## What changed

Removed every `<span class="tag">Town, MA</span>` location badge from the "Related Projects"
`.project-head` blocks on all 5 live service pages. 4 of the 5 pages had exactly one tagged card
next to one untagged card (the visible inconsistency); the 5th, `custom-home-builder-cape-cod`,
had both of its cards tagged (no visible inconsistency there today) but was included per the
owner's blanket "we dont need the location" instruction, for full site-wide consistency.

- `adu-builder-cape-cod/index.html` — removed `Belmont, MA` tag under "Custom Residence".
- `custom-home-builder-cape-cod/index.html` — removed `Belmont, MA` tag under "Custom Residence"
  and `Carlisle, MA` tag under "Modern Custom Residence" (both cards on this page).
- `general-contractor-falmouth-ma/index.html` — removed `Belmont, MA` tag under "Custom
  Residence".
- `home-additions-cape-cod/index.html` — removed `Carlisle, MA` tag under "Modern Custom
  Residence".
- `home-renovation-cape-cod/index.html` — removed `Carlisle, MA` tag under "Modern Custom
  Residence".
- `css/styles.css` — dropped the now-dead `.service-page .project-head .tag` rule (no `.tag`
  elements remain inside `.project-head` on any service page) and refreshed the preceding comment,
  which previously described centering "the column and each item in it" for a location tag that
  no longer exists.

The source templates (`src/*/index.njk`) for all 5 pages were edited the same way in the
`feature/service-page-project-photos-2026-10-21` worktree and are the durable record of this
change; this release ships the equivalent bytes to production without waiting on a wholesale
worktree deploy (see hazard below).

## The actual hazard this release had to solve

The worktree with the correct source edits (`/private/tmp/cc-cleanup/project-photos`,
`feature/service-page-project-photos-2026-10-21`) was branched 2026-10-21, one day before the
most recent production deploy (the 2026-10-22 gallery reorg + footer-thumbnail change documented
in `docs/releases/2026-10-22-gallery-reorg-rollout.md`). Deploying that worktree's `_site`
wholesale would have silently reverted the gallery reorg and footer thumbnail back to their
pre-10-22 state. Cloudflare Workers Static Assets deploys upload the **entire** `_site/`
directory as one atomic unit, so the deploy source had to be a complete, correct snapshot of the
current live state plus exactly this patch, not a diff applied on top of a stale worktree build.

`docs/releases/production-baseline.json` (2026-10-12) and
`docs/releases/2026-10-19-approved-website-launch.md` were not consulted as baselines; both are
already flagged stale by the 2026-10-22 release doc. Live was treated as ground truth throughout.

## Approach: mirror live, patch only the two things that actually changed

1. Fetched all 9 live pages, `css/styles.css`, `sitemap.xml`, and the origin-authored
   `robots.txt`/`llms.txt` directly from `https://collaborativeconstructionllc.com`.
2. Patched exactly 5 HTML files (the tag-span removals above) and `css/styles.css` (the dead-rule
   removal). First attempt at the HTML patch used a whitespace-capturing Perl regex
   (`s/(\s*)<span class="tag">...<\/span>\n//`) that greedily consumed the newline between the
   preceding `</h2>` and the tag span, merging `</h2>` and the following `</div>` onto one line.
   Caught by `grep -A1 project-head` showing the malformed merge; fixed by re-fetching clean
   copies and using a line-oriented removal (`perl -ni -e 'print unless /^\s*<span
   class="tag">[^<]*<\/span>\s*$/'`) across all 5 files in one pass, which can't corrupt
   surrounding lines.
3. Extracted every asset/css/js reference from the 9 live pages plus every `url()` in live CSS
   (79 unique paths, including `@font-face` `url("...")` entries missed by an initial
   single-quote-only grep) and compared live byte sizes against the
   `feature/service-page-project-photos-2026-10-21` worktree's already-built `_site`. Result:
   100% identical except `css/styles.css` (the known pre-existing drift, not used from this
   worktree). This confirmed the worktree's `assets/` (361 files, including the `img/r/`
   responsive renditions and `fonts/`) and `js/` directories could be reused with zero risk, since
   this change touches no images or scripts.
4. Assembled `/tmp/cc-tag-fix-deploy`: live bytes for everything, patched HTML (5 files) and CSS
   (1 file), `assets/` and `js/` copied verbatim from the verified worktree build, origin-authored
   `robots.txt`/`llms.txt` (not the Cloudflare-edge-injected copy picked up by a direct live
   fetch), and `sitemap.xml` with `<lastmod>` bumped to 2026-10-23 on the 5 pages that actually
   changed (matching what the site's own `gitLastModified`-driven sitemap template would produce
   once this change is committed).
5. Verified the assembled tree against live file-by-file: 374 files total (matching the exact
   count from the last verified live deploy), zero missing, zero extra. All 9 HTML pages and
   `css/styles.css` compared by byte size against live; only the 5 patched pages and the CSS
   file differed, by exactly the intended lines (`diff` showed a single removed line per page,
   two for `custom-home-builder-cape-cod`; CSS diff showed exactly the comment + dead-rule
   removal). Every other file (homepage, about, construction-advisory, gallery, all of
   `assets/`, `js/`) confirmed byte-identical to live.

## Preflight

- `node scripts/verify-release-build.mjs` against the assembled tree overlaid into the worktree's
  `_site` (`rsync -a --delete`): passed, 374 public files, matching trap/challenge contracts,
  sitemap/canonical/robots/JSON-LD invariants held across all 9 pages. Caught one real issue on
  the first run: the live-fetched `robots.txt` included Cloudflare's edge-injected AI-crawler
  content-signals block, which the verifier correctly rejects since that block is added at the
  edge, not by the origin; fixed by substituting the repo's own origin-authored `robots.txt`
  (confirmed to share the same final 5 lines as the live file, modulo the injected block).
- Confirmed current production Worker version: `af7490e7-3f4c-4855-8a7c-fc3edf649a63` (created
  2026-10-22T23:17:30Z, the version deployed by the 2026-10-22 gallery reorg release), the
  rollback target for this release.
- Node v20.20.2 was the default; switched to v22.23.3 via `nvm` for Wrangler, same as every prior
  release.
- `npx wrangler deploy --dry-run`: bindings matched the known-good set exactly (`ASSETS`,
  R2 `cc-lead-attachments`, `SEND_EMAIL` to `collaborativeconstructiongc@gmail.com`, D1
  `cc-leads`, rate limiter 5/60s, `LEAD_INBOX`/`LEAD_FROM_ADDRESS`), no drift. 392 files read
  (374 files + 18 non-root directories in Wrangler's walk count, reconciled exactly).

## Deployment

```sh
cd /private/tmp/cc-cleanup/project-photos   # _site rsynced to the verified assembled tree above
npx wrangler deploy
```

- **New Worker version:** `26659897-10c2-45a0-91e3-15b10d3c2a5a`
- **Traffic:** 100%
- **Assets uploaded:** 7 new/modified — `sitemap.xml`, the 5 patched service pages, and
  `css/styles.css`. 367 already-uploaded assets unchanged.
- **Production URL:** `https://collaborativeconstructionllc.com`

## Post-deploy production verification (live)

- All 9 canonical pages: `200` (homepage, about, construction-advisory, gallery, 5 service
  pages).
- Zero `class="tag"` location badges remaining on any of the 5 service pages (checked by
  `grep -c 'class="tag"'` against the live HTML of each).
- `css/styles.css` live byte size now 158,192 (down from 158,218, matching the patch exactly).
- Live HTML for all 5 patched pages diffed against the locally-assembled source tree: byte-for-
  byte identical.
- `/index.html` still 301-redirects to `/`, confirming the Worker's legacy-redirect logic
  (untouched by this release) still runs.
- Live `sitemap.xml` shows `2026-10-23` `<lastmod>` on the 5 patched pages.
- No test customer inquiry was submitted; not needed for a content/CSS-only change touching no
  form or backend code.

## Rollback (preserves all customer data)

```sh
npx wrangler rollback af7490e7-3f4c-4855-8a7c-fc3edf649a63 --name collaborativeconstructionllc-com --message "Revert service-page location-tag removal; restore prior Related Projects markup"
```

Restores the immediately-prior Worker version and does not touch D1, R2, or any stored
lead/workflow data. Asset filenames did not change, so rollback swaps bytes back cleanly.

## What was explicitly not part of this release

- No images or JavaScript changed; `assets/` and `js/` shipped byte-identical to what was already
  live.
- At deploy time, the source-template edits sitting uncommitted in
  `feature/service-page-project-photos-2026-10-21` (`src/*/index.njk`) had not been committed or
  merged; this release shipped the equivalent production bytes directly, consistent with how the
  2026-10-22 gallery reorg was also deployed from a hybrid live-mirrored tree rather than a raw
  worktree build.

## Source-tracking follow-up (2026-10-23, after this deploy)

Deploying the live bytes directly (above) left `main` out of sync with production: the six
location-tag `<span>`s and the dead CSS rule were still present in every `src/*/index.njk` file
and in `css/styles.css` on `main`, even though live no longer served them. This was caught and
fixed separately: draft PR #27, `fix/service-project-location-tags-source-2026-10-23`
(commit `0dc0664`), commits the same six-badge removal and CSS cleanup into source, based on
current `main` (so it correctly keeps the hero-figure border, `svc-path` grid weighting, and
other CSS that landed on `main`/live after the
`feature/service-page-project-photos-2026-10-21` worktree branched, none of which this release
touched). It also adds `tests/service-project-location-tags.test.mjs` as a regression guard. PR
#27 was independently diffed against the uncommitted worktree used for this deploy: the five
`.njk` files are byte-identical; the CSS diff is larger only because of that pre-existing,
already-live drift, not because of any discrepancy in the tag-removal fix itself. PR #27 is open
and not yet merged as of this writing; no second production deploy is needed once it merges, since
`main` will then simply match what is already live.

## Cross-references

- `docs/releases/2026-10-22-gallery-reorg-rollout.md` — the immediately prior release and the
  template this release's "mirror live, patch only the two things that actually changed" approach
  follows exactly.
- PR #27 (`fix/service-project-location-tags-source-2026-10-23`) — the source-tracking follow-up
  described above.
