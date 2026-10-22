#!/usr/bin/env node
/**
 * One-off processor for the October 2026 Projects-page photo intake.
 *
 * For each source photo:
 *  - strips all EXIF/IPTC/XMP metadata (GPS included) by re-encoding
 *  - writes assets/img/<name>.jpg (mozjpeg, quality 82, no metadata)
 *  - writes assets/img/r/<name>-<width>.webp for the repo's established
 *    breakpoint set: the "core" widths [160, 480, 768, 1024, 1440, 1920]
 *    that are strictly less than the source width, plus the source width
 *    itself appended as the final (largest) rendition. This matches the
 *    pattern already present for every existing project image (verified
 *    against src/_data/projects.json + assets/img/r/* before writing this
 *    script -- e.g. a 709px-wide source gets [160, 480, 709], not
 *    [160, 480, 640, 709], because 640/768/868/1280 are not core widths,
 *    they only show up when they equal a source's own width).
 *
 * Not idempotent by design -- it is meant to run once per named mapping.
 * Re-running on an unchanged mapping just re-writes identical bytes.
 */
import sharp from "sharp";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const stagingRoot = path.join(repoRoot, ".intake-staging");
const imgDir = path.join(repoRoot, "assets", "img");
const rDir = path.join(imgDir, "r");

const CORE_WIDTHS = [160, 480, 768, 1024, 1440, 1920];

// source (relative to .intake-staging/) -> output base name (no extension)
const MAPPING = [
  // -- Modern Custom Residence (existing project, new angles) --
  ["Bath Remodels/Custom Bath.jpg", "modern-home-5"],
  ["Bath Remodels/Custom Bath 4.jpg", "modern-home-6"],

  // -- Custom Residence / Belmont (existing project, new angles) --
  ["Custom Homes/Custom Home Belmont 1.jpg", "belmont-exterior-2"],
  ["Custom Homes/Custom Home Belmont 2.jpg", "belmont-kitchen"],

  // -- New project: shingle-style custom home --
  ["Custom Homes/New Construction 1.jpeg", "shingle-home-1"],
  ["Custom Homes/New Construction 2.jpeg", "shingle-home-2"],
  ["Custom Homes/New Construction 3.jpeg", "shingle-home-3"],
  ["Custom Homes/New Construction 4.jpeg", "shingle-home-4"],
  ["Custom Homes/New Construction 5.jpeg", "shingle-home-5"],

  // -- New project: coastal bath remodel --
  ["Bath Remodels/Cust Bath 1.jpg", "coastal-bath-1"],
  ["Bath Remodels/Cust Bath 2.jpg", "coastal-bath-2"],
  ["Bath Remodels/Cust Bath 3.jpg", "coastal-bath-3"],
  ["Bath Remodels/Cust Bath 4.jpg", "coastal-bath-4"],

  // -- New project: traditional kitchen --
  ["Kitchen Remodels/Custom Kitchen 6.jpg", "traditional-kitchen-1"],
  ["Kitchen Remodels/Custom Kitchen 7.jpg", "traditional-kitchen-2"],

  // -- New project: fieldstone kitchen (single photo) --
  ["Kitchen Remodels/Kitchen Remodel 4.jpg", "fieldstone-kitchen-1"],

  // -- New project: custom interior built-in (single photo) --
  ["Kitchen Remodels/Kitchen Remodel 2.jpg", "custom-interior-built-in-1"],

  // -- New project: pool cabana --
  ["Pool Projects/Pool Cabana.jpg", "pool-cabana-1"],
  ["Pool Projects/Pool Cabana Close up.jpg", "pool-cabana-2"],
  ["Pool Projects/Pool Cabana Night.jpg", "pool-cabana-3"],

  // -- New project: custom pool (single photo) --
  ["Pool Projects/Custom Pool 1.jpg", "custom-pool-1"],

  // -- New project: pool deck (single photo) --
  ["Pool Projects/Deck and Pool.jpg", "pool-deck-1"],
];

function widthsFor(sourceWidth) {
  const core = CORE_WIDTHS.filter((w) => w < sourceWidth);
  if (!core.includes(sourceWidth)) core.push(sourceWidth);
  return core;
}

async function processOne(relSrc, outBase) {
  const srcPath = path.join(stagingRoot, relSrc);
  const img = sharp(srcPath, { failOn: "none" }).rotate(); // auto-orient from EXIF, then we strip EXIF below
  const meta = await img.metadata();
  const srcWidth = meta.width;
  const srcHeight = meta.height;

  // Full-size JPEG, metadata stripped (sharp drops all metadata by default
  // unless .withMetadata() is called -- we deliberately never call it).
  const jpgOut = path.join(imgDir, `${outBase}.jpg`);
  await sharp(srcPath, { failOn: "none" })
    .rotate()
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(jpgOut);

  const widths = widthsFor(srcWidth);
  for (const w of widths) {
    const webpOut = path.join(rDir, `${outBase}-${w}.webp`);
    await sharp(srcPath, { failOn: "none" })
      .rotate()
      .resize({ width: w })
      .webp({ quality: 80 })
      .toFile(webpOut);
  }

  return { outBase, srcWidth, srcHeight, widths };
}

async function main() {
  await mkdir(rDir, { recursive: true });
  const results = [];
  for (const [relSrc, outBase] of MAPPING) {
    const r = await processOne(relSrc, outBase);
    results.push(r);
    console.log(
      `${outBase.padEnd(28)} ${String(r.srcWidth).padStart(5)}x${r.srcHeight.toString().padEnd(5)} widths=[${r.widths.join(", ")}]`
    );
  }
  console.log(`\nProcessed ${results.length} photos.`);
  // Emit a JSON summary other scripts/steps can consume.
  const summaryPath = path.join(repoRoot, ".intake-staging", "_processed-summary.json");
  await (await import("node:fs/promises")).writeFile(summaryPath, JSON.stringify(results, null, 2));
  console.log(`Summary written to ${summaryPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
