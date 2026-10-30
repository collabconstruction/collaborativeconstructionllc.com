# Project handoff — start here

**Last updated: October 24, 2026.** Read this before `docs/research/00-INDEX.md`. This file exists so a new agent session can resume without re-discovering verified facts. It supersedes nothing else; it points to the current source of truth for each topic rather than duplicating it. If this file and a linked file disagree, trust the linked file and flag the mismatch to the owner — this file can go stale faster than the detailed records it points to.

**Do not infer deploy status from GitHub Actions history alone.** This site has two independent production deploy paths (section 3). Checking only `gh run list` has previously produced a wrong "not deployed" conclusion. Always cross-check with `npx wrangler deployments list` (read-only) and, if present, the newest `.release/deploy-*.json` report before stating what is live.

## 1. Repository identity

- **Public repo**: `collabconstruction/collaborativeconstructionllc.com` — Eleventy (v3) + Nunjucks static site, Cloudflare Worker + D1 (`cc-leads`) for the contact form, GitHub Actions CI. This is the repo this file lives in.
- **Private repo**: `collabconstruction/collaborative-hq` — internal business-intelligence system (Cloudflare Access-protected dashboard, D1 `cc-intel`/`cc-intel-staging`, R2 evidence storage, agent-report ingestion). It is a **separate repository with separate access**. Do not recreate HQ functionality here; do not pull HQ-only material into this repo. See section 6.

## 2. Current verified GitHub state (as of 2026-10-24)

