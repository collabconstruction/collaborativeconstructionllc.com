#!/usr/bin/env node
/**
 * Refresh docs/research/data/{gsc,ga4}-snapshot.json.
 *
 * This is deliberately NOT wired into build-workbooks.py's run path.
 * build-workbooks.py makes zero network calls and only ever reads the JSON
 * files this script writes (or that were written by hand from a live MCP
 * pull, which is how the current pair of snapshot files was produced).
 * Keeping the fetch and the build separate means a rebuild stays
 * reproducible and offline even after credentials expire.
 *
 * GSC: reads the existing read-only OAuth token this project already uses
 * for its Search Console MCP connector, at ~/.cc-private/gsc/token.json
 * (docs/research/16-gsc-seo-baseline.md documents this path). That token
 * belongs to an External/Testing OAuth consent screen, so its refresh token
 * expires roughly every 7 days (issued 2026-10-12, so likely already
 * expired by the time this runs). If the refresh fails, this script writes
 * a snapshot with status "auth_failed" rather than fabricating numbers.
 *
 * GA4: docs/research/19-ga4-connection-and-diagnosis.md:15 explicitly notes
 * the shared OAuth client/token pair "remain exclusively owned by the GSC
 * MCP tool" -- this script does not reuse them for GA4 and has no separate
 * GA4 credential of its own. Until a dedicated service-account credential
 * is set up for this project, refreshing the GA4 snapshot means re-running
 * the equivalent query through a live Claude Code session with the
 * google-analytics MCP connector attached, and hand-updating
 * docs/research/data/ga4-snapshot.json the same way the current file was
 * produced. This script writes status "manual_only" for GA4 and exits 0.
 *
 * Usage: node scripts/fetch-analytics-snapshot.mjs [--gsc-only]
 */
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/research/data");
const siteUrl = "sc-domain:collaborativeconstructionllc.com";

async function refreshGscToken(tokenPath, clientPath) {
  const [token, client] = await Promise.all([
    readFile(tokenPath, "utf8").then(JSON.parse),
    readFile(clientPath, "utf8").then(JSON.parse),
  ]);
  const installed = client.installed || client.web;
  const body = new URLSearchParams({
    client_id: installed.client_id,
    client_secret: installed.client_secret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  const refreshed = await res.json();
  return refreshed.access_token;
}

async function fetchGsc() {
  const tokenPath = path.join(homedir(), ".cc-private/gsc/token.json");
  const clientPath = path.join(homedir(), ".cc-private/gsc/oauth-client.json");
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 3); // GSC reporting lag buffer, per 16-gsc-seo-baseline.md
  const start = new Date(end);
  start.setDate(start.getDate() - 28);
  const fmt = (d) => d.toISOString().slice(0, 10);

  let accessToken;
  try {
    accessToken = await refreshGscToken(tokenPath, clientPath);
  } catch (err) {
    return {
      status: "auth_failed",
      fetched_at: now.toISOString(),
      error: String(err.message || err),
      note: "GSC OAuth token refresh failed, most likely because the External/Testing refresh token (~7-day lifetime) has expired. Re-authorize via the google-search-console MCP connector, then re-run this script.",
    };
  }

  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: [] }),
  });
  if (!res.ok) {
    return { status: "unavailable", fetched_at: now.toISOString(), error: `${res.status} ${await res.text()}` };
  }
  const data = await res.json();
  const row = (data.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    status: "ok",
    fetched_at: now.toISOString(),
    property: siteUrl,
    window: "28-day",
    date_range: { start: fmt(start), end: fmt(end) },
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avg_position: row.position,
    caveat: "Check docs/research/data/../../releases for current maintenance-mode status before reading this as a performance signal.",
  };
}

async function main() {
  const gscOnly = process.argv.includes("--gsc-only");

  const gsc = await fetchGsc().catch((err) => ({
    status: "unavailable",
    fetched_at: new Date().toISOString(),
    error: String(err.message || err),
  }));
  await writeFile(path.join(outDir, "gsc-snapshot.json"), JSON.stringify(gsc, null, 2) + "\n");
  console.log(`gsc-snapshot.json: ${gsc.status}`);

  if (!gscOnly) {
    const ga4 = {
      status: "manual_only",
      fetched_at: new Date().toISOString(),
      note:
        "No standalone GA4 credential is configured for this script (see file header). Refresh docs/research/data/ga4-snapshot.json by hand via a live session with the google-analytics MCP connector attached: call get_account_summaries, confirm the business account still has exactly one property, and update the file following the same shape as the current one. Do not overwrite a status:'ok' file with this placeholder.",
    };
    console.log(`ga4-snapshot.json: ${ga4.status} (not written; see note -- update by hand via MCP session)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
