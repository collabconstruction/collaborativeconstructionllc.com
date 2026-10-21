# Deploying the current changes to the live site

Written October 20, 2026. Read `AGENTS.md` first for which design is the real one.

## Two ways to deploy. Do not mix them up.

| | `npm run deploy` | Safe overlay (`_deploy`) |
|---|---|---|
| What it ships | A fresh build of this repo (`_site`) | A copy of the live site plus only the files listed in `OVERLAY` |
| Risk | Anything live that the repo lacks is removed | Low. Nothing live is lost |
| Command | `npm run deploy` | `node scripts/build-live-overlay.mjs`, then `npx wrangler deploy --assets _deploy` |
| Checked by CI | Build only, never the deploy | No. Run it by hand and read `READY` |

Use the safe overlay unless the owner says otherwise. Merging a pull request does not deploy anything by itself. Deploying always needs the owner's separate approval.

## Why this method, instead of `npm run deploy`

A Cloudflare deploy replaces the whole set of public files. As of October 21, 2026 the repo templates, fonts, photos and scripts match the live site, so a plain repo deploy should now give the same site. This method is still the safest, because it starts from a copy of what is live and only lays the changed files on top, so nothing the repo does not know about can be lost.

## Safe way: live site copy plus only the changed files

`scripts/build-live-overlay.mjs` copies every public file of the live site into `_deploy/` (this folder is not committed), then lays the changed files on top. The changed files are listed in `OVERLAY` at the top of that script.

```
git fetch origin
git checkout claude/website-design-refinements-qh7d3f
git pull
npm ci
node scripts/build-live-overlay.mjs
```

It must finish with a line starting `READY`. If it prints `NOT READY`, stop.

```
npx wrangler login
npx wrangler deploy --dry-run --assets _deploy
npx wrangler deploy --assets _deploy
```

`wrangler login` opens a browser. The dry run uploads nothing.

The Worker code in this branch is the same as the live Worker (live already answers old page URLs with the branch's 301 redirects), so the form, database and email keep working as they are.

## Check it worked

```
curl -s https://collaborativeconstructionllc.com/css/styles.css | grep -c "footer-motto.is-armed"
curl -s -o /dev/null -w "%{http_code}\n" https://collaborativeconstructionllc.com/assets/img/swirls/glow-ribbons.webp
```

The first prints a number above 0. The second prints 200. Then open the home page, About and a service page.

## Undo

```
npx wrangler rollback
```

## What this cannot protect against

A file that the live site serves, that no page links to, and that this repo has never tracked would be left out of `_deploy/` and so deleted. The script keeps every file the repo tracks. Anything else, check the Cloudflare dashboard before deploying.
