/* Projects page: two plain arrows per project so visitors can click through the photos.
   No automatic changes and no animation beyond a short fade. No libraries.
   Without JavaScript the arrows stay hidden and each project shows its first photo. */
(function () {
  "use strict";
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  $$(".gallery-media").forEach((media) => {
    const frames = $$(".gallery-frame", media);
    const prev = media.querySelector(".gallery-arrow--prev");
    const next = media.querySelector(".gallery-arrow--next");
    const status = media.querySelector('[role="status"]');
    if (frames.length < 2 || !prev || !next) return;

    let idx = 0;
    prev.hidden = false;
    next.hidden = false;
    frames.forEach((f, i) => f.setAttribute("aria-hidden", i === 0 ? "false" : "true"));

    // Photos after the first load lazily. Start loading them when the project is near the screen,
    // so a click finds the next photo ready.
    function loadAll() {
      frames.forEach((f) => { const img = f.querySelector("img"); if (img) img.loading = "eager"; });
    }
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { loadAll(); io.disconnect(); }
      }, { rootMargin: "400px 0px" });
      io.observe(media);
    } else {
      loadAll();
    }

    function go(to) {
      to = (to + frames.length) % frames.length;
      if (to === idx) return;
      const img = frames[to].querySelector("img");
      const apply = () => {
        frames[idx].classList.remove("is-live");
        frames[idx].setAttribute("aria-hidden", "true");
        idx = to;
        frames[idx].classList.add("is-live");
        frames[idx].setAttribute("aria-hidden", "false");
        if (status) status.textContent = "Photo " + (idx + 1) + " of " + frames.length;
      };
      if (img && !(img.complete && img.naturalWidth > 0)) {
        img.loading = "eager";
        img.addEventListener("load", apply, { once: true }); // switch when the photo has arrived, never to a blank frame
      } else {
        apply();
      }
    }

    prev.addEventListener("click", () => go(idx - 1));
    next.addEventListener("click", () => go(idx + 1));
    media.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    });
  });
})();
