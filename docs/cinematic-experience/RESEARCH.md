# Research and technical decisions

Reviewed October 16, 2026. References are evidence, not instructions. No competitor code, photographs, copy, 3D model or third-party agent skill was copied into this implementation.

## Technology comparison

| Approach | Fit for this Eleventy site | Decision |
|---|---|---|
| Procedural Three.js island | Real depth, editable groups, predictable model ownership; a lazy local GPU renderer | Selected. Three 0.186.1, MIT; esbuild 0.28.2, MIT build tool. Native scroll and DOM controls are sufficient. |
| React Three Fiber | Declarative React renderer for Three; requires the React ecosystem and compatible major versions | Adds a second UI stack without a corresponding need here. Not installed. [Official introduction](https://r3f.docs.pmnd.rs/getting-started/introduction). |
| GSAP / ScrollTrigger | Established scrub/pin timelines; commercial website use covered by standard no-charge license | Valid alternative, but native sticky + a small scroll controller avoids a second timing engine. Not installed. [Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [license](https://gsap.com/community/standard-license/). |
| Blender -> GLB | Appropriate when detailed architectural modeling/art direction is needed; reproducible export supported | Optional future editing tool, not required for this simplified original geometry. GLB is already generated directly. [Official pipeline](https://www.blender.org/features/pipeline/), [export reference](https://docs.blender.org/manual/en/5.1/addons/import_export/scene_gltf2.html) (page extraction failed during this check). |
| Spline | Visual scene/event authoring and embeds | Adds an authoring/runtime service dependency; no need to require a subscription/editor for this scene. No price or plan assumption made. [Official docs](https://docs.spline.design/). |
| SVG/CSS only | Cheapest initial delivery, accessible/static, excellent for architectural line drawing | Selected as the always-present fallback. Not equivalent to true 3D camera/cutaway behavior. |
| Pre-rendered image sequence | Predictable art direction without a runtime model | Many frames/bytes for only a small controlled turn; weaker optional cutaway and aspect-ratio flexibility. Not generated. |

[Three documentation](https://threejs.org/docs/) and [upstream MIT license](https://github.com/mrdoob/three.js/blob/dev/LICENSE). The exact installed license is shipped at `assets/models/THREE-LICENSE.txt`. The runtime is locally bundled, not loaded from a third-party CDN. Blender, React, Spline and GSAP were evaluated, not installed. No paid asset or software used.

## Scrollytelling references

[Nomadium's architecture sales-page case study](https://nomadium.co.uk/lab/sales-page/) describes a building assembly narrative. This informed the limited staged concept, not the site's layout or code. The supplied Blueprint Arising URL could not be fetched; its implementation and claimed technology are unverified. The owner explicitly requested a simple model, so realism, a mansion model and an automatic doorway fly-through were rejected. There is no persistent scene across page loads; standard links and the site's existing short transition preserve history and reliability.

## Construction-site review

Public first-party pages were read for information architecture and residential positioning. A follow-up desktop browser pass captured all eight supplied sites and measured their rendered heading/body font declarations (evidence/builder-visuals.json). This is not an exhaustive mobile or performance audit; several media/entrance states were still loading in the initial screenshots. Claims and awards belong to those companies, not Collaborative Construction.

| Source | Observed pattern | Applied lesson |
|---|---|---|
| [Sea View Builders](https://www.seaviewbuilders.com/) | Residential services and portfolio are easy to reach; staged process and direct enquiry path | Keep real photos and service links visible beside the original model. Do not copy its promises, quote or language. |
| [High Tide](https://www.high-tide-contracting.com/) | Specific renovation categories and clear service requests | Name actual construction services; avoid turning headings into slogans. |
| [Archwright](https://archwright.com/) | Coastal-home photography, portfolio, separate estate management path | Strong photography and clear categories are more useful than repeated corporate description. |
| [Cape Associates](https://www.capeassociates.com/) | Web text fetch failed; direct browser showed a centered logo/nav over a full-width media hero | Keep brand/navigation legible before optional visual effects finish. |
| [Longfellow Design Build](https://www.longfellowdb.com/) | Architecture/construction/engineering differentiation and direct enquiry | Clearly distinguish our building and independent oversight roles; do not imply our company is an architect or engineer. |
| [The Valle Group](https://vallegroup.com/) | Residential portfolio and client-evidence paths | Retain real project photography and honest attribution. Avoid its intimate relationship language for this owner's voice. |
| [Duffany](https://duffanybuilders.com/) | Homeowner/architect paths, service categories and portfolio | Residential-first navigation; keep commercial work secondary. |
| [PSD](https://www.psdab.com/) | Named featured projects and project stories | Organize photos consistently. A future case study needs verified project role and permission, not invented narrative. |

Competitors are internal research only; none are linked on public pages.

## Brand and socials

Keep the approved tan CC monogram with live white header text. A house icon alone is less distinctive and risks generic clip art; the house study provides the residential association without replacing the identity. The only master in the current branch is `brand/cc-monogram.png`; previous house-mark exploration is not a proven approved production asset. Existing generated header/footer/icon/favicon renditions are preserved. No single PNG was re-exported or renamed.

Facebook remains the existing company URL from the business data. A fresh direct page fetch was blocked, so this pass does not claim new independent ownership verification. There is no verified company LinkedIn URL. Concurrent privacy work removed the personal LinkedIn link; that choice was preserved. No guessed social URL was added.

## Visual editing research

- [AgentGrab](https://github.com/PaulHarrer/agentgrab): browser extension extracts element context for an AI editing prompt. Closest conceptual fit; installing an extension would expand the environment unnecessarily for a local proof of concept.
- [Stagewise](https://github.com/stagewise-io/stagewise): current project describes an agentic IDE, broader than a small element selector. Not blindly installed from an old integration example.
- [v0](https://v0.app/docs): useful hosted generation product, but an external workflow is unnecessary for Nunjucks source selection.

Selected a tiny original localhost-only selector. It generates a source-mapped edit brief for the existing coding agent, with no telemetry, dependencies, account permission or production injection. It does not pretend to autonomously run Claude from a web page. See HANDOFF.md.

### Desktop visual follow-up

Sea View uses a large Playfair Display serif over house photography, a Jost UI and warm neutral surfaces. High Tide uses condensed Oswald headings and a cream/blue identity. Archwright uses a lighter Effra sans-serif, a broad media hero and a curved transition. Cape Associates declares a Lora-family heading and centers its logo in the navigation. Longfellow uses Josefin Sans and a diagrammed navy header. Valle pairs Playfair Display with Open Sans and large residential imagery. Duffany uses large uppercase Montserrat headings with distinct homeowner/architect actions. PSD's initial view uses an oversized monogram, a compact menu and broad curved media framing; no H1 was present in that sampled DOM. These are observations, not endorsements or templates to copy. Several initial media/reveal states were incomplete, so no loading-speed ranking or complete animation claim is made. Sources are the linked first-party sites in the table; screenshots and measured declarations are saved internally.

Applied judgement: retain our readable serif/sans combination and bounded authentic photography; use original geometry and crisp borders; keep navigation and essential headings visible independently of optional rendering. Our desktop/mobile site checks are separate from these competitor references.
