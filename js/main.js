/* ==========================================================================
   Collaborative Construction, LLC site behavior
   ========================================================================== */
(function () {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ----------------------------------------------------------------------
     Header shadow on scroll
  ---------------------------------------------------------------------- */
  const header = $(".site-header");
  const onScrollHeader = () => header && header.classList.toggle("is-stuck", window.scrollY > 12);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ----------------------------------------------------------------------
     Mobile nav toggle
  ---------------------------------------------------------------------- */
  const toggle = $(".nav-toggle");
  const nav = $(".nav");
  if (toggle && nav) {
    // The hamburger's own bars animate off [aria-expanded], so the panel is the
    // only thing that needs a class.
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".nav a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ----------------------------------------------------------------------
     Services dropdown

     CSS already opens the panel on :hover and :focus-within, so the menu
     works with this file absent. What CSS cannot do is keep aria-expanded
     honest, or let a tap toggle the panel shut again, so that part lives
     here, as a class the same CSS rules respond to.
  ---------------------------------------------------------------------- */
  $$(".nav-group").forEach(group => {
    const trigger = $(".nav-group__trigger", group);
    if (!trigger) return;
    const setOpen = (open) => {
      group.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!group.classList.contains("is-open"));
    });
    // Escape closes and returns focus to the trigger, per the usual
    // disclosure pattern; focusout covers tabbing or tapping away.
    group.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && group.classList.contains("is-open")) {
        setOpen(false); trigger.focus();
      }
    });
    group.addEventListener("focusout", () => {
      if (!group.contains(document.activeElement)) setOpen(false);
    });
    document.addEventListener("click", (e) => {
      if (!group.contains(e.target)) setOpen(false);
    });
  });

  /* ----------------------------------------------------------------------
     Contour drift: the one scroll-linked effect on the page.

     The hero and the navy strata bands are drawn as nested CSS contour
     ellipses, like the depth lines on a nautical chart. As you scroll, the
     inner lines travel slightly further than the outer ones, which reads as
     depth without moving any text.

     Two deliberate constraints:
       - One rAF-batched scroll listener for every band on the page. The
         previous version wrote an inline `transform` string on every single
         scroll event, un-batched, which is a layout write inside the scroll
         handler.
       - It sets a custom property (`--drift`) and lets CSS own the actual
         transform. That keeps `translateX(-50%)` centring in the stylesheet
         where it belongs: the old code clobbered the whole transform and
         had to re-state the centring in JS.
  ---------------------------------------------------------------------- */
  if (!prefersReduced && "IntersectionObserver" in window) {
    const animatedDecorations = $$(".locations--atlas, .process-section, .quote-band, .header-cta a, .svc-cta .btn, .hero__cta .btn-gold, .adu-card .btn");
    const visibleDecorations = new Set();
    const syncDecoration = element => element.style.setProperty("--decorative-state", visibleDecorations.has(element) && !document.hidden ? "running" : "paused");
    const decorationObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) visibleDecorations.add(entry.target); else visibleDecorations.delete(entry.target);
      syncDecoration(entry.target);
    }));
    animatedDecorations.forEach(element => { element.style.setProperty("--decorative-state", "paused"); decorationObserver.observe(element); });
    document.addEventListener("visibilitychange", () => animatedDecorations.forEach(syncDecoration));
  }
  const contourField = $(".hero__bg");
  if (contourField && !prefersReduced && "IntersectionObserver" in window) {
    let visible = true;
    const syncContours = () => {
      contourField.querySelectorAll("span").forEach(line => {
        line.style.animationPlayState = visible && !document.hidden ? "running" : "paused";
      });
    };
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncContours();
    }).observe(contourField.closest(".hero"));
    document.addEventListener("visibilitychange", syncContours);
    syncContours();
  }
  const driftBands = $$(".hero__bg, .strata__lines");
  if (driftBands.length && !prefersReduced) {
    let queued = false;
    const applyDrift = () => {
      queued = false;
      const vh = window.innerHeight;
      driftBands.forEach((band) => {
        const r = band.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;   // off-screen: skip
        // -1 .. 1 as the band crosses the viewport.
        const progress = (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2);
        const lines = band.children;
        for (let i = 0; i < lines.length; i++) {
          // Inner lines (later children) drift more. 7px per step is small
          // enough that it never visibly detaches from the band edge.
          lines[i].style.setProperty("--drift", (progress * (i + 1) * 7).toFixed(2));
        }
      });
    };
    const onScrollDrift = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(applyDrift);
    };
    applyDrift();
    window.addEventListener("scroll", onScrollDrift, { passive: true });
    window.addEventListener("resize", onScrollDrift, { passive: true });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal

     `is-in` is the single state class the stylesheet keys every reveal on:
     blocks, headline words, motto words, hairline rules and the strata
     dividers. One vocabulary, so a new component only has to pick the right
     attribute to join in.
  ---------------------------------------------------------------------- */
  const processTimeline = $("[data-process]");
  if (processTimeline) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      processTimeline.classList.add("is-ready");
    } else {
      processTimeline.classList.add("is-staged");
      const processObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          processTimeline.classList.add("is-ready");
          processObserver.disconnect();
        }
      }, { threshold: .08, rootMargin: "0px 0px 35px 0px" });
      processObserver.observe(processTimeline);
    }
  }
  // Give each content type a restrained entrance, shared across all routes.
  $$(".company-brand, .company-overview__copy, .company-principles article").forEach(el => el.setAttribute("data-reveal", ""));
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el, index) => {
    el.dataset.motion = el.matches(".project, .service-card, .company-principles article") ? "settle"
      : el.matches(".company-brand, figure, .figure") ? "soften"
      : index % 2 ? "right" : "left";
  });
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(el => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px 80px 0px" });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Drawn elements: hairline rules and the topographic section dividers.

     Both are pure decoration that should arrive as the section does, so they
     share one observer. `.rule` starts at scaleX(0) and draws left-to-right;
     `.section-divider` runs its contour arcs up on `.is-in`.
  ---------------------------------------------------------------------- */
  const drawnEls = $$(".rule, .section-divider");
  if (drawnEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      drawnEls.forEach(el => el.classList.add("is-in"));
    } else {
      const drawIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add("is-in"); drawIO.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      drawnEls.forEach(el => drawIO.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Word-by-word heading reveal: wraps each word of a heading in a span and
     rises them in on a short stagger as the heading scrolls into view.

     Two things this has to get right that the previous version did not:

     1. It walks the DOM instead of reading `textContent`. The hero headline
        is "Built with you <span class='gem'>in the room.</span>", the
        italic serif accent is an element, and flattening to text would have
        silently deleted it and shipped the headline in one voice. Any inline
        markup inside a reveal heading now survives: the walker recurses into
        elements and only ever splits text nodes.
     2. The stagger is a CSS custom property (`--w-delay`), not a chain of
        setTimeout calls. One class add starts the whole heading, so there is
        no queue of timers still firing into a heading the visitor has
        already scrolled past, and the delay is visible to anyone reading the
        stylesheet.
  ---------------------------------------------------------------------- */
  const wordRevealEls = $$("[data-reveal-words]");
  if (wordRevealEls.length) {
    const STAGGER = 0.018; // seconds between words

    // Splits every text node beneath `root` into .rw-word spans, leaving the
    // element structure (and therefore the styling) intact.
    const wrapWords = (root) => {
      const words = [];
      const walk = (node) => {
        // Copy the child list first: we replace nodes as we go.
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const text = child.nodeValue;
            if (!/\S/.test(text)) return;             // whitespace-only, leave it
            const frag = document.createDocumentFragment();
            // Keep the original spacing by splitting on captured gaps.
            text.split(/(\s+)/).forEach((part) => {
              if (part === "") return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              const span = document.createElement("span");
              span.className = "rw-word";
              span.textContent = part;
              frag.appendChild(span);
              words.push(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(root);
      return words;
    };

    const wrapped = wordRevealEls.map((el) => {
      const words = wrapWords(el);
      words.forEach((w, i) => w.style.setProperty("--w-delay", (Math.min(i * STAGGER, 0.18)).toFixed(3) + "s"));
      return { el, words };
    });

    const show = ({ words }) => words.forEach(w => w.classList.add("is-in"));

    if (prefersReduced || !("IntersectionObserver" in window)) {
      wrapped.forEach(show);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const match = wrapped.find(w => w.el === entry.target);
          if (match) show(match);
        });
      }, { threshold: 0.05, rootMargin: "0px 0px 80px 0px" });
      wrapped.forEach(({ el }) => io.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Page transitions: smooth directional slide + gold particle shift.
     No color veil; the fixed background stays put so nothing flashes.
     Direction tracks the site's nav order (moving left / right).
  ---------------------------------------------------------------------- */
  /* Links are extensionless ("/about"), because Cloudflare serves them that
     way and 307-redirects the ".html" form. The ".html" handling below is
     kept so any old bookmark or stray link still animates correctly. */
  const NAV_ORDER = ["", "general-contractor-falmouth-ma", "home-additions-cape-cod", "adu-builder-cape-cod", "home-renovation-cape-cod", "custom-home-builder-cape-cod", "construction-advisory", "gallery", "about"];

  const pageSlug = (pathname) => {
    let s = (pathname || "").split("#")[0].split("?")[0];
    s = s.replace(/\/+$/, "");              // drop trailing slash
    s = s.split("/").pop() || "";           // last path segment
    s = s.replace(/\.html$/i, "");          // tolerate the legacy form
    return s === "index" ? "" : s;
  };

  const pageIndex = (pathname) => {
    const i = NAV_ORDER.indexOf(pageSlug(pathname));
    return i < 0 ? 0 : i;
  };

  const isInternal = (a) => {
    const href = a.getAttribute("href") || "";
    if (a.target === "_blank" || a.hasAttribute("download")) return false;
    if (/^(mailto:|tel:|#)/.test(href)) return false;
    // Covers absolute, root-relative, and relative hrefs in one check.
    return a.origin === location.origin;
  };

  // A link that only changes the hash is not a page change. Let the browser
  // jump to the anchor instead of playing an exit animation and reloading.
  const isSameDocument = (dest) => {
    const u = new URL(dest, location.href);
    return u.pathname === location.pathname && u.search === location.search;
  };

  /* The exit used to also spray 26 gold dust particles across the viewport in
     the travel direction. Removed: the tints were hard-coded from the retired
     amber palette, and a particle burst is exactly the "spectacle" register
     this design avoids. The directional slide alone carries the sense of
     travel, and it costs nothing to paint. */

  let leaving = false;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !isInternal(a)) return;
    const dest = a.href;
    if (dest === location.href) return;
    if (isSameDocument(dest)) return;   // in-page anchor, not a navigation
    if (prefersReduced) return; // let it navigate normally
    e.preventDefault();
    if (leaving) return;
    leaving = true;

    const forward = pageIndex(new URL(dest, location.href).pathname) > pageIndex(location.pathname);
    // remember which way to enter on the next page
    try { sessionStorage.setItem("navDir", forward ? "right" : "left"); } catch (_) {}

    document.body.classList.add("is-leaving", forward ? "leave-fwd" : "leave-back");
    // This delay is paid on every internal click before the browser even
    // starts the request, so it is a direct cost to perceived speed. It must
    // stay in step with the .page-main exit transition in styles.css,
    // otherwise navigation cuts the fade off half-finished. Both were 320ms;
    // both are now 180ms, which still reads as a complete slide.
    setTimeout(() => { window.location.href = dest; }, 180);
  });

  // restore on bfcache back-navigation
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      leaving = false;
      document.body.classList.remove("is-leaving", "leave-fwd", "leave-back");
    }
  });

  /* ----------------------------------------------------------------------
     Back to top
  ---------------------------------------------------------------------- */
  const toTop = $(".to-top");
  if (toTop) {
    const onScrollTop = () => toTop.classList.toggle("is-visible", window.scrollY > 620);
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }));
  }

  /* ----------------------------------------------------------------------
     Carousel(s): dots, arrows, keyboard, swipe, slide counter

     These no longer advance on their own. Seven galleries on /gallery/ each
     ran a requestAnimationFrame loop forever to paint a progress bar, and up
     to four were on screen at once in the two-column grid, so the page had
     several photographs sliding independently while you tried to look at one.
     Autoplay also failed WCAG 2.2.2: pausing was bound to :hover, which a
     touch or keyboard visitor cannot do.

     Photographs of finished work are the reason someone is on this page, so
     the visitor sets the pace. Everything that let you *choose* a photo
     (arrows, dots, swipe) is kept, and arrow keys and a "3 / 6" counter are
     new, because with autoplay gone the controls have to carry discovery.
  ---------------------------------------------------------------------- */
  $$(".carousel").forEach((root) => {
    const track  = $(".carousel__track", root);
    const slides = $$(".carousel__slide", root);
    const dotsWrap = $(".carousel__dots", root);
    const prev   = $(".carousel__btn.prev", root);
    const next   = $(".carousel__btn.next", root);
    if (!track || slides.length <= 1) return;

    let idx = 0;

    /* Slide bytes.

       Every slide but the first ships with data-src / data-srcset. They cannot
       simply carry `loading="lazy"`: the track lays all slides out side by side
       and Blink grows the lazy-load viewport by ~1250px in *every* direction, so
       on a 412px phone the next three slides of every carousel read as "near
       viewport" and download immediately. /gallery/ was pulling 24 photographs
       and 1.28MB on first paint for the four or five a visitor can actually see.

       Promotion is driven by what the visitor does, not by a timer:
         - the slide either side of the current one, so a click never lands on a
           frame that has not started loading;
         - and only once the carousel itself is near the viewport, so the six
           galleries further down /gallery/ cost nothing until scrolled to. */
    const promote = (i) => {
      const slide = slides[i];
      if (!slide) return;
      $$("source[data-srcset], img[data-src]", slide).forEach((el) => {
        if (el.dataset.srcset) { el.srcset = el.dataset.srcset; delete el.dataset.srcset; }
        if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
      });
    };
    const promoteAround = (i) => {
      promote(i);
      promote((i + 1) % slides.length);
      promote((i - 1 + slides.length) % slides.length);
    };

    /* Two stages, because the neighbouring frames are expensive and nobody has
       asked for them yet. Nearing the viewport promotes only the slide actually
       on screen; the frames either side wait for a sign the visitor means to
       browse: a pointer over the carousel, focus landing inside it, or a touch.
       Deferring them merely to `load` was not enough: the featured carousel on
       /gallery/ opens on a 119KB photograph whose neighbour is another 119KB,
       and that second file was being spent on a slide nobody can see. */
    let armed = false;
    const arm = () => {
      if (armed) return;
      armed = true;
      promoteAround(idx);
    };
    const whenNear = () => {
      if (!("IntersectionObserver" in window)) { arm(); return; }
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        promote(idx);
        ["pointerenter", "focusin", "touchstart"].forEach((ev) =>
          root.addEventListener(ev, arm, { once: true, passive: true }));
      }, { rootMargin: "300px 0px" });
      io.observe(root);
    };
    if (document.readyState === "complete") whenNear();
    else addEventListener("load", whenNear, { once: true });

    /* Built here rather than in the templates: it is a readout of state this
       script owns, so on a page where the script never ran there is no "1 / 6"
       sitting next to arrows that do nothing. aria-hidden because the dots
       and arrow labels already say which photo you are on, a screen reader
       does not need to hear the position twice. */
    const count = document.createElement("p");
    count.className = "carousel__count";
    count.setAttribute("aria-hidden", "true");
    const at = document.createElement("span");
    at.className = "carousel__at";
    count.append(at, document.createTextNode(" / " + slides.length));
    root.appendChild(count);

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      // Without this the `.carousel__dots .dot` rules never match and the
      // browser's default button chrome paints instead.
      b.className = "dot";
      b.setAttribute("aria-label", "Photo " + (i + 1) + " of " + slides.length);
      b.addEventListener("click", () => go(i));
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      track.style.transform = `translateX(${-idx * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle("active", i === idx);
        // aria-current, not aria-selected: this is a set of links-in-spirit
        // into one gallery, not a tablist.
        if (i === idx) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      if (at) at.textContent = String(idx + 1);
    }
    const go = (i) => {
      idx = (i + slides.length) % slides.length;
      promoteAround(idx);
      render();
    };

    next && next.addEventListener("click", () => go(idx + 1));
    prev && prev.addEventListener("click", () => go(idx - 1));

    // Arrow keys work once anything inside the carousel has focus, which is
    // how a keyboard visitor expects a gallery to behave.
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); }
    });

    let sx = 0, dx = 0, dragging = false;
    track.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; dx = 0; dragging = true; }, { passive: true });
    track.addEventListener("touchmove",  (e) => { if (dragging) dx = e.touches[0].clientX - sx; }, { passive: true });
    track.addEventListener("touchend",   () => {
      if (Math.abs(dx) > 45) go(dx < 0 ? idx + 1 : idx - 1);
      dx = 0; dragging = false;
    });

    render();
  });

  /* ----------------------------------------------------------------------
     mailto: links are left alone on purpose.

     This used to intercept every mailto click and force it into Gmail's web
     compose window. That broke for anyone not signed into Gmail in that
     browser, which is most people on a phone. The OS already knows which mail
     app the visitor uses. Let it decide.
  ---------------------------------------------------------------------- */

  /* ----------------------------------------------------------------------
     Contact form.     [INTAKE-HANDLER-START]

     Posts to the Worker at /api/contact, which stores the lead and emails it.
     The success message is only shown on a confirmed 200. If anything fails,
     the visitor is told the truth and given a direct way to reach us, so a
     real inquiry is never lost to a silent error.

     DO NOT REMOVE THE TWO MARKERS. tests/frontend-intake.test.mjs and
     tests/honeypot-regression.test.mjs cut the text between the marker above
     and its matching END marker out of this file and run it in a bare `vm`
     context against a synthetic form. That means they exercise the submit
     handler that actually ships rather than a copy that can drift, which is
     what stops a refactor from silently resetting the form after a failed
     submission or clearing the spam trap before it is sent.

     Both tests used to key the end of the region on the decorative banner of
     whichever section happened to follow this one. Deleting that section
     truncated the slice mid-function and every test in both files failed with
     `Unexpected token '}'`, a syntax error reported against a file that is
     itself perfectly valid. Named markers make the dependency explicit and
     survive reordering.

     Each marker string is written exactly once in this file, deliberately, so
     a plain indexOf finds the real one and not a mention of it in prose.
  ---------------------------------------------------------------------- */
  const form = $("#contact-form");
  if (form) {
    const field = name => form.elements.namedItem(name);
    const status = $(".form-status", form);
    const fileInput = $("#cc-files", form);
    const list = $(".file-list", form);
    const type = field("project_type");
    const context = window.ccIntakeContext;
    if (type && context) type.value = context.get().project_type;
    let files = [], sending = false, submissionId = null;
    const rotate = () => { submissionId = null; };
    /* One input listener, not two. Rotating the submission id and clearing a
       stale error message are both reactions to the visitor editing a field,
       and splitting them across two registrations made the second one shadow
       the first wherever only a single handler per event type is kept. */
    form.addEventListener("input", e => {
      const el = e.target;
      if (!el || el.name !== "cf-turnstile-response") rotate();
      if (isFlagged(el) && String(el.value || "").trim()) setFieldError(el, "");
    });
    form.addEventListener("change", e => { if (e.target.name !== "cf-turnstile-response") rotate(); });
    function renderFiles() {
      if (!list) return;
      list.textContent = "";
      files.forEach((file, i) => {
        const li = document.createElement("li");
        const text = document.createElement("span");
        text.textContent = file.name;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Remove";
        button.setAttribute("aria-label", "Remove " + file.name);
        button.addEventListener("click", () => { files.splice(i, 1); rotate(); renderFiles(); });
        li.append(text, button); list.appendChild(li);
      });
    }
    if (fileInput) fileInput.addEventListener("change", () => {
      files = Array.from(fileInput.files || []);
      renderFiles();
    });
    /* ---- per-field errors ------------------------------------------------
       Validation used to speak only through the one status line at the
       bottom of the form ("Please enter your name, email and project
       message"), which does not say which box is wrong and, on a phone,
       is often off screen. These helpers write the message next to the
       control and mark it aria-invalid. The .field__error elements are
       already in the markup and already referenced by aria-describedby,
       so filling one announces it with the field it belongs to.

       setFieldError does not touch submit logic: the gating conditions
       below are unchanged. It only makes the existing refusal legible.

       Every DOM call here is feature-checked rather than assumed. Labelling
       is cosmetic and submitting is not: a field with no matching error slot,
       or an element that cannot take focus, must never be the reason an
       inquiry fails to send.
    --------------------------------------------------------------------- */
    const errorSlot = el => (el && el.id ? $("#" + el.id + "-error", form) : null);
    const isFlagged = el => !!el && typeof el.getAttribute === "function"
      && el.getAttribute("aria-invalid") === "true";
    function setFieldError(el, message) {
      if (!el) return;
      if (typeof el.setAttribute === "function") el.setAttribute("aria-invalid", message ? "true" : "false");
      const slot = errorSlot(el);
      if (slot) slot.textContent = message || "";
    }
    function focusField(el) { if (el && typeof el.focus === "function") el.focus(); }
    function clearFieldErrors() {
      ["name", "email", "message"].forEach(n => setFieldError(field(n), ""));
    }

    function fallback(message) {
      status.className = "form-status err";
      status.textContent = message + " Your entries are still here. You can retry, email ";
      const email = document.createElement("a");
      email.href = "mailto:collaborativeconstructiongc@gmail.com";
      email.textContent = "collaborativeconstructiongc@gmail.com";
      const phone = document.createElement("a");
      phone.href = "tel:+15084406981"; phone.textContent = "(508) 440-6981";
      status.append(email, document.createTextNode(" or call "), phone, document.createTextNode("."));
    }
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (sending) return;
      status.className = "form-status"; status.textContent = "";
      clearFieldErrors();
      const missing = [
        ["name", "Please enter your name."],
        ["email", "Please enter your email address."],
        ["message", "Please tell us about your project."]
      ].filter(([n]) => !field(n).value.trim());
      if (missing.length) {
        missing.forEach(([n, msg]) => setFieldError(field(n), msg));
        status.className = "form-status err";
        status.textContent = missing.length === 1
          ? "One field still needs an answer. See the message above it."
          : "A few fields still need answers. See the messages above them.";
        focusField(field(missing[0][0]));
        return;
      }
      if (!form.reportValidity()) return;
      if (files.length > 6 || files.some(f => f.size > 10 * 1024 * 1024) || files.reduce((total, f) => total + f.size, 0) > 25 * 1024 * 1024) {
        fallback("Please select up to 6 attachments, each no larger than 10 MB and 25 MB total."); return;
      }
      if (!window.crypto || typeof window.crypto.randomUUID !== "function") {
        fallback("This browser cannot submit securely. Please use a current browser."); return;
      }
      if (!window.ccChallenge || !window.ccChallenge.take(field("cf-turnstile-response")?.value)) {
        window.ccChallenge?.reset();
        fallback("Please complete fresh verification, then select Send Inquiry again.");
        return;
      }
      submissionId = submissionId || window.crypto.randomUUID();
      const payload = new FormData(form);
      if (context) Object.entries(context.get()).forEach(([key, value]) => {
        if (["source_page", "first_landing_page", "referrer", "utm_source", "utm_medium", "utm_campaign"].includes(key)) payload.set(key, value);
      });
      payload.set("submission_id", submissionId);
      payload.delete("attachments");
      files.forEach(file => payload.append("attachments", file));
      const btn = $("button[type=submit]", form);
      const original = btn.textContent;
      const controls = Array.from(form.elements).filter(el => !el.disabled && el.name !== "cf-turnstile-response");
      sending = true;
      controls.forEach(el => { el.disabled = true; });
      btn.textContent = "Saving inquiry…";
      status.textContent = "Saving your inquiry…";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch("/api/contact", { method: "POST", body: payload, signal: controller.signal });
        let data = {};
        try { data = await response.json(); } catch (_) {}
        if (response.ok && data.ok === true && data.stored === true && typeof data.id === "string" && data.id) {
          form.reset(); files = []; renderFiles(); rotate();
          status.className = "form-status ok";
          status.textContent = "Your inquiry is saved. Reference: " + data.id.slice(0, 80) + ". This confirms storage, not a personal response. If you need to follow up, call (508) 440-6981 and quote this reference.";
          if (data.attachments && data.attachments.pending) status.textContent += " Attachments are still being processed; do not resend your inquiry.";
          if (data.attachments && data.attachments.failedCount > 0) status.textContent += " Some attachments could not be saved. Please mention this when we speak; your inquiry itself is saved.";
          if (window.ccTrack) window.ccTrack("generate_lead");
        } else {
          /* The Worker already returns a per-field `errors` map alongside
             `error` on a 400 (see worker/index.js), and the browser was
             throwing it away, so a server-side rejection showed only the
             generic "Please check the form fields." Attach each one to its
             control, then focus the first. */
          let firstBad = null;
          if (data && data.errors && typeof data.errors === "object") {
            Object.entries(data.errors).forEach(([name, message]) => {
              const el = field(name);
              if (!el || typeof message !== "string") return;
              setFieldError(el, message.slice(0, 200));
              /* Only move focus to something the visitor can actually act on.
                 The Worker can reject project_type, which is a hidden input
                 carrying the context of whichever service page they arrived
                 from: focusing that would take focus nowhere and leave no
                 visible explanation. Those cases fall through to the status
                 line below, which prints the server's own message. */
              if (!firstBad && errorSlot(el)) firstBad = el;
            });
          }
          fallback(typeof data.error === "string" ? data.error.slice(0, 300) : "We could not confirm that your inquiry was saved.");
          focusField(firstBad);
        }
      } catch (_) {
        fallback("We could not confirm the result. Please retry without changing your entries to avoid a duplicate inquiry.");
      } finally {
        clearTimeout(timeout);
        sending = false;
        controls.forEach(el => { el.disabled = false; });
        btn.textContent = original;
        window.ccChallenge?.reset();
      }
    });
  }
  /* [INTAKE-HANDLER-END]: end of the region the intake tests extract.
     Everything below this line is presentation and is not under test. */

  /* ----------------------------------------------------------------------
     Hero figure crossfade.

     One frame at a time, a slow dissolve, and no controls. Deliberately not
     a slideshow: no dots, no arrows, no counter, nothing competing with the
     headline for the visitor's first second on the page. The motion is the
     only thing that says "there is more work behind this".

     Why it is safe to run unattended, which is the usual objection to any
     auto-advancing element:
       - It is decorative. The frames after the first carry `alt=""` and
         `aria-hidden`, so assistive tech sees exactly one image, and nothing
         the visitor needs is hidden behind a timer.
       - It stops when it is not being looked at. An IntersectionObserver
         pauses the timer the moment the hero leaves the viewport, so the
         rest of the page is not re-rasterising a crossfade off-screen, and a
         backgrounded tab gets `visibilitychange` on top of that.
       - Under `prefers-reduced-motion` the driver never starts at all. The
         CSS leaves the first frame at `opacity:1`, so the hero renders as a
         clean static photograph, which is also exactly what a visitor with
         JS disabled gets.
  ---------------------------------------------------------------------- */
  $$("[data-hero-figure]").forEach((figure) => {
    const stage = $(".hero-figure__stage", figure);
    const frames = stage ? $$(":scope > picture", stage) : [];
    if (!stage || frames.length <= 1 || prefersReduced) return;

    // Frames after the first ship with data-src / data-srcset so they cost
    // nothing during the initial load.
    const promote = () => {
      frames.slice(1).forEach((frame) => {
        $$("source[data-srcset], img[data-src]", frame).forEach((el) => {
          if (el.dataset.srcset) { el.srcset = el.dataset.srcset; delete el.dataset.srcset; }
          if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
        });
      });
    };
    // Idle on its own fired while the hero image was still in flight, putting
    // 144KB of invisible frames into the same pipe as the LCP resource. Waiting
    // for `load` first means these can only ever use bandwidth nobody else
    // wants. The first crossfade is 6.2s out, so there is slack for both waits.
    const schedulePromote = () => {
      if ("requestIdleCallback" in window) requestIdleCallback(promote, { timeout: 2000 });
      else setTimeout(promote, 600);
    };
    if (document.readyState === "complete") schedulePromote();
    else addEventListener("load", schedulePromote, { once: true });

    const HOLD = 6200;   // ms a frame stays up; the CSS dissolve is 1.5s
    let idx = 0;
    let timer = null;

    // The first frame is held visible by CSS (`img:first-child`) so there is
    // something to look at before this runs. Promote it to the same class the
    // others use, then let the class alone drive visibility.
    frames[0].classList.add("is-live");
    stage.classList.add("is-live");

    const advance = () => {
      frames[idx].classList.remove("is-live");
      idx = (idx + 1) % frames.length;
      frames[idx].classList.add("is-live");
    };

    const start = () => { if (!timer) timer = setInterval(advance, HOLD); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach(e => (e.isIntersecting ? start() : stop()));
      }, { threshold: 0.25 }).observe(figure);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!("IntersectionObserver" in window)) start();
    });
  });

  /* ----------------------------------------------------------------------
     Locations rail: the explicit pause control.

     The marquee itself is one CSS animation; this only owns the button. The
     rail is already pausable by hover and by `:focus-within` in CSS, and it
     does not animate at all under `prefers-reduced-motion`, but neither of
     those is reachable by a touch visitor, and WCAG 2.2.2 (Pause, Stop, Hide)
     asks for a real mechanism for any motion that starts automatically and
     runs more than five seconds. So there is a button.

     `aria-pressed` carries the state rather than swapping the label text,
     because "Pause" that becomes "Play" makes a screen-reader user guess
     which word describes the current state and which describes the action.
  ---------------------------------------------------------------------- */
  $$("[data-rail]").forEach((rail) => {
    const btn = $("[data-rail-pause]", rail.closest("section") || document);
    if (!btn) return;
    const setPaused = (paused) => {
      rail.dataset.paused = String(paused);
      btn.setAttribute("aria-pressed", String(paused));
    };
    setPaused(false);
    btn.addEventListener("click", () => setPaused(rail.dataset.paused !== "true"));
  });

  /* ----------------------------------------------------------------------
     Motto words: the "Experience · Quality · Trust" line.

     Same `is-in` + `--w-delay` contract as the headline reveal, so the
     stylesheet owns the timing. These are already in the markup (unlike
     .rw-word, which JS creates), so this only stages the delays and flips
     the class once the line is on screen.

     This replaces a block that fired a particle burst from the centre of
     each word as it landed, on a 400ms chain, using hard-coded colours from
     the retired amber palette.
  ---------------------------------------------------------------------- */
  const mottoLines = $$(".motto-words");
  if (mottoLines.length) {
    const staged = mottoLines.map((line) => {
      let words = $$(".motto-word", line);
      // about.njk and the service pages write the motto as bare text with
      // separator dots. Wrap the words so those pages join in too, without
      // every template having to spell out the spans.
      if (!words.length) {
        words = [];
        Array.from(line.childNodes).forEach((node) => {
          if (node.nodeType === 3) {
            const frag = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach((part) => {
              if (part === "") return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const span = document.createElement("span");
              span.className = "motto-word";
              span.textContent = part;
              frag.appendChild(span);
              words.push(span);
            });
            line.replaceChild(frag, node);
          } else if (node.nodeType === 1) {
            node.classList.add("motto-word");
            words.push(node);
          }
        });
      }
      words.forEach((w, i) => w.style.setProperty("--w-delay", (Math.min(i * 0.18, 0.54)).toFixed(2) + "s"));
      return { line, words };
    });

    const reveal = ({ words }) => words.forEach(w => w.classList.add("is-in"));

    if (prefersReduced || !("IntersectionObserver" in window)) {
      staged.forEach(reveal);
    } else {
      const mottoIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          mottoIO.unobserve(entry.target);
          const match = staged.find(s => s.line === entry.target);
          if (match) reveal(match);
        });
      }, { threshold: 0.6 });
      staged.forEach(({ line }) => mottoIO.observe(line));
    }
  }

  /* ----------------------------------------------------------------------
     Removed with the Midnight & Brass rebuild
     ----------------------------------------------------------------------
     Four decorative systems are gone. Each was built against the previous
     charcoal/amber palette and each is at odds with this design, which is
     navy drafting ink on warm ivory paper, a drawing, not a light show:

       - Click-burst particles. ~30 glowing dots on every pointerdown over a
         button, nav link or form control, with `box-shadow` glow in the old
         amber. A form field that sprays sparks when you tap it is noise in
         the one interaction that actually matters here.
       - Scroll-speed dust motes, plus a sustained cloud while back-to-top
         flew the page up. This also kept a scroll listener measuring
         velocity on every event.
       - 3D card tilt on `.adu-card`, `.form-card`, `.owner-photo` and the
         service cards: a perspective rotate following the cursor, written as
         an inline transform on every mousemove. Reads as app chrome, and it
         skewed the owner's photograph.
       - Section spot orbs: up to five absolutely-positioned radial-gradient
         blobs injected into five named sections, in `217,83,30` amber. The
         contour bands in `.hero__bg` and `.strata__lines` now carry depth,
         in palette, in CSS, with no injected DOM.

     `.spark-layer`, `.amb-spot`, `.spot-extra` and `.cc-cursor` are held at
     `display:none` in styles.css so any page still carrying that markup
     stays quiet. Nothing re-creates these layers.
  ---------------------------------------------------------------------- */

  // Filtering leaves every project available when JavaScript is unavailable.
  const projectFilters = document.querySelector(".project-filters");
  if (projectFilters) {
    const projects = Array.from(document.querySelectorAll("[data-project-category]"));
    const buttons = Array.from(projectFilters.querySelectorAll("button"));
    const status = document.querySelector(".project-results");
    projectFilters.hidden = false;
    buttons.forEach(button => button.addEventListener("click", () => {
      const category = button.dataset.projectFilter;
      buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      let visible = 0;
      projects.forEach(project => {
        project.hidden = category !== "All" && project.dataset.projectCategory !== category;
        if (!project.hidden) visible++;
      });
      status.textContent = `${visible} ${category === "All" ? "projects" : category.toLowerCase() + " projects"}`;
    }));
  }

  /* ----------------------------------------------------------------------
     Footer year
  ---------------------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
