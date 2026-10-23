# Deploying the public website (runbook)

Last updated October 23, 2026: added an optional owner-approved, cloud-hosted GitHub Actions deployment path. Historical release details below are retained. This is the definitive procedure. Read it before any deployment.

## Owner-approved cloud deployment (no Mac terminal)

When the owner has explicitly approved a **specific website release** in the current chat or task, an agent with repository workflow-dispatch permission can deploy the exact merged commit through `.github/workflows/approved-production-deploy.yml`. This workflow is **manual-dispatch only**: merging or pushing does not deploy on its own.

**One-time owner setup (no API keys in chat, source files or commands):**

1. In GitHub, open this repository's **Settings → Environments**, create/select the `production` environment, and restrict deployments to `main`. Add environment secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token must be created inside the company Cloudflare account with the smallest Worker deployment permissions/resources that work for this Worker; Cloudflare currently documents the scoped **Edit Cloudflare Workers** token for CI.
2. If desired, enable GitHub Environment required reviewers. That adds an explicit GitHub UI approval, not a terminal confirmation; it is optional depending on the owner's acceptable risk and repository plan.
3. Never share the token with an AI, in a message, in `.env`, or in Git history. If these secrets are absent, the workflow **fails before it prepares/deploys**. This setup must be done by the owner using GitHub/Cloudflare account interfaces once.

**Per-release workflow, after explicit owner approval:**

- Agent completes tests and review, merges the specifically approved PR, and obtains the current **40-character** `origin/main` SHA.
- Agent checks that `main` contains only approved changes for this release, no production data/migrations or unrelated infrastructure changes, and the working tree is clean. A merge of a scheduler/research change to `main` in the interim must not be silently included.
- Agent runs `gh workflow run approved-production-deploy.yml --ref main -f commit_sha=<full-40-character-sha>` or uses GitHub's **Actions → Approved Production Deploy → Run workflow** UI. Never launch without fresh owner authorization.
- GitHub verifies that the input SHA equals current `main`, then runs `npm ci`, `release:prepare` and `release:deploy -- --confirm <short-sha> --github-approved`, followed by built-in Cloudflare version and public site verification. All existing rollback, source provenance, complete overlay, binding and tests remain in force.
- Agent reads the actual completed workflow result and Cloudflare version, checks changed public content, and reports **deployed and verified / failed / unknown**, including rollback target. If the workflow did not execute successfully, do not claim deployment.

The `--github-approved` mode is **not a free bypass**. It only skips the physical terminal text prompt within this exact, manually dispatched GitHub Actions workflow for the exact approved `main` SHA. It refuses ordinary local shells, branch builds, GitHub push/PR events, other workflow files, and GitHub reruns. The normal local path remains interactive.

**If GitHub secrets are not configured, this cloud deployment path is not operational yet.** A Claude Cloud agent may have GitHub access but will still not directly have Wrangler credentials.

## The local Mac method (also remains supported)

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
3. **Production changes need the owner's explicit approval each time.** The owner may approve the exact release in an active chat/task. An authorized agent may then run the manually dispatched, SHA-bound GitHub workflow; no separate Mac terminal phrase is required for that route.
4. **Never claim a deployment worked without checking.** Success means the new version id was printed, the live checks passed and the site was seen working.
5. **Do not touch** production DNS, secrets, customer records, the D1 database `cc-leads` or the R2 bucket as part of a release.

## What was done for the October 21, 2026 release (verified by the owner)
| Item | Value |
|---|---|
| Release | PR #12: design, crawl and SEO fixes, Gallery (it contained PRs #6, #10 and #11) |
| Merged commit on `main` | `14c36e6` |
| Cloudflare account | `0fadcd0965374caa75a44c3aa9784042` |
| Worker | `collaborativeconstructionllc-com` |
| Previous production version (rollback target, a Worker **version** id) | `308583ee-8c69-4207-9336-982cc82f3555` |
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
2. **Provenance:** asks GitHub (`gh`) which merged pull request into `main` has this exact commit as its merge commit. If GitHub cannot confirm it (not logged in, no PR, a direct push), prepare on `main` stops. There is no override: deploy only commits that came through a merged pull request.
3. Checks Wrangler is logged in to the right account and reads the current production **version** id from `wrangler deployments list --json`. This is the rollback target. A deployment has its own id; `wrangler rollback` needs the version id (`versions[].version_id`), and the tool never uses the deployment id in its place. If the newest deployment lists no version, or splits traffic between versions (a gradual rollout), prepare stops.
4. Runs the tests (JavaScript and Python), the build and `scripts/verify-release-build.mjs`.
5. Builds `_deploy` with `scripts/build-live-overlay.mjs`, which must report READY.
6. **Fails closed on live content:** every file the live pages reference must have been retrieved. If any could not, it stops and lists them. A known one can be accepted with `--allow-missing /path` and is written into the report.
7. Checks the `_deploy` folder: all nine pages, one H1 and one canonical on each, the home page contact form with Turnstile widget, site key and honeypot, the form scripts, `robots.txt` (repo version, one Sitemap line, `/api/` disallowed, no Cloudflare managed block), the sitemap, at least 150 images, and that every image, script, style and font that a page refers to exists in the folder.
8. Runs `wrangler deploy --assets _deploy --dry-run` and confirms the bindings are intact: D1 `cc-leads`, R2 `cc-lead-attachments`, email, rate limiter and the inbox variables.
9. Deletes any older `.release/prepare.json` at the very start (an aborted prepare can never leave an earlier report that deploy would accept), and writes the new one atomically only after every check passed. The report holds the commit, folder fingerprint and rollback version id. The folder is not committed.

