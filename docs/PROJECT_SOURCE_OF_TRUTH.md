# Project source of truth

Audit date: 2026-10-20. Read-only investigation. No commit, merge, reset, push, deploy, or Cloudflare
change was made while producing this document.

This file exists because three things were repeatedly treated as interchangeable when they are not:
the local checkout, the GitHub branch, and the Cloudflare production deployment. Sections 1-5 record
what each one actually is. Section 9 records the resulting damage. Section 11 is the safe workflow.

## 1. Absolute local project path

```
/Users/marcusbehn/Desktop/Software/Wesbite/CollaberativeConstructionWebsite
```

The folder names are misspelled on purpose and must not be corrected: `Wesbite`, and
`CollaberativeConstructionWebsite`. This directory exists and is the primary working tree.

It is not the only working tree. See section 5.

## 2. GitHub repository and remote

```
origin  https://github.com/collabconstruction/collaborativeconstructionllc.com.git (fetch + push)
origin/HEAD -> origin/main
```

Push requires the `collabconstruction` GitHub account. The `mbehn11` account is signed in by default
and has read access only; pushing as `mbehn11` fails with HTTP 403. Switch with:

```sh
gh auth switch --hostname github.com --user collabconstruction
```

## 3. Current branch and commit

Checked out: `design/site-refresh-2026-10` at `de54fb9`, in sync with
`origin/design/site-refresh-2026-10`.

The working tree is dirty: 52 tracked files modified (roughly 900 added and 700 removed lines, all
real content, not whitespace) plus about 54 untracked paths. These are documentation, research,
release notes, evidence screenshots, and a set of unreviewed helper scripts
(`scripts/dashboard.mjs`, `scripts/collect-company-health.py`, `scripts/build-workbooks.py`,
`scripts/fetch-analytics-snapshot.mjs`, `scripts/seed_data.py`, and others) with two matching test
files. None of it is build-critical, and none of it has been committed anywhere. **Do not discard
it.** It is the only copy.

## 4. Branch relationships

Merge base of `design/site-refresh-2026-10` and `origin/main` is `e2ba56b`.

**Neither branch is a superset of the other.** A one-directional overwrite in either direction loses
work.

`origin/main` has 3 commits absent from the design branch:

| Commit | Contents |
| --- | --- |
| `ae9eb95` | `.github/workflows/public-website-health.yml`, `scripts/monitor_public_site.py` |
| `4e7dcd1` | `.github/workflows/falmouth-competitor-watch.yml`, `config/competitor-watch.json`, `scripts/monitor_competitors.py`, test |
| `0c19bc8` | `docs/automation/profit-review.md` |

The design branch has 34 commits absent from `origin/main`, including all lead-intake and Worker
hardening work (`d2872d6`, `04b2ee0`, `57aac15`, `be4bf6c`), the SEO work (`db6e247`, `d0bd660`,
`9e9245d`), and the analytics migration (`9fb6ac8`).

Important: none of main's 3 extra commits touch `css/`, `js/`, `src/`, `assets/`, or `worker/`. A
`git merge-tree` dry run of design into main returns a clean tree with no conflicts. So merging the
design branch into `main` is conflict-free and preserves the monitoring workflows. That is a
statement about mechanical mergeability only. It is **not** a recommendation to merge, because of
section 9.

## 5. Working-tree duplication (the root cause of the confusion)

`git worktree list` reports **eleven** working trees of this one repository:

| Path | Branch / commit | State |
| --- | --- | --- |
| `.../Desktop/Software/Wesbite/CollaberativeConstructionWebsite` | `design/site-refresh-2026-10` | primary |
| `/private/tmp/cc-launch-20261019` | `09fb220` detached | **approved release checkout, still intact** |
| `/private/tmp/cc-maintenance` | `ops/maintenance-mode` | prunable |
| `/private/tmp/cc-midnight-brass` | `codex/architectural-house-refinement` | prunable |
| `/private/tmp/cc-release-about-simplify` | `70c7916` detached | prunable |
| `/private/tmp/cc-release-deploy-d0bd660` | `d0bd660` detached | prunable |
| `/private/tmp/cc-release-logo-monogram` | `95fc442` detached | prunable |
| `.../.codex/worktrees/intake-release/...` | `codex/phase1-recovery` | active |
| `.../.codex/worktrees/social-profile-refresh/...` | `codex/social-brand-and-footer` | active |
| `.../.stagewise/worktrees/acf90ea33223/semantic-contour` | `semantic-contour` | active |
| `~/Desktop/CollaberativeConstructionWebsite/.claude/worktrees/romantic-vaughan-381ed4` | `4586bb9` detached | prunable |

Several agents each created a worktree, worked on a different branch, and deployed from wherever
they happened to be standing. Because `wrangler deploy` publishes the local disk (section 6), "the
project" means a different thing in each of these directories.

