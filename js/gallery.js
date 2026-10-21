/* Gallery: view switching and quiet auto cycling. No libraries.
   Without JavaScript every view is shown and each slot shows its first photo. */
(function () {
  "use strict";
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tabs = $$("[data-gallery-tab]");
  const views = $$("[data-gallery-view]");
  if (!tabs.length || !views.length) return;
  const names = views.map((v) => v.dataset.galleryView);

  function show(name, push) {
    if (!names.includes(name)) name = "all";
    views.forEach((v) => { v.hidden = v.dataset.galleryView !== name; });
    tabs.forEach((t) => {
      if (t.dataset.galleryTab === name) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
    if (push) {
      try { history.replaceState(null, "", "#" + name); } catch (_) { /* ignore */ }
    }
    // Slots in hidden views are paused by the observer, so nothing else to do here.
    window.dispatchEvent(new Event("scroll"));
  }

  tabs.forEach((t) => t.addEventListener("click", (e) => {
    e.preventDefault();
    show(t.dataset.galleryTab, true);
  }));
  window.addEventListener("hashchange", () => show(location.hash.slice(1), false));
  show(location.hash.slice(1) || "all", false);

  /* Cycling. Each slot holds stacked frames; one is `is-live`. A slot only runs while it is on
     screen, in the active view and the tab is visible. Starts are staggered by data-interval. */
  if (reduced || !("IntersectionObserver" in window)) return;

  const slots = $$("[data-cycle]").map((el) => {
    const frames = $$(".gallery-frame", el);
    const dots = el.parentElement ? $$(".gallery-band__dots i", el.parentElement) : [];
    return { el, frames, dots, idx: 0, timer: null, visible: false, interval: Number(el.dataset.interval) || 6000 };
  }).filter((s) => s.frames.length > 1);

  function step(s) {
    s.frames[s.idx].classList.remove("is-live");
    if (s.dots[s.idx]) s.dots[s.idx].classList.remove("is-live");
    s.idx = (s.idx + 1) % s.frames.length;
    s.frames[s.idx].classList.add("is-live");
    if (s.dots[s.idx]) s.dots[s.idx].classList.add("is-live");
  }
  function inActiveView(s) { const v = s.el.closest("[data-gallery-view]"); return !v || !v.hidden; }
  function sync(s) {
    const run = s.visible && !document.hidden && inActiveView(s);
    if (run && !s.timer) s.timer = setInterval(() => step(s), s.interval);
    else if (!run && s.timer) { clearInterval(s.timer); s.timer = null; }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const s = slots.find((x) => x.el === en.target);
      if (!s) return;
      s.visible = en.isIntersecting;
      sync(s);
    });
  }, { threshold: 0.25 });
  slots.forEach((s) => io.observe(s.el));
  document.addEventListener("visibilitychange", () => slots.forEach(sync));
  window.addEventListener("hashchange", () => setTimeout(() => slots.forEach(sync), 0));
  tabs.forEach((t) => t.addEventListener("click", () => setTimeout(() => slots.forEach(sync), 0)));
})();
