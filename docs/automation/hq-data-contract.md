# HQ data contract (retired)

Status: retired, 2026-10-24. This document described a `/hq` dashboard pipeline
(`docs/health/runs/ → scripts/hq-sync.mjs → KV → /hq`) built experimentally in this
public website repository on 2026-10-23. That code was never committed to this
repository and was never deployed anywhere. It has been removed from this worktree.

Why it was retired: a separate, more mature private HQ system already exists at
`collabconstruction/collaborative-hq`, with a proper evidence pipeline (hashed,
immutable artifacts in R2), a real D1 schema (`cc-intel`/`cc-intel-staging`), and
Cloudflare Access protecting it — a categorically stronger security model than this
experiment's password-plus-cookie gate and KV-only storage. Building a second,
independent dashboard here would have created two sources of truth for the same
business data, which is exactly what the owner's operating model is designed to avoid.

The one part of this experiment worth keeping — GA4 report parsing and validation
logic — was not copied wholesale. It was rewritten from scratch against the private
HQ's own schema and conventions (evidence-first, idempotent per period, missing data
stored as `NULL` never `0`) as `packages/domain/src/ga4.ts` in `collaborative-hq`,
with its own test suite, in a draft PR against that repository.

Kept here only as a record of what was explored and why it was not adopted. Do not
resurrect this pipeline — if GA4/GSC or other analytics work is needed on this public
site, it belongs in `collaborative-hq` instead; see this repo's `AGENTS.md` for the
pointer.

---

*Original document below is not preserved verbatim — the `/hq` → KV → dashboard
contract it described has been fully removed from this repository's working tree.*