Read only helper: `npm run release:check-wrangler` shows how Wrangler describes the current deployment (field names and the chosen rollback version) so the parser can be checked against your real output.

Options: `--no-cloudflare` (cloud workspace without a Wrangler login: runs all local checks, but the result can never be deployed) and `--allow-branch` (run the checks from a branch, also never deployable).

## What `npm run release:deploy` does
It refuses unless all of these hold at that moment:
- you are on `main`, the tree is clean, and `git fetch origin` **succeeded** (a failed fetch blocks the deploy) and shows `main` equals `origin/main`;
- GitHub shows the commit as the merge commit of a merged pull request into `main` (provenance, checked again now);
- the prepared commit is the current commit, the `_deploy` fingerprint is unchanged and the prepare is under two hours old;
- **production has not changed since prepare**: the current production version must equal the rollback version recorded at prepare. If someone deployed in between, it stops and tells you to run prepare again.

Then it prints the plan, requires `--confirm <7 characters of the commit>`, and either an interactive typed `deploy production` **locally** or the strictly validated `--github-approved` dispatch context described above. It moves the prepare report aside (it authorizes one attempt only), runs `wrangler deploy --assets _deploy`, then asks Cloudflare which version is active. Cloudflare's deployment list can lag a fresh deployment, so it reads the list up to six times, ten seconds apart, and stops as soon as the new version shows. One stale read never decides anything, and a successful upload is never reported as "not deployed". It then runs the live checks and the SEO audit, writes `.release/deploy-<time>.json`, and prints four separate results and the rollback command:

```
Wrangler upload:        succeeded
Active version:         confirmed by Cloudflare (<version id>)
Live HTTP checks:       passed
SEO audit:              passed
```

The words "deployed and verified" appear only when all four are good. Each line says whether that check actually ran (`not run` is shown, never assumed to pass). The active version is confirmed only when the version id that **Wrangler printed for this upload** is the one Cloudflare lists. If Wrangler prints no id, a version that appears in Cloudflare's list is never attributed to this release, because another deployment could have run at the same time: the result is "not confirmed" (code 5). The same applies when Wrangler fails but a new version appears: it is reported as unknown (code 4), not as ours. It never runs the rollback itself. A local deploy still requires a terminal; an owner-approved GitHub Actions manual dispatch can use its narrowly validated non-interactive route.

Exit codes and what they mean:
| Code | Meaning |
|---|---|
| 0 | Deployed and verified |
| 1 | Not deployed. Production is unchanged (a check refused, or Wrangler failed and Cloudflare still lists the previous version) |
| 2 | **Deployed**, but one or more live checks failed. Consider rolling back |
| 3 | **Deployed** and confirmed active, but the live checks or the SEO audit did not run, or the SEO audit failed. Read the audit and decide with the owner |
| 4 | Unknown (Wrangler failed and Cloudflare could not be read, or it failed and a new version appeared that cannot be attributed to this release). Run `npx wrangler deployments list` |
| 5 | **Deployed** (Wrangler succeeded), but Cloudflare has not confirmed the new version is active (Wrangler printed no id, or the listing is unreadable, lagging or shows another version). Not verified: wait a minute, run `npm run release:check-wrangler`, and check the site |

## Provenance: which merges are supported
The tool deploys only a commit that GitHub reports as the **merge commit of a merged pull request into `main`** (`merge_commit_sha` of the pull request equals the commit you have checked out). Nothing else counts as approval.

