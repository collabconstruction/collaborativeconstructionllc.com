> October 16, 2026 verification: Claude routines redirected to sign-in; saved cloud schedules and cloud API access remain unverified. Local GA4 and dedicated GSC reporting reads succeeded. This task authorizes creating/updating the two report routines and pushing report setup; agents may configure the routines after sign-in, while the owner must enter any credentials directly. Check for existing routines before creating duplicates. The lane summary files are `docs/health/REPORT.md` and `docs/competitive/REPORT.md`; use the updated saved prompts, which also write the three immutable run files. First successful cloud runs must be inspected before activation is reported as verified.

# Activating both Claude Cloud Routines: owner walkthrough

Prepared October 14, 2026. Written steps only, by the owner's explicit choice ("Give me exact written steps, I'll do it myself"), no live browser session was driven for this. This is the last manual step for both the daily health-report routine (`docs/automation/claude-cloud-health-report.md`) and the daily competitor/trend-scan routine (`docs/automation/claude-cloud-competitor-scan.md`). Everything up to this point, committing and pushing the instructions, skills, and both routine prompts to `origin/design/site-refresh-2026-10`, is done. Nothing below can be performed by an agent on your behalf: connector approval and secret entry are account-level actions gated to you.

Do both routines in one sitting if convenient, but they are independent, finishing one does not require finishing the other, and a mistake in one does not affect the other (that is why they use separate environments and separate branches of this same prompt).

## Before you start

- Confirm you can see branch `design/site-refresh-2026-10` on `collabconstruction/collaborativeconstructionllc.com` on GitHub, with `docs/automation/`, `docs/research/09-agent-pipeline.md`, `docs/research/21-comparison-markets-shortlist.md`, and `docs/research/prompts/` present in the file tree. If any of those are missing, the routine will run against an incomplete checkout, stop and say so rather than proceeding.
- Have this decision ready: **`docs/research/21-comparison-markets-shortlist.md` is still a draft ("proposed, not yet approved").** You can activate the competitor-scan routine before approving it, the prompt already handles that by instructing the routine to flag it as unapproved rather than treat it as settled. Approve or trim the shortlist whenever you're ready; it does not block activation.

## Part A: Daily project health report

1. Go to `https://claude.ai/code/routines` (or, in Claude Desktop: **Code → Routines → New routine → Cloud**) and choose **New routine**.
2. Name it exactly: `Collaborative Construction: daily project health`.
3. Repository: `collabconstruction/collaborativeconstructionllc.com`. Branch: `design/site-refresh-2026-10`, not `main`.
4. Environment: create a **new, dedicated** environment for this routine (do not reuse an environment you plan to use for the competitor-scan routine).
5. Connectors: attach only what Section 4 of `docs/automation/claude-cloud-health-report.md` lists as needed (GitHub, Search Console, GA4, GBP, Cloudflare, D1/intake reporting adapter, whichever of these you've actually provisioned as read-only). Do not attach Gmail/Drive personal connectors. If a connector isn't set up yet, skip it for now, the routine is designed to report that source as unavailable rather than fail outright.
6. Secrets: enter any API keys/OAuth credentials directly into the provider-managed connector screen or the environment's secret facility shown in that same UI, never into the routine's Instructions field, never into a chat message to any agent, never into a file in this repository.
7. Schedule: daily at **6:52 AM America/New_York**. Confirm the UI echoes back that exact time and time zone before saving.
8. Instructions: open `docs/research/prompts/claude-cloud-health-report.txt` in this repo, copy its entire contents, and paste into the routine's Instructions field unmodified.
9. Save the routine.
10. Click **Run now**. Wait for it to finish (it is bounded to roughly 45 minutes of work per its own prompt).
11. When it finishes, open the actual output: it should have pushed `docs/health/runs/<run-id>/report.md`, `sources.json`, and `next-tasks.md` to a new `claude/...` branch, and ideally opened a draft PR. Read `report.md` yourself. Confirm:
    - Every finding cites a URL/source and a date.
    - It did not push to `main` and did not merge anything.
    - If a source was unavailable, it says so plainly instead of being silently skipped.
12. Only after you've inspected this first real run should you trust the recurring daily schedule. If anything looks wrong (wrong branch, missing citations, a claimed success that didn't actually happen), pause the schedule and fix the routine config or the prompt file before letting it run unattended again.

## Part B: Daily competitor & trend scan

1. Same starting point: `https://claude.ai/code/routines` → **New routine** (or Claude Desktop equivalent).
2. Name it exactly: `Collaborative Construction: daily competitor & trend scan`.
3. Repository: `collabconstruction/collaborativeconstructionllc.com`. Branch: `design/site-refresh-2026-10`.
4. Environment: a **separate dedicated environment** from Part A's, not the same one. This keeps a runaway Reddit/X/GitHub search from ever blocking the health report's billing or commissioning, and vice versa.
5. Connectors: web search/fetch only. Per `docs/automation/claude-cloud-competitor-scan.md` Section 2 item 6, deliberately do **not** attach GA4, GSC, Cloudflare, D1, Gmail, or Drive to this routine; it has no legitimate reason to touch any of them, and attaching them would just be a bigger blast radius for no benefit.
6. Secrets: this routine shouldn't need any (public web search/fetch only). If the environment nonetheless prompts for something, stop and check why before entering anything.
7. Schedule: daily at **7:11 AM America/New_York**, 19 minutes after the health report's 6:52 AM slot. Runs may overlap because the health report can take 45 minutes; separate environments, unique run directories and separate report branches prevent shared-output collisions.
8. Instructions: open `docs/research/prompts/claude-cloud-competitor-scan.txt`, copy its entire contents, and paste into this routine's Instructions field unmodified.
9. Save the routine.
10. Click **Run now**.
11. When it finishes, inspect the actual output the same way as Part A: `docs/competitive/runs/<run-id>/{report.md,sources.json,next-tasks.md}` on its own `claude/...` branch. Specifically check:
    - The report states plainly whether `docs/research/21-comparison-markets-shortlist.md` is approved or still draft (it should say draft, since you haven't approved it yet).
    - The Reddit/X/GitHub section is honest about coverage limits, especially X, which should never be reported as comprehensively covered.
    - No competitor account was created, no form was submitted, nothing was posted/commented/voted anywhere.
    - Any proposed new competitor or wording change appears only inside `next-tasks.md` as a proposal, not as a direct edit to `docs/research/03-competitors.md`, `docs/research/21-comparison-markets-shortlist.md`, or any live page.
12. Same rule as Part A: don't trust the recurring schedule until you've read this first real run's actual report and confirmed the push succeeded.

## After both are running

- Reviewing output is a recurring owner task, not a one-time step: open each new `claude/...` branch or draft PR, read `report.md`, and decide what (if anything) in `next-tasks.md` becomes real work. `docs/research/09-agent-pipeline.md`'s "Cloud health-report handoff" and "Cloud competitor & trend-scan handoff" sections describe how a future work session picks a proposed task from either lane and runs it through the normal review process; they are not self-executing.
- Merging a report PR is a separate, ordinary review decision each time, not something either routine or this walkthrough grants in advance.
- If you later approve or trim `docs/research/21-comparison-markets-shortlist.md`, update its status line to "approved", the competitor-scan prompt already checks that line and will stop treating the list as a draft once it changes.
- Nothing in either routine merges `design/site-refresh-2026-10` into `main`. That remains a separate, explicit decision whenever you're ready to make it.
