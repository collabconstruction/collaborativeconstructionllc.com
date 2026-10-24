# Collaborative Construction: brand identity exploration

Research date: October 13, 2026. Research and isolated concepts only. Production code, logo, tracking, backend and Cloudflare settings were not changed. No commit, push or deployment was performed.

Start with [the visual gallery](index.html). It includes five complete identity/homepage studies, mobile examples, square/circular avatars, 16px marks, signage treatments, palettes and 14 sourced competitor captures. Use Compare / larger previews to inspect each direction at a larger scale. The illustrations are original architectural diagrams, not company portfolio photographs. Existing asset rights are unconfirmed, so no project imagery was reused in the concepts.

## Evidence and method

Read project handoff, research index/pipeline, competitor discovery, company review/decisions, relevant design skills, live home/service/mobile views, source palette, shared navigation shell, project data and motion gates. Starting checkout: `design/site-refresh-2026-10`, SHA `18a2bcf4c4ace8afa102d41d2377efae0be1891a`; working tree had existing edits, preserved. The handoff's historical branch/deployment details are stale relative to this checkout; no production commit parity is asserted.

14 relevant construction brands were independently opened on their official homepages; rendered viewport captures and sampled computed fonts/colors are in `screenshots/` and `browser-observations.json`. Content extraction supplemented visual review. Sea View failed in the web text tool but succeeded in the browser. Some media loaded incompletely (Duffany, REEF, Valle, Philbrook, Hamblin); those captures cannot establish photographic quality, performance or animation smoothness. Colors describe visible palette families, not complete extracted brand guidelines. Font samples describe specified CSS families, not proof of actual font download. Unknown secondary colors/logo details are explicitly unresolved.

This is a purposive Falmouth/Upper Cape and Cape-wide overlap sample, not a map-pack ranking, exhaustive census or market-share study. Google Business Profile ratings/social activity were not independently inspected. No conversion, customer-perception or competitive quality claims are measured. All company tenure, awards, credentials and customer claims remain self-reported. Aesthetic evaluations are interpretations, not objective market facts.

## Current website audit

Observed: sticky black header, gold roofline/name logo, orange primary contact action and phone shortcut, full-width architectural hero, heavy slab heading, italic supporting line and secondary project action. Mobile header retains contact/phone/menu and shrinks the detailed logo. Homepage exposes residential versus oversight routes, optional intake context and a simple required-field explanation. Service page uses matching centered slab hierarchy. Source uses charcoal `#2B2D31`, orange `#D9531E`, Roboto Slab, Inter and Cormorant Garamond; local source includes ongoing user edits and is not assumed identical to production.

Creative interpretation: practical contractor confidence with architectural ambition, rather than a consistently premium or consistently traditional identity. Contact access and service routing look professional. The three type voices and gold-logo/orange-interface combination reduce coherence. A long hero sentence competes with the photograph on a phone; shortening it is a stronger improvement than adding effects. The roof symbol communicates category quickly but is less distinctive at avatar scale than a purpose-designed CC mark. The logo's tiny slogan is unsuitable as essential information at favicon size.

Preserve: recognizable company name, real owner identity, visible phone/inquiry path, residential/oversight distinction, canonical service URLs, accessible functional controls and existing backend/consent contracts. Retain existing project assets pending permissions/attribution; do not delete them. Do not infer that a redesign requires new technology. The current Eleventy/shared-shell/token structure is appropriate.

Capture caveat: entrance/reveal animation was active in initial service/mobile screenshots; momentarily faded or absent content is not a proven permanent visibility defect. Motion lifecycle and reduced-motion behavior need dedicated runtime verification before any production decision. No fresh Lighthouse, full keyboard audit, form submission or conversion test was run here.

Trust/content opportunity: replace generic quality/trust repetition with verified scope, owner role, planning steps and credited case studies. The LLC's projects must remain distinct from Wesleigh's earlier career. The portfolio data explicitly withholds `role`/`builtBy`; gallery photography is not proof of LLC authorship. Credentials, response promises, awards and capacity need owner evidence before new public claims.

