# Original residential model and asset pipeline

`lib/house/model.mjs` is the source of truth. Original procedural geometry, not a downloaded house, AI photo or a model of a completed company project. A modest one-storey pitched-roof residence uses ivory walls, navy roof/glazing, brass details, simple entry steps and minimal planting. Named site/foundation/frame/walls/roof/details/interior groups support assembly and a basic cutaway. Proportions and stages are illustrative, not design, building-code or engineering advice.

Run `npm run build:house` (also runs before every normal site build):
- Bundle runtime to local `js/house-scene.js` with pinned esbuild/Three versions.
- Export `assets/models/residential-study.glb` through Three's GLTFExporter. The browser builds the identical model procedurally, so it does not fetch this GLB again. The GLB is an editable/exportable asset, not required runtime overhead.
- Project the same final exterior geometry into `assets/models/residential-study.svg`, an always-present poster. No independent hand-drawn duplicate house to drift from the 3D version.
- Copy the installed Three MIT license to `assets/models/THREE-LICENSE.txt`.

No textures, external fonts/models, Draco workers, decoder downloads or post-processing. Geometry has a <10,000-triangle test budget; GLB <300KB; renderer bundle <200KB gzip (actual measurements in QA). SVG poster is deliberately vector; no image-generation tool or photorealistic asset is required.

Edit geometry/materials here, then regenerate. Do not hand-edit generated files. Keep the named construction groups if replacing the model. A GLB from Blender can be imported for future authoring, but swapping to a downloaded model requires verified rights and a new performance/visual review. Existing project photos and brand master/renditions remain independent, authentic assets.
