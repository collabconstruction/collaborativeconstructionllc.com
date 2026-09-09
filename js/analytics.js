/* ==========================================================================
   analytics.js  -  business events and consent

   Loaded on every page, but almost entirely inert unless src/_data/analytics.json
   has a GA4 measurement id. base.njk only defines window.__CC_ANALYTICS when a
   measurement id exists, so with the default null config this file installs two
   cheap listeners, finds no gtag, and does nothing else. No cookies, no banner,
   no network requests, no console noise.

   What it tracks and why:
     click_to_call   a tel: tap. For a contractor this is usually a MORE
                     valuable signal than the form, because most homeowners
                     just call. Not tracking it means undercounting the site's
                     actual output.
     click_to_email  a mailto: tap.
     form_start      first focus of any contact-form field. Paired with
                     generate_lead this yields a form completion rate, which is
                     the number that tells you whether the form itself is the
                     problem or whether nobody is reaching it.

   generate_lead is deliberately NOT here. It lives in js/main.js because it
   must fire only after the server returns a confirmed 200. Firing it on submit
   would count failed submissions as conversions, which quietly corrupts every
   downstream conversion-rate figure.

   Consent: GA4 sets cookies, so Consent Mode v2 is set to denied for everything
   in base.njk BEFORE gtag('config') runs. Nothing is written until the visitor
   accepts. Cloudflare Web Analytics is cookieless and is not gated on any of
   this.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.__CC_ANALYTICS;
  if (!CFG) return; // GA4 not configured: stay completely inert.

  var STORAGE_KEY = "cc-consent";

  /* ---------------------------------------------------------------------
     Event helper. Queues nothing: if gtag is missing or consent is denied,
     GA4 itself buffers or discards. We never invent our own queue, because a
     queue that outlives a denied-consent decision is exactly how a "privacy
     friendly" setup ends up sending data it promised not to.
     ------------------------------------------------------------------- */
  function track(name, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  }

  /* ---------------------------------------------------------------------
     Outbound intent. One delegated listener on the document rather than a
     listener per link, so links added later (or rendered by a future
     template) are covered without anyone remembering to wire them up.

     pointerdown, not click: on mobile the browser may begin handing off to
     the dialer before a click event ever lands, so click under-reports.
     ------------------------------------------------------------------- */
  document.addEventListener(
    "pointerdown",
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
        if (e.target.name === "company_website") return;
        started = true;
        track("form_start", { form_location: location.pathname });
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
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  // Re-apply a previously granted choice on every subsequent page load.
  var prior = readChoice();
  if (prior === "granted") grant();

  if (prior) return; // Already decided. No banner.

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