| How the pull request was merged | Supported? |
|---|---|
| "Create a merge commit" | Yes. This is how PR #12 was merged (commit `14c36e6`), so this case has been run for real. |
| "Squash and merge" | Expected to work: GitHub records the squashed commit on `main` as the pull request's merge commit. Not yet exercised; the unit test covers the data shape only. |
| "Rebase and merge" | Expected to work for the final (tip) commit on `main`, which GitHub records as the merge commit. Not yet exercised. |
| A commit pushed straight to `main` | **No.** There is no merged pull request. |
| A commit added to `main` after the merge (even a one line fix) | **No.** The checked-out commit is not the merge commit. |
| A pull request merged into a branch other than `main` | **No.** |

Standard practice: merge release pull requests with "Create a merge commit", pull `main`, and deploy immediately, before anything else lands on `main`. If another commit lands first, open and merge a pull request for the deploy target again (an empty release pull request is acceptable) rather than deploying an unreviewed commit.

**There is no bypass for provenance, tests, production-version pinning, the deploy hash, or live verification.** The narrowly scoped `--github-approved` route replaces only terminal typing with validated GitHub workflow dispatch context and a freshly approved SHA. If a real situation ever needs an exception (for example an emergency hotfix while GitHub is unavailable), it is a separate decision for the owner: follow the "Manual steps without the tooling" fallback below yourself with written owner approval recorded in the release notes, or change `checkProvenance` in `scripts/lib/release-lib.mjs` in a pull request the owner reviews, with tests that show what is newly allowed and why. Agents must not do either on their own.

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

The id is a Worker version id, not a deployment id. For the October 21 release the target was `308583ee-8c69-4207-9336-982cc82f3555`. `npm run release:rollback-info` prints the last recorded one. A rollback changes only the Worker version and static files. It does not undo database changes (a release does not make any). After a rollback run `npm run release:verify-live` and look at the site. Rolling back needs the owner's approval, except in an emergency where the owner says so.

## Common errors
| Message | Meaning and fix |
|---|---|
| `Wrangler is not logged in` | Run `npx wrangler login`. |
| `account ... is not listed` | Logged in to another Cloudflare account. Log out and in with the company account. |
| `working tree is not clean` | Commit or discard changes. Generated folders (`_site`, `_deploy`, `.release`, `monitoring-output`) are ignored and do not count. |
| `release provenance not established` | GitHub does not show this commit as the merge commit of a merged PR into `main`, or `gh` is not logged in (`gh auth login`). See "Provenance: which merges are supported". |
| `NOT CONFIRMED THE NEW VERSION IS ACTIVE` | Wrangler uploaded, but Cloudflare's listing did not show the new version within about a minute. Run `npm run release:check-wrangler` and look at the site before saying anything is live. |
| `cannot establish the rollback version` | Wrangler's deployment list had no single 100 percent version. Run `npm run release:check-wrangler` and read the message. |
| `production changed since prepare` | Someone deployed in between. Run prepare again. |
| `git fetch origin failed` | Network or login problem. Fix it; the deploy will not trust stale remote data. |
| `main is not the same as origin/main` | `git pull origin main`, or an unpushed commit exists. Deploy only pushed, merged code. |
| `some live files that pages reference could not be retrieved` | The live site refers to a file it does not serve (or the network failed). Retry. If it repeats, investigate before deploying; a deploy replaces the whole site. |
| `NOT READY: _site/... is missing` | `npm run build` did not complete. |
| Overlay says the hero or Facebook link patch failed | The live page markup changed. Update the patch in `scripts/build-live-overlay.mjs`, do not skip it. |
| `the _deploy folder changed after prepare` | Something edited it. Run prepare again. |
| All live checks show "no answer" | A proxy blocks Node. Use `NODE_USE_ENV_PROXY=1`. On your Mac this should not happen. |

## Why the overlay is still required
A Cloudflare assets deploy replaces the whole public file set. Until October 2026 the repo templates differed from the live site (different pages, fonts and 148 photos not committed). The overlay copies the live site first, then adds only the approved files, so nothing can be lost by accident.