There is also a remote branch `origin/claude/collaborative-construction-redesign-u3rxhu` whose tip
commit is literally "Switch site palette to charcoal and safety orange". The design branch's own
history contains `df04548 feat(design): flat charcoal/orange redesign`. The unwanted orange styling
is genuine committed history in this repository, not a hallucination, which is why it keeps
resurfacing in dirty working trees.

## 6. Build and deployment

Stack: Eleventy 3.x generating `_site/`, served by a Cloudflare Worker. Not Astro.

Worker config `wrangler.jsonc`:

- name `collaborativeconstructionllc-com`
- main `worker/index.js`
- assets `./_site` bound as `ASSETS`
- D1 database `cc-leads`
- R2 bucket `cc-lead-attachments`
- plain vars `LEAD_INBOX`, `LEAD_FROM_ADDRESS` (values intentionally not reproduced here)
- compatibility date `2025-06-01`

Node 22 is required; the system default is Node 20 and wrangler refuses to run on it. `.nvmrc`
pins `22.23.3`. Prefix commands with `source ~/.nvm/nvm.sh && nvm use 22.23.3`.

**The authoritative build pipeline is the one on `09fb220`:**

```
build        = build:brand && build:house && clean && eleventy
build:brand  = node scripts/build-brand-assets.mjs
build:house  = node scripts/build-house.mjs
release:check= test && build && node scripts/verify-release-build.mjs && wrangler deploy --dry-run
deploy       = build && wrangler deploy
```

The current branch's `package.json` has `build = clean && eleventy`. The two generator steps were
dropped. This is the single most consequential difference in the repository. See section 9.

### CI/CD

There is **no deployment automation.** The two workflows on `origin/main` are monitoring only:
`public-website-health.yml` (cron every 6 hours) and `falmouth-competitor-watch.yml` (cron weekly,
plus `push` and `workflow_dispatch`). Neither invokes wrangler, references deploy secrets, or
touches Cloudflare.

Consequently: **pushing to GitHub does not change the website, and deploying does not require
anything to be committed.** `wrangler deploy` publishes whatever is on local disk at that moment,
including uncommitted and unreviewed changes, from whichever of the eleven worktrees is current.
That is exactly how an unapproved orange redesign reached production on 2026-10-20.

## 7. Relevant source directories

`src/` (Nunjucks templates, `_data/`, `_includes/`), `css/styles.css`, `js/`, `assets/`,
`worker/`, `scripts/`, `tests/`, `migrations/`, `docs/`.

`eleventy.config.js` passthrough-copies only `css/`, `js/`, `assets/`, and `robots.txt`. Anything
not under those paths will not reach `_site/` regardless of whether it is committed.

## 8. Design and branding reference

The approved palette is navy, brass/gold, paper, white and black. Verified in the deployed
stylesheet:

```
--navy-950 #060b14   --navy-900 #0a1120   --navy-800 #0e172b   --navy #182b49
--brass    #bda16a   --brass-600 #9c8450  --brass-300 #d4be91  --brass-100 #ebe0c9
--paper    #f4f0e7   --white #ffffff      --ink #111315
--font-display "Newsreader"   --font-ui "Inter"   --radius 3px
```

No orange and no maroon. `css/styles.css` on production is byte-for-byte identical to the approved
release build (117,093 bytes), so the stylesheet itself is correct and is not part of the damage in
section 9.

Logo history: the owner-approved launch shipped a gold interlocking **CC monogram**. The current
production logo is the gold **house-in-circle** mark, which is the owner's explicitly requested
artwork. The house mark is correct and should be kept. Source artwork is `brand/cc-house-mark.png`.

The header and footer wordmark is live font text (`<span class="brand-wm">`), replacing the baked
`assets/wordmark-header.png`. This was explicitly requested and should be kept.

## 9. Production reality and known damage

| Version | Created | What it is |
| --- | --- | --- |
| `6b4286d3-4aa0-424d-8916-507a0687895d` | 2026-10-19T22:03Z | **Owner-approved launch.** Built from `09fb220` on `codex/social-brand-and-footer` in the isolated checkout `/private/tmp/cc-launch-20261019`. Release notes: `docs/releases/2026-10-19-approved-website-launch.md` (currently untracked). |
| `7a0dcc6b-0c5e-4610-9ed6-35a6f7ea4355` | 2026-10-20T03:24Z | Unapproved orange/maroon redesign, deployed from a dirty working tree. Rolled back at 03:28Z. |
| `65f68b93-1a51-452c-a24d-83a7d6b5b107` | 2026-10-20T03:49Z | **Currently live.** Built from `de54fb9` on `design/site-refresh-2026-10`. |

The critical fact for anyone continuing this work:

> The source of the approved design was **always in git**, at commit `09fb220` on branch
> `codex/social-brand-and-footer`, with its exact build artifact still present at
> `/private/tmp/cc-launch-20261019/_site`.

