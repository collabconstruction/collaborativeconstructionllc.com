# GitHub construction and growth skill source review

Reviewed: 2026-10-11. Company fit: Collaborative Construction, owner-led residential work in Falmouth/Cape Cod. Objective: more qualified, profitable clients within delivery capacity.

## Decision

Build a small company-owned skill base, borrowing selected patterns with attribution. Prioritize lead measurement, local search, proof of completed work, enquiry follow-up, and reliable client updates. A large collection of general construction prompts will not supply missing company data or create demand by itself.

Seven canonical repositories were resolved through the GitHub API; no owner redirects were observed. Metadata, HEAD commit, tree inventory, selected source files and license notices are retained in [machine-readable evidence](evidence/github-repositories.json) and [source snapshots](evidence/github/). These are **reference evidence, not active instructions or installed skills**. Source filenames such as CLAUDE.md inside the evidence directory must not override company instructions.

This is a selected-source scan, not a full security, dependency, legal, performance, or construction-accuracy audit. No third-party code, installers, package hooks, MCP servers, or skill instructions were executed. No repository was cloned. “Last push” measures observed repository activity, not reliability. Hosted models may receive data an agent reads; a local Markdown file does not imply local-only processing. No scan finding establishes the absence of telemetry throughout a dependency tree.

## Ranked shortlist

| Priority | Repository | Decision | Company use |
|---|---|---|---|
| 1 | coreyhaines31/marketingskills | Adapt selected prompts | Local search audit, service-page clarity, enquiry conversion, measurement |
| 2 | googleanalytics/google-analytics-mcp | Candidate for controlled adoption | Read-only GA4 evidence once property/access/tracking are verified |
| 3 | KRASA-AI/construction-ai-skills | Adapt selected prompts | Weekly homeowner updates, daily notes, closeout evidence |
| 4 | ibuilder/master-builder | Reference; adapt locality checklist | Early feasibility questions, project context, source discipline |
| 5 | datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction | Selective reference | Document registers, RFI status and progress reports |
| 6 | hamzaabduljabbar/claude-construction-takeoff-skill | Defer; internal pilot only | Estimator-assisted quantity documentation after dependency repair |
| 7 | hamzaabduljabbar/construction-drawing-analyzer | Reference only at this revision | Sheet indexes/cross-references; do not trust area extraction |

## Marketing skills

Canonical: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills). Pin: `1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff`. Last push: 2026-10-08T21:51:51Z. GitHub archived flag: false.

MIT license. The reviewed SEO skill includes local-business guidance; tree inventory also contains measurement, referral, conversion and content skills. This is a good conceptual match for growing qualified enquiries.

The repository also ships executable integrations. The inspected Search Console CLI includes sitemap submission, and the GA4 CLI includes conversion-event creation and Measurement Protocol event submission. These are not read-only tool bundles. External API credentials, vendor accounts and potentially paid provider services apply to chosen integrations; a free license does not make all workflows free. Adapt prompt-only workflows first. Create a narrower reporting connector instead of granting the whole marketing toolkit access. Review outbound requests and dependencies before activation.

