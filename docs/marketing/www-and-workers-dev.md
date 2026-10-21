# www redirect and workers.dev plan (not applied)

## What is known

- `https://www.collaborativeconstructionllc.com` returned HTTP 522 when checked earlier. A 522 means Cloudflare could not reach an origin for that name.
- `wrangler.jsonc` sets the Worker name `collaborativeconstructionllc-com` with static assets. It has no `routes` or `workers_dev` setting, so custom domains are managed in the Cloudflare dashboard.
- I cannot reach the Cloudflare dashboard or developers.cloudflare.com from this workspace. Nothing below was tested.

## www redirect (owner or dashboard step)

1. In Cloudflare DNS, confirm there is a `www` record that is proxied (orange cloud). A proxied placeholder record is the usual way to let a redirect rule run.
2. Add a Redirect Rule: if hostname equals `www.collaborativeconstructionllc.com`, redirect to `https://collaborativeconstructionllc.com` plus the same path and query, status 301.
3. Check: `curl -sI https://www.collaborativeconstructionllc.com/about/` should show 301 and the apex address. Also check a page with a query string.
4. Check that the apex site, `/api/` and the contact form still work.

## workers.dev

1. Open the Worker in the dashboard, Settings, Domains and Routes. See if the workers.dev address is on.
2. Open the workers.dev address and see what it shows. Look for the owner name.
3. If nothing needs it, turn it off there. Or set `"workers_dev": false` in `wrangler.jsonc` and deploy. That is a deploy, so it needs the owner's approval.
4. Check that the custom domain still serves the site after.

I changed neither setting.
