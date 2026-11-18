# Firecrawl competitor research pilot (manual only)

**Status:** Code prepared; no Firecrawl credentials, purchase, scheduling, production deployment or completed live scrape are implied.

This optional research tool uses [Firecrawl v2 Scrape](https://docs.firecrawl.dev/api-reference/endpoint/scrape) on a **small subset of the existing public competitor list** in `config/competitor-watch.json`. It is separate from the already operational `scripts/monitor_competitors.py` and does not modify the public website, lead inbox, D1, R2, Google Business Profile, or HQ metrics.

## Try it

From the repository root with Node.js 22 or later:

```sh
node scripts/firecrawl-competitors.mjs --dry-run
node scripts/firecrawl-competitors.mjs --dry-run --limit=10
```

The dry run displays exactly which URLs would be sent and makes **zero API calls**.

To opt in to a real run, obtain your own Firecrawl key and pass it privately as an environment variable (do not paste it into GitHub issues, PRs, chat transcripts, source files, or client-side JavaScript):

```sh
# In a terminal where FIRECRAWL_API_KEY has already been set securely:
node scripts/firecrawl-competitors.mjs --run --limit=5
```

The script refuses to run without `--run` and `FIRECRAWL_API_KEY`. It scrapes **five URLs by default** and has a **hard cap of ten pages per invocation**. Calls are sequential with a 30-second timeout each. It uses only `/v2/scrape` with the basic `markdown` output; no website crawl, search, LLM extraction, scheduled task, or customer-data processing.

The local `monitoring-output/firecrawl/snapshot.json` contains a timestamp, source URL, title, short excerpt, and SHA-256 content fingerprint. `monitoring-output/` is gitignored. Subsequent runs compare these fingerprints with the local prior snapshot. **A change is only a research lead**: dynamic content, navigation, promotions, and extraction differences can cause false positives. Nothing in this file establishes construction project wins or company performance.

## Controls and limitations

- **Cost:** Budget up to the selected page count in *basic scrape credits*, subject to Firecrawl's actual billing and plan terms. Do not schedule recurring runs until a monthly budget is explicitly approved. The script's cap is per invocation, not a monthly billing cap.
- **Page choice:** The first URLs in `config/competitor-watch.json` are used in existing list order; edit/reorder the curated list only after verifying scope. No automatic discovery or whole-domain crawl.
- **Respect sites:** Review the sites' published usage restrictions and terms before requesting them; Firecrawl runs via its own service and does not replace that review.
- **Privacy:** Only public competitor URLs are sent to Firecrawl. Never add leads, emails, private documents, customer addresses, or API keys to the config.
- **Research:** Manual review is required before publishing claims or SEO recommendations. Do not automatically write extracted competitor content to marketing pages.
- **Operations:** This pilot is not wired into the current Cloudflare site, the existing agent-report pipeline, CI schedules or the production release. A later separate project can add controlled HQ ingestion only after evidence of usefulness.

Run `npm test` to execute the included offline mock tests. These do not consume Firecrawl credits or require a key.

References: [Firecrawl's v2 API](https://github.com/firecrawl/firecrawl-docs/blob/main/api-reference/v2-openapi.json), [Firecrawl pricing](https://www.firecrawl.dev/pricing).
