# Deploying the current changes to the live site

Written October 20, 2026. Read `AGENTS.md` first for which design is the real one.

## Do not run `npm run deploy` or a plain `wrangler deploy`

A Cloudflare deploy replaces the whole set of public files. The page templates in this repo are older than the live pages (different wording, self hosted fonts, company social links) and 148 photos plus 3 fonts are not committed. Deploying the repo build would roll the live site back.

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
