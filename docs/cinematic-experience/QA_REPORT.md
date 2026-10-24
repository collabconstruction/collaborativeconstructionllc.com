# QA and release readiness

October 16, 2026. Tested actual local source/build, not the public maintenance page. Evidence in `evidence/`. No deployment, customer inquiry, API/account change or analytics test event was sent.

## Results

| Check | Actual result |
|---|---|
| Existing + new tests | 100 passed, 0 failed/skipped. Covers intake/notifications/consent/structured data plus stage progression, geometry bounds, editable GLB groups, and no renderer under reduced-motion/save-data/static preferences. |
| Clean build | House assets regenerated, old _site removed, Eleventy completed. |
| Release verifier | Passed: 182 public files, 9 canonical pages, local links, sitemap/canonical/robots/JSON-LD and intake challenge/honeypot contracts; private docs excluded. |
| Wrangler dry-run | Passed. Existing D1/R2/email/rate-limiter bindings reported. No real deploy or infrastructure modification. |
| Isolated staged candidate | Archived only this task's staged content (subsequently committed as 2bde457) outside the shared worktree; 100 tests and clean build/release verifier passed separately. Concurrent privacy/centering work was excluded from that staged candidate and preserved in the working preview. |
| Desktop | All 9 canonical pages inspected/screenshot at 1280px; one H1, correct production canonical, no detected loaded-image failures or horizontal overflow. |
| Mobile | All 9 canonical pages checked/screenshot in a genuine same-origin 390px iframe document. No horizontal overflow; white live wordmark, functioning native menu. This is responsive browser testing, not a physical phone. |
| Tablet | All 9 canonical pages checked at an 820px iframe document width; no horizontal overflow. Not a separate device performance test. |
| Gallery | Existing All/Residential/Commercial filters retained. Consistent cards/controlled photos; career attribution retained. No new project role or company-history claims. |
| House stages | WebGL initialized; manual stage 02 reported stage 1, completion stage 3; labelled range Home/ArrowRight gave progress 0/1. Four real buttons remain keyboard accessible. |
| Reverse scroll | Follow scroll, scroll down -> progress 100; reverse -> 72 in the prototype. No scroll cancellation or automatic page navigation. |
| Explore | Cutaway and exterior return work with a small camera adjustment. Six actual service links remain accessible throughout. |
| Navigation/history | Home Renovation link reached its canonical local route; browser Back restored the prototype. Existing site transitions remain. |
| Skip/restart | Skip removed canvas (0), displayed poster, retained 6 links and disabled unsupported stage controls. Enable restored 1 canvas. |
| WebGL failure | Dev-only fixture forced canvas getContext to return null. Controller displayed static poster/status, 0 canvas and all 6 links. Expected Three initialization error is confined to that fixture. |
| Reduced motion/data saving | Deterministic controller tests prove no renderer load and disabled stage controls. Native CSS static/no-sticky rules reviewed. OS-level preference switching was not independently exercised. |
| No JavaScript | HTML/source review: poster and all six links are present without the loader. Whole-site no-JS behavior uses the existing noscript rules; no separate disabled-JS browser session was run. |
| Contact | Name/email/message required fields and /api/contact action retained; local browser layout inspected at 390px. No lead submitted. Existing automated intake tests pass; this is not a fresh production delivery test. |
| Analytics/SEO | Production-host consent guard retained; no reporting/account changes. Canonical URLs unchanged; misleading gallery metadata company attribution corrected. |
| Footer | Experience/Quality/Trust positions share x=20 at 390px with sequential y positions. Brass separator and live lockup preserved. |
| Local selector | Alt-clicking house H2 produced src/_includes/house-explorer.njk, house-explorer ID and selected text in an editable brief. It is served only by the local review server and absent from _site. |
| Console | Normal model prototype reported no errors/warnings during the observed check. Failure fixture has its expected renderer error. |

## Measured cost

- House controller: 4,747 bytes raw / 1,768 gzip at the pre-final-label measurement; final label/failure-message edits are small and the final bundle/build log is authoritative.
- Local Three/model runtime: approximately 566.6KB raw / 144KB gzip, loaded only near the model on eligible browsers.
- GLB: 212,024 bytes (about 13KB gzip), exported for editing; not fetched by the runtime.
- SVG poster: 87,304 bytes / 10,041 gzip, original generated geometry.
- Completed exterior observed: 96 draw calls, 1,380 triangles. Last CPU render submission measured 0.30–0.40ms on this host. This is not GPU completion time or a mobile FPS score.
- After settling, data-render-frames remained 17 across separate observations: there was no perpetual render loop. Offscreen/hidden suspension and cleanup are implemented.
- DPR capped at 1.5; no textures, external model downloads, React, postprocessing or multiple scene renderers.

Token contrast calculations: navy/ivory 12.47:1; white/navy 14.18:1; dark-brass/ivory 5.09:1; brass/navy 5.72:1; muted body/ivory 6.93:1. These are specific token pairs, not a blanket WCAG certification. Focus/labels reviewed; full assistive-technology testing was not performed.

## Remaining release considerations

1. Review the model and changes locally. Public production remains intentionally in maintenance; this work does not authorize restoring it.
2. Physical low-powered phone/GPU performance, field Core Web Vitals, full screen-reader coverage and production conversion/form delivery were not measured here. Do not call this a Lighthouse/field-performance pass.
3. npm audit found 14 advisories (4 moderate, 10 high) in the existing Eleventy/Wrangler/transitive build tools, not the newly added Three/esbuild packages. A compatible automatic audit fix was attempted but refused: current workers-types 4 conflicts with the candidate Wrangler's optional workers-types 5 peer. No --force/legacy-peer-deps or unreviewed infrastructure upgrade was used. Plan and test that build-tool dependency update before release; the successful functional checks do not erase these advisories.
4. Current credential/insurance publication, free-estimate policy and project-by-project attribution still require business evidence. Nothing new was invented to fill those gaps.
5. Privacy/centering edits made concurrently in this checkout remain a separately owned integration. The working preview contains them; the feature's staged candidate intentionally excludes their hunks. Reconcile/commit that lane before a combined release, preserving the owner's latest directions.

## Creative review

Selected a clean architectural miniature rather than a photorealistic mansion. The scene adds one distinct residential detail without replacing the photo-led hero or turning service pages into 3D demos. The optional cutaway is intentionally basic. SVG/image-sequence alternatives, tools and competitor evidence are in RESEARCH.md. A custom house logo was not forced into an already approved identity. The /about/ route was retained with useful compact background rather than deleted without indexing/inbound-link evidence.
