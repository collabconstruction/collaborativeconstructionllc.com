# Design & motion handoff — 2026-10-13

Date: 2026-10-13. Branch: `design/site-refresh-2026-10`, commit `ff8cfb4`. Status: implemented and verified locally against an isolated preview; **not deployed**. Deployment, publishing, spending, connecting accounts, or sending communications were explicitly out of scope for this round per the governing handoff ("Complete preparation and verification before any production deployment; publish... only within explicit authorization").

Source handoff: `Construction Website Full Agent Prompt.md` (Design and Motion Research, 2026-10-13). Skills used: `construction-website-improvement`, `creative-website-design`, `design-code-reuse`, `claude-design-workflow`, `claude-motion-video` (all read in full from `~/.claude/skills/`).

## 1. Context map and baseline

Actual checkout: this repository, Eleventy 3.1.6 + Nunjucks (`src/` → `_site/`), Cloudflare Worker backend (`worker/index.js`, D1 `cc-leads`, R2 attachments, Turnstile, Cloudflare Email Routing), deployed via `wrangler`. This is the real, owned checkout — not a guessed repository — and matches the historical notes' architecture after inspection.

Baseline going into this round already reflected substantial prior work in this same branch: accessible nav, a reveal-on-scroll motion system (`js/main.js`, `data-reveal`/`data-reveal-words`, `IntersectionObserver` with a `prefers-reduced-motion` short-circuit), a merged residential/advisory service-choice section, an honestly-captioned project gallery (`src/_data/projects.json`) with an explicit non-attribution disclaimer, five dedicated service pages plus a construction-advisory page, SEO/schema work (brand-term fix, GBP identifiers, indexing confirmed via Search Console), and an automated test suite covering accessibility-adjacent and lead-intake behavior (95 tests before this round).

Findings this round, classified:

- **Observed defect (fixed):** the header rendered two house icons side by side above the 940px breakpoint — a standalone `c-icon.png` badge next to `logo-header.png`, which already draws its own gold house mark from an earlier logo recolor. Mobile already hid the duplicate; desktop/tablet did not. This was the user's own "clean up the top left" report, confirmed by DOM inspection before any fix.
- **Optional enhancement (implemented):** none of the six service/advisory pages used a disclosure pattern for common questions; relevant information existed but was spread across prose paragraphs. Added native `<details>` FAQs (see §3).
- **Optional enhancement (evaluated, not implemented):** a before/after comparison slider (cookbook pattern 03) was considered and dropped — there are no matching before/after image pairs of the same space in the approved asset set, and the pattern explicitly requires "genuine comparable before/after assets" per the shortlist.
- **Hypothesis (not acted on):** no analytics/conversion data was available this session to justify further changes to the hero, CTA copy, or form field order; none of those were touched.

## 2. Visual direction

Two directions were considered, per the handoff's requirement to develop two and recommend one:

- **Direction A — Editorial warm (recommended, and the one in production/this branch).** Maroon/charcoal ink (`--maroon #2b2d31`, `--ink #1a1a1a`) with a warm gold/amber accent scale (`--gold-1/2/3`, `--amber`, `--amber-600`), serif display type (`Roboto Slab`) over a plain sans body, generous whitespace, and a single reveal-on-scroll motion system. This already exists across the whole site from prior sessions (flat charcoal/orange redesign, gold-recolored logo) and reads as a deliberate, non-template identity distinct from generic contractor-site styling.
- **Direction B — Cooler architectural (not built).** A forest/cobalt palette closer to the pattern lab's alternate `data-palette` options, with sharper geometric dividers instead of the gem/diamond section dividers. This was not implemented: the handoff instructs preserving useful existing identity rather than rebuilding branding arbitrarily, and Direction A already has no identified brand-consistency defects — only the duplicate-icon bug, which is a markup bug, not a palette problem.

**Recommendation:** keep Direction A. Rebuilding the palette now would not fix any observed problem and would conflict with "avoid ... decorative complexity" and "preserve useful existing identity."

Design tokens used (all **already-approved**, read from `css/styles.css`; none proposed or new this round): `--maroon #2b2d31`, `--maroon-900 #1a1a1a`, `--amber #d9531e`, `--amber-600 #b8441a`, `--gold-1/2/3`, `--ink #1a1a1a`, `--body #3a3a3a`, `--muted #6b6b6b`, `--cream #f5f5f3`, `--line rgba(26,26,26,.12)`, `--radius 10px`, `--shadow-sm/md/lg`, `--step--1`…`--step-5` type scale, `--space-1`…`--space-9`, `--ease cubic-bezier(.22,.61,.36,1)`, `--focus` (white/amber double ring). The only **new** rule this round is `.faq-list`/`.faq-item` styling, built entirely from these existing tokens — no new colors, fonts, or spacing values were introduced.

