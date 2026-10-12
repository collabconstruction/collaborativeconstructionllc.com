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
