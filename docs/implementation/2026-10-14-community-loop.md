# Compact endless communities strip

October 14, 2026. Owner requested removal of visible heading/arrows, continuous looping, edge fades and tighter borders.

Implemented in the Midnight & Brass checkout. Two identical 27-community lists form an equal-width seamless track, with only the first exposed to assistive technology. A 110-second linear transform runs continuously while visible, pauses on hover/focus or when hidden/offscreen, and becomes one static wrapped list under reduced motion. Removed obsolete arrow handlers. Compact 93px desktop band uses asymmetric chip corners and fine brass/slate contour borders. No visible heading or controls remain.

Validation: 95 tests pass, clean build and release verifier pass (177 public files). Browser measured both loop halves at 2969.54px; animation resumed after focus left (transform advanced from -8.10px to -16.21px). Focus pause observed. No horizontal document overflow at 390px; edge mask present. Reduced-motion fallback inspected in source, not OS-emulated. Screenshot in main workspace: docs/implementation/evidence/communities-endless-loop.jpg.

Preview: http://127.0.0.1:8884/ . No production deployment or push; maintenance remains unchanged. This is a focused follow-up to bcceec5.
