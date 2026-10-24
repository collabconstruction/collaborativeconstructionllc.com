# Honeypot autofill regression fix

Date: 2026-10-11. Status: implemented and verified locally; deployment awaits owner approval.

## Changes

- `src/index.njk`: replaces semantic company/website trap with name `cc_x7q2m9` and ID `cc-x7q2m9`. Wrapper uses `hidden`, `inert`, and `aria-hidden="true"`; input uses `tabindex="-1"`, `autocomplete="off"`, disabled capitalization/spellcheck, and password-manager ignore hints.
- `css/styles.css`: explicitly enforces `display: none !important` on the hidden trap wrapper.
- `worker/index.js`: validates every submitted value for the new trap. Nonempty strings and non-string values return HTTP 422, including duplicate-field evasions. Old company/organization metadata no longer acts as the trap.
- `js/analytics.js`: excludes the new trap name from form-interaction measurement.
- `tests/intake.test.mjs`: regression coverage for legitimate organization autofill (`Endicott College`), populated trap rejection, duplicate and file values, and failed Turnstile verification despite legitimate autofill.
- `tests/frontend-intake.test.mjs`: verifies nonsemantic hidden/inert markup and that the client transmits a populated trap unchanged. No submission-time clearing was added.

Turnstile verification, rate limiting, and other spam checks remain in place. Normal form reset after a successful stored inquiry is unchanged.

## Verification

- Full suite under Node 25.1.0: 44 passed, 0 failed, 0 skipped.
- `npm run build`: passed; 11 generated pages/files.
- Local browser: neutral field exists, computed wrapper display is `none`, hidden/inert/aria-hidden attributes are present, tabindex is -1, autocomplete is off, and the trap is absent from the accessibility tree. No old `company_website` input is rendered.
- Autofill regression is a simulated request/client test, not a claim that every Chrome extension was exercised. Browser extensions can ignore autofill hints; the new neutral name and actual hidden/inert field remove the known semantic trigger without bypassing validation.
- The configured Turnstile widget displayed “Unable to connect to website” in the localhost preview. Live CAPTCHA success is therefore unverified; backend success/failure enforcement is covered by automated tests. No widget configuration or secret was changed as part of this fix.

## Release boundary

No deployment, production database change, secret change, or live inquiry was performed for this fix. Frontend and Worker must ship together because the trap name is a shared contract. The working tree contains broader ongoing intake/growth changes; approval of this bug fix alone must not silently authorize those unrelated changes. Existing release documents must be revalidated against the actual release candidate before use.
