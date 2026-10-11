/* ---------------------------------------------------------------------------
   collaborativeconstructionllc.com

   Static assets are served by the ASSETS binding. The only dynamic route is
   POST /api/contact, which captures a lead.

   Design rule: persist the lead BEFORE attempting to send email. Email
   transport is the flaky part; the database write is not. A lead that is
   stored but not emailed is recoverable. A lead that is emailed but not
   stored is invisible the moment the inbox is cleaned out.

   The endpoint never reports success unless the lead is durably captured.
--------------------------------------------------------------------------- */

import { EmailMessage } from "cloudflare:email";

const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;   // 10 MB per file
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;  // 25 MB per submission
const MAX_MESSAGE_CHARS = 5000;

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "application/pdf",
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirect .html URLs to clean canonical URLs (only for pages, not assets)
    if (url.pathname.endsWith('.html') && !url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/css/') && !url.pathname.startsWith('/js/')) {
      const cleanPath = url.pathname.slice(0, -5);
      return Response.redirect(`${url.origin}${cleanPath}${url.search}`, 301);
    }

    // Redirect www to non-www
    if (url.hostname.startsWith('www.')) {
      const nonWww = url.hostname.replace('www.', '');
      return Response.redirect(`${url.protocol}//${nonWww}${url.pathname}${url.search}`, 301);
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405, { Allow: "POST" });
      }
      try {
        return await handleContact(request, env, ctx);
      } catch {
        console.error("intake-unexpected-error");
        return json({ ok: false, error: "We could not confirm your inquiry was saved. Please retry or call us." }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

/* ------------------------------------------------------------------ utils */

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

const isEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Escape anything interpolated into the notification HTML.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function safeExt(filename) {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(filename || "");
  return m ? "." + m[1].toLowerCase() : "";
}

/* ---------------------------------------------------------------- turnstile */

async function verifyTurnstile(token, ip, secret, hostname) {
  if (!secret || !token || token.length > 2048) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return res.ok && data.success === true && data.hostname === hostname && data.action === "contact";
  } catch { return false; }
}

/* -------------------------------------------------------------------- email */

// RFC 2047 encoding, so names and subjects with accents survive the trip.
function encodeHeader(value) {
  value = value.replace(/[\r\n]/g, " ");
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

function buildMime({ from, to, replyTo, subject, html }) {
  const boundary = `b${crypto.randomUUID().replace(/-/g, "")}`;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h2|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return [
    `From: ${from}`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@collaborativeconstructionllc.com>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].filter((l) => l !== null).join("\r\n");
}

async function sendNotification(env, lead, attachments, failedUploads = []) {
  const to = env.LEAD_INBOX;
  const from = env.LEAD_FROM_ADDRESS;

  if (!to || !from) return { sent: false, error: "email-not-configured" };

  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "(not provided)"],
    ["Project type", lead.project_type || "(not provided)"],
    ["Town", lead.project_town || "(not provided)"],
    ["Responder", "Wesleigh Behn — review the private queue and record next action"],
    ["Page", lead.source_page || "(unknown)"],
    ["Referrer", lead.referrer || "(direct)"],
    ["Campaign",
      [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") || "(none)"],
  ]
    .map(([k, v]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`)
    .join("");

  const files = attachments.length
    ? `<p style="margin:18px 0 6px"><strong>Attachments (${attachments.length}):</strong></p><ul>` +
      attachments.map((a) => `<li>${esc(a.name)} (${Math.round(a.size / 1024)} KB)</li>`).join("") +
      `</ul><p style="color:#666;font-size:13px">Stored in R2 under: ${esc(attachments.map((a) => a.key).join(", "))}</p>`
    : "";

  const failed = failedUploads.length
    ? `<p style="margin:18px 0 0;padding:10px 12px;background:#fdecea;border-left:3px solid #c0392b;font-size:14px">
         <strong>${failedUploads.length} attachment(s) failed to upload</strong> and were not saved:
         ${esc(failedUploads.join(", "))}. Ask the customer to resend them by email.
       </p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px">
      <h2 style="margin:0 0 4px">New website inquiry</h2>
      <p style="color:#666;margin:0 0 18px">Lead ${esc(lead.id)} &middot; ${esc(lead.created_at)}</p>
      <table style="border-collapse:collapse;font-size:15px">${rows}</table>
      <p style="margin:18px 0 6px"><strong>Message:</strong></p>
      <div style="white-space:pre-wrap;padding:12px 14px;background:#f6f6f6;border-radius:6px;font-size:15px">${esc(lead.message)}</div>
      ${files}
      ${failed}
    </div>`;

  const subject = `Website inquiry from ${lead.name}`;

  /* Primary transport: Cloudflare's native send_email binding.
     Email Routing is already enabled on this zone, so this costs nothing,
     needs no API key, and adds no third-party dependency. The one constraint
     is that LEAD_INBOX must be a verified destination address in Email
     Routing, which it already is as the forwarding target. */
  if (env.SEND_EMAIL) {
    try {
      const raw = buildMime({
        from,
        to,
        replyTo: `${lead.name.replace(/[<>@"\r\n]/g, "")} <${lead.email}>`,
        subject,
        html,
      });
      await env.SEND_EMAIL.send(new EmailMessage(from, to, raw));
      return { sent: true, via: "cloudflare" };
    } catch (err) {
      const detail = "transport-rejected";
      // Fall through to Resend if it happens to be configured.
      if (!env.RESEND_API_KEY) return { sent: false, error: `cf-email: ${detail}` };
      console.error("notification-primary-rejected");
    }
  }

  /* Optional fallback: Resend. Only used if RESEND_API_KEY is set. */
  if (!env.RESEND_API_KEY) return { sent: false, error: "no-transport-configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,        // replying goes straight to the customer
        subject,
        html,
      }),
    });

    if (!res.ok) {
      return { sent: false, error: `resend-http-${res.status}` };
    }
    return { sent: true, via: "resend" };
  } catch (err) {
    return { sent: false, error: "resend-unavailable" };
  }
}

