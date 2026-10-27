/* Projects page: click a photo to zoom in. One shared overlay, built once and
   reused for every project. Keyboard: Enter/Space opens, Escape closes, Left/
   Right move between a project's own photos. Closing always returns focus to
   whichever photo opened the viewer. Without JavaScript nothing changes: the
   photos are plain images with no affordance to click. */
(function () {
  "use strict";
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // .gallery-slot (not .gallery-media) is the click/keyboard target: it wraps only the
  // photo frames, not the prev/next <button> arrows, which are siblings inside
  // .gallery-media. Keeping the zoom affordance off the arrows' ancestor avoids nesting
  // real buttons inside a role="button" element and keeps a sane tab order.
  const slotEls = $$(".gallery-slot");
  if (!slotEls.length) return;

  let overlay, dialogImg, statusEl, prevBtn, nextBtn, closeBtn;
  let activeFrames = [];
  let activeIdx = 0;
  let openedFrom = null;

  function build() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="lightbox__backdrop"></div>' +
      '<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="Photo viewer">' +
        '<button type="button" class="lightbox__close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo" hidden>' +
          '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<img class="lightbox__img" alt="">' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next photo" hidden>' +
          '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="m9 4 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<p class="lightbox__status visually-hidden" role="status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(overlay);

    dialogImg = overlay.querySelector(".lightbox__img");
    statusEl = overlay.querySelector(".lightbox__status");
    prevBtn = overlay.querySelector(".lightbox__nav--prev");
    nextBtn = overlay.querySelector(".lightbox__nav--next");
    closeBtn = overlay.querySelector(".lightbox__close");

    overlay.querySelector(".lightbox__backdrop").addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", () => show(activeIdx - 1));
    nextBtn.addEventListener("click", () => show(activeIdx + 1));
    overlay.addEventListener("keydown", onKeydown);
  }

  function frameImgSrc(frame) {
    const img = frame.querySelector("img");
    return img ? { src: img.src, alt: img.alt } : null;
  }

  function show(idx) {
    if (!activeFrames.length) return;
    activeIdx = (idx + activeFrames.length) % activeFrames.length;
    const data = frameImgSrc(activeFrames[activeIdx]);
    if (!data) return;
    dialogImg.src = data.src;
    dialogImg.alt = data.alt;
    if (statusEl) statusEl.textContent = "Photo " + (activeIdx + 1) + " of " + activeFrames.length;
    const multi = activeFrames.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  }

  function open(slot, startIdx) {
    build();
    activeFrames = $$(".gallery-frame", slot);
    if (!activeFrames.length) return;
    openedFrom = slot;
    overlay.hidden = false;
    document.documentElement.classList.add("lightbox-open");
    show(startIdx);
    closeBtn.focus();
    document.addEventListener("keydown", onDocKeydown, true);
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.classList.remove("lightbox-open");
    document.removeEventListener("keydown", onDocKeydown, true);
    if (openedFrom && typeof openedFrom.focus === "function") openedFrom.focus();
    openedFrom = null;
  }

  function onKeydown(e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(activeIdx - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(activeIdx + 1); }
  }

  // Escape must work even when focus is on a child the overlay listener won't catch
  // consistently across browsers, so it is also bound at the document level while open.
  function onDocKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") trapFocus(e);
  }

  function trapFocus(e) {
    const focusable = $$('button, [href], [tabindex]:not([tabindex="-1"])', overlay).filter((el) => !el.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  slotEls.forEach((slot) => {
    slot.classList.add("gallery-slot--zoomable");
    slot.setAttribute("role", "button");
    slot.setAttribute("tabindex", "0");
    slot.setAttribute("aria-label", "View photo full size");

    function liveIdx() {
      return Math.max(0, $$(".gallery-frame", slot).findIndex((f) => f.classList.contains("is-live")));
    }

    slot.addEventListener("click", () => open(slot, liveIdx()));

    slot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(slot, liveIdx());
      }
    });
  });
})();
