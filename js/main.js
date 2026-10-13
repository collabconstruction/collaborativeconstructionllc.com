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
  const onScrollHeader = () => header && header.classList.toggle("scrolled", window.scrollY > 12);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ----------------------------------------------------------------------
     Mobile nav toggle
  ---------------------------------------------------------------------- */
  const toggle = $(".nav-toggle");
  const nav = $(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$(".nav a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open"); toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ----------------------------------------------------------------------
     Services dropdown

     CSS already opens the panel on :hover and :focus-within, so the menu
     works with this file absent. What CSS cannot do is keep aria-expanded
     honest, or let a tap toggle the panel shut again — so that part lives
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
     Subtle hero parallax
  ---------------------------------------------------------------------- */
  const heroBg = $(".hero__bg");
  if (heroBg && !prefersReduced) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) heroBg.style.transform = `scale(1.08) translateY(${y * 0.18}px)`;
    }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal
  ---------------------------------------------------------------------- */
  const revealEls = $$("[data-reveal]");
  if (revealEls.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(el => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Word-by-word heading reveal — splits a heading's text into per-word
     spans and pops them in with a short stagger as the heading scrolls
     into view, instead of just fading in as one block.
  ---------------------------------------------------------------------- */
  const wordRevealEls = $$("[data-reveal-words]");
  if (wordRevealEls.length) {
    const wrapWords = (el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.className = "rw-word";
        span.textContent = word;
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      return $$(".rw-word", el);
    };
    const wrapped = wordRevealEls.map(el => ({ el, words: wrapWords(el) }));
    if (prefersReduced || !("IntersectionObserver" in window)) {
      wrapped.forEach(({ words }) => words.forEach(w => w.classList.add("animate")));
    } else {
      const STAGGER = 45; // ms between each word popping in
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const match = wrapped.find(w => w.el === entry.target);
          if (!match) return;
          match.words.forEach((w, i) => setTimeout(() => w.classList.add("animate"), i * STAGGER));
        });
      }, { threshold: 0.3, rootMargin: "0px 0px -8% 0px" });
      wrapped.forEach(({ el }) => io.observe(el));
    }
  }

  /* ----------------------------------------------------------------------
     Value circles (About page only). Replaces the earlier hand-rolled
     OBB physics sim (rectangles that fell, collided, and settled into a
     pile) with a much simpler CSS-driven approach per user feedback that
     the physics pile looked glitchy: a fixed 5-column grid of uniform
     circles that drop into their own grid cell (via a staggered CSS
     keyframe) the first time the card scrolls into view, then bob gently
     in place. No requestAnimationFrame loop, no per-frame math — JS only
     detects "first time visible" and stamps a stagger delay per circle;
     @keyframes in css/styles.css do the rest.
  ---------------------------------------------------------------------- */
  const valuesGrid = $("#values-grid");
  if (valuesGrid) {
    const circleEls = $$(".value-circle", valuesGrid);
    if (prefersReduced || !circleEls.length) {
      // Reduced motion: CSS shows circles fully settled with no animation,
      // so there's nothing for JS to do here.
    } else {
      const STAGGER_MS = 80;
      const DROP_DURATION_MS = 650; // must match the circleDrop keyframe duration in css/styles.css
      circleEls.forEach((el, i) => {
        const dropDelay = i * STAGGER_MS;
        el.style.setProperty("--drop-delay", dropDelay + "ms");
        // The bob animation is declared alongside circleDrop from the start
        // (see css/styles.css) but given its own delay so it only starts
        // once this circle's own drop has finished — no mid-fall bobbing,
        // and no JS timer/class-swap needed to hand off between the two.
        el.style.setProperty("--bob-delay", (dropDelay + DROP_DURATION_MS) + "ms");
      });

      let hasFallen = false;
      const dropIn = () => {
        if (hasFallen) return;
        hasFallen = true;
        valuesGrid.classList.add("is-visible");
      };

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => { if (e.isIntersecting) dropIn(); });
        }, { threshold: 0.2 });
        io.observe(valuesGrid);
      } else {
        dropIn();
      }
    }
  }

  /* ----------------------------------------------------------------------
     Page transitions — smooth directional slide + gold particle shift.
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

  // Soft gold particles that drift in the travel direction during a page shift
  function emitShiftParticles(forward) {
    let layer = document.querySelector(".spark-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "spark-layer";
      document.body.appendChild(layer);
    }
    const tints = ["243,182,140", "217,83,30", "255,255,255", "232,121,58"]; // gold / amber / white
    const dirX = forward ? -1 : 1;
    for (let i = 0; i < 26; i++) {
      const d = document.createElement("span");
      d.className = "dust";
      const size = 3 + Math.random() * 5;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const c = tints[(Math.random() * tints.length) | 0];
      d.style.cssText =
        `left:${x}px; top:${y}px; width:${size}px; height:${size}px;` +
        `background:radial-gradient(circle, rgba(${c},.9), rgba(${c},0) 70%);`;
      layer.appendChild(d);
      const dx = dirX * (60 + Math.random() * 130);
      const dy = (Math.random() - 0.5) * 44;
      d.animate(
        [
          { transform: "translate(0,0) scale(.5)", opacity: 0 },
          { opacity: .55, offset: .25 },
          { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 0 }
        ],
        { duration: 520 + Math.random() * 380, easing: "cubic-bezier(.22,.61,.36,1)" }
      ).onfinish = () => d.remove();
    }
  }

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
    emitShiftParticles(forward);
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
    const onScrollTop = () => toTop.classList.toggle("show", window.scrollY > 620);
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }));
  }

  /* ----------------------------------------------------------------------
     Carousel(s) — dots, arrows, keyboard, swipe, slide counter

     These no longer advance on their own. Seven galleries on /gallery/ each
     ran a requestAnimationFrame loop forever to paint a progress bar, and up
     to four were on screen at once in the two-column grid, so the page had
     several photographs sliding independently while you tried to look at one.
     Autoplay also failed WCAG 2.2.2: pausing was bound to :hover, which a
     touch or keyboard visitor cannot do.

     Photographs of finished work are the reason someone is on this page, so
     the visitor sets the pace. Everything that let you *choose* a photo —
     arrows, dots, swipe — is kept, and arrow keys and a "3 / 6" counter are
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

    /* Built here rather than in the templates: it is a readout of state this
       script owns, so on a page where the script never ran there is no "1 / 6"
       sitting next to arrows that do nothing. aria-hidden because the dots
       and arrow labels already say which photo you are on — a screen reader
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
    const go = (i) => { idx = (i + slides.length) % slides.length; render(); };

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
     Contact form.

     Posts to the Worker at /api/contact, which stores the lead and emails it.
     The success message is only shown on a confirmed 200. If anything fails,
     the visitor is told the truth and given a direct way to reach us, so a
     real inquiry is never lost to a silent error.
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

       setFieldError does not touch submit logic — the gating conditions
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
          ? "One field still needs an answer — see the message above it."
          : "A few fields still need answers — see the messages above them.";
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
             throwing it away — so a server-side rejection showed only the
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
                 from — focusing that would take focus nowhere and leave no
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

  /* ----------------------------------------------------------------------
     Particles a generous burst of theme-colored dots when you click
     something interactive. Disabled for reduced-motion users.
  ---------------------------------------------------------------------- */
  if (!prefersReduced) {
    const sparkLayer = document.createElement("div");
    sparkLayer.className = "spark-layer";
    document.body.appendChild(sparkLayer);

    const COLORS = ["#d9531e", "#e8793a", "#f3b68c", "#2b2d31"]; // amber, gold, light gold, charcoal
    const SEL = ".btn, .nav a, .socials a, .to-top, .carousel__btn, .carousel__dots button, " +
                ".info-list a, .dropzone, .file-pill, .footer-links a, .footer-contact a, .adu-card, .brand";

    function makeDot(x, y) {
      const d = document.createElement("span");
      d.className = "spark";
      const size = 2 + Math.random() * 4;
      const c = COLORS[(Math.random() * COLORS.length) | 0];
      d.style.cssText =
        `width:${size}px;height:${size}px;left:${x}px;top:${y}px;` +
        `background:${c};box-shadow:0 0 ${5 + size}px ${c};`;
      sparkLayer.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = 22 + Math.random() * 50;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      d.animate(
        [
          { transform: "translate(-50%,-50%) scale(.3)", opacity: 0 },
          { opacity: .95, offset: .2 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 0 }
        ],
        { duration: 750 + Math.random() * 550, easing: "cubic-bezier(.22,.61,.36,1)" }
      ).onfinish = () => d.remove();
    }

    // Custom cursor removed — the site now uses the browser/OS default
    // cursor everywhere (no .cc-cursor-on class is ever added to <html>).

    // Burst only on click of an interactive element
    document.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(SEL)) return;
      const n = 28 + ((Math.random() * 8) | 0); // generous burst
      for (let i = 0; i < n; i++) makeDot(e.clientX, e.clientY);
    });

    // Dust motes — soft floating specks across the screen on fast scroll & back-to-top
    function makeDust(driftBias) {
      const d = document.createElement("span");
      d.className = "dust";
      const size = 2 + Math.random() * 5;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const tints = ["243,182,140", "217,83,30", "255,255,255", "232,121,58"]; // gold / amber / white
      const c = tints[(Math.random() * tints.length) | 0];
      d.style.cssText =
        `left:${x}px; top:${y}px; width:${size}px; height:${size}px;` +
        `background:radial-gradient(circle, rgba(${c},.95), rgba(${c},0) 70%);`;
      sparkLayer.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 72;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist + (driftBias || 0); // gentle directional drift
      d.animate(
        [
          { transform: "translate(0,0) scale(.4)", opacity: 0 },
          { opacity: .5, offset: .3 },
          { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 0 }
        ],
        { duration: 1400 + Math.random() * 1300, easing: "ease-out" }
      ).onfinish = () => d.remove();
    }

    // emit dust only past a higher scroll speed
    let wY = window.scrollY, wT = performance.now(), wThrottle = 0;
    window.addEventListener("scroll", () => {
      const now = performance.now();
      const dy = window.scrollY - wY;
      const dt = (now - wT) || 16;
      const v = Math.abs(dy) / dt;
      wY = window.scrollY; wT = now;
      if (v > 1.8 && now - wThrottle > 45) {          // appears only at higher scroll speed
        wThrottle = now;
        const bias = dy > 0 ? -24 : 24;               // drift opposite to travel
        const n = Math.min(18, 6 + ((v * 2) | 0));
        for (let i = 0; i < n; i++) makeDust(bias);
      }
    }, { passive: true });

    // sustained dust cloud while the back-to-top button flies the page up
    const topBtn = document.querySelector(".to-top");
    if (topBtn) topBtn.addEventListener("click", () => {
      let i = 0;
      const cloud = setInterval(() => {
        for (let k = 0; k < 14; k++) makeDust(24);
        if (++i > 6) clearInterval(cloud);
      }, 60);
    });

    // Motto domino effect on load
    const mottoWords = $$("#hero-motto .motto-word");
    if (mottoWords.length > 0) {
      mottoWords.forEach((word, index) => {
        setTimeout(() => {
          word.classList.add("animate");
          // Trigger a tiny particle spark from the word's center
          const rect = word.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const n = 10 + ((Math.random() * 5) | 0); // tiny burst
          for (let i = 0; i < n; i++) makeDot(cx, cy);
        }, 500 + index * 400); // Wait 500ms initially, then stagger by 400ms
      });
    }
  } else {
    // Fallback for reduced motion: just show them immediately
    const mottoWords = $$("#hero-motto .motto-word");
    mottoWords.forEach(w => { w.style.opacity = "1"; w.style.transform = "translateY(0)"; });
  }

  /* ----------------------------------------------------------------------
     Footer year
  ---------------------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------------
     Gold rule draw animation — clip-path left-to-right on scroll-in
  ---------------------------------------------------------------------- */
  if (!prefersReduced && "IntersectionObserver" in window) {
    const ruleIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-drawn"); ruleIO.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    $$(".rule").forEach(rule => {
      rule.style.clipPath = "inset(0 100% 0 0)";
      rule.style.transition = "clip-path 1s cubic-bezier(.22,.61,.36,1)";
      ruleIO.observe(rule);
    });
  }

  /* ----------------------------------------------------------------------
     3D card tilt on mousemove
  ---------------------------------------------------------------------- */
  if (!prefersReduced) {
    $$(".adu-card, .form-card, .owner-photo, .svc-grid .svc-card").forEach(card => {
      const MAX = card.classList.contains("owner-photo") ? 5 : 8;
      card.addEventListener("mouseenter", () => {
        card.style.transition = "transform .12s ease-out";
      });
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${x * MAX * 2}deg) rotateX(${-y * MAX}deg) translateZ(6px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .5s cubic-bezier(.22,.61,.36,1)";
        card.style.transform = "";
      });
    });
  }

  /* The back-to-top button used to carry a scroll-progress "clock": an inner
     circle that filled like a pie as you scrolled. Removed at the owner's
     request so the button reads as a plain, quiet arrow. This also drops a
     scroll listener that wrote an inline custom property on every scroll. */

  // Page-glow fixed layer removed — fixed blobs at % positions create visible
  // circular patches against the plain stone background on gallery/about page tops.

  /* ----------------------------------------------------------------------
     Section-level spot orbs — placed behind text/image content areas,
     NOT at edges. No overflow:hidden so they bleed softly into adjacent
     sections instead of cutting off with a hard line.
  ---------------------------------------------------------------------- */
  if (!prefersReduced) {
    // x/y = center of the glow blob within the section
    // Keep y between 25%–75% so nothing clips at section top/bottom edges
    const SPOT_TARGETS = [
      { sel: ".section.about", spots: [
        { x: "28%", y: "45%", s: 300, c: "217,83,30",   op: .22, a: "ambFloat1", d: "16s" },
        { x: "72%", y: "40%", s: 260, c: "243,182,140", op: .20, a: "ambFloat2", d: "20s" },
        { x: "50%", y: "60%", s: 240, c: "232,121,58", op: .18, a: "ambFloat3", d: "24s" },
      ]},
      // about-page-hero and gallery-intro are short header sections — page-glow
      // already covers them; section spots here create a visible lighter patch.
      { sel: ".about-page-body", spots: [
        { x: "28%", y: "40%", s: 340, c: "217,83,30",   op: .13, a: "ambFloat2", d: "17s" },
        { x: "70%", y: "52%", s: 300, c: "243,182,140", op: .12, a: "ambFloat1", d: "21s" },
        { x: "50%", y: "68%", s: 280, c: "232,121,58", op: .11, a: "ambFloat3", d: "25s" },
      ]},
      // projects: start spots at 28%+ so they don't bleed into the divider above
      { sel: ".projects", spots: [
        { x: "28%", y: "28%", s: 320, c: "217,83,30",   op: .13, a: "ambFloat2", d: "22s" },
        { x: "70%", y: "32%", s: 300, c: "243,182,140", op: .12, a: "ambFloat1", d: "26s" },
        { x: "32%", y: "55%", s: 320, c: "232,121,58", op: .12, a: "ambFloat3", d: "19s" },
        { x: "66%", y: "60%", s: 300, c: "217,83,30",   op: .13, a: "ambFloat2", d: "23s" },
        { x: "48%", y: "82%", s: 300, c: "243,182,140", op: .11, a: "ambFloat1", d: "20s" },
      ]},
      // Construction Advisory page — Owner's PM + Clerk-of-the-Works sections
      { sel: ".advisory-pm", spots: [
        { x: "26%", y: "34%", s: 320, c: "217,83,30",   op: .12, a: "ambFloat2", d: "22s" },
        { x: "72%", y: "30%", s: 300, c: "243,182,140", op: .11, a: "ambFloat1", d: "26s" },
        { x: "50%", y: "60%", s: 300, c: "232,121,58", op: .10, a: "ambFloat3", d: "20s" },
      ]},
      { sel: ".advisory-clerk", spots: [
        { x: "30%", y: "42%", s: 320, c: "217,83,30",   op: .12, a: "ambFloat1", d: "19s" },
        { x: "70%", y: "50%", s: 300, c: "243,182,140", op: .11, a: "ambFloat2", d: "23s" },
      ]},
    ];

    SPOT_TARGETS.forEach(({ sel, spots }) => {
      const section = document.querySelector(sel);
      if (!section) return;
      const pos = getComputedStyle(section).position;
      if (pos === "static") section.style.position = "relative";
      // NO overflow:hidden — lets blobs bleed softly past section borders

      spots.forEach(({ x, y, s, c, op, a, d }) => {
        const el = document.createElement("span");
        el.className = "amb-spot";
        el.style.cssText =
          `left:${x}; top:${y}; width:${s}px; height:${s}px;` +
          `background:radial-gradient(circle, rgba(${c},${op}) 0%, transparent 65%);` +
          `animation:${a} ${d} ease-in-out infinite;`;
        section.appendChild(el);
      });
    });
  }
})();
