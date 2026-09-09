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
    }));
  }

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
     Page transitions — smooth directional slide + gold particle shift.
     No color veil; the fixed background stays put so nothing flashes.
     Direction tracks the site's nav order (moving left / right).
  ---------------------------------------------------------------------- */
  /* Links are extensionless ("/about"), because Cloudflare serves them that
     way and 307-redirects the ".html" form. The ".html" handling below is
     kept so any old bookmark or stray link still animates correctly. */
  const NAV_ORDER = ["", "gallery", "construction-advisory", "about"];

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
    const tints = ["232,214,163", "205,141,5", "255,255,255", "204,184,121"]; // gold / amber / white
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
     Carousel(s) auto-advance, dots, arrows, progress, swipe, pause-on-hover
  ---------------------------------------------------------------------- */
  $$(".carousel").forEach((root) => {
    const track  = $(".carousel__track", root);
    const slides = $$(".carousel__slide", root);
    const dotsWrap = $(".carousel__dots", root);
    const bar    = $(".carousel__bar", root);
    const prev   = $(".carousel__btn.prev", root);
    const next   = $(".carousel__btn.next", root);
    if (slides.length <= 1) { if (prev) prev.style.display = "none"; if (next) next.style.display = "none"; }

    let idx = 0;
    const INTERVAL = parseInt(root.dataset.interval || "5000", 10);
    let timer = null, barRAF = null, barStart = 0, paused = false;

    // dots
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", () => go(i, true));
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });

    function render() {
      track.style.transform = `translateX(${-idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    }
    function go(i, user) {
      idx = (i + slides.length) % slides.length;
      render();
      if (user) restart();
    }
    const nextSlide = () => go(idx + 1);
    const prevSlide = () => go(idx - 1);

    next && next.addEventListener("click", () => go(idx + 1, true));
    prev && prev.addEventListener("click", () => go(idx - 1, true));

    // progress bar animation
    function animateBar(ts) {
      if (!barStart) barStart = ts;
      const p = Math.min((ts - barStart) / INTERVAL, 1);
      if (bar) bar.style.width = (p * 100) + "%";
      if (p >= 1) { barStart = 0; nextSlide(); }
      barRAF = requestAnimationFrame(animateBar);
    }
    function start() {
      if (prefersReduced || slides.length <= 1 || paused) return;
      stop(); barStart = 0; barRAF = requestAnimationFrame(animateBar);
    }
    function stop() {
      if (barRAF) cancelAnimationFrame(barRAF);
      barRAF = null; if (bar) bar.style.width = "0%";
    }
    function restart() { stop(); start(); }

    // pause on hover / when offscreen
    root.addEventListener("mouseenter", () => { paused = true; stop(); });
    root.addEventListener("mouseleave", () => { paused = false; start(); });
    document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => {
        ents.forEach(en => { paused = !en.isIntersecting; en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.25 }).observe(root);
    }

    // swipe
    let sx = 0, dx = 0, dragging = false;
    track.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; dragging = true; stop(); }, { passive: true });
    track.addEventListener("touchmove",  (e) => { if (dragging) dx = e.touches[0].clientX - sx; }, { passive: true });
    track.addEventListener("touchend",   () => {
      if (Math.abs(dx) > 45) (dx < 0 ? nextSlide() : prevSlide());
      dx = 0; dragging = false; start();
    });

    render();
    start();
  });

  function ensureModalAnimations() {
    if (document.getElementById("modal-animations")) return;
    const style = document.createElement("style");
    style.id = "modal-animations";
    style.textContent = `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  function showFormModal(title, message, buttonColor) {
    ensureModalAnimations();
    const modal = document.createElement("div");
    modal.className = "form-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${title}</h2>
        <p>${message}</p>
        <button type="button" class="modal-close">Close</button>
      </div>
    `;
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;
      z-index: 10000; animation: fadeIn 0.3s ease;
    `;
    const content = modal.querySelector(".modal-content");
    content.style.cssText = `
      background: white; padding: 2rem; border-radius: 8px; max-width: 420px;
      text-align: center; animation: slideUp 0.3s ease;
    `;
    const closeBtn = modal.querySelector(".modal-close");
    closeBtn.style.cssText = `
      margin-top: 1rem; padding: 0.5rem 1.5rem; background: ${buttonColor};
      color: white; border: none; border-radius: 4px; cursor: pointer;
    `;
    closeBtn.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

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
    const fileInput = $("#cc-files", form);
    const pill   = $(".file-pill", form);
    const pillN  = $(".file-pill .count", form);
    const listEl = $(".file-list", form);
    const drop   = $(".dropzone", form);
    const status = $(".form-status", form);

    /* -- optional attachment UI (only present when storage is enabled) ---- */
    let store = new DataTransfer(); // authoritative file set

    if (fileInput && drop && pill && pillN && listEl) {
      const human = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
      };
      var syncFiles = function () {
        fileInput.files = store.files;
        const n = store.files.length;
        pill.hidden = n === 0;
        pillN.textContent = n;
        listEl.innerHTML = "";
        Array.from(store.files).forEach((f, i) => {
          const li = document.createElement("li");
          const name = document.createElement("span");
          name.textContent = f.name + "  ·  " + human(f.size);
          const rm = document.createElement("button");
          rm.type = "button"; rm.textContent = "Remove"; rm.setAttribute("aria-label", "Remove " + f.name);
          rm.addEventListener("click", () => {
            const dt = new DataTransfer();
            Array.from(store.files).forEach((file, j) => { if (j !== i) dt.items.add(file); });
            store = dt; syncFiles();
          });
          li.append(name, rm); listEl.appendChild(li);
        });
      };
      const addFiles = (fileList) => {
        Array.from(fileList).forEach(f => store.items.add(f));
        syncFiles();
      };

      fileInput.addEventListener("change", () => addFiles(fileInput.files));
      drop.addEventListener("click", () => fileInput.click());
      drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
      ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
      ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
      drop.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
    }

    /* -- attribution ------------------------------------------------------
       Captured at submit time so every lead row can be traced back to the
       page, referrer, and campaign that produced it. This is what makes
       conversion rate answerable per channel instead of per site.
    --------------------------------------------------------------------- */
    function attribution() {
      const qs = new URLSearchParams(location.search);
      let gaClientId = "";
      try {
        // GA4 stores the client id in the _ga cookie as GA1.1.<id>.<ts>
        const m = document.cookie.match(/(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/);
        if (m) gaClientId = m[1];
      } catch (_) {}
      return {
        source_page: location.pathname + location.search,
        referrer: document.referrer || "",
        utm_source: qs.get("utm_source") || "",
        utm_medium: qs.get("utm_medium") || "",
        utm_campaign: qs.get("utm_campaign") || "",
        ga_client_id: gaClientId,
      };
    }

    const FALLBACK_HTML =
      'Please email <a href="mailto:collaborativeconstructiongc@gmail.com">collaborativeconstructiongc@gmail.com</a> ' +
      'or call <a href="tel:+15084406981">(508) 440-6981</a>.';

    let sending = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;

      status.className = "form-status";
      status.textContent = "";

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        status.classList.add("err");
        status.textContent = "Please fill in your name, email, and message.";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        status.classList.add("err");
        status.textContent = "That email address does not look right.";
        form.email.focus();
        return;
      }

      const btn = $("button[type=submit]", form);
      const original = btn.textContent;
      sending = true;
      btn.disabled = true;
      btn.textContent = "Sending…";

      const payload = new FormData(form);
      Object.entries(attribution()).forEach(([k, v]) => payload.set(k, v));
      // FormData picks up the live input, which we keep in sync with `store`.

      try {
        const res = await fetch("/api/contact", { method: "POST", body: payload });
        let data = {};
        try { data = await res.json(); } catch (_) {}

        if (res.ok && data.ok) {
          form.reset();
          store = new DataTransfer();
          if (typeof syncFiles === "function") syncFiles();
          if (window.turnstile) window.turnstile.reset();

          showFormModal(
            "Thank You!",
            "Your message has been received. We'll be in touch shortly.",
            "#cd8d05"
          );

          // Only fire the conversion once the server has confirmed the lead.
          if (typeof window.gtag === "function") {
            window.gtag("event", "generate_lead", {
              lead_id: data.id || "",
              form_location: location.pathname,
            });
          }
        } else {
          status.classList.add("err");
          status.innerHTML =
            (data.error || "We could not send your message just now.") + " " + FALLBACK_HTML;
          if (window.turnstile) window.turnstile.reset();
        }
      } catch (err) {
        status.classList.add("err");
        status.innerHTML =
          "We could not reach the server. Please check your connection and try again. " + FALLBACK_HTML;
      } finally {
        sending = false;
        btn.disabled = false;
        btn.textContent = original;
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

    const COLORS = ["#cd8d05", "#ccb879", "#e8d6a3", "#9c2b22"]; // amber, gold, light gold, maroon
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
      const tints = ["232,214,163", "205,141,5", "255,255,255", "204,184,121"]; // gold / amber / white
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
        { x: "28%", y: "45%", s: 300, c: "205,141,5",   op: .22, a: "ambFloat1", d: "16s" },
        { x: "72%", y: "40%", s: 260, c: "232,214,163", op: .20, a: "ambFloat2", d: "20s" },
        { x: "50%", y: "60%", s: 240, c: "204,184,121", op: .18, a: "ambFloat3", d: "24s" },
      ]},
      // about-page-hero and gallery-intro are short header sections — page-glow
      // already covers them; section spots here create a visible lighter patch.
      { sel: ".about-page-body", spots: [
        { x: "28%", y: "40%", s: 340, c: "205,141,5",   op: .13, a: "ambFloat2", d: "17s" },
        { x: "70%", y: "52%", s: 300, c: "232,214,163", op: .12, a: "ambFloat1", d: "21s" },
        { x: "50%", y: "68%", s: 280, c: "204,184,121", op: .11, a: "ambFloat3", d: "25s" },
      ]},
      // projects: start spots at 28%+ so they don't bleed into the divider above
      { sel: ".projects", spots: [
        { x: "28%", y: "28%", s: 320, c: "205,141,5",   op: .13, a: "ambFloat2", d: "22s" },
        { x: "70%", y: "32%", s: 300, c: "232,214,163", op: .12, a: "ambFloat1", d: "26s" },
        { x: "32%", y: "55%", s: 320, c: "204,184,121", op: .12, a: "ambFloat3", d: "19s" },
        { x: "66%", y: "60%", s: 300, c: "205,141,5",   op: .13, a: "ambFloat2", d: "23s" },
        { x: "48%", y: "82%", s: 300, c: "232,214,163", op: .11, a: "ambFloat1", d: "20s" },
      ]},
      // Construction Advisory page — Owner's PM + Clerk-of-the-Works sections
      { sel: ".advisory-pm", spots: [
        { x: "26%", y: "34%", s: 320, c: "205,141,5",   op: .12, a: "ambFloat2", d: "22s" },
        { x: "72%", y: "30%", s: 300, c: "232,214,163", op: .11, a: "ambFloat1", d: "26s" },
        { x: "50%", y: "60%", s: 300, c: "204,184,121", op: .10, a: "ambFloat3", d: "20s" },
      ]},
      { sel: ".advisory-clerk", spots: [
        { x: "30%", y: "42%", s: 320, c: "205,141,5",   op: .12, a: "ambFloat1", d: "19s" },
        { x: "70%", y: "50%", s: 300, c: "232,214,163", op: .11, a: "ambFloat2", d: "23s" },
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