/* ------------------------------------------------------------------ handler */

const PROJECT_TYPES = new Set(["", "general_contracting", "addition", "adu", "renovation", "custom_home", "advisory", "other"]);
const MAX_BODY_BYTES = MAX_TOTAL_BYTES + 256 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const singleLine = (value, max) => clean(value, max).replace(/[\x00-\x1f\x7f]/g, " ");
const campaign = (value) => /^[a-zA-Z0-9_. -]{1,100}$/.test(value || "") ? value : "";
function sourcePath(value) {
  try {
    const u = new URL(value, "https://collaborativeconstructionllc.com");
    return u.origin === "https://collaborativeconstructionllc.com" ? u.pathname.slice(0, 300) : "";
  } catch { return ""; }
}
function referrerOrigin(value) {
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.origin.slice(0, 200) : ""; }
  catch { return ""; }
}
async function digest(value) {
  const hash = await crypto.subtle.digest("SHA-256", typeof value === "string" ? new TextEncoder().encode(value) : value);
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function boundedForm(request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new Error("too-large");
  if (!request.body) throw new Error("invalid-body");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("too-large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new Response(bytes, { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
}
async function knownReceipt(db, key, fingerprint) {
  const row = await db.prepare(`SELECT r.fingerprint, r.lead_id, w.notification_state,
    w.attachment_state, w.attachment_warning FROM intake_receipts r
    JOIN lead_workflow w ON w.lead_id = r.lead_id WHERE request_key = ?`).bind(key).first();
  if (!row) return null;
  if (row.fingerprint !== fingerprint) return json({ ok: false, error: "This submission reference was already used for different details. Refresh the page before sending a new inquiry." }, 409);
  let failedCount = 0;
  try { failedCount = JSON.parse(row.attachment_warning || "{}").failedCount || 0; } catch { /* legacy note */ }
  return json({ ok: true, stored: true, id: row.lead_id,
    notification: row.notification_state,
    attachments: { failedCount, pending: row.attachment_state === "pending" } });
}

async function handleContact(request, env, ctx) {
  const url = new URL(request.url);
  const local = env.INTAKE_LOCAL_TEST === "true" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const expectedOrigin = local ? url.origin : "https://collaborativeconstructionllc.com";
  if (request.headers.get("origin") !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ ok: false, error: "Please send your inquiry from our website." }, 403);
  }
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (!local) {
    if (!env.TURNSTILE_SECRET_KEY || !env.INTAKE_RATE_LIMITER) {
      return json({ ok: false, error: "Our form is temporarily unavailable. Please call or email us directly." }, 503);
    }
    try {
      const limit = await env.INTAKE_RATE_LIMITER.limit({ key: `contact:${ip}` });
      if (!limit.success) return json({ ok: false, error: "Too many attempts. Please wait a minute or call us." }, 429, { "Retry-After": "60" });
    } catch { return json({ ok: false, error: "Our form is temporarily unavailable. Please call or email us." }, 503); }
  }
  // Never accept an email-only inquiry: a durable queue is required.
  if (!env.DB) return json({ ok: false, error: "We cannot save your inquiry right now. Please call or email us." }, 503);
  let form;
  try { form = await boundedForm(request); }
  catch (err) { return json({ ok: false, error: err.message === "too-large" ? "Your files are too large. Please keep the total below 25 MB." : "Could not read the form. Please try again." }, err.message === "too-large" ? 413 : 400); }
  // Neutral field name avoids organization/website autofill heuristics. Never clear it
  // client-side: every supplied value (including duplicate fields) is checked here.
  if (form.getAll("cc_x7q2m9").some(value => typeof value !== "string" || value.trim() !== "")) return json({ ok: false, error: "We could not accept this submission. Please call us if you need help." }, 422);

  const fields = { name: 120, email: 254, phone: 40, message: MAX_MESSAGE_CHARS,
    project_type: 40, project_town: 100, budget_range: 100, desired_timeline: 150 };
  const errors = {};
  const lead = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = form.get(key);
    if (value !== null && (typeof value !== "string" || value.trim().length > max)) errors[key] = `Please shorten the ${key.replaceAll("_", " ")} field.`;
    lead[key] = key === "message" ? clean(value, max) : singleLine(value, max);
  }
  if (!lead.name) errors.name = "Please enter your name.";
  if (!isEmail(lead.email) || /[\r\n]/.test(form.get("email") || "")) errors.email = "Please enter a valid email address.";
  if (!lead.message) errors.message = "Please tell us about your project.";
  if (!PROJECT_TYPES.has(lead.project_type)) errors.project_type = "Please choose a listed project type.";
  if (Object.keys(errors).length) return json({ ok: false, error: "Please check the form fields.", errors }, 400);
  const suppliedKey = form.get("submission_id");
  if (suppliedKey && !UUID.test(suppliedKey)) return json({ ok: false, error: "Please refresh the form and try again." }, 400);
  const requestKey = suppliedKey || crypto.randomUUID();
  const uploads = form.getAll("attachments").filter(file => file && typeof file === "object" && file.size > 0);
  if (uploads.length > MAX_FILES) return json({ ok: false, error: "Please attach no more than 6 files." }, 400);
  let total = 0;
  for (const file of uploads) {
    total += file.size;
    if (file.size > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES) return json({ ok: false, error: "Files must be at most 10 MB each and 25 MB in total." }, 413);
    if (!ALLOWED_TYPES.has(file.type)) return json({ ok: false, error: "Use JPG, PNG, WEBP, HEIC or PDF attachments." }, 400);
  }
  if (uploads.length && !env.ATTACHMENTS) return json({ ok: false, error: "Attachments are unavailable. Remove the files to send your inquiry, then share them when we follow up." }, 503);
  Object.assign(lead, {
    source_page: sourcePath(form.get("source_page") || "/"),
    referrer: referrerOrigin(form.get("referrer")),
    utm_source: campaign(form.get("utm_source")), utm_medium: campaign(form.get("utm_medium")),
    utm_campaign: campaign(form.get("utm_campaign")),
  });
  const fileFingerprints = [];
  for (const file of uploads) fileFingerprints.push([file.name, file.type, file.size, await digest(await file.arrayBuffer())]);
  // Attribution can change on a retry; content identity is the customer's fields/files.
  const fingerprint = await digest(JSON.stringify([Object.keys(fields).map(k => lead[k]), fileFingerprints]));
  const replay = await knownReceipt(env.DB, requestKey, fingerprint);
  if (replay) return replay;
  if (!local && !await verifyTurnstile(form.get("cf-turnstile-response"), ip, env.TURNSTILE_SECRET_KEY, url.hostname)) {
    return json({ ok: false, error: "Please complete the verification and try again." }, 403);
  }
  lead.id = crypto.randomUUID();
  lead.created_at = new Date().toISOString();
  try {
    // D1 batch is transactional: customer data, receipt and workflow update commit together.
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO leads (id,created_at,name,email,phone,message,source_page,referrer,
        utm_source,utm_medium,utm_campaign,attachment_keys) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        lead.id, lead.created_at, lead.name, lead.email, lead.phone, lead.message, lead.source_page,
        lead.referrer, lead.utm_source, lead.utm_medium, lead.utm_campaign, "[]"),
      env.DB.prepare(`INSERT INTO intake_receipts (request_key,fingerprint,lead_id,created_at) VALUES (?,?,?,?)`).bind(requestKey, fingerprint, lead.id, lead.created_at),
      env.DB.prepare(`UPDATE lead_workflow SET project_type=?,project_town=?,budget_range=?,desired_timeline=?,attachment_state=? WHERE lead_id=?`).bind(
        lead.project_type, lead.project_town, lead.budget_range, lead.desired_timeline, uploads.length ? "pending" : "none", lead.id),
    ]);
  } catch {
    // Concurrent identical submissions race on the receipt key; only one creates a lead.
    const concurrent = await knownReceipt(env.DB, requestKey, fingerprint);
    if (concurrent) return concurrent;
    console.error("intake-storage-failed");
    return json({ ok: false, error: "We could not save your inquiry. Please retry or call us." }, 503);
  }

  const attachments = [];
  const failedUploads = [];
  for (const file of uploads) {
    const key = `leads/${lead.id}/${crypto.randomUUID()}${safeExt(file.name)}`;
    try {
      await env.ATTACHMENTS.put(key, file.stream(), { httpMetadata: { contentType: file.type },
        customMetadata: { leadId: lead.id } });
      attachments.push({ key, name: singleLine(file.name, 200), size: file.size });
    } catch { failedUploads.push(singleLine(file.name, 200)); }
  }
  let failedCount = failedUploads.length;
  if (uploads.length) {
    try {
      await env.DB.batch([
        env.DB.prepare("UPDATE leads SET attachment_keys=? WHERE id=?").bind(JSON.stringify(attachments.map(a => a.key)), lead.id),
        env.DB.prepare("UPDATE lead_workflow SET attachment_state=?,attachment_warning=? WHERE lead_id=?").bind(
          failedCount ? "partial_failure" : "saved", failedCount ? JSON.stringify({ failedCount }) : null, lead.id),
      ]);
    } catch {
      // Lead remains durable, pending attachments surface in the private queue.
      // Avoid retaining objects whose references could not be committed.
      for (const a of attachments) { try { await env.ATTACHMENTS.delete(a.key); } catch { /* reconcile private prefix */ } }
      failedCount = uploads.length;
      attachments.length = 0;
      failedUploads.splice(0, failedUploads.length, "Attachment storage could not be confirmed");
      console.error("intake-attachment-status-unconfirmed");
    }
  }
  const notify = (async () => {
    let mail;
    try { mail = local ? { sent: false, error: "local-notification-disabled" } : await sendNotification(env, lead, attachments, failedUploads); }
    catch { mail = { sent: false, error: "notification-unavailable" }; }
    try {
      await env.DB.batch([
        env.DB.prepare("UPDATE leads SET emailed=?,email_error=? WHERE id=?").bind(mail.sent ? 1 : 0, mail.error || null, lead.id),
        env.DB.prepare("UPDATE lead_workflow SET notification_state=?,notification_attempted_at=? WHERE lead_id=?").bind(
          mail.sent ? "accepted" : "failed", new Date().toISOString(), lead.id),
      ]);
    } catch { console.error("intake-notification-status-unconfirmed"); }
  })();
  if (ctx?.waitUntil) ctx.waitUntil(notify);
  else await notify;
  return json({ ok: true, stored: true, id: lead.id, notification: "pending", attachments: { failedCount, pending: false } });
}
