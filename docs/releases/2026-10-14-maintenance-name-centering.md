# Maintenance company-name centering

October 14, 2026. Owner explicitly requested the live maintenance page correction.

Change: `.company` now has `margin: 0 auto` and explicit `text-align: center`; its constrained paragraph box previously sat left of the centered main content.

Source commit: `8f299d5` on `ops/maintenance-mode`, isolated checkout `/private/tmp/cc-maintenance`. Deployed Worker version: `e93485d0-6bd4-4c70-8745-98225614a7dc`. Prior maintenance version / rollback target: `df9e4be6-98d6-4134-b6c0-7841fc684359`.

Validation: full release check passed, 109 tests passed, clean build and public-file verification passed, dry run preserved maintenance-on configuration and existing bindings. Deploy uploaded no changed frontend assets. Live HTML contains the corrected rule; live browser reload measured paragraph center within 0.004px of viewport center. Maintenance remains on. No intake, database, account or DNS changes.

Screenshot: main workspace `docs/implementation/evidence/maintenance-centered.jpg`.
