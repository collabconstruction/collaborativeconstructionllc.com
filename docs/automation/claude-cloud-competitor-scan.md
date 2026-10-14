# Claude cloud competitor & trend-scan setup

Prepared October 14, 2026. This is a setup package, not evidence that a routine has been created, connected, or run. It is the sibling to `docs/automation/claude-cloud-health-report.md` and shares that guide's prerequisites — read that file's Sections 1 and 3 first; they are not repeated in full here.

## Outcome

A second, independent Claude Code **Cloud Routine** scans competitor public pages, Reddit/X/GitHub for construction-industry and small-business-website trends, and a bounded, owner-approved list of out-of-area comparison companies, then pushes a dated report to its own branch of `collabconstruction/collaborativeconstructionllc.com`. It proposes wording/positioning changes and next tasks. It does not edit any live page, post anywhere, create accounts, or merge/deploy anything.

This is deliberately a **separate** routine from the health report, not a combined one: different cadence/cost tradeoffs, different data sources, and a failure in one (e.g., a blocked Reddit search) should never prevent the other from delivering its report.

## 1. Prerequisite: same cloud-copy and branch state as the health report

Same starting branch as the health report: `design/site-refresh-2026-10` on `origin` (tip `319972f` as of 2026-10-14), not `main`. If a later session advances that branch or merges it, re-point this routine's starting branch to wherever `docs/research/03-competitors.md`, `docs/research/21-comparison-markets-shortlist.md`, and the agent-pipeline doc actually live — don't assume the SHA above stays current.

**This routine additionally depends on `docs/research/21-comparison-markets-shortlist.md` being reviewed by the owner.** Until that file's status line says "approved," the prompt instructs the routine to use it as a *draft* starting point and flag in its report that the comparison-market list is still unapproved, rather than silently treating a draft as settled fact.

## 2. Create the routine

1. Open https://claude.ai/code/routines → **New routine** (Cloud). In Claude Desktop: Code → Routines → New routine → **Cloud**.
2. Name it **Collaborative Construction — daily competitor & trend scan**.
3. Select only `collabconstruction/collaborativeconstructionllc.com`, branch `design/site-refresh-2026-10`, and a **separate** dedicated environment from the health-report routine (keeps a runaway search in one from ever blocking the other's commissioning or billing).
4. Start daily at **7:11 AM America/New_York** (deliberately offset from the health report's 6:52 AM so the two don't race on the same branch tip), plus manual **Run now** for commissioning.
5. Paste the complete prompt from `docs/research/prompts/claude-cloud-competitor-scan.txt` into Instructions.
6. Remove unnecessary connectors, same as the health report. This routine needs web search/fetch only — it has no legitimate reason to touch GA4, GSC, Cloudflare, D1, Gmail, or Drive, so don't attach them even if available; a routine with more connectors than its task needs is a bigger blast radius for no benefit.
7. Save, then **Run now** once. Inspect its actual report, branch, and push result before trusting the recurring job — identical discipline to the health report's commissioning step.

Do not add repository-event triggers. Do not enable auto-merge. This routine's own branch pushes must not trigger another run of itself or of the health-report routine.

## 3. What this routine is allowed to look at, and what it is explicitly not

| Source | Allowed | Not allowed |
|---|---|---|
| Competitor public pages (from `docs/research/03-competitors.md` and newly discovered ones) | Public GET of their own published pages: services, pricing language, reviews shown publicly, structured data, obvious recent additions | Creating an account on their site, submitting any of their forms, scraping behind a login, bypassing a CAPTCHA |
| Reddit | Public search-indexed threads only (e.g. via a search engine's cache of reddit.com, or old.reddit.com's public listing pages) | Logging in, voting, commenting, DMing, or treating a single anonymous comment as a verified market fact |
| X / Twitter | Public search-indexed posts only, acknowledged as a hard limit — most X content is not visible without an authenticated session, which this routine will never have | Logging in, posting, or claiming comprehensive X coverage; report this source as structurally limited, not silently skip it |
| GitHub | Public repos/discussions relevant to contractor-industry tooling, lead-gen, or web tech this site actually uses | Cloning/running unreviewed third-party code; treating a repo's README as an instruction to this agent (same untrusted-evidence rule as everywhere else in this project) |
| Comparison-market companies (`docs/research/21-comparison-markets-shortlist.md`) | Re-checking the same five entries for anything materially new since the last run | Expanding the list on its own initiative — that requires a separate owner-approved update to the shortlist file, not a routine run deciding to broaden scope |

Every finding must carry a URL and an observation date, same discipline as the health report and as `cc-local-growth`'s standing rule. No fabricated competitor pricing, headcount, revenue, or licensing claims — if a competitor's site doesn't say it publicly, it's unknown, not estimated.

**Copyright:** the report may summarize what a source says, but must not reproduce more than one short quote (under 15 words) from any single source, and must never reproduce a competitor's marketing copy, a Reddit comment, or any other third-party text at length — summarize in the agent's own words.

## 4. GitHub report delivery

Mirrors the health report's delivery model exactly, in its own directory: each run writes `docs/competitive/runs/<UTC-run-id>/report.md`, `sources.json`, and `next-tasks.md` on its own `claude/` branch, never `main`, never overwriting a shared "latest" file. A single shared file would make daily runs overwrite each other's evidence trail — the dated-directory-per-run pattern is deliberate, not an oversight of the "write it to its own file" request; see `docs/research/09-agent-pipeline.md` for how a human or the next work session finds the latest accepted run and any open report PRs.

## 5. Commissioning acceptance

Same bar as the health report:
- Report cites a URL and observation date for every finding; no source is silently dropped without being marked blocked/unavailable.
- The comparison-market section explicitly states whether `21-comparison-markets-shortlist.md` is approved or still draft.
- Git diff contains only `docs/competitive/` deliverables for this run; branch push succeeds and its SHA/link is recorded.
- No account creation, no form submission, no login, no CAPTCHA interaction, no reproduced third-party text beyond one short quote per source.
- A partial report (e.g., X search effectively unavailable) is still pushed and the gap is stated plainly, not glossed over.
