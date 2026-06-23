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
     Page transitions (woosh veil on leave + fade entrance via CSS)
  ---------------------------------------------------------------------- */
  const veil = document.createElement("div");
  veil.className = "page-veil";
  document.body.appendChild(veil);

  const isInternal = (a) => {
    const href = a.getAttribute("href") || "";
    if (a.target === "_blank" || a.hasAttribute("download")) return false;
    if (/^(mailto:|tel:|#)/.test(href)) return false;
    if (/^https?:\/\//i.test(href) && a.host !== location.host) return false;
    return /\.html(\?|#|$)/.test(href) || href === "/" || href.startsWith("./");
  };

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !isInternal(a)) return;
    const dest = a.href;
    if (dest === location.href) return;
    if (prefersReduced) return; // let it navigate normally
    e.preventDefault();
    // gradual cross-fade: dim & lift current page while the veil eases in, then go
    document.body.classList.add("is-leaving");
    veil.classList.add("show");
    setTimeout(() => { window.location.href = dest; }, 560);
  });
  // restore on bfcache back-navigation
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { veil.classList.remove("show"); document.body.classList.remove("is-leaving"); }
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

  /* ----------------------------------------------------------------------
     Contact form file count indicator + submit
     To enable real delivery (incl. attachments): create a free access key at
     https://web3forms.com (uses wes@collaborativeconstructionllc.com) and paste
     it into ACCESS_KEY below. Until then, the button opens the visitor's email
     app pre-filled (mailto cannot carry file attachments).
  ---------------------------------------------------------------------- */
  const ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"; // <-- replace to enable server-side delivery
  const form = $("#contact-form");
  if (form) {
    const fileInput = $("#cc-files", form);
    const pill   = $(".file-pill", form);
    const pillN  = $(".file-pill .count", form);
    const listEl = $(".file-list", form);
    const drop   = $(".dropzone", form);
    const status = $(".form-status", form);
    let store = new DataTransfer(); // authoritative file set

    function human(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
      return (bytes / 1048576).toFixed(1) + " MB";
    }
    function syncFiles() {
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
    }
    function addFiles(fileList) {
      Array.from(fileList).forEach(f => store.items.add(f));
      syncFiles();
    }

    fileInput.addEventListener("change", () => addFiles(fileInput.files));
    drop.addEventListener("click", () => fileInput.click());
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
    ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if (!name || !email || !message) {
        status.classList.add("err"); status.textContent = "Please fill in your name, email, and message.";
        return;
      }

      // No access key yet -> graceful mailto fallback
      if (!ACCESS_KEY || ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
        const n = store.files.length;
        const body =
          `Name: ${name}\nEmail: ${email}\n\n${message}` +
          (n ? `\n\n(${n} file${n > 1 ? "s" : ""} selected please attach them to this email before sending.)` : "");
        window.location.href =
          `mailto:wes@collaborativeconstructionllc.com?subject=${encodeURIComponent("Website inquiry from " + name)}&body=${encodeURIComponent(body)}`;
        status.classList.add("ok");
        status.textContent = "Opening your email app… attach any files there, then hit send.";
        return;
      }

      // Real submission via Web3Forms (supports attachments)
      const btn = $("button[type=submit]", form);
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const fd = new FormData(form);
        fd.append("access_key", ACCESS_KEY);
        fd.append("subject", "Website inquiry from " + name);
        fd.append("from_name", "Collaborative Construction Website");
        Array.from(store.files).forEach((f, i) => fd.append("attachment_" + (i + 1), f, f.name));
        const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
          status.classList.add("ok");
          status.textContent = "Thank you! Your message has been sent we'll be in touch shortly.";
          form.reset(); store = new DataTransfer(); syncFiles();
        } else {
          throw new Error(data.message || "Submission failed");
        }
      } catch (err) {
        status.classList.add("err");
        status.textContent = "Sorry, something went wrong. Please email wes@collaborativeconstructionllc.com directly.";
      } finally {
        btn.disabled = false; btn.textContent = original;
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
})();
