# Autonomy system: index and honest status

Written October 21, 2026. Branch `claude/autonomy-foundation`, built on the research branch `research/chatgpt-2026-10-21` (which sits on PR #6). Nothing here is merged, deployed or running unattended.

| Piece | Status |
|---|---|
| Better public health monitor (`scripts/site_health.py`, `scripts/monitor_public_site.py`) | Built and tested. Run against the live site on Oct 21: 9 pages OK, assets OK, contact endpoint OK, `www` degraded (HTTP 522). Active in GitHub only after the branch is merged to `main` |
| Evidence format and Scout prototype (`scripts/autonomy/evidence.py`, `scout.py`) | Built and tested. Deterministic. No model calls. Reads a health report and returns findings |
| Task states, owner gates, Builder simulator, spend limits (`scripts/autonomy/workflow.py`) | Built and tested as pure code. The Builder only plans a draft pull request. It writes nothing |
| Manual dry run workflow (`.github/workflows/autonomy-scout-dryrun.yml`) | Ready. Manual only. No schedule, no secrets |
| Scheduled Scout and Builder with a model | Proposal only. Needs owner decisions in `COST-CONTROLS.md` |
| GitHub issue creation by an agent | Proposal only. Needs a scoped token the owner approves |
| Read only analytics sources (GA4, Search Console, Business Profile, Cloudflare) | Proposal only. Needs owner authorisation |

Files: `HQ-PLAN.md` (private dashboard and MCP plan, approved), `PLAN.md` (design and rollout), `THREAT-MODEL.md`, `EVIDENCE-SCHEMA.md`, `COST-CONTROLS.md`, `OPERATOR-GUIDE.md`, `RUNBOOK.md`.

Tests: `python3 -m unittest discover -s tests -p "test_*.py"` (42 tests when this was written).

What the owner must approve first: see the end of `PLAN.md`.
