# Project handoff — start here

**Last updated: October 12, 2026.** Read this before `docs/research/00-INDEX.md`. This file exists so a new session can resume without repeating research that already happened. It supersedes nothing else; it points to the current source of truth for each topic rather than duplicating it. If this file and a linked file disagree, trust the linked file and flag the mismatch — this file can go stale faster than the detailed records.

## 1. Deployment and Git status (verified, not claimed)

- **Live production Worker version**: `28d3bb86-6417-4266-a3b0-c12e28f8c37f` (created 2026-10-12T16:34:30.692Z), Worker `collaborativeconstructionllc-com`, Cloudflare account `0fadcd0965374caa75a44c3aa9784042`.
- **Deployed source commit**: `1a8c15b7423882b1f6d2d2e14b4a835ec749b941` — verified byte-identical for frontend assets (`js/main.js`, `js/turnstile-lifecycle.js`) between the live site and this commit.
- **Git branches** (as of this update):
  - `codex/phase1-recovery` — pushed to `origin`, at `1a8c15b...`. This is the durable copy of the verified recovery work; confirmed via `git ls-remote`.
  - `phase1-release-prep` (local workspace's checked-out branch) — fast-forward merged to `1a8c15b...` locally. **Not pushed to origin** — it has no upstream tracking branch. This was deliberate: pushing it was not authorized.
  - `main` — still at `e2ba56b...` on origin, unchanged. **Not merged.** Merging recovery work into `main` requires a separate, explicit owner approval; it has not been requested or granted.
  - A stray local branch `claude/romantic-vaughan-381ed4` (`4586bb9`) and `feature/live-parity-and-features` (`e2ba56b`, matches `main`) also exist locally; neither was touched this session.
- **Uncommitted working tree**: ~89 files uncommitted/staged in the main workspace (`/Users/marcusbehn/Desktop/Software/Wesbite/CollaberativeConstructionWebsite`, branch `phase1-release-prep`). These are **substantial pre-existing research/skills work predating this session**, deliberately preserved — no destructive Git operation (`reset --hard`, `clean -f`, broad `add -A`) was run against them. The count grew slightly from 86 during this session because this session's own documentation edits (this file, `docs/phase1-status.md`, edits to `docs/research/*`, `docs/operations.md`) are also sitting uncommitted in that same tree. **None of this session's documentation edits have been committed yet** — see section 6.
- **Isolated verification worktree**: `/Users/marcusbehn/.codex/worktrees/intake-release/CollaberativeConstructionWebsite` (branch `codex/phase1-recovery`) was used to validate the merge safely before touching the real `phase1-release-prep` branch; a separate throwaway worktree (`integration-check-phase1-release-prep`) ran the full test suite + dry-run before the real fast-forward merge happened. Both are safe to leave or remove; neither holds unique work not already in `codex/phase1-recovery`/`phase1-release-prep`.

## 2. Phase 1 — customer intake pipeline

**Status: PASS, verified in production with owner-confirmed email receipt.** Full detail, acceptance-criteria table, and known unresolved technical items live in `docs/phase1-status.md` — read that file for specifics rather than this summary. In short: a real test inquiry on 2026-10-12 was stored once in D1, correctly assigned in the workflow table, retrievable via the private CLI, accepted by the email provider, and the owner personally confirmed it arrived in `collaborativeconstructiongc@gmail.com`. The historical pre-Phase-1 lead (received 2026-09-29) is preserved unchanged.

Three known, non-blocking technical items remain (full detail in `phase1-status.md`): the original Turnstile 403's root cause is undiagnosed (resolved in practice via new diagnostics, not root-caused); a minor mobile horizontal-overflow issue around 390px viewport width; and a D1 migration-ledger bookkeeping gap (migrations 0001/0002 are applied in production but not recorded in the tracking table — do not replay them; this needs its own separate reviewed task).

Five older Phase 1 planning documents (`phase1-production-preflight.md`, `phase1-activation-checklist.md`, `phase1-deliverables.md`, `phase1-final-approval-request.md`, `phase1-release-decision-report.md`) are preserved unmodified as historical pre-deployment records, each now carrying a banner pointing to `phase1-status.md`. Do not delete them; they're the investigation trail.

## 3. Data and account access status

| Source | Status |
|---|---|
| Cloudflare / Wrangler / D1 | **Connected, verified working** (confirmed directly during Phase 1 closeout) |
| Google Search Console | Unknown — not connected; owner must grant property access |
| GA4 | Unknown — not connected; measurement ID exists in code, reporting access unverified |
| Google Business Profile | Unknown — not connected; owner must grant manager access or supply a manual export |

This is an owner-granted-access blocker, not a technical one. The exact procedure to resolve each is in `docs/research/06-data-access.md`.

## 4. Business growth status: known vs. unknown

**Known**: the intake pipeline technically works end-to-end (section 2). Current real qualified-inquiry count for the active reporting period is **0** — not because anything is broken, but because no actual customer has submitted a real inquiry since the pipeline started working. Do not report the 2 D1 leads (1 historical, 1 flagged test) as business traction; the scorecard's own definition of "web inquiries" excludes both (`docs/research/10-scorecard.md`).

**Unknown** (business facts, not technical facts — see `docs/research/11-decisions-and-questions.md` for the full numbered list): which services/towns/budget bands to prioritize for the next six months; current estimating/PM capacity; who the real intended lead-response owner is (the technical default is "Wesleigh Behn" on every new lead, unconfirmed as the actual intended owner); exact role on each of the seven portfolio projects (confirmed LLC job vs. prior personal employment vs. unverified — none of the seven currently has a confirmed attribution); current CSL/HIC/insurance details eligible for publication; whether the public address is storefront-eligible or should be hidden as a service-area business; whether the Islands/South Shore are actual strategic priorities; pricing policy for introductory estimates; marketing budget.

## 5. Growth priorities (Phase 2)

Full detail, evidence, and the three highest-value next actions with effort/cost/access/approval/deliverable/success-criteria are in **`docs/research/14-phase2-execution-plan.md`** — read that file, not this summary, before doing Phase 2 work. In short, the three highest-value next actions are:

1. Connect GBP, GSC, and GA4 reporting access (owner time only; unblocks every other measurement).
2. Fix the ADU page's image/caption mismatch and complete its feasibility checklist content (small effort; aligned with the one service line that has sourced local demand evidence).
3. Resolve the Falmouth residential-exterior case study's attribution with the owner and, if confirmed, prepare it for publication (it's the only one of seven gallery projects physically inside the declared core market, and the business currently has zero case studies with verified role/process).

