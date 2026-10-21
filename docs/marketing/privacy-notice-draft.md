
## Page status (branch `claude/privacy-page`)

The page exists at `src/privacy/index.njk` and is a draft. It is not built, not in the sitemap and not linked while `privacyPublished` is false in `src/_data/business.json`. To publish: replace every `[Owner ...]` marker, get the owner and lawyer to approve, set the flag to true, add `privacy/index.html` to the `built` list in `scripts/build-live-overlay.mjs`, then deploy. `tests/privacy-page.test.mjs` fails if a marker is left when the flag is true.