## Market patterns and opportunities

The captured sample includes forest green (Cataldo), muted green (Valle), sage (Walsh), teal (High Tide), burgundy (REEF/Philbrook), blue (Cape Associates/Custom Crafted) and warm brown/tan (DC/Hamblin). Therefore “everyone is navy” is not supported. White/light frames and large home photography recur; neither is sufficient differentiation. Colors are descriptive sample observations, not a numerical market prevalence estimate.

Roof/house imagery appears clearly in Crafted and Custom Crafted; pictorial devices, heritage nameplates and serif wordmarks also occur. Hammers/hard hats were not established as a dominant pattern. Avoid making claims about unseen marks. High-end positioning in Cataldo, Walsh and Sea View relies on coherent photography, restrained typography and premium service framing; larger established firms also present team/process/history evidence. Design quality does not prove construction quality.

Strongest observed visual references: Cataldo's photography-led restraint; Walsh's consistent warm editorial hierarchy; Sea View's large brand scale; Clancy's separation of image and text. Each has tradeoffs. DC's owner-first identity is memorable but the intro impedes immediate task access in the captured state. Learn from principles, not marks or layouts.

Opportunity hypothesis: a joined/paired identity reflecting collaboration, paired with clear scope and honest role/process evidence. An unconventional identity can plausibly remain trustworthy when navigation, residential imagery, contact and evidence stay familiar. Test this with actual target homeowners; no research here proves audience preference or conversion gain.

## Outside inspiration