Evidence: [LICENSE](https://github.com/coreyhaines31/marketingskills/blob/1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff/LICENSE), [skills/seo-audit/SKILL.md](https://github.com/coreyhaines31/marketingskills/blob/1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff/skills/seo-audit/SKILL.md), [tools/clis/google-search-console.js](https://github.com/coreyhaines31/marketingskills/blob/1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff/tools/clis/google-search-console.js), [tools/clis/ga4.js](https://github.com/coreyhaines31/marketingskills/blob/1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff/tools/clis/ga4.js).

## Google Analytics MCP

Canonical: [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp). Pin: `75c0e1be8322e5eaa5c2e3ef7e79cf4760060f9a`. Last push: 2026-10-02T15:27:10Z. GitHub archived flag: false.

Apache-2.0 license. Inspected client code explicitly uses the Analytics read-only OAuth scope and adds a package-version user-agent to Google requests. The package has an executable server entry point and Google API, authentication, MCP, Google ADK and HTTP dependencies. README supports Claude integration; this is a data connector, not a company strategy skill.

It requires an authorized Analytics property, credentials and enabled Google APIs. It does not provide Google Business Profile or Search Console data. Candidate for a pinned, isolated setup after baseline conversion tracking is checked. Google request logging, hosting/model usage and dependency behavior still need review; no current pricing or zero-cost guarantee is inferred from the license. Do not copy an unpinned package-run command into production.

Evidence: [LICENSE](https://github.com/googleanalytics/google-analytics-mcp/blob/75c0e1be8322e5eaa5c2e3ef7e79cf4760060f9a/LICENSE), [analytics_mcp/tools/client.py](https://github.com/googleanalytics/google-analytics-mcp/blob/75c0e1be8322e5eaa5c2e3ef7e79cf4760060f9a/analytics_mcp/tools/client.py), [pyproject.toml](https://github.com/googleanalytics/google-analytics-mcp/blob/75c0e1be8322e5eaa5c2e3ef7e79cf4760060f9a/pyproject.toml), [README.md](https://github.com/googleanalytics/google-analytics-mcp/blob/75c0e1be8322e5eaa5c2e3ef7e79cf4760060f9a/README.md).

## Construction administration prompts

Canonical: [KRASA-AI/construction-ai-skills](https://github.com/KRASA-AI/construction-ai-skills). Pin: `21f0059dc38bb0e8fde4c2fedd36e8817d49e2eb`. Last push: 2026-07-31T22:10:50Z. GitHub archived flag: false.

MIT license. The retained homeowner-update and daily-log prompts define structured inputs, source-based reporting and company configuration. The tree contains 46 files, principally Markdown prompts and references, rather than a bundled executable application. Adapt the residential update flow and job-note structure to the owner's actual working process.

Do not inherit the README's implied legal defensibility or time-saving claims as verified outcomes. Prompt-driven drafts still expose supplied client/project details to the chosen model provider. No dedicated telemetry executable was found in this tree inventory; that is not a guarantee about the agent host or linked services. Keep communications as drafts until reviewed; require a dated source for schedule, progress and change-order claims.

Evidence: [LICENSE](https://github.com/KRASA-AI/construction-ai-skills/blob/21f0059dc38bb0e8fde4c2fedd36e8817d49e2eb/LICENSE), [skills/customer-service/homeowner-update-drafter.md](https://github.com/KRASA-AI/construction-ai-skills/blob/21f0059dc38bb0e8fde4c2fedd36e8817d49e2eb/skills/customer-service/homeowner-update-drafter.md), [skills/operations/daily-log-generator.md](https://github.com/KRASA-AI/construction-ai-skills/blob/21f0059dc38bb0e8fde4c2fedd36e8817d49e2eb/skills/operations/daily-log-generator.md), [README.md](https://github.com/KRASA-AI/construction-ai-skills/blob/21f0059dc38bb0e8fde4c2fedd36e8817d49e2eb/README.md).

## Project reasoning and locality

Canonical: [ibuilder/master-builder](https://github.com/ibuilder/master-builder). Pin: `0a3d4eb6b0908898787fa8beef8fa5b2f151a358`. Last push: 2026-07-31T20:51:05Z. GitHub archived flag: false.

MIT license. The skill requests jurisdiction, climate, constraints, dated cost assumptions and professional review. Useful as a checklist for Falmouth/Cape Cod project briefs; its global breadth is not evidence of local code correctness.

The tree includes packaged distributions, evaluations and scripts, so it is more than a single prompt. The inspected MCP script imports Python standard-library modules for local reference retrieval; this limited observation does not audit every tool or dependency. Use selected questions in company-owned Markdown first. Any external research, model invocation or linked design software has its own privacy and cost conditions. The inspected evaluation runner reads answers rather than proving construction competence on company projects.

Evidence: [LICENSE](https://github.com/ibuilder/master-builder/blob/0a3d4eb6b0908898787fa8beef8fa5b2f151a358/LICENSE), [SKILL.md](https://github.com/ibuilder/master-builder/blob/0a3d4eb6b0908898787fa8beef8fa5b2f151a358/SKILL.md), [scripts/mcp_server.py](https://github.com/ibuilder/master-builder/blob/0a3d4eb6b0908898787fa8beef8fa5b2f151a358/scripts/mcp_server.py), [scripts/eval_behavior.py](https://github.com/ibuilder/master-builder/blob/0a3d4eb6b0908898787fa8beef8fa5b2f151a358/scripts/eval_behavior.py).

## DDC construction collection

Canonical: [datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction). Pin: `ce45bbfbdd63ab7868871061fdf5e83bc17f5020`. Last push: 2026-08-22T07:59:18Z. GitHub archived flag: false.

The MIT root license is qualified by NOTICE: books have separate rights, curated content retains source conditions, and CWICR database commercial use requires separate licensing. Do not treat the entire collection as commercially unrestricted.

Sampled progress/RFI skills contain Python examples; semantic cost search references Qdrant, embeddings and additional data infrastructure. Cloud model/API, hosting, conversion-tool and database costs can apply by workflow. The checked-in local Claude settings allow broad Git operations including reset/push; do not copy those settings. Adapt document-control fields and reporting concepts only. No full script, integration or telemetry audit was performed across the 733-file tree. Database coverage and benchmark accuracy are not evidence of current Cape Cod subcontractor pricing.

Evidence: [LICENSE](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction/blob/ce45bbfbdd63ab7868871061fdf5e83bc17f5020/LICENSE), [NOTICE.md](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction/blob/ce45bbfbdd63ab7868871061fdf5e83bc17f5020/NOTICE.md), [.claude/settings.local.json](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction/blob/ce45bbfbdd63ab7868871061fdf5e83bc17f5020/.claude/settings.local.json), [1_DDC_Toolkit/Document-Control/rfi-management/SKILL.md](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction/blob/ce45bbfbdd63ab7868871061fdf5e83bc17f5020/1_DDC_Toolkit/Document-Control/rfi-management/SKILL.md), [1_DDC_Toolkit/CWICR-Database/semantic-search-cwicr/SKILL.md](https://github.com/datadrivenconstruction/DDC_Skills_for_AI_Agents_in_Construction/blob/ce45bbfbdd63ab7868871061fdf5e83bc17f5020/1_DDC_Toolkit/CWICR-Database/semantic-search-cwicr/SKILL.md).

## Takeoff workflow

Canonical: [hamzaabduljabbar/claude-construction-takeoff-skill](https://github.com/hamzaabduljabbar/claude-construction-takeoff-skill). Pin: `ab3e77bae39497b241aa36ee5a5ad77befbd7430`. Last push: 2026-08-02T09:06:12Z. GitHub archived flag: false.

README says MIT, but actual LICENSE is AutoConst Source Available: internal business use is permitted with conditions; redistribution/resale is restricted. Follow the actual notice and resolve ambiguity before redistribution.

The seven-file tree contains Markdown and notices, not a validated takeoff engine. SKILL.md requires prior analyzer output, an Excel template and estimator review; it uses metric quantity defaults and reinforcement ratios. Those defaults are not company-approved quantities or engineering design. Critically, it expects `0.ai-context/` files while the inspected analyzer creates `indexes/` and `sheets/`; the advertised dependency chain is inconsistent. Model access and document-processing costs remain. Defer activation until interfaces, units and templates are repaired and a human-estimated sample validates results. No autonomous quotes or bids.

Evidence: [LICENSE](https://github.com/hamzaabduljabbar/claude-construction-takeoff-skill/blob/ab3e77bae39497b241aa36ee5a5ad77befbd7430/LICENSE), [README.md](https://github.com/hamzaabduljabbar/claude-construction-takeoff-skill/blob/ab3e77bae39497b241aa36ee5a5ad77befbd7430/README.md), [SKILL.md](https://github.com/hamzaabduljabbar/claude-construction-takeoff-skill/blob/ab3e77bae39497b241aa36ee5a5ad77befbd7430/SKILL.md).

## Drawing analyzer dependency

Canonical: [hamzaabduljabbar/construction-drawing-analyzer](https://github.com/hamzaabduljabbar/construction-drawing-analyzer). Pin: `f0e798532643dc7f008f28b6994ae7feabed47cc`. Last push: 2026-08-25T15:22:06Z. GitHub archived flag: true.

Actual LICENSE is AutoConst Source Available, despite MIT language in README. README says the skill is archived/superseded; distinguish this maintainer statement from the API archived flag recorded below.

Source inspection found automatic `pip install` with `--break-system-packages` on missing dependencies. Requirements are lower-bounded pypdf/PyMuPDF, not a reproducible lock; dependency licensing remains separately unresolved. Polygon extraction calculates bounding-rectangle width × height, assumes 1:100 when no scale is found, and can sum overlapping shapes. This is not general polygon-area measurement and is unsuitable for unattended bids. The model-based visual stage can expose private drawings to the provider. The README's accuracy/token-saving figures are maintainer claims, not independently reproduced results. Retain the index pattern; do not deploy these scripts as-is.

Evidence: [LICENSE](https://github.com/hamzaabduljabbar/construction-drawing-analyzer/blob/f0e798532643dc7f008f28b6994ae7feabed47cc/LICENSE), [README.md](https://github.com/hamzaabduljabbar/construction-drawing-analyzer/blob/f0e798532643dc7f008f28b6994ae7feabed47cc/README.md), [requirements.txt](https://github.com/hamzaabduljabbar/construction-drawing-analyzer/blob/f0e798532643dc7f008f28b6994ae7feabed47cc/requirements.txt), [scripts/split_drawings.py](https://github.com/hamzaabduljabbar/construction-drawing-analyzer/blob/f0e798532643dc7f008f28b6994ae7feabed47cc/scripts/split_drawings.py), [scripts/extract_polygons.py](https://github.com/hamzaabduljabbar/construction-drawing-analyzer/blob/f0e798532643dc7f008f28b6994ae7feabed47cc/scripts/extract_polygons.py).

## Company adaptation plan

These are proposed company-owned workflows, not copied third-party skills or installed packages:

1. **Company evidence librarian:** maintain facts, source paths, verification dates, unresolved contradictions and owner-approved public claims. Never convert a competitor claim into a company claim.
2. **Local growth analyst:** compare query/service/town demand and website journeys using approved exports; report qualified leads and sold gross profit alongside traffic. Distinguish correlation from measured conversion improvement.
3. **Website proof editor:** turn consented project records into truthful case studies with scope, location granularity, constraints, approach, photographs and homeowner outcome. Remove addresses and personal data not approved for publication.
4. **Enquiry qualification assistant:** draft next-step responses using service area, job fit, indicative timeline, budget-fit questions and owner capacity. No invented availability, quote, or guarantee.
5. **Client update assistant:** derive weekly status and decisions from dated job notes; explicitly flag missing facts and produce a reviewable draft.
6. **Opportunity researcher:** study planning decisions, public economic/development data and referral partners; rank project-fit opportunities. Public records are research evidence, not authorization to contact individuals.
7. **Experiment reviewer:** define hypothesis, audience, expected outcome, measurement window and stop criteria before a marketing change; record result and whether the change is retained.

Each skill should name allowed data, required inputs, exact output file, acceptance checks and the reviewer. Use one writer per output path. Workers read the company index and receive only relevant approved records; finance/payroll/client-sensitive access should be narrower than public marketing access. Store credentials outside Markdown and Git.

## Admission and maintenance pipeline

1. Register candidate URL, intended benefit and alternative already available locally.
2. Resolve canonical owner; capture commit and actual license/NOTICE before adaptation.
3. Inspect the specific requested skill, linked scripts, package hooks, permissions and network/write tools. Keep upstream reference material separate from active instructions.
4. Translate into a small company workflow with no inherited broad permissions. Retain required attribution for copied/adapted licensed content.
5. Test on a consented or synthetic sample: missing data, contradictory evidence, stale source, wrong unit, duplicate record, out-of-area lead and attempted instruction injection.
6. Owner evaluates the output for usefulness and factual accuracy. Enable only the needed data source; begin with read-only exports/connectors.
7. Record accepted version, test evidence and next review date. Evaluate new upstream changes as a diff; no automatic latest-version replacement.

Initial success measures: time to respond to a qualified enquiry, consultation booking rate, proposal-to-win rate, realized gross margin, and owner administration hours. Give the first two weeks to establishing accurate inputs and baseline reports before expanding the number of agents.
