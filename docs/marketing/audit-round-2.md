# Social media audit, round 2 (handoff)

Report dated October 20, 2026, from the browser research agent. Recorded here October 21, 2026.

The research agent could not control a signed in browser. It made no social media changes. This file keeps checked facts apart from unchecked ones.

## Checked by the research agent (public sources and Metricool)

- The Claude branch was 59 commits ahead of `main` and 0 behind, at commit `b710130`. I confirmed the same count in the repo.
- The four marketing documents exist in `docs/marketing/`.
- The October 20 introduction post is published. Metricool shows it went out at 9:38 PM Eastern.
- The website home page is reachable. The `www` address failed.
- Metricool Facebook id is 1409900735535950. The post path uses page id 122094671283521703. The reported official page id is 61595651094549.

## Not checked (no signed in access)

- That the three Facebook ids above are the same page. Different ids do not prove a mistake. They also do not prove a match.
- Who has full control of the Facebook page, and whether a backup admin exists.
- Facebook and LinkedIn profile fields. Every "DONE" in the audit table is reported by the earlier signed in agent, not seen by the research agent.
- Follower counts, search order, and whether the older page 61593017512930 ranks above the newer one.
- Whether the footer social links resolve, as seen by the research agent. I checked the Facebook link on the live pages myself earlier.
- Competitor Facebook follower counts, ratings and posting rates. These were not invented.

## Decisions recorded (from the owner's relayed message)

1. Pull request from this branch into `main` is approved. No auto merge. No deploy. Full tests and release checks must pass.
2. Facebook service areas stay as they are until the owner confirms coverage. Provisional idea: swap Edgartown and Nantucket for Yarmouth and Dennis if island service is not confirmed.
3. Metricool: schedule nothing more until the Facebook page match is confirmed.
4. Older Facebook page: do not delete or merge. Merging can delete posts, photos and ratings and cannot be undone.
5. Analytics: prepare a separate proposed fix for UTM tags. Do not deploy.
6. `www` redirect: prepare a plan to redirect to `https://collaborativeconstructionllc.com`. Check DNS, TLS and routing first.
7. `workers.dev`: audit it. If unused, recommend turning off the public route without touching the production Worker, API or integrations.
8. Marketing drafts stay drafts. No posting, messaging, commenting, inviting, extra follows or spending until checks are done.
9. Write original homeowner topics. Do not copy competitors. Do not make unverified project claims.

## Content ideas from the research (original wording needed)

Topics that fit confirmed services: what to prepare before contacting a contractor; how additions and ADUs differ in planning; why independent oversight helps when a homeowner already has a builder; what happens at close out.

Competitor lesson, from public websites only: a connected educational series, a clear after-inquiry process, and before and after photos with permission.

## Review rule

Google allows asking for genuine reviews. It does not allow rewards or asking only happy customers. `review-requests.md` follows this.

## Open work, in order

1. Owner checks, in Facebook, that page 61595651094549 is the one Metricool posts to.
2. Owner confirms full control admins and adds a trusted backup.
3. Owner confirms service towns.
4. Review the older Facebook page before any merge.
5. Merge the pull request when the owner is ready.
6. Analytics UTM fix: see branch `claude/utm-attribution-proposal`, if created.
7. `www` redirect and `workers.dev` steps: see `docs/marketing/www-and-workers-dev.md`.

## Review response (October 21, 2026)

Independent GitHub review of PR #6 asked for checks on the exact head. On head `21b9e58`, `npm run release:check` passed: 99 tests, release build verified (222 files, 9 pages), `wrangler deploy --dry-run` OK. Python tests also pass.

Added `.github/workflows/release-check.yml` so the same checks run on every pull request. It is read only and deploys nothing.

Deploying (not merging) needs one authorized test inquiry afterward: check it is saved, the notification arrives, no duplicate, no customer data in logs. Keep a rollback ready.

Analytics: see the UTM pull request for the referrer and overlay fixes.
