#!/usr/bin/env node
/**
 * Optional, bounded Firecrawl competitor research pilot. Never runs on website
 * requests or scheduled jobs. Manual --run and a private API key are required.
 * Basic /v2/scrape markdown only; no crawling, search, LLM extraction, or AI claims.
 */
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_PAGES = 5;
export const HARD_MAX_PAGES = 10;
const MAX_MARKDOWN_CHARS = 50_000;
const API_URL = "https://api.firecrawl.dev/v2/scrape";

export function pickTargets(config, count = DEFAULT_PAGES) {
  if (!Number.isInteger(count) || count < 1 || count > HARD_MAX_PAGES) {
    throw new Error("Page limit must be an integer from 1 to 10.");
  }
  if (!Array.isArray(config)) throw new Error("Competitor config must be an array.");
  const selected = config.slice(0, count);
  const seen = new Set();
  for (const site of selected) {
    if (!site || typeof site.name !== "string" || typeof site.url !== "string") {
      throw new Error("Every competitor needs a name and URL.");
    }
    const url = new URL(site.url);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) {
      throw new Error("Only public HTTPS competitor pages are supported.");
    }
    if (seen.has(url.href)) throw new Error("Duplicate competitor URL: " + url.href);
    seen.add(url.href);
  }
  return selected;
}

export function summarizePage(site, response) {
  if (!response || response.success !== true || typeof response.data?.markdown !== "string") {
    throw new Error("Firecrawl returned an unsuccessful or invalid scrape.");
  }
  const markdown = response.data.markdown.slice(0, MAX_MARKDOWN_CHARS).replace(/\r\n/g, "\n");
  const normalized = markdown.replace(/\s+/g, " ").trim();
  return {
    name: site.name,
    town: site.town || "",
    category: site.category || "",
    url: site.url,
    title: String(response.data.metadata?.title || "").slice(0, 200),
    description: String(response.data.metadata?.description || "").slice(0, 300),
    sha256: createHash("sha256").update(normalized).digest("hex"),
    excerpt: normalized.slice(0, 240),
    truncated: response.data.markdown.length > MAX_MARKDOWN_CHARS
  };
}

async function scrape(site, apiKey, fetcher = fetch) {
  const response = await fetcher(API_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ url: site.url, formats: ["markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error("Firecrawl HTTP " + response.status);
  const result = await response.json();
  return summarizePage(site, result);
}

export async function run({ config, limit, apiKey, fetcher = fetch, previous = [] }) {
  const targets = pickTargets(config, limit);
  const priorByUrl = new Map(previous.map(p => [p.url, p]));
  const pages = [];
  for (const site of targets) {
    try {
      const page = await scrape(site, apiKey, fetcher);
      const before = priorByUrl.get(page.url);
      page.comparison = !before ? "baseline" : page.sha256 === before.sha256 ? "unchanged" : "changed";
      pages.push(page);
    } catch (error) {
      // Do not write the request's headers, body or secret to reports.
      pages.push({ name: site.name, url: site.url, comparison: "unavailable", error: String(error.message || "Scrape failed").slice(0, 160) });
    }
  }
  return {
    timestamp_utc: new Date().toISOString(),
    provider: "firecrawl-v2-scrape",
    planned_requests: targets.length,
    // A basic scrape is normally billed per page; account for possible premium charges separately.
    pages,
    notes: "Observed changes to public website content are not verified business events or proof of competitor growth."
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !["--dry-run", "--run"].includes(a) && !/^--limit=\d+$/.test(a)) ||
      args.includes("--run") === args.includes("--dry-run")) {
    throw new Error("Usage: node scripts/firecrawl-competitors.mjs --dry-run|--run [--limit=1..10]");
  }
  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : DEFAULT_PAGES;
  const config = JSON.parse(await readFile("config/competitor-watch.json", "utf8"));
  const targets = pickTargets(config, limit);
  if (args.includes("--dry-run")) {
    console.log(JSON.stringify({ dry_run: true, requests: targets.length, estimated_basic_scrape_credits: targets.length, urls: targets.map(s => s.url) }, null, 2));
    return;
  }
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is required for --run; never commit it.");
  const out = path.resolve("monitoring-output/firecrawl");
  let previous = [];
  try {
    const old = JSON.parse(await readFile(path.join(out, "snapshot.json"), "utf8"));
    previous = Array.isArray(old.pages) ? old.pages : [];
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const report = await run({ config, limit, apiKey, previous });
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, "snapshot.json"), JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  const summary = {
    timestamp_utc: report.timestamp_utc,
    attempted: report.pages.length,
    succeeded: report.pages.filter(p => p.sha256).length,
    changes: report.pages.filter(p => p.comparison === "changed").map(p => ({ name: p.name, url: p.url }))
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.succeeded !== summary.attempted) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error("Firecrawl pilot: " + error.message); process.exitCode = 1; });
}
