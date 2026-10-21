# Deploying the public website (runbook)

Last updated October 21, 2026, after the release of PR #12. This is the definitive procedure. Read it before any deployment.

## The short version (next release)

On your Mac, in `~/Desktop/Personal/CollaborativeConstruction/collaborativeconstructionllc.com`:

```
git checkout main && git pull origin main
npm ci
npm run release:prepare
npm run release:deploy -- --confirm <first 7 characters of the commit it prints>
```

Then type `deploy production` when asked. `release:prepare` changes nothing in production. `release:deploy` refuses unless every check still holds, asks for two confirmations, deploys, checks the live site and prints the new version and the rollback command.

If a step stops, read the message. Every stop says why. Do not work around it.

## Rules that never change
1. **Merged is not deployed.** Merging a pull request changes GitHub only. The live site changes only when `release:deploy` (or the manual steps below) succeeds.
2. **Never deploy `_site` directly while the overlay is required.** Do not run `npm run deploy`, and do not run `wrangler deploy` with the default assets folder. Use `_deploy`, built by the overlay. See "Why the overlay is still required".
3. **Production changes need the owner's approval each time.** An agent prepares and verifies. The owner confirms.
4. **Never claim a deployment worked without checking.** Success means the new version id was printed, the live checks passed and the site was seen working.
5. **Do not touch** production DNS, secrets, customer records, the D1 database `cc-leads` or the R2 bucket as part of a release.

## What was done for the October 21, 2026 release (verified by the owner)
| Item | Value |
|---|---|
| Release | PR #12: design, crawl and SEO fixes, Gallery (it contained PRs #6, #10 and #11) |
| Merged commit on `main` | `14c36e6` |
| Cloudflare account | `0fadcd0965374caa75a44c3aa9784042` |
| Worker | `collaborativeconstructionllc-com` |
| Previous production version (rollback target) | `308583ee-8c69-4207-9336-982cc82f3555` |
| New production version | `d44368c2-a776-4c21-a387-2bbba3a5d830` |

Steps taken: PR approved and merged on GitHub; `git checkout main && git pull origin main`; `npm ci`; `npm run build`; `node scripts/verify-release-build.mjs`; `node scripts/build-live-overlay.mjs` (reported READY); `npx wrangler deploy --assets _deploy --dry-run`; `npx wrangler deploy --assets _deploy`; then live checks. The home page, `robots.txt` and the sitemap answered HTTP 200 and the SEO audit inspected nine pages.
After the release, a read only check of the live site (`npm run release:verify-live`) passed: nine pages, scripts, the Gallery script, one gallery image, `robots.txt` with one Sitemap line, and the contact endpoint answering GET with 405.

## Required tools and logins
| Need | Check |
|---|---|
| Node 22 or newer and npm | `node --version` |
| Git and a clean checkout of this repository | `git status` shows nothing |
| GitHub CLI logged in as the company account (optional, lets the tool show which pull request merged the commit) | `gh auth status` |
| Wrangler logged in to the company Cloudflare account | `npx wrangler whoami` lists account `0fadcd0965374caa75a44c3aa9784042` |
| Python 3 (tests and the SEO audit) | `python3 --version` |

If Wrangler says it is not authenticated, run `npx wrangler login` (it opens a browser). The tool refuses to prepare a deployable release without it.

## What `npm run release:prepare` does (no production change)
1. Confirms the repository is `collabconstruction/collaborativeconstructionllc.com`, the working tree is clean, and you are on `main` equal to `origin/main` (it fetches first).
2. Asks GitHub which merged pull request produced the commit (warns if it cannot tell).
3. Checks Wrangler is logged in to the right account and records the current production deployment id. This is the rollback target.
4. Runs the tests (JavaScript and Python), the build and `scripts/verify-release-build.mjs`.
5. Builds `_deploy` with `scripts/build-live-overlay.mjs`, which must report READY.
6. **Fails closed on live content:** every file the live pages reference must have been retrieved. If any could not, it stops and lists them. A known one can be accepted with `--allow-missing /path` and is written into the report.
7. Checks the `_deploy` folder: all nine pages, one H1 and one canonical on each, the home page contact form with Turnstile widget, site key and honeypot, the form scripts, `robots.txt` (repo version, one Sitemap line, `/api/` disallowed, no Cloudflare managed block), the sitemap, at least 150 images, and that every image, script, style and font that a page refers to exists in the folder.
8. Runs `wrangler deploy --assets _deploy --dry-run` and confirms the bindings are intact: D1 `cc-leads`, R2 `cc-lead-attachments`, email, rate limiter and the inbox variables.
9. Writes `.release/prepare.json` (commit, folder fingerprint, rollback id). This folder is not committed.

