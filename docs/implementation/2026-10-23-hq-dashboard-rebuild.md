# Collaborative HQ rebuild (retired)

Status: retired, 2026-10-24. This document originally recorded the build of an `/hq`
dashboard directly in this public website repository on 2026-10-23: password+cookie
authentication, a KV-only data store synced from `docs/health/runs/` via
`scripts/hq-sync.mjs`, and ten dashboard sections with a deterministic insights engine.

That work was never committed to this repository and was never deployed. It duplicated
a pre-existing, more mature private HQ system at `collabconstruction/collaborative-hq`
(Cloudflare Access authentication, D1 `cc-intel`/`cc-intel-staging`, an evidence
pipeline with hashed immutable artifacts in R2, and already-tested Search Console
ingestion). Running two independently-developed dashboards against the same business
data risked exactly the kind of silent divergence the owner's operating model is meant
to prevent, so this experiment was not adopted.

What was removed from this repository's working tree as part of retiring it:
- `worker/hq/` (dashboard routes, HTML/CSS/JS)
- `scripts/hq-sync.mjs`
- The `/hq` and `/hq/api/snapshot` route wiring in `worker/index.js`, and the
  corresponding KV namespace configuration in `wrangler.jsonc` / `wrangler.local.jsonc`
  (reverted to their state before this experiment)
- A local-only `.claude/launch.json` entry for running this dashboard (that file is
  gitignored and was never shared regardless)

What was preserved instead of discarded: the GA4 report parsing/validation logic was
the one genuinely reusable piece. It was rewritten against `collaborative-hq`'s own
schema and conventions (not copied as-is) as `packages/domain/src/ga4.ts`, with its own
test suite, in a draft PR against that repository. Google Search Console ingestion was
not ported — `collaborative-hq` already has a tested, superior implementation of that.

Kept here only as a record of what was built and why it was retired, not as an active
contract. See this repo's `AGENTS.md` for the pointer to the real private HQ repository.
