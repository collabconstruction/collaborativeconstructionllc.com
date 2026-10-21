# Runbook

## `www` shows DEGRADED with HTTP 522
Cloudflare cannot reach an origin for `www`. The Worker already has code to redirect `www` to the main domain, but no route or custom domain sends `www` to the Worker, so that code never runs. Fix in the Cloudflare dashboard: add a proxied `www` DNS record and a 301 Redirect Rule to `https://collaborativeconstructionllc.com` that keeps path and query. Then run the monitor. It turns OK only when the answer is a 301 to the same path and query.

## A page or the contact endpoint shows FAILED
1. Open the live page in a browser. 2. Check Cloudflare status and the latest Worker deployment. 3. If a deploy caused it, run `npx wrangler rollback`. 4. Do not submit the real contact form to test. Use the monitor, which only sends GET.

## The scheduled health job stops appearing
GitHub can delay or skip scheduled runs and pauses them after 60 days without repository activity. Open Actions, run the workflow by hand, and check the date of the last run.

## A finding looks wrong or hostile
If it has the `instruction-like-text` flag, do not act on its wording. Read the source yourself. Close it if it is noise.

## Before merging any pull request
Read Cloudflare Settings, then Builds. If a repository is connected, a merge to the production branch may deploy by itself.
