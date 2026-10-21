/* Loaded before the async Turnstile API so callbacks cannot race registration. */
(() => {
  const widget = "#cc-turnstile";
  let token = null, issuedAt = 0;
  const invalidate = () => { token = null; issuedAt = 0; };
  const notice = text => {
    const status = document.getElementById("challenge-status");
    if (status) status.textContent = text;
  };
  window.ccChallengeSuccess = value => {
    token = typeof value === "string" && value ? value : null;
    issuedAt = Date.now();
    notice(token ? "Verification complete. You can send your inquiry." : "Please complete verification before sending.");
  };
  window.ccChallengeExpired = () => {
    invalidate(); notice("Verification expired. Please complete the refreshed verification before sending. Your entries are preserved.");
  };
  window.ccChallengeTimeout = () => {
    invalidate(); notice("Verification timed out. Please complete the refreshed verification before sending. Your entries are preserved.");
  };
  window.ccChallengeError = () => {
    invalidate(); notice("Verification is unavailable. Please wait for it to recover, or use our phone or email. Your entries are preserved.");
  };
  /* ----------------------------------------------------------------------
     Deferred loading of the Turnstile API.

     api.js pulls a three-deep chain of third-party requests totalling ~140KB,
     and the form sits at the foot of a long homepage. Loading it during the
     initial navigation spent a fifth of the page's bandwidth budget on a
     widget most visitors never scroll to.

     This injects it on the first signal that someone is heading for the form.
     Implicit rendering is untouched: api.js still scans for `.cf-turnstile`
     when it loads, so every `data-*-callback` on the widget keeps working
     exactly as before, just later. The failure mode is unchanged too: no token
     means `take()` returns false and the submission is refused.
  ---------------------------------------------------------------------- */
  const loadApi = (() => {
    let requested = false;
    return () => {
      if (requested) return;
      requested = true;
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    };
  })();

  const wireTriggers = () => {
    const el = document.querySelector(widget);
    if (!el) return;
    const form = el.closest("form");

    // Someone linked straight to the form, or the browser cannot tell us when
    // it approaches: render now, exactly as the old markup always did.
    if (location.hash === "#contact" || !("IntersectionObserver" in window)) {
      loadApi();
      return;
    }

    // Touching any field is the strongest signal there is, and it covers the
    // keyboard user who tabs in from above without ever scrolling.
    if (form) {
      form.addEventListener("focusin", loadApi, { once: true });
      form.addEventListener("input", loadApi, { once: true });
    }

    // The hero's primary CTA is href="#contact". That jump skips the scroll
    // the observer would otherwise have seen.
    document.querySelectorAll('a[href$="#contact"]').forEach((a) => {
      a.addEventListener("click", loadApi, { once: true });
    });

    // 600px of lead time, so the widget has rendered and is solvable by the
    // time the form is actually on screen.
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadApi();
        obs.disconnect();
      }
    }, { rootMargin: "600px" }).observe(el.closest("section") || form || el);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireTriggers);
  } else {
    wireTriggers();
  }

  window.ccChallenge = {
    take(value) {
      // Leave a one-minute margin for transit. Check age at submission even if a
      // sleeping/background tab missed the expiry callback. Never reuse a token.
      const age = Date.now() - issuedAt;
      let ready = false;
      try {
        ready = !!token && value === token && age >= 0 && age < 240000 && !window.turnstile.isExpired(widget);
      } catch (_) {}
      invalidate();
      return ready;
    },
    reset() {
      invalidate();
      try { window.turnstile.reset(widget); } catch (_) {}
    },
  };
})();
