/* Session-only inquiry context: no query strings, customer data or GA identifiers. */
(function () {
  "use strict";
  const KEY = "cc-intake-context-v1";
  const TTL = 30 * 60 * 1000;
  const pages = new Set(["/", "/about/", "/gallery/", "/construction-advisory/", "/general-contractor-falmouth-ma/", "/home-additions-cape-cod/", "/adu-builder-cape-cod/", "/home-renovation-cape-cod/", "/custom-home-builder-cape-cod/"]);
  const types = new Set(["general_contracting", "addition", "adu", "renovation", "custom_home", "advisory", "other"]);
  function path(value) {
    try {
      let p = new URL(value, location.origin).pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
      if (!p.endsWith("/")) p += "/";
      return pages.has(p) ? p : "/";
    } catch (_) { return "/"; }
  }
  function campaign(value) { return /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value || "") ? value : ""; }
  function origin(value) { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.origin : ""; } catch (_) { return ""; } }
  let saved;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch (_) {}
  const valid = saved && Number.isFinite(saved.at) && Date.now() - saved.at >= 0 && Date.now() - saved.at < TTL;
  const qs = new URLSearchParams(location.search);
  const context = {
    at: valid ? saved.at : Date.now(),
    first_landing_page: valid ? path(saved.first_landing_page) : path(location.pathname),
    source_page: path(location.pathname),
    referrer: valid ? origin(saved.referrer) : origin(document.referrer),
    project_type: valid && types.has(saved.project_type) ? saved.project_type : ""
  };
  ["utm_source", "utm_medium", "utm_campaign"].forEach(k => { context[k] = campaign(valid ? saved[k] : qs.get(k)); });
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(context)); } catch (_) {} }
  // Keep the service-page CTA as the source while navigating to the contact section.
  if (valid && location.hash === "#contact") context.source_page = path(saved.source_page);
  save();
  window.ccIntakeContext = {
    currentPage: () => path(location.pathname),
    get: () => ({ ...context }),
    select: (type) => { if (types.has(type)) { context.project_type = type; context.source_page = path(location.pathname); save(); } }
  };
  document.addEventListener("click", e => {
    const link = e.target.closest && e.target.closest("a[data-project-type]");
    if (!link) return;
    window.ccIntakeContext.select(link.dataset.projectType);
    const field = document.getElementById("cc-project-type");
    if (field) { field.value = context.project_type; field.dispatchEvent(new Event("change", { bubbles: true })); }
  });
})();
