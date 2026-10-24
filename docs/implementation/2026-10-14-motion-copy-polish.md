# Construction-focused copy and motion refinement

Implemented October 14, 2026 in `/private/tmp/cc-midnight-brass`, branch `design/midnight-brass`, following `196b7c2`. Main workspace frontend preserved. Preview: http://127.0.0.1:8883/ . Public maintenance mode remains unchanged; no deployment or push performed.

## Changes

- Hero contour field enters with a 1.15-second swept/rotated movement, then settles into slow continuous contour motion. Fine-pointer movement shifts the background by at most 11px horizontally and 8px vertically; leaving resets it. Text and photo hit targets do not move with the pointer.
- Replaced Cape-focused presentation with service-focused copy in page headings, service descriptions, metadata and footer. Kept existing canonical URLs, real addresses, About background and project locations. Original business service-area schema remains intact; presentation does not claim statewide coverage. Reworded the ADU statistical qualifier to preserve statewide-versus-local meaning.
- Nearby communities rail now contains 27 entries within existing regional service areas, including South Shore communities. Native horizontal scrolling, keyboard focus, previous/next controls and snap points replace an autoplay list. Asymmetric rounded borders and a brass/slate/ivory/navy zigzag edge animate slightly. Entries indicate locations to discuss, not offices or completed projects.
- Free-estimate card is white with a stronger border/shadow, stretch alignment and distributed content. The Call Wes action sits at the bottom. Service-path cards also align bottom actions and fill their row height. No fixed-height clipping is imposed on mobile text.
- Removed decorative eyebrow dashes and the About portrait's gold rectangular offset frame. Name badge remains. Centered section headings, About biography and relevant service copy.
- About and six service headers reveal Experience, Quality, Trust with 0/.22/.44-second delays. Gallery's “Our Work” label removed.
- Contact buttons and header call icon use a low-frequency 11-second shimmer with subdued glow. Reduced-motion disables decorative motion. Contours and shimmer/rail decorations pause when offscreen or the document is hidden; pointer writes are requestAnimationFrame-batched.

## Validation

95 tests pass, zero failures/skips. Clean build and release-build verification pass: 177 public files and nine canonical-page invariants. Diff whitespace check passes. Nine pages inspected at 390px with no document overflow, no em/en dash characters in rendered body text, and Cape text absent from main content except About. Value stagger delays confirmed on About and all six services. Hero pointer variable updated in response to actual pointer input; eight contour lines use separate arrival/breathing animations. Location next control moved the scroll position to 849.5px and all 27 entries are present. Desktop estimate and location-rail screenshots saved in the main workspace `docs/implementation/evidence/2026-10-14-motion-polish/`.

Limits: no full Lighthouse measurement, no runtime OS reduced-motion toggle, no production inquiry submission. Reduced-motion fallbacks were inspected in source. Changing service-page titles may affect search presentation; canonical URLs and structured-data checks remain valid. Existing credentials, project attribution and older legislative claims retain their original evidence requirements; no new business promises were introduced.

## Integration

Use the focused commit on `design/midnight-brass`, not a whole-directory copy over the older main workspace. Coordinate with maintenance/recovery work before any release. Keep the maintenance gate and production settings until restoration is authorized. Run release checks in the integrated release checkout before publishing.