## 5a. Git integration readiness (2026-10-12 execution sprint)

Re-verified this sprint, no destructive operation run:

- `codex/phase1-recovery` (pushed, `1a8c15b`) ← `main`/`origin/main` (`e2ba56b`, unrelated, unchanged) ← `phase1-release-prep` (local-only, `936cb25`) is **exactly one commit ahead** of `codex/phase1-recovery`'s tip: the documentation commit `936cb25` (`docs(phase1,phase2): record production-verified status and open Phase 2 plan`). Confirmed via `git merge-base --is-ancestor 1a8c15b 936cb25` (true).
- **Safe integration plan, not yet executed (needs separate approval):**
  1. Push `phase1-release-prep` to `origin` as a new branch (e.g. `origin/phase1-release-prep` or fast-forward `origin/codex/phase1-recovery` to `936cb25`) — this only adds the one documentation commit on top of already-pushed work; it changes no production code.
  2. Separately, and only with explicit owner approval, fast-forward `main` to `936cb25` (or open a PR for review first) — `main` currently has no commits that aren't also in `936cb25`'s history, so this would be a clean fast-forward with no merge conflicts, but it is a distinct decision from pushing the recovery/prep branches.
  3. This sprint's own new local changes (ADU content edit, `phase1-status.md` update, `14-phase2-execution-plan.md` updates, new `15-falmouth-case-study-worksheet.md`) are **not yet committed** as of this writing — see section 6 for the focused-commit plan that keeps them separate from the ~80 unrelated pre-existing uncommitted files currently in the tree (`git status --porcelain=v1 | wc -l` → 80, up from 76 after the prior session's focused commit, because this sprint's edits are sitting on top of that unchanged baseline).
- **No push to `origin/main`, no merge into `main`, and no push of `phase1-release-prep` was performed this sprint** — all three remain pending owner approval, per the task's explicit constraint.

## 6. Next actions for whoever picks this up

- **Decide whether/how to commit this session's documentation edits.** Nothing from this session (this file, `docs/phase1-status.md`, `docs/research/14-phase2-execution-plan.md`, edits to `docs/research/08-growth-plan.md`/`10-scorecard.md`/`11-decisions-and-questions.md`/`00-INDEX.md`, `docs/operations.md`, the five superseded-banner insertions) has been committed. They sit uncommitted alongside the pre-existing ~86 files of unrelated research/skills work. A focused commit covering only this session's documentation changes (not the pre-existing unrelated work, and not a destructive `add -A`) is the clean way to make this durable — do that explicitly rather than assuming it already happened.
- **Do not merge `phase1-release-prep`/`codex/phase1-recovery` into `main`, and do not push `phase1-release-prep`, without separate owner approval.** Both remain local-only or recovery-branch-only by design.
- **Do not replay D1 migrations** 0001 or 0002 — production already has both migrations' objects; the ledger gap is a separate bookkeeping task.
- **Do not treat the 2 D1 leads as business traction.**
- Owner decisions still needed before further Phase 2 work can move past research: see `docs/research/11-decisions-and-questions.md` section "Owner decisions needed first" (10 numbered items) — none of them are technical.