Commit `de54fb9` was produced by downloading the rendered HTML/CSS/JS from the live site and
reinstating that output as source on a different branch. It faithfully reproduces the stylesheet and
the page text, but it could not reproduce files the HTML merely references. Relative to `09fb220`,
`de54fb9` removes 157 tracked asset files and both generator scripts.

Confirmed regressions currently live in production:

1. **Self-hosted fonts deleted.** `assets/fonts/newsreader-normal-latin.woff2`,
   `newsreader-italic-latin.woff2`, `inter-normal-latin.woff2` now return **404**. The stylesheet
   still asks for `Newsreader`, so the display face silently falls back to Iowan Old Style/Palatino
   site-wide. The page now loads Google Fonts instead (`Cormorant Garamond`, `Inter`, `Roboto Slab`)
   from a third-party CDN, which both changes the typography and introduces an external request the
   approved build deliberately avoided.
2. **151 responsive WebP renditions deleted** (`assets/img/r/`). Eleven are referenced by the
   homepage alone and all return 404. The approved build also used a WebP `<link rel=preload>` for
   the hero; that is now a JPEG preload.
3. **3D house explorer removed.** `js/house-scene.js` (4,230 lines), `js/house-loader.js`,
   `src/_includes/house-explorer.njk`, and `assets/models/residential-study.glb` are gone;
   `/js/house-loader.js` and the `.glb` return 404.
4. **`theme-color` is a maroon remnant.** `src/_includes/base.njk:35` hard-codes `#2b2d31`, the old
   `--maroon` value. The approved value is `#121d33`. This is the one piece of the rejected orange
   design currently shipping.
5. **Data files deleted**: `src/_data/images.json` (822 lines, the responsive-image manifest) and
   `src/_data/serviceArea.json` (122 lines).
6. **`worker/maintenance.js` deleted** (143 lines), along with `scripts/build-house.mjs` and
   `scripts/review-preview.mjs`. The maintenance-mode gate can no longer be built.
7. **Unreviewed content changes** inherited from the design branch's data files: page `<title>`,
   meta description, OG/Twitter metadata, the footer blurb, nav label "Company" to "About" plus an
   added "Contact" item, a new JSON-LD `founder` node, the Facebook URL
   (`profile.php?id=61595651094549` to `/people/Collaborative-Construction-LLC/61593017512930/`),
   and the LinkedIn URL (company page `collaborative-construction-56761b444` to a personal profile
   `wesleigh-behn-a5b925187`). The owner has not confirmed which Facebook or LinkedIn target is
   correct.

Two genuine fixes were made in the same commit and are worth preserving: the Cloudflare Turnstile
`api.js` script tag (the contact-form challenge had never rendered in production) and the no-JS
`.rule { transform: scaleX(1) }` fallback.

## 10. Outstanding verification issues

- Contact form end-to-end delivery (D1 write, email notification, conversion event) has not been
  exercised since the 2026-10-19 launch. The approved launch notes explicitly state no synthetic
  inquiry was submitted.
- `robots.txt` cannot be byte-compared because Cloudflare injects managed content signals.
- Owner decision required on the Facebook and LinkedIn URLs.
- Whether the house explorer is wanted on the site at all is an owner decision; it is currently
  absent rather than broken-visible.
- `origin/main` has not been built or deployed in this audit; its site files sit at the merge base
  `e2ba56b` and are older than both the approved launch and the current deployment.

## 11. Safe workflow for future changes

Because no CI/CD exists, discipline has to substitute for automation.

1. **Work only in** `/Users/marcusbehn/Desktop/Software/Wesbite/CollaberativeConstructionWebsite`.
   Confirm with `git rev-parse --show-toplevel` before editing. Do not create new worktrees; prune
   the stale ones once their contents are confirmed unneeded.
2. **Confirm the branch** before touching files. Being on a branch whose history contains the orange
   redesign is how the accident happened.
3. **Never run `npm run deploy` from a dirty tree.** `git status --short` must be empty of
   build-relevant paths (`css/ js/ src/ assets/ worker/ scripts/ *.json*`).
4. **Establish what is live before changing it**: `curl` production, diff against the local build
   output, and enumerate every difference. A successful `wrangler deploy` proves only that an upload
   occurred, never that the right bytes were uploaded.
5. **Run `npm run release:check`** (tests, full build including `build:brand` and `build:house`,
   `verify-release-build.mjs`, and a wrangler dry run) before any production deploy.
6. **Get explicit owner approval** naming the specific change, then deploy, then verify live and
   record the version ID in `docs/releases/`.
7. **Keep the rollback target to hand.** `npx wrangler deployments list`; recover with
   `npx wrangler rollback <version-id>`.

Target workflow once this is stabilised: feature branch, tests, preview deploy, visual verification,
owner approval, production deploy.

## 12. Safety note

This file deliberately contains no credentials, API tokens, secrets, environment variable values,
customer records, or lead data.