**Current parity (measured October 21, 2026, after PR #12, with `npm run release:parity`):** the repo build has 244 files and the deploy folder has 243; 242 are byte for byte identical. The differences are:
- `sitemap.xml`: the dates come from git history, so they differ.
- `assets/img/wesleigh-behn.jpg`: this owner photo stays in the repository, but the live site deliberately does not serve it. The report found the repo build emitted it, so a direct `_site` deploy would have published it. **Fixed (PR #13):** `eleventy.config.js` excludes it from the build, `scripts/verify-release-build.mjs` fails if it appears in `_site`, the overlay and `checkDeployFolder` refuse a folder containing it, and a regression test builds the site and proves it is absent. Any future preview deploy or overlay migration inherits this because it is in the build itself. To add another never-publish file, extend `FORBIDDEN_FILES` in `scripts/lib/release-lib.mjs` and the filter in `eleventy.config.js`.

So the repo is now very close to being the source of truth, but the overlay stays until the steps below are done. Byte parity of public files does not prove parity of everything else: Worker secrets, Cloudflare dashboard settings (DNS, SSL, WAF, Turnstile widget), and any private files are outside the repository and are not covered by this report.

**The overlay no longer edits live files.** Earlier releases rewrote the hero photos and the Facebook link inside the copied live pages. Those release-specific edits were removed. The overlay now only copies live files, lays this repository's approved files and built pages on top, and then **checks** the result (Belmont hero present, current Facebook link on every page, no old link, forbidden files absent). If a check fails it stops and the fix belongs in the template, so a leftover edit can never silently change an unrelated release. The list of repository files laid over the live copy (`OVERLAY` and the built pages) is still in the script and should be reviewed at each release.

### How to retire the overlay (future, one step at a time, not done)
1. Make the sitemap dates stable and add a test (the owner photo exclusion is already done and tested).
2. Make `npm run release:parity` part of `release:prepare` and require "only live = 0, different = 0" for two releases in a row.
3. Add a preview deploy (below) that deploys the repo build and compare it to live with `release:verify-live --site <preview url>`.
4. Only then change `release:prepare` to build `_site` directly. Keep `release:parity` as a permanent guard and keep the overlay script for emergencies for one more release.

### Preview before production (future)
Use a second Worker with its own name and no production bindings (no `cc-leads`, no R2, no email), deployed from the repo build with `wrangler deploy --name collaborative-construction-preview --assets _site`, protected by Cloudflare Access for the owner only. It lets the owner review a release in a browser before approving. This needs a new Worker, an Access application and a workers.dev decision, so it needs the owner's approval first. The contact form must not point at the production database in a preview.

## Where things run
| | Local Claude Code on the Mac | Claude Cloud session | GitHub Actions |
|---|---|---|---|
| Edit, test, commit, push, open pull requests | Yes | Yes | PR checks in `release-check` |
| Wrangler and Cloudflare authentication | Owner's Wrangler login | No direct credentials | Scoped GitHub `production` environment secrets, after owner setup |
| Run `release:prepare` | Yes | Only with `--no-cloudflare` for local checks | Yes, during the manual-dispatch deploy workflow |
| Run `release:deploy` | Yes, owner terminal confirmation | Indirectly dispatches approved workflow, after explicit approval | Yes, only via `--github-approved` exact-SHA workflow context |
| Reads GitHub pull requests | `gh` | GitHub tools | Yes |

An AI agent must not assume cloud access means Cloudflare access. The cloud session itself remains credential-free; the restricted workflow performs the release on GitHub's runner. Until production environment secrets are set and an end-to-end run is verified, treat this as implemented but **not proven operational**.

## Current manual Cloudflare configuration (from `wrangler.jsonc`)
- Worker `collaborativeconstructionllc-com`, entry `worker/index.js`, compatibility date 2025-06-01.
- Static assets from the deploy folder (`--assets _deploy`), binding `ASSETS`. The Worker runs first only for `/api/*` and the 17 legacy URLs listed in `run_worker_first`.
- D1 `cc-leads` (binding `DB`), R2 `cc-lead-attachments` (`ATTACHMENTS`), email binding `SEND_EMAIL`, rate limiter `INTAKE_RATE_LIMITER` (5 requests per 60 seconds), variables `LEAD_INBOX` and `LEAD_FROM_ADDRESS`.
- Secrets (not in the repository, set with `wrangler secret put`): the Turnstile secret key, and optionally an email provider key.
- Observability on, request bodies not logged.
- **Cloudflare Builds (verified October 21, 2026):** an authenticated local Claude session reported no connected build configuration, zero build triggers and zero deploy hooks for `collaborativeconstructionllc-com`, so Wrangler is the only deployment source and a push to `main` does not deploy. This result was reported to us by the owner and was not independently reproduced from the cloud workspace. **Re-verify before every release for now, and at least monthly afterwards** (Cloudflare, Workers and Pages, `collaborativeconstructionllc-com`, Settings, Builds). If a Git repository, trigger or deploy hook ever appears, stop and treat merging to `main` as a possible live deployment.
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