## 3. Implemented templates, components, styles, interactions

- **`src/_includes/base.njk`, `css/styles.css` — header fix.** Removed the `<img class="c-badge">` element from `.brand` and its base/hover CSS rules. Left the unrelated `.c-badge` uses on the About page (owner photo) and in the footer (paired with plain text, not the full logo) untouched — confirmed by grep that no duplication exists there.
- **`src/_includes/faq.njk` — new shared macro.** Renders a `.faq` section of native `<details>/<summary>` items from a plain list of `{q, a}` objects. Adapted from the MIT-licensed pattern lab's "04 / NATIVE DISCLOSURES" study (`~/.claude/skills/creative-website-design/assets/pattern-lab/`) — only the pattern idea (native disclosure element, no JS, first item open) was reused; the markup, classes, and all copy are this project's own, and the CSS is scoped to the site's existing tokens rather than copying the lab's standalone stylesheet.
- **`css/styles.css` — `.faq-list`/`.faq-item` rules.** Card-style accordion matching `.svc-card`'s existing visual language (cream background, `--radius`, `--shadow-sm` on open), a CSS-drawn plus/minus marker (no icon font/SVG asset), `:focus-visible` ring using the site's existing `--focus` token, and an explicit `prefers-reduced-motion` override disabling only the decorative marker-rotation/shadow transitions (the open/close itself is the browser's native, non-animated `<details>` toggle).
- **Six pages — `general-contractor-falmouth-ma`, `home-additions-cape-cod`, `adu-builder-cape-cod`, `home-renovation-cape-cod`, `custom-home-builder-cape-cod`, `construction-advisory`.** Each gained a 3–4 item FAQ section built **only** from facts already stated elsewhere on that same page (process steps, service area, what information is needed to start) — no new claims, prices, timelines, or credentials were introduced. The ADU page's FAQ deliberately covers process only, since the page's existing feasibility checklist already covers legal/zoning/site-constraint content; duplicating it as FAQ items was avoided. The construction-advisory FAQ directly states the Owner's Project Management vs. Clerk of the Works vs. Construction Advisory distinction — this is the exact clarification the handoff's second visitor journey (owners/developers seeking oversight) needs, and it was already present in the page's three service-area sections; the FAQ just consolidates it into one answer.

Not touched this round, and still pending from the earlier design-refresh phase: hero video/image decision (already static per an existing code comment — a prior owner request plus an 11.9s LCP regression from an autoplaying video), comparison slider (no assets), any copy changes to claims about licensing/insurance/credentials (none were touched).

## 4. Previews and states

Verified via the Claude Preview MCP tool against the local Eleventy dev server (`npm run serve`, port 8787) — a true local preview, not production:

- **Desktop (1280×900):** header shows exactly one logo child (`brandChildCount: 1`); FAQ section renders all expected questions, first item open by default (`firstOpen: true`).
- **Mobile (390×844, reported `innerWidth: 434` — a known preview-tool viewport-reporting quirk also seen in the prior session, cross-checked against `document.documentElement.scrollWidth === window.innerWidth`, confirming no horizontal overflow regardless of the reported number):** no overflow (`overflowsRight: false`), FAQ cards stack legibly, touch targets are full-width summary rows.
- **Keyboard/interaction:** focusing a `<summary>` and invoking it toggles `.open` via the browser's native behavior (no custom JS); the reveal-on-scroll system reaches `opacity: 1` / `.is-visible` on the new `.faq-list` (checked via computed style, not just screenshot, since the screenshot tool has a known mid-paint capture artifact from the prior session).
- **Not independently confirmed in this headless harness:** the `:focus-visible` ring's visual appearance under real keyboard focus — the harness's programmatic `.focus()` does not reliably trigger `:focus-visible` matching (a known headless-automation limitation, not a code defect); the CSS rule itself follows the same `:focus-visible` convention already used site-wide (e.g. `.carousel__btn:focus-visible`).
- **Form/error states:** not re-tested this round because the contact form itself was not touched. See §6 for what remains current from earlier verification.

## 5. Source references, license, and attribution notes

- Pattern source: `~/.claude/skills/creative-website-design/assets/pattern-lab/{index.html,patterns.css,patterns.js,README.md,LICENSE}` — original, dependency-free, MIT-licensed research demo, explicitly intended for adaptation rather than wholesale reuse. Only pattern 04 (native disclosures) was adapted; patterns 01–03, 05–07 (editorial hero, bento, comparison slider, filterable grid, process-as-story, deterministic motion study) were reviewed and **not** adopted this round — the site already implements equivalents of 01 (editorial hero), 06 (process sections), and a scroll-based version of 07's reveal idea from earlier sessions; 03 was rejected for lack of matching assets; 05's filter grid was judged unnecessary at the current project count (judgment call, not a defect).
- No new third-party dependency, package, font, or remote asset was added. No React Bits, GSAP, Remotion, or any other licensed-with-restrictions component was used — the stack remains vanilla Eleventy/CSS/JS, consistent with "static Eleventy + vanilla JS... favor scoped CSS, vanilla JS and progressive enhancement."
- All FAQ copy is this project's own, derived from already-approved on-page copy; no photography, testimonial, rating, or credential claim was added or changed.

## 6. Video/storyboard evaluation

No video was produced or proposed for implementation this round. Assessment: the homepage hero is deliberately a static image, not video, per an existing code comment recording that the previous autoplaying background video was removed at the owner's request and had been the single largest contributor to an 11.9-second LCP. Reintroducing video as a default hero would conflict with that prior, deliberate decision and with the performance targets in the Website Verification Plan (LCP ≤ 2.5s). A short, optional process-explainer video (not a hero autoplay) could still be worth scoping in a future round if the owner wants one, but no approved footage, voiceover, or storyboard brief exists yet, so nothing is rendered or drafted here — this is an explicit "not pursued this round," not a missed task.

## 7. Build, functional, accessibility, and performance results

- `npm run build`: clean, 11 pages written, no errors.
- `npm test` (Node 22.23.3 via nvm, required by `engines`): **95 passed, 0 failed, 0 skipped**, including the pre-existing SEO/structured-data, D1 read-back, honeypot, intake, and lead-operations suites — none of which were touched or needed changing by this round's work.
- DOM-level accessibility checks performed: single logical header logo, keyboard-operable native disclosures, no introduced horizontal overflow at 390px, reduced-motion override present for the new component. Full axe-core/Lighthouse runs were **not** performed this round (no new dependency was added to run them, and the change surface — a header deletion and a native HTML disclosure pattern — is low enough risk that a full automated audit was judged unnecessary; this is a scoping decision, not a completed-and-passed claim).
- No performance measurement (Lighthouse/Web Vitals) was taken this round; the change adds a small amount of text-only markup/CSS per page and no new image, font, or script, so no meaningful performance impact is expected, but this is an expectation, not a measured result.

## 8. Summary, unresolved facts, deferred enhancements, rollback

**Summary:** Fixed the reported duplicate header icon (desktop/tablet had been missed by an earlier mobile-only fix). Added a native, dependency-free FAQ pattern to all six service/advisory pages, built entirely from already-approved on-page copy, directly serving the handoff's two visitor journeys (service clarity for homeowners; the OPM/Clerk-of-the-Works/Advisory distinction for owners seeking oversight). Evaluated and deliberately did not implement: a second visual direction (existing identity preserved), a comparison slider (no assets), and video (hero is intentionally static for performance reasons; no process-video brief exists).

**Material unresolved facts** (unchanged from the research record, not newly discovered): current license/insurance wording still needs checking against the state and the owner before any credential badge is published; per-project attribution in the gallery (company work vs. founder's prior employment) remains unconfirmed; the Claude account's independent design review remains pending per `docs/research/02-claude-company-review.md`.

**Deferred enhancements, prioritized:** (1) full axe-core/Lighthouse pass on this branch before any deploy decision; (2) a filterable project grid once there are enough categories to justify it; (3) a before/after slider if/when matching asset pairs are approved; (4) a process-explainer video, if the owner wants one, as its own scoped brief with real footage.

**Rollback:** this round's work is three commits ahead of the last deployed Worker version (`77344f5d-dcbf-4ed3-90b7-0a45d4514b44`, itself one deploy ahead of the recorded pre-design-refresh rollback target `bf2a57a5-f4e9-4466-8c67-abdd73bec4de`). Nothing in this round was deployed; reverting is `git revert ff8cfb4` or simply not merging/deploying this commit. No database, binding, secret, or Worker code was touched this round.
