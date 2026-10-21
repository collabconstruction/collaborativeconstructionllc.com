# Plan: two cooperating agents with controlled shared state

## Goal
Find real problems and opportunities with dated evidence, turn the approved ones into small tested draft pull requests, and measure results. Safe by default. A person approves anything that touches the live business.

## Design in one picture
A scheduled run reads saved state, does one bounded job, writes one small artifact and exits. The next run continues from that artifact. There is no long running conversation between agents and no loop that can run away.

```
timer or manual run
  -> Scout (read only) -> findings (deduplicated) -> GitHub issue labeled agent:research (owner approves before any build)
  -> owner adds agent:ready
  -> Builder (one task) -> draft pull request -> GitHub checks -> Scout checks the evidence -> owner reviews -> owner merges and deploys -> Scout measures later
```

## Agents
- **Scout (Agent A).** Reads public health results and, in later phases, official Massachusetts ADU pages, a small rotating set of the 26 watched competitor pages, and GitHub run history. Output is a finding in the shape in `EVIDENCE-SCHEMA.md`. It never edits code.
- **Builder (Agent B).** Takes one owner approved task. Works in an isolated branch. Adds tests. Opens a draft pull request. It cannot merge, deploy or touch protected paths.
- **Owner.** Approves tasks, public claims, spending, merges and deployments.

## Task states and who may move them
States: discovered, needs-evidence, needs-owner, approved-for-proposal, implementing, awaiting-review, accepted, released, measuring, closed, blocked, cancelled. The table is in `scripts/autonomy/workflow.py`. Only the owner can move a task to approved-for-proposal, accepted, released or cancelled. Agents cannot release or close anything. Illegal jumps raise an error.

## Permissions (when a workflow exists)
- Scout: `contents: read`. No secrets.
- Builder: a scoped token that can push to feature branches and open draft pull requests only. No admin, no secrets, no deployments, no workflow edits, no protected branch writes. Not created yet.
- Protected paths the Builder may never edit without a human opt in: `wrangler.jsonc`, `migrations/`, `schema.sql`, `worker/`, `.github/workflows/`.

## Costs and limits
See `COST-CONTROLS.md`. No paid model call happens without an owner set daily and monthly cap, a stop file check and a failure pause. Today nothing calls a model.

## Schedule proposal (not enabled)
- Health check every 6 hours: exists, free, no model.
- Scout once a day with a deeper weekly pass: needs a decision on a model provider.
- Builder once a day, only when an approved task exists, one task at a time.
- Weekly report to the owner: at most three validated actions.

## Staged rollout
0. Inventory and design (this document and the others).
1. Deterministic monitor (built).
2. Scout prototype with fixtures (built for health data; other sources are next).
3. Builder simulator (built; plans only).
4. Owner feedback loop and read only measurement sources (needs authorisation).
5. Bounded unattended rollout (needs owner decisions below).

## Findings already acted on
- `www` returns HTTP 522 and the old monitor did not ask. The new monitor does, and reports it as degraded with the reason. The Worker already contains a www redirect, but it never runs because no route or custom domain binds `www` to the Worker. The fix is in the Cloudflare dashboard and needs the owner.
- The contact endpoint is checked with GET only. It must answer 405 with `Allow: POST`. No form data is ever sent.

## Owner approvals needed, in order
1. Read Cloudflare Settings, then Builds, for `collaborativeconstructionllc-com` (blocks merging PR #6).
2. Give the official HIC and CSL numbers from ContractorHub.mass.gov. Third party numbers found in research are leads only and are not on the site.
3. Confirm the Facebook page match in a signed in view.
4. Set model spend caps and pick a provider, or decide to stay deterministic only.
5. Decide whether a scoped GitHub token for issues and draft pull requests may be created.
