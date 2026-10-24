# Architectural preview handoff

**Current owner revision:** see [OUTLINE_UPDATE.md](OUTLINE_UPDATE.md). The line drawing now rotates slowly and pauses on hover/focus; locations marquee is restored; Company page replaces founder content. The older controls and founder references below are historical.

October 16, 2026. Branch `codex/architectural-house-refinement`, worktree `/private/tmp/cc-midnight-brass`, baseline 96e5873. Feature implementation commit: `2bde457`. Main source workspace's unrelated work was not overwritten. Concurrent edits to remove visible personal founder identity/links and rename the portrait were observed in this worktree; preserved rather than reverted or attributed to this task.

## Preview and editing

```
npm ci
npm run build
npm run preview:review
```

Default http://127.0.0.1:8891; current review instance uses port 8893. Public production remains in maintenance; this server binds only loopback and sends noindex/no-store headers. It has no live contact API. Do not submit customer inquiries to this static preview.

- `/`: integrated full website.
- `/__house-prototype/`: the same house island in isolation, outside the public Eleventy build.
- `/__review/mobile?path=/gallery/`: real 390px iframe viewport, useful when the browser's own resize control is unavailable. Change path to a canonical route. It is not a claim to physical-phone performance.
- `/?review=1`: localhost-only point/select tool. Alt-click any element, enter the requested change in the generated brief, choose Copy, and paste it into the project's Claude/Codex chat. The brief gives page, source template, section, selector and text. The agent applies the edit to source; rebuild to review. This is deliberately human-mediated, not a public website function or an unauthenticated arbitrary file-writer.
- `/?scene=static#house-explorer`: explicit no-WebGL presentation for review.

Source files: `src/_includes/house-explorer.njk` content/controls, `lib/house/model.mjs` geometry/materials, `lib/house/runtime.mjs` camera/lifecycle, `lib/house/state.mjs` deterministic progress, `js/house-loader.js` lazy loading and DOM interactions, `scripts/build-house.mjs` generated bundle/GLB/SVG. Normal `npm run build` regenerates all house assets before the clean Eleventy build. House service links come from `src/_data/nav.json` dropdown entries. Add a real page there, not an invented scene category.

The model is intentionally simple and original. Roof/cutaway movement is optional. It has no photorealistic interior, production-project implication or persistent scene across pages. No React/GSAP/Spline/Blender dependency was required. Keep the CC master and all existing generated identity assets; do not adopt a new house logo from this illustration.

Copy: read `docs/design/writing-voice.md` (already referenced by CLAUDE.md) before editing. Do not reinstall generic copywriting skills. Review social/profile privacy against current owner direction rather than restoring historic personal URLs.

## Release and rollback

Run `npm test`, clean build, release verifier, then `npx wrangler deploy --dry-run`. Read QA_REPORT.md for remaining security/device/production checks. Inspect Git ownership carefully: concurrent privacy work is not automatically part of this feature's commit. Do not broad-stage or overwrite it. Keep production maintenance until the owner approves a concrete isolated release. Never replay D1 migrations, change secrets/bindings or merge unrelated main-workspace work as part of this frontend release.

Before a real release, use the repository's isolated release procedure and preserve the current production version/maintenance setting. To discard the feature locally, switch to a separate checkout of baseline 96e5873 rather than resetting a shared dirty tree. To roll back a deployed release, deploy the previously verified Worker version via the established release procedure. No real deployment was performed by this task.
