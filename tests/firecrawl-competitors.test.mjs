import test from "node:test";
import assert from "node:assert/strict";
import { pickTargets, summarizePage, run, DEFAULT_PAGES, HARD_MAX_PAGES } from "../scripts/firecrawl-competitors.mjs";

const sites = Array.from({ length: 15 }, (_, i) => ({
  name: "Builder " + i,
  town: "Falmouth",
  category: "builder",
  url: "https://builder" + i + ".example/"
}));

test("the competitor pilot is capped at 5 requests by default and 10 at most", () => {
  assert.equal(pickTargets(sites).length, DEFAULT_PAGES);
  assert.equal(pickTargets(sites, HARD_MAX_PAGES).length, 10);
  for (const value of [0, 11, -1, 1.5, NaN]) {
    assert.throws(() => pickTargets(sites, value), /limit/i);
  }
});

test("rejects unsupported or duplicate competitor URLs", () => {
  assert.throws(() => pickTargets([{ name: "X", url: "http://example.com" }]), /HTTPS/);
  assert.throws(() => pickTargets([{ name: "X", url: "https://user:pass@example.com" }]), /HTTPS/);
  assert.throws(() => pickTargets([sites[0], sites[0]], 2), /Duplicate/);
});

test("extracts a bounded, stable fingerprint from Firecrawl v2 markdown", () => {
  const response = { success: true, data: { markdown: "# Hello\n World ", metadata: { title: "Hello" } } };
  const a = summarizePage(sites[0], response);
  const b = summarizePage(sites[0], { success: true, data: { markdown: "# Hello World", metadata: { title: "Hello" } } });
  assert.equal(a.sha256, b.sha256);
  assert.equal(a.title, "Hello");
  assert.equal(a.url, sites[0].url);
  assert.throws(() => summarizePage(sites[0], { success: false }), /invalid/);
});

test("mock pilot runs sequentially, reports baseline, unchanged and changed", async () => {
  const urls = [];
  const fetcher = async (url, options) => {
    assert.equal(url, "https://api.firecrawl.dev/v2/scrape");
    assert.equal(options.headers.Authorization, "Bearer fake-key");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.formats, ["markdown"]);
    urls.push(body.url);
    return { ok: true, json: async () => ({ success: true, data: { markdown: "Site content", metadata: {} } }) };
  };
  const first = await run({ config: sites, limit: 2, apiKey: "fake-key", fetcher });
  assert.equal(first.pages[0].comparison, "baseline");
  assert.equal(first.planned_requests, 2);
  assert.deepEqual(urls, sites.slice(0, 2).map(s => s.url));
  const again = await run({ config: sites, limit: 2, apiKey: "fake-key", fetcher, previous: first.pages });
  assert.equal(again.pages[0].comparison, "unchanged");
  const changed = await run({
    config: sites, limit: 1, apiKey: "fake-key",
    previous: [{ ...first.pages[0], sha256: "old-hash" }], fetcher
  });
  assert.equal(changed.pages[0].comparison, "changed");
});

test("an unsuccessful API response cannot be misreported as a company change", async () => {
  const result = await run({
    config: sites, limit: 1, apiKey: "fake-key",
    fetcher: async () => ({ ok: false, status: 429 })
  });
  assert.equal(result.pages[0].comparison, "unavailable");
  assert.equal(result.pages[0].error, "Firecrawl HTTP 429");
  assert.equal(result.pages[0].sha256, undefined);
});