Options: `--no-cloudflare` (cloud workspace without a Wrangler login: runs all local checks, but the result can never be deployed) and `--allow-branch` (run the checks from a branch, also never deployable).

## What `npm run release:deploy` does
It refuses unless: you are on `main` equal to `origin/main`, the tree is clean, the prepared commit is the current commit, the `_deploy` fingerprint is unchanged, Cloudflare was verified, a rollback id was recorded, and the prepare is under two hours old. Then it prints the plan, requires `--confirm <7 characters of the commit>` and an interactive typed `deploy production`. It re-reads the current production id, runs `wrangler deploy --assets _deploy`, reads the new version id, runs the live checks (`npm run release:verify-live`, read only) and the SEO audit, writes `.release/deploy-<time>.json`, and prints the previous version and the rollback command. It never runs the rollback itself. It exits with an error and says so if a live check fails.
It cannot run without a terminal, so an agent cannot confirm for you.

## Contact form safety
- The release must not change `worker/`, `wrangler.jsonc`, `migrations/`, `schema.sql`, `js/turnstile-lifecycle.js`, `js/intake-context.js`, `js/analytics.js` or `js/api.js` unless the release is about them. Check: `git diff <last release commit> HEAD --stat -- worker wrangler.jsonc migrations schema.sql js`.
- The prepare step proves the page still has Turnstile, the honeypot and the form scripts, and that the Worker bindings are intact.
- `release:verify-live` sends no form. It only checks that `GET /api/contact` answers 405 with `Allow: POST`.
- After a release that touches the contact area, the owner may send one clearly marked test message from a browser, confirm it arrives in the inbox, and check the newest row with: `npx wrangler d1 execute cc-leads --remote --command "SELECT id, created_at FROM leads ORDER BY id DESC LIMIT 1"`. This reads only the id and time, never the lead contents. Delete the test row afterwards if wanted. Never run a submission test without the owner's approval.

## Rollback
Printed by both commands, never run automatically:

```
npx wrangler rollback <previous version id> --message "rollback after release"
```

For the October 21 release the target was `308583ee-8c69-4207-9336-982cc82f3555`. `npm run release:rollback-info` prints the last recorded one. A rollback changes only the Worker version and static files. It does not undo database changes (a release does not make any). After a rollback run `npm run release:verify-live` and look at the site. Rolling back needs the owner's approval, except in an emergency where the owner says so.

## Common errors
| Message | Meaning and fix |
|---|---|
| `Wrangler is not logged in` | Run `npx wrangler login`. |
| `account ... is not listed` | Logged in to another Cloudflare account. Log out and in with the company account. |
| `working tree is not clean` | Commit or discard changes. Generated folders (`_site`, `_deploy`, `.release`, `monitoring-output`) are ignored and do not count. |
| `main is not the same as origin/main` | `git pull origin main`, or an unpushed commit exists. Deploy only pushed, merged code. |
| `some live files that pages reference could not be retrieved` | The live site refers to a file it does not serve (or the network failed). Retry. If it repeats, investigate before deploying; a deploy replaces the whole site. |
| `NOT READY: _site/... is missing` | `npm run build` did not complete. |
| Overlay says the hero or Facebook link patch failed | The live page markup changed. Update the patch in `scripts/build-live-overlay.mjs`, do not skip it. |
| `the _deploy folder changed after prepare` | Something edited it. Run prepare again. |
| `production changed since prepare` (note) | Someone deployed in between. The rollback target shown is the newer version. |
| All live checks show "no answer" | A proxy blocks Node. Use `NODE_USE_ENV_PROXY=1`. On your Mac this should not happen. |