- `main` on the public repo includes merge commit **`e3db3f6` (PR #46, "AI-ops docs, brand assets, and contact email fix")**, merged 2026-10-24. This PR touched ~324 files (+51,577/-191) and mixed legitimate public-site changes (contact email copy fix) with internal/duplicate/unprocessed material that should never have been added to a public repo: raw, unedited project photography (`Bath Remodels/`, `Custom Homes/`, `Kitchen Remodels/`, `Pool Projects/`), draft AI-generated brand images, a full duplicate AI-ops instruction system (`docs/ai-operations/`, `docs/PROJECT_PIPELINE.md`, `docs/PROJECT_SOURCE_OF_TRUTH.md`), internal planning docs (`docs/cinematic-experience/`, `docs/implementation/`), a mirrored copy of third-party repos (`docs/research/evidence/github/`), and a file containing personal (non-business) email addresses and an account/credential surface map (`docs/research/20-accounts-and-integrations.md`).
- **PR #47 — MERGED** (merge commit `8b1bb16`, 2026-10-24T15:40:59Z, `chore/public-repo-cleanup-2026-10-24` → `main`). Removed the material listed above (214 files). Explicitly did **not** remove `docs/health/` or `docs/competitive/` — those were initially misclassified as AI-ops clutter during preparation but are the legitimate, intentional output of the automated report-sync pipeline (see `docs/automation/report-ingestion.md`); removing them would have broken a working pipeline. Tests (174/174 Node tests at the time) and `npm run build` passed on this branch; `node scripts/verify-release-build.mjs` confirmed 378 public files with no private material and no regressions. CI ("Release Check") was green before merge.
- **PR #48 — MERGED** (`fix/gallery-cta-texture-consistency` → `main`, merged 2026-10-24T15:38:21Z, by the owner's GitHub account directly). Unrelated gallery/service-page CTA texture fix — not produced by this session, noted here only because it landed on `main` between this handoff branch being created and finished, confirming the owner is actively working in the repo in real time.
- **Draft PR B** — `docs/rebuild-handoff-2026-10-24` → `main` (this file). Replaces the stale, Oct 12-dated `docs/HANDOFF.md` that described an out-of-date design-branch narrative and a now-superseded account-confusion note. Rebased onto `main` after PR #47/#48 merged. **Not merged — awaiting owner review.**
- **Open PR #44** (`collabconstruction/collaborativeconstructionllc.com`) expands the `AGENTS.md`/`CLAUDE.md` "private business intelligence lives in collaborative-hq" language and, in its current text, references `docs/automation/hq-data-contract.md` and `docs/implementation/2026-10-23-hq-dashboard-rebuild.md` by name as further reading. **Problem**: PR #47 already deleted both of those files from `main` as internal/duplicate material. Re-diffing PR #44 against the current `main` (after #47) confirms it would merge cleanly on `AGENTS.md`/`CLAUDE.md` text, but it would add two dangling file references to docs that no longer exist in the repo. PR #44's own description states the duplicate `/hq` dashboard it refers to "was never committed or deployed and has been fully retired" — so the underlying system is already gone; **the owner should edit PR #44 to drop those two file references (or merge, then fix the references in a follow-up) rather than merge it unmodified.**
- **Private repo** (`collabconstruction/collaborative-hq`) has **9 open PRs** as of this check (#2, #7, #9, #10, #11, #12, #13, #14, #15 — newest is #15, "Agent report ingestion pipeline: registry, collector, endpoint, dashboard", updated 2026-10-24T05:20:31Z). None were reviewed in this session — entirely out of scope for the public-repo cleanup, but this is a large open-PR backlog the owner should triage separately.
- No destructive git operations were run anywhere in this session: no `reset --hard`, no `clean -f`, no deleted worktrees, no force-push against anyone else's branch, no history rewrite. The one force-push used (`chore/public-repo-cleanup-2026-10-24`) was to a branch created and pushed entirely within this session, to amend a self-caught classification error before review — not a push over existing collaborator work.

## 3. Production/deployment state

- **Commit `e3db3f6` (PR #46) is live in production**, confirmed via the local release report `.release/deploy-1792803....json` found in a worktree: deployed and verified at `2026-10-24T06:10:35.671Z`, Worker version `2c6eb2f3-8af2-404a-9c6d-3b17b24e9746` (previous version `509c5884-2fc5-46a6-a3d0-6ea2758f7dc5`), outcome "DEPLOYED and verified (upload, active version, live checks, SEO audit)", zero failed live checks. This matches the live site, which now shows `contact@collaborativeconstructionllc.com` instead of the old `info@` address.
- **There are two independent, non-overlapping deploy paths** — check both before concluding anything about deploy status:
  1. **GitHub Actions**: `approved-production-deploy.yml`, manual `workflow_dispatch` only, SHA-pinned, requires the `Pushing Live` environment's secrets. Visible via `gh run list --workflow approved-production-deploy.yml`. The most recent run in this workflow's history (as of this session) was for PR #37, well before PR #46 — **this workflow was not used to deploy PR #46.**
  2. **Local Mac deploy** (`npm run release:prepare` then `release:deploy -- --confirm <sha>`, per `docs/DEPLOY-LIVE.md`). This path leaves **no trace in GitHub Actions** — it only appears in local `.release/deploy-*.json` reports (which may live in a worktree, not necessarily the main checkout) and in Cloudflare's own deployment history. **This is the path that actually shipped PR #46.**
- Verify current live state yourself with `npx wrangler deployments list` (Cloudflare account `0fadcd0965374caa75a44c3aa9784042`, Worker `collaborativeconstructionllc-com`) — this is read-only and safe to run anytime. Wrangler was found pre-authenticated as `wesleighb@gmail.com` in this environment.
- Never deploy `_site` directly, never deploy or roll back production as an agent action, never dispatch the production-deploy workflow without explicit owner authorization. See `docs/DEPLOY-LIVE.md` for the full protected process.

## 4. Website architecture notes

- Eleventy input is `src/`, output `_site/`. Passthrough copies are limited to `css/`, `js/`, `assets/` (excluding `assets/img/wesleigh-behn.jpg`, which is in-repo but never served), and `robots.txt`. **Anything added at repo root or under `docs/` is never built or served** — this is why PR #46's raw photos and internal docs, while a real public-GitHub exposure problem, were never a production/live-site exposure problem. Treat those as two different severities when triaging similar issues in the future.
- Contact form → Cloudflare Worker → D1 `cc-leads`; lead notification email routes through Cloudflare Email Routing to `contact@collaborativeconstructionllc.com` (confirmed in code and live copy as of PR #46; end-to-end delivery — i.e., an actual test submission arriving in the inbox — was **not** re-tested this session and should not be assumed without an owner-authorized test).
- The automated report-sync pipeline (`docs/automation/report-ingestion.md`) is intentional and expected to keep producing uncommitted/new changes under `docs/health/runs/` and `docs/competitive/runs/` on this machine on an ongoing basis (local scheduled tasks `cc-daily-health-report-local`, `cc-daily-competitor-scan-local`, `cc-reports-sync-local`, plus optional Claude Cloud Routines pushing `claude/<run-id>` branches). Do not treat fresh files there as stray or unauthorized without checking that doc first. Automation status beyond what's documented (e.g., whether ChatGPT/Grok integrations are actually configured and running, versus only described) is owner-reported and was not independently re-verified this session.

## 5. Private business intelligence lives in collaborative-hq, not here

Internal dashboards, BI data contracts, agent-report ingestion for cross-session intelligence, and anything requiring Cloudflare Access protection belong in `collabconstruction/collaborative-hq`, a separate private repository with its own D1 databases (`cc-intel`, `cc-intel-staging`) and R2 evidence storage. This repo (the public site) should only ever contain the docs-only, non-sensitive report mirror described in `docs/automation/report-ingestion.md`. Do not build a second dashboard or BI system here — PR #46 did exactly that (duplicated under `docs/ai-operations/` and `docs/implementation/`), and PR #47 removes it for that reason.

## 6. Open owner decisions

None of these were resolved this session — they require the owner, not another agent pass:

1. **How to fix PR #44 now that #47 is merged** (section 2) — merging #44 unmodified will add two dangling references to files #47 already deleted.
2. **Whether to pursue git-history remediation** for the material that was in `main`'s history before PR #47's merge (raw photos, the personal-email/account-surface-map file) and is still reachable via the pre-merge commits. Rewriting published history or contacting GitHub Support about scrubbing it is an owner-level decision with real tradeoffs (broken forks/clones, force-push to `main`) — not something an agent should do unilaterally.
3. **Whether to run an authorized end-to-end contact-form email test** to confirm lead notifications are actually arriving at `contact@collaborativeconstructionllc.com` post-PR#46, rather than relying on code/copy inspection alone.
4. **`collaborative-hq`'s 9-PR backlog** (#2, #7, #9, #10, #11, #12, #13, #14, #15) — not reviewed this session; separate follow-up scope, likely needs its own triage pass.
5. **Nantucket / Martha's Vineyard service-area question** — still undecided per earlier research; not touched this session, not silently resolved either way.

## 7. Local filesystem notes for the next agent

- Raw, unprocessed project photography and draft brand images that PR #47 removes from the **repo** still exist as **local original files** wherever they were first added — they were never deleted from disk, only unstaged from the public Git history. Do not delete local originals; do not rename, resize, or otherwise "publish" them into the public gallery without explicit owner attribution/approval for each project.
- At last check this environment had 25+ live git worktrees across `/private/tmp/*`, `~/.codex/worktrees/*`, `~/.stagewise/worktrees/*`, and `~/Desktop/CollaberativeConstructionWebsite/.claude/worktrees/*`. None were touched or deleted this session — worktree cleanup requires explicit owner authorization.
- The main working checkout (`/Users/marcusbehn/Desktop/Software/Wesbite/CollaberativeConstructionWebsite`) routinely has uncommitted changes under `docs/health/` from the live report-sync pipeline (section 4) — this is expected, not a sign of incomplete work.

## 8. Source hierarchy — where to look first

| Topic | Read this first |
|---|---|
| Overall repo rules for agents | `AGENTS.md` |
| Deploying to production | `docs/DEPLOY-LIVE.md` |
| Company improvement / growth work queue | `docs/research/00-INDEX.md`, `docs/research/08-growth-plan.md` |
| Delegation / multi-agent handoffs | `docs/research/09-agent-pipeline.md` |
| What agents have found recently | `docs/research/22-research-report-index.md` |
| Automated report-sync pipeline mechanics | `docs/automation/report-ingestion.md` |
| This PR #46 cleanup and its rationale | Merged PR #47's description and commit message (merge commit `8b1bb16`) |
| Private BI / HQ dashboard | `collabconstruction/collaborative-hq` (separate repo — not this one) |

If this file and a linked file disagree, trust the linked file and tell the owner.
