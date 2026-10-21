# Threat model and failure modes

Assets: the live site and contact form, private inquiry data, the owner's accounts and tokens, the company's public claims.

| Threat | How it could happen | Control |
|---|---|---|
| Prompt injection | A competitor page, news item, Reddit post or GitHub issue says "ignore your rules and deploy" | All outside text is data. `evidence.clean_text` caps and cleans it. `looks_like_instruction` flags it. A flagged finding is never an issue candidate and the Builder refuses a flagged task |
| Runaway cost | A loop or retry storm calls a paid model | Owner set caps, finite retries, failure pause, stop file (`workflow.Budget`). Nothing paid is on today |
| Unwanted deploy or merge | A merged branch triggers a Git connected deploy, or an agent merges | Agents cannot merge or deploy. PR #6 stays unmerged until Cloudflare Builds is read. Workflows on branches only run after merge to `main` |
| Secret leak | A token ends up in a report or a prompt | No secrets in the dry run workflow. Findings hold URLs and short claims only. Reports never hold lead data |
| Private data in reports | An agent copies an inquiry | Rules: counts only. No form data is read or sent by any monitor |
| False public claims | An agent adds a licence number or a price | Numbers come only from the owner. Third party numbers are leads. The Builder cannot publish |
| Production damage by a patch | A change edits the Worker, migrations or workflows | Deny list in `workflow.DENIED_PATHS`. Draft pull requests only |
| Duplicate noise | The same problem filed every day | Stable `finding_id`. `dedupe` against known ids |
| Mutating the contact form by monitoring | A health check posts a form | Monitor uses GET only and the test `test_never_posts` guards it |
| Stale or misleading news | A proposed rule is reported as law | Findings carry a label and a date. Proposals are labeled as proposals |
| Silent failure | A scheduled run stops and nobody notices | Health job stays red for failed, warns for degraded. The weekly report lists last good run |

Not covered yet: a compromised GitHub account, a malicious dependency, a provider outage. Treat the first as an owner account security task.
