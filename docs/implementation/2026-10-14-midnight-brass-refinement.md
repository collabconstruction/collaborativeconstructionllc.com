# Midnight & Brass refinement: implemented locally

October 14, 2026. Source checkout: `/private/tmp/cc-midnight-brass`, branch `design/midnight-brass`, starting commit `7d27da5`. This matches the captured live redesign. The main workspace carries a different older frontend plus unrelated edits, so those files were preserved. A separate agent is handling the temporary public-site shutdown. No deployment, push, Worker/account change, analytics change or intake submission was performed here.

## Implemented

- Hero headline: “Residential construction & renovation.” Supporting copy names services and independent oversight. Removed the leading decorative dash.
- Hero image sits inside its brass frame. Subtle edge mask softens the photograph; the frame and readable caption remain separate. Eight asymmetrically placed contour lines animate slowly. Reduced-motion stylesheet cancels motion; viewport/visibility listeners pause background motion offscreen or in a hidden tab.
- Location section is a thin navy wrapped list with existing town data. Removed heading, explanatory copy, duplication, animation and pause control from its markup. Static content does not require a pause button.
- First service-page introductions and service-page hero descriptions are centered. Closing CTA paragraphs are centered and constrained to a readable measure.
- Gallery projects have consistent card padding, title/tag/description regions, equal header heights in desktop pairs and contained photo carousels. On mobile the cards stack and header space becomes content-sized.
- About portrait frame uses an isolated non-negative stacking level so it remains visible. Name and Owner & Founder sit on an irregular navy/brass oval overlapping the portrait. Existing title is retained; no CEO claim added.
- Wes's portrait is removed from homepage and service/gallery closing sections; only About contains his face in main content. No image assets deleted.
- Footer Experience / Quality / Trust are always vertically stacked. Mobile header retains the live-text white company name at narrow widths.
- Section spacing and reveal durations/delays are reduced. Reveal thresholds start earlier, long heading stagger is capped. Offscreen reveal offsets are clipped at the main-content boundary to avoid horizontal overflow.
- Added `docs/design/writing-voice.md` with original professional copy guidance and before/after examples; `CLAUDE.md` routes future Claude copy work to it. GitHub references were reviewed, not installed as tools or hooks.

## Validation

95/95 tests passed, zero failures/skips. Clean Eleventy build and release-build verification passed (177 public files, 9 page invariants). Diff whitespace check passed after cleanup. Nine canonical pages were inspected at 390px: no horizontal document overflow; all six service introductions and all closing CTAs centered; one owner portrait on About, zero on other pages. Header company name also checked at 320px. Mobile menu opens and closes. Gallery Residential Exterior next control advanced from 1/5 to 2/5, and paired gallery header regions both measured 135px. Desktop screenshots saved in the main workspace under `docs/implementation/evidence/2026-10-14-refinement/`.

Limits: no fresh Lighthouse score, no full screen-reader audit, no runtime reduced-motion emulation and no production form/backend submission. Static build preview is not a live intake server. Provider calls and production outage recovery belong to the separate release task. Existing business claims/portfolio attribution still require their normal evidence review; this change adds no new credentials or project-authorship claims.

## Review and integration

Preview: http://127.0.0.1:8881/ while the local server is running. Implementation is in the separate checkout, not the older main workspace frontend. Review the focused local commit/patch against this starting source. Do not copy the whole temporary checkout over the main workspace, stage unrelated files, deploy a stale build or overwrite the other agent's shutdown/recovery work. Integrate with the actual current release branch after coordination; then rerun the full release procedure and verify live behavior only when authorized.

GitHub writing reference: https://github.com/pbakaus/impeccable/blob/main/skill/reference/clarify.md . Recommended principles: specific action labels, consistent terminology, factual preservation, contextual review. No upstream skill/code was copied; no installer was run.
