# Wrangler output fixtures

These files model `npx wrangler deployments list --name collaborativeconstructionllc-com --json`.

**Provenance, stated honestly:** they follow the documented Cloudflare Workers deployments shape (a deployment `id`, plus `versions[]` with `version_id` and `percentage`). They were not captured from the company account, because the cloud workspace that wrote them has no Wrangler login. The two version ids are the real ones recorded for the October 21, 2026 release; everything else (deployment ids, email, timestamps) is a placeholder.

To replace them with a real capture, run `npm run release:check-wrangler` on the Mac. It prints only the field names and the chosen rollback version. If the field names differ from these fixtures, send the output so the parser and these files can be corrected. Do not paste tokens or private data.

The important rule these fixtures protect: `wrangler rollback` takes a Worker version id (`versions[].version_id`), never a deployment `id`.
