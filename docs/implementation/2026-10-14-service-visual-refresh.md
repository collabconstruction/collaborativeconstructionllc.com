# Service and project visual refresh

October 14, 2026. Implemented on design/midnight-brass after 785b5fe. Local preview http://127.0.0.1:8887/ . No deployment or push; maintenance stays active.

Changes: removed curved section dividers from all six service pages and gallery; added three concise scope tiles per service; shortened the first photo-led feature on five construction service pages; introduced white scope sections, navy image-led features, ivory supporting content and white project sections. Closing service CTAs use navy. Existing responsive photography, carousels, contact routes, FAQs and ADU feasibility guidance remain. Gallery now leads with photography, project name/category/town, omitting repeated photo counts and image-summary prose. Its attribution note remains, shortened to distinguish founder career work from LLC project authorship. No project-role claims or assets added.

Validation: 95 tests pass, clean build/release verification passes (177 public files). Browser inspected all six services and gallery at 390px: no document overflow, no broken loaded images, no section-divider elements, and three scope tiles per service. Desktop service and gallery screenshots saved under the main workspace docs/implementation/evidence/services-visual-refresh/ . Not a fresh Lighthouse or complete screen-reader audit; no live inquiry submitted.

Integration: use focused commit/patch against current design branch, preserve other agent maintenance changes and rerun release checks before an authorized restoration.
