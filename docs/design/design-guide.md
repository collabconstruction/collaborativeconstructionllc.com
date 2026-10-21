# Collaborative Construction, LLC — Website Design Guide

**Status:** working reference for the October 2026 site refresh.
**Scope:** `css/styles.css`, `js/main.js`, and the Nunjucks templates in `src/`.

---

## 0. How to read this document

Every rule below is tagged so nobody has to guess what is settled and what is a
suggestion I made:

| Tag | Meaning |
| --- | --- |
| **[BRAND]** | Pre-existing and already published. Not invented here. Change only with the owner. |
| **[PROPOSED]** | Introduced in this refresh. Reversible. Open to the owner's preference. |
| **[UNCONFIRMED]** | A factual claim on the site that research could not verify. Needs the owner's confirmation before it is relied on. |

The distinction matters because this is a real company's site. Anything in the
**[UNCONFIRMED]** list must not be treated as established fact.

---

## 1. Colour

### 1.1 Palette **[BRAND]**

The "Contractor Industrial" palette — flat charcoal plus construction orange —
was already in production before this refresh (see the redesign release notes in
`docs/releases/`). It is unchanged.

| Token | Value | Role |
| --- | --- | --- |
| `--maroon` | `#2b2d31` | Primary charcoal. Headers, dark bands, tags. |
| `--maroon-600` | `#24262a` | Charcoal, one step down. |
| `--maroon-700` | `#1d1f22` | Charcoal, two steps down. |
| `--maroon-900` | `#1a1a1a` | Deepest charcoal. Nav drawer, footer. |
| `--amber` | `#d9531e` | Construction orange. The single accent. |
| `--amber-600` | `#b8441a` | Orange, pressed/hover. |
| `--gold-1` | `#f3b68c` | Warm tint, for text on dark grounds. |
| `--gold-2` | `#e8793a` | Warm mid tint. |
| `--gold-3` | `#c25a1f` | Warm deep tint. |
| `--ink` | `#1a1a1a` | Headings. |
| `--body` | `#3a3a3a` | Body copy. |
| `--muted` | `#6b6b6b` | Secondary copy. **See the warning in §1.2.** |
| `--cream` / `--cream-2` / `--cream-3` | `#f5f5f3` / `#eeeeec` / `#e2e2df` | Light surfaces. |
| `--stone` | `#ececea` | Page ground. |
| `--line` | `rgba(26,26,26,.12)` | Hairlines. |

> **Naming:** the variables are still called `--maroon*`, `--amber*`, `--gold-*`
> from the older logo palette. They are deliberately **not** renamed — every
> existing rule references them, so a rename is a large diff with no visible
> result. Read them as "primary dark", "accent", "warm tint".

### 1.2 Contrast rules **[PROPOSED]**

Measured in-browser against the real composited backgrounds, not estimated.

- `--muted` (`#6b6b6b`) on `--stone` is **4.51:1** — it clears WCAG AA (4.5:1) by
  one hundredth. **Do not place `--muted` on any lighter surface**, and do not
  use it under 13px. It is at the edge of the standard, not comfortably inside it.
- Text over photography needs a scrim strong enough **where the text actually
  sits**, not merely somewhere in the box. Measured worst cases, against the
  brightest pixels each photo can present:

  | Element | Worst case | Required | Result |
  | --- | --- | --- | --- |
  | Hero eyebrow (14.4px, bold, + text-shadow) | 4.83:1 | 4.5:1 | pass |
  | Hero headline (32px bold → large text) | 4.02:1 | 3.0:1 | pass |
  | Hero CTA row | 7.55:1 | 4.5:1 | pass |
  | Carousel caption | 5.81:1 | 4.5:1 | pass |

- The carousel caption scrim is a four-stop ramp, not a two-stop fade. A plain
  `linear-gradient(transparent, rgba(26,26,26,.78))` only reaches full strength
  at the bottom edge of the box — *below* the text. Measured, the caption text
  occupies roughly 34–70% of the box height, where that gradient was only
  0.27–0.55 opaque, giving **1.77:1** over a bright photo. Several photographs
  in the gallery are bright (sky-heavy exteriors, a white bath). The ramp now
  reaches ≥0.66 opacity under the whole text band.

---

## 2. Typography

### 2.1 Families **[BRAND]**

| Token | Stack | Used for |
| --- | --- | --- |
| `--font-head` | Roboto Slab → Georgia → serif | Headings |
| `--font-body` | Inter → system sans | Body, UI |
| `--font-display` | Cormorant Garamond (italic) → Georgia | The motto voice only |

