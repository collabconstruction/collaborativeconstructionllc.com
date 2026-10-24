# Architectural refinement implementation plan

October 16, 2026. Owner authorized planning and completion in the same request. Isolated branch `codex/architectural-house-refinement`, based on reviewed Midnight & Brass commit 96e5873. Main workspace's unrelated changes remain untouched. No deployment, accounts, automations or customer data in scope.

## Work packages and acceptance

1. Audit source, supplied briefs, actual local preview and current public maintenance. Preserve nine canonical URLs, project attribution, intake and analytics contracts.
2. Refine ordinary site first: residential message, concise metadata/body copy, remove homepage quote and redundant About promotion, retain concise founder identity and /about/ content for existing links. Tighten spacing/reveals, architectural corners, exact navy palette, white mobile wordmark, consistent image treatment and gallery. Keep CC identity consistent rather than replace an approved logo without evidence.
3. Slim manual location rail: full-width brass borders and edge fades, native horizontal scroll and keyboard access; no autoplay, duplicate towns or pause button. Preserve regional list without claiming offices/availability.
4. Original restrained house: procedural Three.js miniature with foundation, timber frame, ivory walls, navy roof and subtle glazing, no photorealistic textures. Generate an SVG poster and GLB from the same source; no third-party model. Compare WebGL/SVG/image-sequence tradeoffs in RESEARCH.md.
5. Optional homepage services island after existing service paths: compact sticky scene, reversible assembly over normal scroll, tiny desktop pointer response, explicit stage buttons and range control, Explore/Reset/Skip motion, actual six service routes. Optional cutaway view on Explore, ordinary anchors and existing page transitions. No scroll hijacking or forced navigation. Render on demand, lazy load, capped DPR, offscreen/hidden suspension, context-loss fallback and disposal. Reduced motion/save-data keep poster and full links.
6. Separate local prototype before integration; then reuse identical island. Development-only point/select overlay served outside public assets; no hosted editor migration or injected production tooling. Write reusable copy standard and source map.
7. Tests: deterministic stage-state/asset tests, existing suite/build/release verifier and dry-run. Browser review canonical pages, explorer stages/links/back/fallback, desktop/mobile where backend permits, contact fields without sending a lead. Record limitations honestly, byte budgets and screenshots.
8. Commit focused release candidate. Handoff: six requested documents, research sources, copy changes, source editing workflow, preview, rollback to 96e5873. Public maintenance untouched; deploy only after separate approval.

## Architecture / risk controls

Eleventy/Nunjucks and Worker remain. Native scroll/IntersectionObserver/CSS own timing; a lazy local Three.js bundle owns only the house. No React, GSAP, Spline subscription or Blender requirement. Essential content and static poster are HTML-first. House is explicitly illustrative, not a completed project or construction specification. No oversized pinned sequence; mobile uses a normal flow panel. Form/consent and SEO preserved. Runtime errors retain the static illustration and routes.

## Expected files

`src/index.njk`, shared house include/base shell, service/About/gallery copy, `css/styles.css`, targeted `js/main.js`, new loader/runtime/model modules, reproducible build script, generated model/poster/local bundle/license, focused tests, development-only review server and docs. Additions outside `src/` are never copied publicly except explicitly generated static assets.

## Execution status

Implemented and browser-reviewed: ordinary site refinements, original model/poster/GLB, isolated prototype and integrated island, stage/range/scroll/cutaway controls, fallback/lifecycle, local source selector, reusable copy standard and research/handoff documents. 100 tests, clean build, release verification and deployment dry-run passed. See QA_REPORT.md for actual device/fallback coverage and remaining existing build-tool advisories. No production deployment or accounts/automation work performed. Concurrent privacy/centering edits were preserved and isolated from this feature's staged changes.