## Why the overlay is still required
A Cloudflare assets deploy replaces the whole public file set. Until October 2026 the repo templates differed from the live site (different pages, fonts and 148 photos not committed). The overlay copies the live site first, then adds only the approved files, so nothing can be lost by accident.

**Current parity (measured October 21, 2026, after PR #12, with `npm run release:parity`):** the repo build has 244 files and the deploy folder has 243; 242 are byte for byte identical. The differences are:
- `sitemap.xml`: the dates come from git history, so they differ.
- `assets/img/wesleigh-behn.jpg`: in the repo build but deliberately not served live. **A direct `_site` deploy would publish this owner photo.** This alone is a reason not to deploy `_site` today.

So the repo is now very close to being the source of truth, but the overlay stays until the steps below are done.

### How to retire the overlay (future, one step at a time, not done)
1. Stop the build from emitting `assets/img/wesleigh-behn.jpg` (exclude it in the Eleventy config) and make the sitemap dates stable. Add a test for each.
2. Make `npm run release:parity` part of `release:prepare` and require "only live = 0, different = 0" for two releases in a row.
3. Add a preview deploy (below) that deploys the repo build and compare it to live with `release:verify-live --site <preview url>`.
4. Only then change `release:prepare` to build `_site` directly. Keep `release:parity` as a permanent guard and keep the overlay script for emergencies for one more release.

### Preview before production (future)
Use a second Worker with its own name and no production bindings (no `cc-leads`, no R2, no email), deployed from the repo build with `wrangler deploy --name collaborative-construction-preview --assets _site`, protected by Cloudflare Access for the owner only. It lets the owner review a release in a browser before approving. This needs a new Worker, an Access application and a workers.dev decision, so it needs the owner's approval first. The contact form must not point at the production database in a preview.

## Where things run
| | Local Claude Code on the Mac | Claude Cloud session | GitHub Actions |
|---|---|---|---|
| Edit, test, commit, push, open pull requests | Yes | Yes | Tests only (`release-check`) |
| Wrangler and Cloudflare login | Yes, the owner's own login | **No. The cloud session is not logged in to Wrangler or Cloudflare.** | No Cloudflare secret in this repository |
| Run `release:prepare` | Yes | Only with `--no-cloudflare` (checks, never deployable) | Not set up |
| Run `release:deploy` | Yes, with the owner present | No | No |
| Reads GitHub pull requests | `gh` | GitHub tools | Yes |

An AI agent must not assume cloud access means deployment access. The cloud session's checks are useful evidence, but only the Mac run counts for a release.

## Current manual Cloudflare configuration (from `wrangler.jsonc`)
- Worker `collaborativeconstructionllc-com`, entry `worker/index.js`, compatibility date 2025-06-01.
- Static assets from the deploy folder (`--assets _deploy`), binding `ASSETS`. The Worker runs first only for `/api/*` and the 17 legacy URLs listed in `run_worker_first`.
- D1 `cc-leads` (binding `DB`), R2 `cc-lead-attachments` (`ATTACHMENTS`), email binding `SEND_EMAIL`, rate limiter `INTAKE_RATE_LIMITER` (5 requests per 60 seconds), variables `LEAD_INBOX` and `LEAD_FROM_ADDRESS`.
- Secrets (not in the repository, set with `wrangler secret put`): the Turnstile secret key, and optionally an email provider key.
- Observability on, request bodies not logged.
- Cloudflare Builds Git connection: **not recorded here. The owner must write down what Settings, Builds shows.** If a repository is connected, a push to `main` could build and deploy without the overlay. Confirm it is disconnected or harmless before relying on this runbook.
- DNS, the `www` redirect, SSL/TLS and security settings are managed in the Cloudflare dashboard and are not changed by a release.

## Manual steps without the tooling (fallback)
```
git checkout main && git pull origin main
npm ci && npm run build
node scripts/verify-release-build.mjs
node scripts/build-live-overlay.mjs        # must end with READY
npx wrangler deployments list              # write down the newest id
npx wrangler deploy --assets _deploy --dry-run
npx wrangler deploy --assets _deploy
```
