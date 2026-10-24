# Experience and interaction specification

## Visitor journey

Existing residential hero and real gallery photo remain first. Service explanations and six ordinary routes remain visible. A separate warm-ivory house study follows the service list, before the slim location rail. It is one optional illustration, not the main navigation.

1. Initial view: completed static architectural poster is present in HTML, with an explicit illustrative-model label. No extra renderer request at hero load.
2. As the section approaches: load the local Three module if motion/data preferences allow. Desktop scroll gently builds foundation, structural framing, enclosure and finishing details. The sequence reverses with normal reverse scrolling. No wheel/touch cancellation, forced page navigation or long pinned tunnel.
3. Manual stages: four real buttons and a labelled range work without dragging. They take ownership of the model until “Follow scroll” is chosen. Range arrow keys provide small steps. Touch uses these controls; mobile is a normal stacked layout with no sticky scroll sequence.
4. Explore: a deliberate button lifts/fades the roof, exposes the simplified interior and slightly adjusts the view. Press again for the exterior. This is an illustrative spatial transition, not an interior photograph or architectural plan. Six real service anchors remain next to it throughout.
5. Service pages: ordinary anchors use the established short page transition. The scene is not carried across documents. Browser Back/Forward remain native. No service page gains an unnecessary WebGL scene.
6. Skip motion: remove and dispose the canvas, show the poster, retain every service link. “Enable 3D” restarts when preferences permit. Reduced motion/save-data/explicit static mode do not load the renderer. Unavailable WebGL/import failure/context loss retain the poster and links.

## Motion contract

- Purpose: explain a generic house assembly and provide a memorable residential service introduction.
- Camera: small scroll turn, tiny mouse-only pointer response, controlled cutaway zoom; no continuous spin, controls that move underneath a pointer, full-screen orbit or doorway trap.
- State: absolute normalized progress, not accumulated scroll deltas. Manual controls interrupt; stage changes can reverse. No document history entry for model state.
- Lifecycle: IntersectionObserver visibility, ResizeObserver dimensions, DPR <=1.5, demand-only animation frames, visibility suspension, pagehide cleanup, bfcache restart, geometry/material/renderer disposal.
- Accessibility: essential HTML links and SVG fallback, explicit button labels/pressed states, polite announcement only for user stage changes, no canvas instructions essential to completing an enquiry. Decorative canvas hidden from screen readers; illustration alt text explains the visual. Foundation is a diagram, not a claim about how every project proceeds.
- Boundaries: no autoplay on the location rail; no persistent GPU rendering when the model is still. Existing reduced-motion styles, consent and intake remain.

## Other refinements

Palette: owner-specified #182B49 navy, #BDA16A brass, #F4F0E7 ivory, #111315 soft black, white. Brass on ivory is decorative; dark brass token carries small accent text. Sharp but comfortable 3px/5px corners. Concise intros centered, long service body content kept readable. Redundant homepage About promotion and quote removed; compact career summary retained, /about/ preserved to avoid a speculative redirect. Concurrent founder-privacy changes take precedence over the old named-owner presentation.
