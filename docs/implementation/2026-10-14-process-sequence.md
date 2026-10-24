# Centered process and moving tan borders

October 14, 2026. Follow-up to 7d45485 in the separate Midnight & Brass checkout.

Centered all four process cards, numbers, headings and body copy. Desktop cards are equal columns with tan borders; mobile stacks centered cards. One viewport-triggered sequence pops cards in at 0/.3/.6/.9 seconds and draws the connectors between them. The observer disconnects after the first trigger. No-JS shows final content and reduced motion bypasses animation. Added subtle continuous tan contour borders to the process section and quote band, with visibility/offscreen pausing through the existing decoration observer. Removed the short dash above the quote attribution.

Validation: 95 tests pass, clean build/release verification passes, diff check clean. Browser confirmed centered text, four delay values and connector animation; quote border uses tanBorderDrift. At 390px the process is one column without document overflow. Reduced-motion inspected in source, not OS-emulated. Screenshot: main workspace docs/implementation/evidence/process-centered.jpg.

Preview http://127.0.0.1:8885/ . No push/deployment; public maintenance remains unchanged.
