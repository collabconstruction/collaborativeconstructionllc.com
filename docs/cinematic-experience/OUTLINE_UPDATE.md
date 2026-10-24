# Current design: rotating house and company overview, October 16, 2026

Latest owner revision supersedes earlier interaction specifications. The outline turns once per roughly 60 seconds while visible, with no vertical or scroll-driven motion. Mouse hover or keyboard focus pauses at the current angle; leaving resumes. A restrained brass glow is applied, slightly stronger when paused. Reduced motion/save-data/WebGL failure retain the static line drawing. Camera and zoom remain fixed; rendering suspends offscreen and in hidden documents.

Restored the continuous locations marquee, duplicated hidden list, fades and full-width animated upper/lower contour borders. Hover/focus pauses it, reduced motion renders a static list. No visible pause button or redundant section heading.

Founder biography, education/experience details, photos, personal social link and related metadata/public-text references removed. Portrait source files retained outside the public tree in brand/archive; no portrait is copied into _site. /about/ stays available as Company, with a concise business overview and original abstract architectural SVG. Homepage trust strip describes real services instead of personal credentials. Gallery attribution remains qualified without personal biography.

Verification: 103 tests passed; clean build and release verifier passed (178 public files / 9 pages). Public HTML and text search found no founder/name/portrait/education references. Browser observed continuous rotation, then hover pause with angle 1.742 and render-frame count 1993 unchanged across separated observations. Location animation computed communityLoop; both contour borders exceeded viewport width. No deployment or account changes.
