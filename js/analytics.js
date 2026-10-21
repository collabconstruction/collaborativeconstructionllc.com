/* Consent-gated GA: no loader, queued events, customer fields or lead IDs before consent. */
(function () {
  "use strict";

  var CFG = window.__CC_ANALYTICS;
  if (!CFG) return; // GA4 not configured: stay completely inert.

  // Keep previews and development visits out of the production property.
  if (!["collaborativeconstructionllc.com", "www.collaborativeconstructionllc.com"].includes(location.hostname)) {
    window.ccTrack = function () { return false; };
    return;
  }

  var STORAGE_KEY = "cc-consent";
  var granted = false;
  var loaded = false;

  /* ---------------------------------------------------------------------
     Event helper. Queues nothing: if gtag is missing or consent is denied,
     GA4 itself buffers or discards. We never invent our own queue, because a
     queue that outlives a denied-consent decision is exactly how a "privacy
     friendly" setup ends up sending data it promised not to.
     ------------------------------------------------------------------- */
  function track(name, params) {
    if (!granted || typeof window.gtag !== "function") return false;
    if (!["click_to_call", "click_to_email", "form_start", "generate_lead"].includes(name)) return false;
    // Accept only the site's fixed path; never copy arbitrary event parameters.
    var page = window.ccIntakeContext ? window.ccIntakeContext.currentPage() : "/";
    window.gtag("event", name, { form_location: page });
    return true;
  }
  window.ccTrack = track;

  /* ---------------------------------------------------------------------
     Outbound intent. One delegated listener on the document rather than a
     listener per link, so links added later (or rendered by a future
     template) are covered without anyone remembering to wire them up.

     pointerdown, not click: on mobile the browser may begin handing off to
     the dialer before a click event ever lands, so click under-reports.
     ------------------------------------------------------------------- */
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (href.indexOf("tel:") === 0) {
        track("click_to_call", {
          phone_number: href.slice(4),
          link_location: location.pathname,
        });
      } else {
        track("click_to_email", {
          link_location: location.pathname,
        });
      }
    },
    true // capture: fires even if something downstream stops propagation
  );

  /* ---------------------------------------------------------------------
     form_start. Fires once per page load, on the first focus of any field in
     the contact form. "Once" matters: a visitor tabbing through five fields
     is one form start, not five, and counting it five times would make the
     completion rate look five times worse than it is.
     ------------------------------------------------------------------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var started = false;
    form.addEventListener(
      "focusin",
      function (e) {
        if (started) return;
        if (!e.target.matches("input, textarea, select")) return;
        // The honeypot is invisible to people. If it is focused, that is a bot,
        // and counting it would inflate form starts with traffic that will
        // never convert.
        if (e.target.name === "cc_x7q2m9") return;
        started = track("form_start");
      },
      true
    );
  }

  /* ---------------------------------------------------------------------
     Consent banner.

     Shown only when GA4 is configured and the visitor has not already chosen.
     The choice is stored in localStorage, so it survives across pages and
     visits; storage is wrapped in try/catch because Safari private mode throws
     on access rather than returning null, and an exception here would take the
     rest of this file down with it.
     ------------------------------------------------------------------- */
  function readChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }
  function writeChoice(v) {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch (err) {
      /* Storage unavailable. The banner will reappear next page, which is the
         correct failure: re-asking is better than assuming consent. */
    }
  }

  function grant() {
    granted = true;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("js", new Date());
    window.gtag("config", CFG.measurementId, {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + (window.ccIntakeContext ? window.ccIntakeContext.currentPage() : "/"),
      page_referrer: ""
    });
    window.gtag("event", "page_view");
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.measurementId);
    document.head.appendChild(script);
  }

  // Re-apply a previously granted choice on every subsequent page load.
  var prior = readChoice();
  if (prior === "granted") grant();

  if (prior === "granted" || prior === "denied") return; // Already decided. No banner.

  var banner = document.createElement("div");
  banner.className = "consent-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-label", "Cookie notice");

  var msg = document.createElement("p");
  msg.textContent = CFG.consent.message;

  var actions = document.createElement("div");
  actions.className = "consent-banner__actions";

  var decline = document.createElement("button");
  decline.type = "button";
  decline.className = "btn btn-ghost";
  decline.textContent = CFG.consent.decline;

  var accept = document.createElement("button");
  accept.type = "button";
  accept.className = "btn btn-primary";
  accept.textContent = CFG.consent.accept;

  function close() {
    banner.classList.remove("is-in");
    // Let the back-to-top button drop back to its normal position in step with
    // the banner sliding out.
    document.documentElement.classList.remove("has-consent-banner");
    setTimeout(function () {
      banner.remove();
    }, 300);
  }

  accept.addEventListener("click", function () {
    writeChoice("granted");
    grant();
    close();
  });

  decline.addEventListener("click", function () {
    writeChoice("denied");
    // No consent update needed: the default set in base.njk is already denied.
    close();
  });

  actions.appendChild(decline);
  actions.appendChild(accept);
  banner.appendChild(msg);
  banner.appendChild(actions);

  function mount() {
    document.body.appendChild(banner);
    document.documentElement.classList.add("has-consent-banner");
    // The banner wraps to two or three lines on narrow screens, so the
    // back-to-top button cannot clear it with a fixed offset.
    document.documentElement.style.setProperty(
      "--consent-h",
      banner.getBoundingClientRect().height + "px"
    );
    // Next frame, so the transition has an initial state to animate from.
    requestAnimationFrame(function () {
      banner.classList.add("is-in");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