### 2.2 Type scale **[PROPOSED]**

Six steps, ratio ~1.25 at mobile widening to ~1.33 at desktop. **Components
reference a step; they do not invent a size.**

```
--step--1: clamp(.82rem, .79rem + .14vw, .9rem)
--step-0:  clamp(1rem,   .96rem + .2vw,  1.0625rem)
--step-1:  clamp(1.2rem, 1.12rem + .4vw, 1.44rem)
--step-2:  clamp(1.45rem, 1.3rem + .75vw, 1.95rem)
--step-3:  clamp(1.75rem, 1.5rem + 1.25vw, 2.6rem)
--step-4:  clamp(2.1rem, 1.7rem + 2vw,   3.4rem)
--step-5:  clamp(2.5rem, 1.9rem + 3vw,   4.2rem)
```

Why this exists: previously every heading hand-rolled its own `clamp()`, and the
contact eyebrow had drifted *larger* than the `h2` beneath it. A shared scale
makes that class of inversion impossible to introduce silently.

### 2.3 Measure **[PROPOSED]**

- `--measure-display: 24ch` for display lines.
- `--measure-prose: 68ch` for body copy.
- **Set measure caps in `em` on the element that carries the type, never in `ch`
  on a parent.** A `ch`/`em` cap on a parent resolves against the parent's font,
  not the child's. That is exactly how a `max-width: 16ch` on the hero wrapper
  turned one sentence into seven lines of headline.

---

## 3. Spacing

8px base. **[PROPOSED]**

```
--space-1: 4px     --space-6: 32px
--space-2: 8px     --space-7: 48px
--space-3: 12px    --space-8: 64px
--space-4: 16px    --space-9: 96px
--space-5: 24px
--space-section: clamp(56px, 7vw, 104px)
```

Section rhythm was a flat 96px everywhere, which read as dead space on a phone
and cramped on a wide screen. `--space-section` scales with the viewport, so
per-breakpoint section-padding overrides are no longer needed and should not be
re-added.

Layout constants **[BRAND]**: `--maxw: 1200px` (1280px above 1500px viewport),
`--header-h: 92px` (78px below 940px), `--radius: 10px`, `--radius-lg: 36px`.

---

## 4. Components

### 4.1 Focus **[PROPOSED]**

```
--focus: 0 0 0 3px rgba(255,255,255,.9), 0 0 0 6px var(--amber);
```

A double ring — white inner, orange outer — so it stays visible on both light
surfaces and dark photographs. Use `:focus-visible`, never `:focus`, so pointer
users don't see it. **Never remove an outline without supplying a replacement.**

### 4.2 Targets **[PROPOSED]**

Interactive targets are **≥24×24 CSS px**, or spaced so a 24px circle on each
centre stays clear of its neighbours' (WCAG 2.5.8, Level AA).

Where a control must *look* small, give the **button** the target size and draw
the visual with `::before`. The carousel dots do this: a 28×24 button containing
a 10px dot, 32px between centres. Before, they were 10×10 with 19px centres,
which failed both the size rule and the spacing exception.

Fixing the width also steadied the row — the old rule grew the active dot from
10px to 26px, so the whole centred row shifted sideways on every photo change.

### 4.3 Hiding things **[PROPOSED]**

This is the rule that caused the most real bugs, so it is stated plainly:

> **Moving something off-screen or clipping it to zero height does not remove it
> from the keyboard tab order.**

- `transform: translateY(-130%)` — still focusable.
- `max-height: 0; overflow: hidden` — still focusable.
- `opacity: 0` — still focusable.

Use `visibility: hidden` (or `inert`/`display: none`) for anything that should
be unreachable, and transition `visibility` alongside the transform so the
animation still plays in both directions. Note that a descendant's
`visibility: visible` **overrides a hidden ancestor** — that is how six services
links stayed focusable inside a closed mobile drawer.

Prefer doing this in CSS rather than JS, so the drawer is still unreachable if
`main.js` fails to load.

### 4.4 Carousels **[PROPOSED]**

- **No autoplay.** The gallery previously ran seven autoplaying carousels, each
  with its own `requestAnimationFrame` loop, up to four on screen at once.
- Controls are visible at rest. They used to be `opacity: 0` until
  `.carousel:hover`, so on any touch device they never appeared at all and
  swiping was the only way to reach photo 2 of 6 — undiscoverable.
