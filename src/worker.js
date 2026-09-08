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

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed." }, 405, { Allow: "POST" });
      }
      return handleContact(request, env, ctx);
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

async function verifyTurnstile(token, ip, secret) {
  if (!secret) return { ok: true, skipped: true }; // not provisioned yet
  if (!token) return { ok: false, reason: "missing-token" };

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = await res.json();
    return data.success ? { ok: true } : { ok: false, reason: (data["error-codes"] || []).join(",") };
  } catch {
    return { ok: false, reason: "verify-failed" };
  }
}

/* -------------------------------------------------------------------- email */

// RFC 2047 encoding, so names and subjects with accents survive the trip.
function encodeHeader(value) {
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
        replyTo: `${lead.name.replace(/[<>@"]/g, "")} <${lead.email}>`,
        subject,
        html,
      });
      await env.SEND_EMAIL.send(new EmailMessage(from, to, raw));
      return { sent: true, via: "cloudflare" };
    } catch (err) {
      const detail = String(err && err.message ? err.message : err).slice(0, 300);
      // Fall through to Resend if it happens to be configured.
      if (!env.RESEND_API_KEY) return { sent: false, error: `cf-email: ${detail}` };
      console.error("send_email failed, trying Resend", detail);
    }
  }

  /* Optional fallback: Resend. Only used if RESEND_API_KEY is set. */
  if (!env.RESEND_API_KEY) return { sent: false, error: "no-transport-configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
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
      const detail = await res.text();
      return { sent: false, error: `resend-${res.status}: ${detail.slice(0, 300)}` };
    }
    return { sent: true, via: "resend" };
  } catch (err) {
    return { sent: false, error: `resend-threw: ${String(err).slice(0, 300)}` };
  }
}

/* ------------------------------------------------------------------ handler */

async function handleContact(request, env, ctx) {
  const ip = request.headers.get("cf-connecting-ip") || "";

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Could not read the form data." }, 400);
  }

  // Honeypot. Real users never fill this in; bots usually do.
  if (clean(form.get("company_website"), 200)) {
    // Look successful so the bot does not retry with a different shape.
    return json({ ok: true, id: "ok" });
  }

  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 254);
  const phone = clean(form.get("phone"), 40);
  const message = clean(form.get("message"), MAX_MESSAGE_CHARS);

  const errors = {};
  if (!name) errors.name = "Please enter your name.";
  if (!email) errors.email = "Please enter your email.";
  else if (!isEmail(email)) errors.email = "That email address does not look right.";
  if (!message) errors.message = "Please tell us about your project.";

  if (Object.keys(errors).length) {
    return json({ ok: false, error: "Please check the highlighted fields.", errors }, 400);
  }

  const turnstile = await verifyTurnstile(
    form.get("cf-turnstile-response"), ip, env.TURNSTILE_SECRET_KEY
  );
  if (!turnstile.ok) {
    return json(
      { ok: false, error: "We could not verify that you are human. Please reload the page and try again." },
      403
    );
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  /* -- attachments -------------------------------------------------------- */
  const uploads = form.getAll("attachments")
    .filter((f) => f && typeof f === "object" && f.size > 0);
  const attachments = [];
  const failedUploads = [];

  if (uploads.length > MAX_FILES) {
    return json({ ok: false, error: `Please attach no more than ${MAX_FILES} files.` }, 400);
  }

  let total = 0;
  for (const file of uploads) {
    total += file.size;
    if (file.size > MAX_FILE_BYTES) {
      return json({ ok: false, error: `"${file.name}" is larger than 10 MB.` }, 400);
    }
    if (total > MAX_TOTAL_BYTES) {
      return json({ ok: false, error: "Those files total more than 25 MB. Please send fewer or smaller files." }, 400);
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return json({ ok: false, error: `"${file.name}" is not a supported file type. Please use JPG, PNG, WEBP, HEIC, or PDF.` }, 400);
    }
  }

  // If files were sent but there is nowhere to put them, say so rather than
  // dropping them silently. The form hides its upload field while R2 is off,
  // so this only fires if someone posts directly.
  if (uploads.length && !env.ATTACHMENTS) {
    return json({
      ok: false,
      error: "We cannot accept file attachments right now. Please send your message without files, and we will follow up for photos by email.",
    }, 503);
  }

  if (uploads.length && env.ATTACHMENTS) {
    for (const file of uploads) {
      const key = `leads/${id}/${crypto.randomUUID()}${safeExt(file.name)}`;
      try {
        await env.ATTACHMENTS.put(key, file.stream(), {
          httpMetadata: { contentType: file.type || "application/octet-stream" },
          customMetadata: { leadId: id, originalName: file.name.slice(0, 200) },
        });
        attachments.push({ key, name: file.name, size: file.size });
      } catch (err) {
        // An attachment failure must not cost us the lead, but it must be
        // visible in the notification so nobody assumes photos arrived.
        console.error("R2 put failed", key, err);
        failedUploads.push(file.name);
      }
    }
  }

  const lead = {
    id, created_at, name, email, phone, message,
    source_page: clean(form.get("source_page"), 300),
    referrer: clean(form.get("referrer"), 500),
    utm_source: clean(form.get("utm_source"), 100),
    utm_medium: clean(form.get("utm_medium"), 100),
    utm_campaign: clean(form.get("utm_campaign"), 150),
    ga_client_id: clean(form.get("ga_client_id"), 100),
  };

  /* -- persist first ------------------------------------------------------ */
  if (!env.DB) {
    // No database bound, so email is the only path and it must succeed.
    const mail = await sendNotification(env, lead, attachments, failedUploads);
    return mail.sent
      ? json({ ok: true, id })
      : json({ ok: false, error: "We could not deliver your message. Please email or call us directly." }, 502);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leads
         (id, created_at, name, email, phone, message,
          source_page, referrer, utm_source, utm_medium, utm_campaign,
          ga_client_id, attachment_keys, country, user_agent)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      lead.id, lead.created_at, lead.name, lead.email, lead.phone, lead.message,
      lead.source_page, lead.referrer, lead.utm_source, lead.utm_medium, lead.utm_campaign,
      lead.ga_client_id,
      JSON.stringify(attachments.map((a) => a.key)),
      request.cf?.country || null,
      (request.headers.get("user-agent") || "").slice(0, 400)
    ).run();
  } catch (err) {
    console.error("D1 insert failed", err);
    // Could not store it. Try email as a last resort before admitting failure.
    const mail = await sendNotification(env, lead, attachments, failedUploads);
    return mail.sent
      ? json({ ok: true, id })
      : json({ ok: false, error: "Something went wrong on our end. Please email or call us directly." }, 500);
  }

  /* -- then notify -------------------------------------------------------- */
  // The lead is safe now, so the response does not need to block on email.
  const notify = sendNotification(env, lead, attachments, failedUploads).then((mail) =>
    env.DB.prepare(`UPDATE leads SET emailed = ?, email_error = ? WHERE id = ?`)
      .bind(mail.sent ? 1 : 0, mail.error || null, id)
      .run()
      .catch((e) => console.error("D1 email-status update failed", e))
  );

  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(notify);
  else await notify;

  return json({ ok: true, id });
}
