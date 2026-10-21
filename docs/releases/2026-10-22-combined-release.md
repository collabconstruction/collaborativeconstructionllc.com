# Combined release 2026-10-22

Status: prepared. Not deployed. The owner deploys.

## What is included

- PR #6: design refinements.
- PR #10: crawl and SEO fixes (robots.txt shipped from the repo, one H1, canonical and og checks, `scripts/seo_audit.py`).
- PR #11: Gallery with three views, cycling photos, Deck and Railings and Porches and Upper Balcony last.

All three are contained in this branch (checked with `git merge-base --is-ancestor`). This one pull request (#12, to `main`) replaces #6, #10 and #11. Close those three after it merges.

## Branches not in this release

| Branch | Content | Status |
|---|---|---|
| `claude/utm-attribution-proposal` (PR #7) | Keep checked UTM tags in GA4 | Not included. Owner decides about sharing the referrer origin. Merge after this release, one at a time. |
| `claude/privacy-page` | Privacy page draft, built only when published | Not included. Needs the owner's text and retention answers. |
| `claude/workers-dev-off` | Turns off the public workers.dev address | Not included. Do not deploy until the dashboard is checked. Own release. |
| `research/chatgpt-2026-10-21` (PR #8) | Research documents | Not included. Documents only. |
| `claude/autonomy-foundation` (PR #9) | Monitor and autonomy tooling | Not included. Stacked on #8. |

## Safe release sequence

1. **Cloudflare Builds check (owner, first).** Open Cloudflare, Workers and Pages, `collaborativeconstructionllc-com`, Settings, Builds. If a Git repository is connected, disconnect it, or confirm it will not deploy on a push. Reason: merging to `main` must never start an automatic build that replaces the live site without the overlay step.
2. **Merge PR #12 into `main`** on GitHub (owner). `main` then matches what is about to be deployed. The live site is still the old version.
3. **Deploy from your Mac** (owner), using the commands below. This is the only step that changes the live site.
4. **Follow up PRs, one at a time:** UTM, privacy page, workers.dev off. Each gets its own release note and checks.

## Mac commands (copy and paste)

    cd ~/Desktop/Personal/CollaborativeConstruction/collaborativeconstructionllc.com
    git fetch origin && git checkout main && git pull
    npx wrangler whoami
    npx wrangler deployments list

Write down the newest deployment id from the last command. Then:

    npm ci
    npm run build
    node scripts/verify-release-build.mjs
    node scripts/build-live-overlay.mjs
    npx wrangler deploy --assets _deploy --dry-run
    npx wrangler deploy --assets _deploy

If `wrangler whoami` says you are not logged in, run `npx wrangler login` first. Then follow "After deploy" and "Rollback" below.

## What is not included

- PR #7 (UTM allowlist).
- Privacy page.
- Turning off workers.dev.
- PR #9 (autonomy tooling).
- The `www` fix, Cloudflare AI crawler settings, licence numbers. These are Cloudflare or owner items.

## Contact form is unchanged

Compared with the last deployed commit `6aae532`, these files have no diff:
`worker/`, `wrangler.jsonc`, `migrations/`, `schema.sql`, `js/turnstile-lifecycle.js`, `js/intake-context.js`, `js/analytics.js`, `js/api.js`.
The contact section of `src/index.njk` is byte for byte the same. The built home page still has the Turnstile widget and the honeypot field.
So Turnstile, D1 (`cc-leads`), R2 attachments and the email binding keep working as before.

Check it yourself:

    git diff 6aae532 HEAD --stat -- worker wrangler.jsonc migrations schema.sql js/turnstile-lifecycle.js js/intake-context.js js/analytics.js js/api.js

The output should be empty.

## Gates already passed on this branch

- `npm run release:check` (tests, build, release build verification, wrangler dry run)
- `python3 -m unittest discover -s tests -p "test_*.py"`

## Deploy steps (owner)

1. Capture the current version so you can roll back:

       npx wrangler deployments list

   Write down the newest deployment id.

2. Get the branch and build:

       git fetch origin
       git checkout release/2026-10-22
       npm ci
       npm run build
       node scripts/verify-release-build.mjs

3. Build the safe overlay folder and dry run:

       node scripts/build-live-overlay.mjs
       npx wrangler deploy --assets _deploy --dry-run

   The overlay step must end with READY. It stops if Cloudflare's managed robots block is found.

4. Deploy:

       npx wrangler deploy --assets _deploy

## After deploy

1. Open the home page, Gallery (all three views), one service page and About in a browser.
2. `curl -s https://collaborativeconstructionllc.com/robots.txt`. Cloudflare's managed block should appear at most once.
3. `python3 scripts/seo_audit.py` and `python3 scripts/monitor_public_site.py`.
4. Controlled contact test (owner approves it first): submit one clearly marked test message. Confirm it arrives in the inbox and a row appears in D1:

       npx wrangler d1 execute cc-leads --remote --command "SELECT id, created_at FROM leads ORDER BY id DESC LIMIT 1"

   Delete the test row afterwards if you want.

## Rollback

If any check fails:

    npx wrangler rollback <previous-deployment-id>

Use the id from step 1. No database change is part of this release, so nothing else needs to be undone.
