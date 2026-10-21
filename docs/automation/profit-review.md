# Monday Project Profit Review

Schedule: Every Monday, America/New_York. Reporting destination: `reports/profit-review/YYYY-MM-DD.md` on `main`.

## Private source
Read the native Google Sheet **Collaborative Construction Project Profits** in the Collaborative Construction Google Drive (`collaborativeconstructiongc@gmail.com`). Do not use a stale local copy or edit the source workbook. If the live sheet is missing or access fails, report the blocker and do **not** commit a placeholder or guessed report.

Read **all tabs**, including Read Me, Assumptions, Project Profits, Summary, Opportunity Scorecard, Growth Constraint, and Lists. Accommodate added tabs. Review actual values AND formulas, not merely cached display values. Do not mistake blank template rows for incomplete jobs.

## Compare with the previous week
Use the last successful review / available Drive version history to detect new or changed job rows and input cells. A file modification timestamp alone does not prove that rows changed. If no reliable prior snapshot exists, label the first run as baseline; do not claim a week-over-week change. Maintain any detailed comparison state **privately outside the public GitHub repository**. Do not place row-level snapshots in issues, logs, commits, or artifacts.

## Review
- For populated job rows, flag missing project type, customer source, start/end dates, or owner hours.
- List blanks among Assumptions inputs (owner time value per hour, yearly overhead, max concurrent jobs).
- Detect formula errors across tabs, using evaluated values when available.
- Count negative net-profit jobs (do not identify them).
- Rank project types by **aggregate total net profit / aggregate total job weeks** (only for completed rows with valid weeks and net profit); include counts so small samples are apparent.
- Rank customer sources by aggregate net profit; identify highest total profit only with valid numbers.
- Read the Growth Constraint verdict and supporting findings; if undecided, say so.
- Ask Wesleigh for up to three high-priority missing pieces of information.
- Label any estimate explicitly `est`. Never confuse missing values with zero. If critical inputs are missing, state that net-profit ranking cannot be calculated reliably.

## Privacy
This repository may be public. Never publish names of customers or projects, addresses, towns, exact job prices, individual job rows, or identifying free-text notes. Reports may include **only totals and averages grouped by project type or customer source** and non-identifying data-quality counts. Do not expose small-group detail if it could identify a customer; suppress or generalize those figures. Never commit the workbook or any source extracts. Do not print private row-level data in logs.

## Output and commit
Report sections:
1. What changed this week
2. Net profit per job week by project type, best to worst
3. Customer sources by total net profit
4. Current main growth limit
5. Missing information / questions for Wesleigh (up to three)

Use clear, short sentences. Date with America/New_York date. Before committing, compare live content with last week's verified state. If nothing changed, **do not commit**; just report 'No changes this week.' If source access, calculations, or change detection are uncertain, explain rather than guessing. Commit only the sanitized Markdown report to `main` at `reports/profit-review/YYYY-MM-DD.md`; do not edit the Sheet.
