# Baseline measurements

Captured 2026-09-08, immediately before the Eleventy migration. Without a
"before" there is no case study, so these numbers are the reference point every
later claim is measured against.

Raw artifacts (Lighthouse JSON, HTML snapshots of all four live pages) are in
`.baseline/`, which is gitignored because it is 700 KB of generated output.

## Leads

| Metric | Value |
| --- | --- |
| Total leads in D1 | **0** |
| Successfully emailed | 0 |
| Email failures | 0 |

The lead table was created on 2026-09-07 along with the contact-form fix. Before
that, the form opened a Gmail compose tab and showed a success modal without
sending anything, so the true historical lead count is unknown and unrecoverable.
Zero is the honest starting line.

## Lighthouse, homepage, mobile

| Metric | Value | Target |
| --- | --- | --- |
| Performance | **71** | ≥ 90 |
| First Contentful Paint | 2.3 s | < 1.8 s |
| **Largest Contentful Paint** | **11.9 s** | < 2.5 s |
| Cumulative Layout Shift | 0.036 | < 0.1 |
| Total Blocking Time | 0 ms | < 200 ms |
| Speed Index | 3.5 s | < 3.4 s |

## Page weight

Total `assets/` directory: **14 MB**.

Three findings explain most of the LCP number:

1. **`assets/video/backgroundvideo.mp4` is 4.1 MB and carries `preload="auto"`.**
   The homepage hero tells the browser to eagerly fetch the entire video before
   it is needed. This is almost certainly the 11.9 s LCP. Fix: `preload="none"`
   or `preload="metadata"`, a compressed and shorter encode, and a poster image
   that is itself optimised.
2. **`assets/favicon.png` is 396 KB.** A favicon should be 2-5 KB. This
   downloads on every page view of every page.
3. **`assets/c-icon.png` is 396 KB** and is rendered twice per page (header
   badge and footer logo) on all four pages.

Items 2 and 3 are pure loss with no tradeoff. They are trivially fixable and
should land early rather than waiting for the Phase 6 image pipeline.

Several gallery JPEGs are also 400-800 KB unoptimised originals, which is the
proper job of the `@11ty/eleventy-img` pipeline.

## Not yet measurable

- **Search traffic, impressions, and click-through rate.** Search Console is not
  connected yet, so there is no query data at all.
- **Sessions and channel attribution.** No analytics of any kind is installed.
- **AI answer-engine citation.** Cloudflare's managed `robots.txt` currently
  blocks GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended and
  meta-externalagent, so the site cannot be cited by any of them regardless of
  what markup it carries.

These three gaps are the reason the analytics phase exists. Every one of them
should have a real number in this table before the project is called finished.