[Johnston Marklee](https://www.johnstonmarklee.com/work): architecture studio, not local competition. Observed spare wordmark, black project index and categories. Borrow indexing discipline, not its relatively hidden sales route. [Marmol Radziner construction](https://www.marmol-radziner.com/construction/): outside-market design-build reference describing integrated execution; visual capture remained a loader, so inspiration is its published responsibility narrative, not an invented visual audit. Do not claim Collaborative Construction is architect-led.

The pasted style-reference images were inspiration cues, not authenticated local competitor evidence. Their remote proxy images were not downloaded or repurposed.

## Five identity directions

### A: Measured Architecture

Precise, open, quietly premium. Competes on precision and documented process rather than a luxury adjective.

- Mark: Open paired C geometry. Original SVG: [prototype](logos/A-mark.svg).
- Type: Source Serif 4 + Inter (recommended; prototype uses Georgia/system sans). Font licensing/files must be verified before production use; no fonts installed.
- Hero: “Good homes. Carefully considered.”, proposed copy, not an approved claim.
- Photography: One permissioned architectural exterior, neutral daylight, full elevation; credited scope and role.
- Motion: Single 180ms image entrance; no delayed text. Always render readable final content without JS and honor reduced motion.
- Mobile: Wordmark above image, short headline and two stacked actions; project captions stay visible.
- Risk: Can resemble an architecture practice; explicitly say residential construction.
- Color roles: primary #202826, secondary #D9D6CE, accent #8A4B32, bg #F7F6F2, surface #FFFFFF, text #202826, muted #626660, button #202826, buttontext #FFFFFF, dark #202826, darktext #F7F6F2.
- Links use the main text/primary color with underline on light backgrounds; on dark backgrounds use darktext with underline. Hover uses an underline/outline, not an untested low-contrast color. Accent is decoration unless paired contrast is checked.
- Contrast: {'Body/background': 13.94, 'Muted/background': 5.41, 'Button label': 15.08, 'Dark application': 13.94}; calculated WCAG relative-luminance ratios for listed pairs. These are token checks, not full page accessibility certification.

### B: Cape, Considered

Warm coastal modernism without nautical decoration. Uses residential warmth and joined geometry rather than the familiar wave/roof symbol.

- Mark: Offset joint / mirrored C. Original SVG: [prototype](logos/B-mark.svg).
- Type: Newsreader + Inter (recommended; prototype uses Georgia/system sans). Font licensing/files must be verified before production use; no fonts installed.
- Hero: “More room for life on the Cape.”, proposed copy, not an approved claim.
- Photography: Permissioned lived-in interiors, cedar and daylight; avoid beaches, boats and staged stock estates.
- Motion: Quiet crop change on hover, static on touch. Always render readable final content without JS and honor reduced motion.
- Mobile: Headline before cropped image; large phone action; no horizontal project carousel.
- Risk: Green/neutral palettes already occur locally; distinction depends on mark, crop and content.
- Color roles: primary #183D3B, secondary #D7C8AD, accent #9A4A32, bg #F4EFE5, surface #FFFDF8, text #183D3B, muted #5F665D, button #183D3B, buttontext #FFFDF8, dark #183D3B, darktext #F4EFE5.
- Links use the main text/primary color with underline on light backgrounds; on dark backgrounds use darktext with underline. Hover uses an underline/outline, not an untested low-contrast color. Accent is decoration unless paired contrast is checked.
- Contrast: {'Body/background': 10.36, 'Muted/background': 5.17, 'Button label': 11.67, 'Dark application': 10.36}; calculated WCAG relative-luminance ratios for listed pairs. These are token checks, not full page accessibility certification.

### C: Built Together

Confident contemporary builder; graphic clarity. Lime punctuation and heavy paired brackets are a bolder combination than observed muted palettes.

- Mark: Two heavy C brackets. Original SVG: [prototype](logos/C-mark.svg).
- Type: Archivo + Inter (recommended; prototype uses Arial/system sans). Font licensing/files must be verified before production use; no fonts installed.
- Hero: “BUILD WELL. BUILD TOGETHER.”, proposed copy, not an approved claim.
- Photography: Wide permissioned on-site and finished-detail crops; balance work-in-progress with residential warmth.
- Motion: Brief bracket alignment on hover only; no particles. Always render readable final content without JS and honor reduced motion.
- Mobile: Compact CC at left, clear menu at right; large type constrained to width, light service section.
- Risk: May feel commercial or technology-oriented; dark surfaces need warm real residential photography.
- Color roles: primary #212526, secondary #E5E4DD, accent #D7F06B, bg #212526, surface #303536, text #F5F4EE, muted #B6BDB8, button #D7F06B, buttontext #212526, dark #212526, darktext #F5F4EE.
- Links use the main text/primary color with underline on light backgrounds; on dark backgrounds use darktext with underline. Hover uses an underline/outline, not an untested low-contrast color. Accent is decoration unless paired contrast is checked.
- Contrast: {'Body/background': 14.04, 'Muted/background': 8.08, 'Button label': 12.21, 'Dark application': 14.04}; calculated WCAG relative-luminance ratios for listed pairs. These are token checks, not full page accessibility certification.

### D: The Joinery

Tactile, dependable craftsmanship; contemporary heritage. Makes collaboration tangible through joinery rather than generic quality/trust wording.

- Mark: Joinery grid / inset C pair. Original SVG: [prototype](logos/D-mark.svg).
- Type: Libre Baskerville + Source Sans 3 (recommended; prototype uses Georgia/system sans). Font licensing/files must be verified before production use; no fonts installed.
- Hero: “Care in every connection.”, proposed copy, not an approved claim.
- Photography: Permissioned timber, stair and trim details plus complete rooms; no antique-filter fabrication.
- Motion: Underline or edge emphasis only; static material illustrations. Always render readable final content without JS and honor reduced motion.
- Mobile: Simple wordmark, short intro, one detail image and clear service list.
- Risk: Badge/detail may lose clarity at favicon size; avoid implied establishment date.
- Color roles: primary #493C30, secondary #D9C5A6, accent #7C352A, bg #F5EDDF, surface #FFFBF4, text #493C30, muted #6C6051, button #493C30, buttontext #FFFBF4, dark #493C30, darktext #F5EDDF.
- Links use the main text/primary color with underline on light backgrounds; on dark backgrounds use darktext with underline. Hover uses an underline/outline, not an untested low-contrast color. Accent is decoration unless paired contrast is checked.
- Contrast: {'Body/background': 9.16, 'Muted/background': 5.27, 'Button label': 10.32, 'Dark application': 9.16}; calculated WCAG relative-luminance ratios for listed pairs. These are token checks, not full page accessibility certification.

### E: Shared Framework

A recognizable system built from two parts and one shared space. Blue exists locally, but a modular paired-frame identity with plan/evidence layouts creates a different system.

- Mark: Offset blue frames / negative-space C. Original SVG: [prototype](logos/E-mark.svg).
- Type: Space Grotesk + Inter (recommended; prototype uses Arial/system sans). Font licensing/files must be verified before production use; no fonts installed.
- Hero: “Your next chapter. Our shared plan.”, proposed copy, not an approved claim.
- Photography: Permissioned paired detail/context images, framed with blue rules; no simulated project labels.
- Motion: Two frame segments align once; reduced-motion keeps final mark. Always render readable final content without JS and honor reduced motion.
- Mobile: Single-column framework with persistent text labels; no decorative frame crossing copy.
- Risk: Could resemble a developer or consultancy; test legibility and contractor recognition before choosing.
- Color roles: primary #234ACB, secondary #DDE4F5, accent #EAD866, bg #F8F7F2, surface #FFFFFF, text #17213D, muted #596172, button #234ACB, buttontext #FFFFFF, dark #17213D, darktext #F8F7F2.
- Links use the main text/primary color with underline on light backgrounds; on dark backgrounds use darktext with underline. Hover uses an underline/outline, not an untested low-contrast color. Accent is decoration unless paired contrast is checked.
- Contrast: {'Body/background': 14.82, 'Muted/background': 5.8, 'Button label': 7.21, 'Dark application': 14.82}; calculated WCAG relative-luminance ratios for listed pairs. These are token checks, not full page accessibility certification.

## Logo system and production refinement brief

Each concept uses an 80×80 grid. A has 5-unit strokes and two overlapping open rectangles; B uses offset 9-unit joints; C uses 12-unit brackets; D uses a 5-unit inset enclosure; E uses 8-unit offset frame strokes. These proportions are visible in the original SVG path data. The paired parts suggest coordination/shared responsibility; that meaning is a creative intention, not established viewer interpretation.

Refine only the selected direction. Develop optical spacing and a distinctive custom wordmark, rather than approving the prototype's generic lettering. Require at least one-color black, reversed white and chosen-color versions. At 16px simplify open gaps and remove slogans/enclosing detail if necessary; D is weakest at that size. A/C/E are the clearest starting geometries. Marks may resemble existing geometric identities; no trademark clearance or uniqueness search was performed.

Required application system: website header uses mark plus full readable name; mobile uses a shorter lockup with the full name elsewhere; Gmail/Google/GBP/social use only a square safe-area symbol that survives circular crop; favicon uses optically simplified symbol; business card puts contact on a separate side; site sign/truck decal uses single-color mark plus large company name and phone, not tiny slogan. Apparel needs embroidery testing with a vendor. Profile examples and signage strips are shown in the gallery, but no account image was changed. Request owner-selected physical applications and print specifications before final vector output.

## Scorecard and skeptical recommendation

Scores are subjective, unweighted 1–10 design judgments. Higher implementation score means easier, not more sophisticated. No score predicts customer response. Customer fit is especially provisional until desired services/project budgets are confirmed.

| Criterion | A | B | C | D | E |
|---|---:|---:|---:|---:|---:|
| Distinctiveness | 8 | 7 | 9 | 7 | 10 |
| Trust | 8 | 9 | 7 | 9 | 7 |
| Premium | 10 | 9 | 8 | 8 | 8 |
| Memorability | 8 | 8 | 9 | 8 | 10 |
| Logo | 8 | 8 | 9 | 7 | 9 |
| Mobile | 9 | 9 | 8 | 9 | 9 |
| Readability | 9 | 9 | 9 | 9 | 9 |
| Customer fit | 8 | 9 | 7 | 8 | 7 |
| Implementation ease | 7 | 8 | 8 | 9 | 7 |
| Maintainability | 9 | 9 | 8 | 9 | 8 |
| Physical applications | 9 | 9 | 9 | 9 | 9 |

Rationale: A earns the highest premium score through disciplined spacing/type but has architecture-versus-builder ambiguity and needs better project evidence. B has the best trust/fit balance because of warmth and familiar residential hierarchy, but loses distinction points because greens/neutrals already occur locally. C has a strong simple mark and contrast but may read as a commercial contractor or tech brand. D is easiest to maintain and reproduces well in broad applications, but loses logo/distinction points for inset detail and familiar heritage styling. E earns the highest distinction/memorability through a modular frame system, but needs homeowner testing to avoid consultancy associations. All directions use responsive static content and readable token pairs; runtime audits remain required, so 9 is a design-potential judgment, not a passed accessibility test.

Best overall / my choice: **B, Cape, Considered**, conditional on residential renovation/addition positioning. Most premium: **A, Measured Architecture**. Most distinctive and highest-risk/highest-upside: **E, Shared Framework**. Best low-effort improvement: **C's disciplined paired mark and hierarchy**, adapting the existing charcoal tokens and removing decorative clutter; logo/artwork replacement still requires approval. Do not choose purely from the mean score: owner goals and credible photography can change the ranking.

## Homepage and website handoff

Proposed sequence: concise geography/service hero → project-fit paths (renovate / add / build, advisory separate) → two verified case studies → how planning and changes work → real owner/credential evidence → short inquiry and phone alternative. Navigation: Work, Services, Approach/About, Contact, with advisory clearly accessible. No invented projects, testimonials or process commitments. Until case studies are approved, use factual service content rather than fictional placeholders on production.

Project pages: town, verified role, scope, constraints, collaborators/photo credits, decisions and actual outcome. Before/after only if both images are permissioned and represent the same documented scope; static paired images work without a slider. Service cards should state scope and relevant questions, not duplicate generic marketing. Preserve existing URLs and Service schema. Keep useful text visible before reveal animations.

Typography should have two functional voices at most; self-host selected licensed fonts after checking files. Use responsive images with dimensions, AVIF/WebP alternatives where practical, and no new video or framework. Above-fold copy stays immediately visible. Touch interactions do not depend on hover. Maintain keyboard focus, labels, consent controls, nav, directional transitions where retained and the existing intake/Turnstile lifecycle. Full browser/form tests happen in an isolated implementation task, not this research run.

## Phased next work and owner decision

1. **Choose B, A or E** as a whole identity. Confirm primary services, desired customer/project range, and whether warm residential or architectural positioning fits. Choose lettering/mark separately only after reviewing the complete system.
2. Refine the selected logo in monochrome, avatar and signage; perform similarity/rights checks, optical small-size work and homeowner interpretation review. Confirm which existing photos/projects may be attributed to the LLC and published.
3. Build one approved homepage and service-page prototype in an isolated branch. Set tokens/type/crops before motion. Verify mobile at 320/390/768px and desktop, contrast, keyboard, reduced-motion, no-JS and performance with real assets.
4. Implement approved templates incrementally while preserving all contact/backend/analytics contracts. Run project tests, clean build and release verification. Deployment, tracking/account changes and marketing publication require their own authorized release task.

Future agent: read AGENTS.md → HANDOFF → research index/pipeline → this report and directions.json. Do not treat these prototypes as production assets or final business claims. Exact output ownership for this research run was this directory only. No shared scorecard/facts were edited.

## Preview and verification

Open index.html directly in a browser, or serve this directory only using `python3 -m http.server 8879 --bind 127.0.0.1 --directory docs/research/brand-exploration-2026-10-13`, then visit http://127.0.0.1:8879/. No dependencies or build integration are needed. Files are outside src and Eleventy passthrough paths, so this package is not in the public build.

Source checks: JSON parses, five SVGs and all local screenshot references exist, listed text/button/dark contrast pairs checked. Browser results are recorded in verification.md after inspection. No production release tests were needed because production code was not changed.
