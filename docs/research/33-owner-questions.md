# Owner decision register: highest-impact questions

Date: 2026-10-21 (America/New_York)
Sources checked: Completed audit files 24–32, active PR #6/#7 and prior review; MA HIC guidance, Cloudflare Workers Git integration docs
BLOCKED: The owner-specific answers and authenticated dashboard views listed below. No question is assumed answered.
Evidence labels: `verified-source` checked repo/tool/public URL, `reported` inherited statement, `estimate` projection with assumptions, `owner-confirmation-needed` requires approval or private facts. Unknown must never be reported as zero.

## Questions ranked, maximum 15

1. **HIC:** What is the exact ACTIVE Home Improvement Contractor registration number, registered business name, and renewal date, verified through Massachusetts Contractor Hub? Label: owner-confirmation-needed. Release gate for applicable advertising.
2. **CSL:** Who holds the applicable MA Construction Supervisor License, number, class, expiry and legal relationship to the work; which claims are actually supportable? Label: owner-confirmation-needed.
3. **Cloudflare Builds:** Is a Git repository connected to Worker `collaborativeconstructionllc-com`? If yes, what production branch and deploy command? May merging PR #6 automatically publish? Label: owner-confirmation-needed; keep #6 unmerged.
4. **Facebook mapping:** In signed-in Business Suite, do Metricool `1409900735535950`, profile `61595651094549`, and published post `122094671283521703` resolve to the intended same Page? Who has full control, and is there a backup admin? Label: owner-confirmation-needed.
5. **Privacy / retention:** Who approves actual retention for inquiries, uploads, contract records and mailbox copies? Is the proposed 12-month unconverted-inquiry and 90-day closed-inquiry upload target acceptable after legal review? Label: owner-confirmation-needed.
6. **Privacy deletion:** Who will receive verified access/deletion requests, respond within a documented deadline, and actually remove D1/R2/mailbox copies subject to lawful holds? Label: owner-confirmation-needed.
7. **Service areas:** Do you genuinely accept projects in Edgartown/Nantucket and the islands, or only specific Cape/South Shore towns? Label: owner-confirmation-needed.
8. **workers.dev:** Does anything depend on the `workers.dev` hostname (public, Turnstile, monitoring, staging)? If none, authorize a standalone change with `workers_dev:false` on the next separately approved release. Label: owner-confirmation-needed.
9. **www redirect:** Can the owner add a proxied `www` record and 301 Redirect Rule preserving path and query, then verify it? Label: owner-confirmation-needed.
10. **Photo/case-study provenance:** Which project photos have written client/rightsholder permission, what role did the LLC perform, and which photos are illustrative only? Label: owner-confirmation-needed.
11. **Capacity:** Which project types, minimum sizes, timelines and annual simultaneous job limit can the business actually service without overpromising? Label: owner-confirmation-needed.
12. **Pricing language:** Is there verified like-for-like evidence for "affordable and competitive", and what scope/contingency/markup policy may be published? Label: owner-confirmation-needed.
13. **Accounts/metrics:** Can read-only GA4, GSC, GBP and Cloudflare performance sources be connected for counts and coverage, with credentials kept out of code/reports? Label: owner-confirmation-needed.
14. **Agent autonomy:** What is the max total daily/monthly LLM and GitHub automation spend, allowed hours, approved repos/branches, number of PRs per day, and emergency stop authority? Label: owner-confirmation-needed.
15. **Routines:** Should independent health and research be hosted in GitHub Actions/cloud rather than rely on a Mac running Claude Code? If cloud, who maintains the approved provider credentials and quotas? Label: owner-confirmation-needed.

## Five questions to answer first

Please resolve 1, 2, 3, 4 and 5 before broad marketing/release decisions. Questions 8/9 are next for Cloudflare hardening.

## Next 3 actions

1. Owner verifies registration/licensing records without sharing passwords or security codes.
2. Owner documents Cloudflare Builds and the Facebook Page ID match from signed-in settings.
3. Set an agreed privacy-retention target and assign a reviewer for a practical deletion workflow.