- Pause-on-hover is **not** an acceptable mechanism for WCAG 2.2.2; it does not
  exist for touch or keyboard. Removing autoplay removes the requirement.
- The "2 / 6" counter is built in JS, not markup, so it never claims the photos
  are browsable on a page where the script failed.
- The dot group is `role="group"` with `aria-current`, **not** `role="tablist"` —
  these are not tabs and they control no tabpanels.

### 4.5 Motion **[PROPOSED]**

- Reveal-on-scroll via one `IntersectionObserver`, `threshold: 0.14`.
- Every motion feature in `main.js` sits behind a `prefersReduced` guard, and
  each has a non-animated fallback that still shows the content.
- Under `prefers-reduced-motion: reduce`, set **both**
  `animation-duration: .001ms` **and** `animation-iteration-count: 1`. Ten rules
  in this file end in `infinite`; shortening an infinite animation does not stop
  it, it restarts it forever, which is worse than leaving it alone.
- Avoid animating a registered custom property (`@property --bd-angle`) inside a
  `conic-gradient` border — it re-rasterizes the border every frame. One
  decorative instance (`.owner-photo`) is kept deliberately; seven were not.

### 4.6 No-JS floor **[PROPOSED]**

Every `[data-reveal]` block starts at `opacity: 0` and is only revealed by
`main.js`. With JavaScript disabled that renders the page blank — including the
no-JS contact fallback inside `.form-card`, which names the phone number and
email for exactly that visitor and was itself invisible. A `<noscript>` style in
`base.njk` restores the end state. A `<noscript>` block is inert whenever
scripting is enabled, so it cannot affect the normal path.

---

## 5. Content rules

### 5.1 Things that must not be invented **[BRAND]**

Do not add testimonials, ratings, awards, credentials, completed-project counts,
staff, prices, response-time promises, or performance claims unless the owner
supplies them. This is a live business; an invented review is a real problem.

### 5.2 Gallery attribution **[UNCONFIRMED]**

Research (`Website Evidence and Business Facts.md`) is explicit: confirm whether
each project was performed by the company or represents the founder's earlier
employment or oversight experience, and **do not imply sole company authorship
of every pictured building.** The gallery contains a 50,000 SF dormitory and a
national-brand self-storage facility alongside bath remodels.

Accordingly:

- `src/_data/projects.json` carries **no** `role` or `builtBy` field, and must
  not gain one until the owner confirms attribution.
- `category` only classifies copy that was already published.
- `shows` summarises **that project's own captions** — which parts of the
  building are pictured. It is deliberately not a scope-of-work claim.
- The `.gallery-note` paragraph says roles differed and offers the real answer on
  request. It is marked in `gallery.njk` as **proposed copy needing owner
  sign-off**. If attribution is confirmed, replace it with per-project roles and
  delete the note.

### 5.3 Other unconfirmed items **[UNCONFIRMED]**

- The **"50,000 SF"** figure in the Lovell Dormitory caption was already
  published and is preserved verbatim. It has not been independently verified.
- ADU and permitting statements must be checked against current state and
  municipal sources before any edit.

---

## 6. Verified in-browser

Measured, not assumed:

- No horizontal overflow at 390 / 768 / 1280 (offender probe against the ICB with
  clipped-ancestor filtering returns empty at all three).
- Keyboard: closed drawer exposes 0 focusable links; open drawer with the
  accordion collapsed exposes 4 and hides the 6 services links; focusing the
  trigger opens the panel and exposes all 6.
- Carousel arrows, dots, counter and `aria-current` all track together.
- Contrast figures in §1.2.

### Known measurement traps in this preview

Worth recording, because they cost real time:

- The preview tab reports `document.hidden === true`. Chrome computes **no**
  intersections in a hidden document, so **no** `IntersectionObserver` fires —
  including a freshly created one on a fully visible element. Nothing reveals on
  its own, and `requestAnimationFrame` never fires (it will hang an `await`).
- Transitions and animations do not advance in a hidden tab, so computed styles
  stay pinned at their start values.
- `document.documentElement.scrollWidth` reads 416 against a 390 ICB. That is
  the un-revealed `data-reveal="right"` elements sitting at `translateX(44px)`,
  clipped by `html { overflow-x: hidden }`. It is **not** real overflow — the
  document is not horizontally scrollable and the offender probe is empty.
- Measure layout from element geometry, and force the end state explicitly
  before screenshotting. Note the word reveals use `animation … forwards`, so
  `animation: none` strands them at `opacity: 0`.
