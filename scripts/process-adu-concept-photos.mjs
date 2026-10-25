#!/usr/bin/env node
/**
 * One-off processor for the October 2026 ADU concept illustrations.
 *
 * These two source images are AI-generated architectural concept illustrations,
 * not photographs of a built Collaborative Construction project. They are
 * processed with the same pipeline as every other project photo (metadata
 * stripped, mozjpeg quality 82, webp responsive set at the repo's "core"
 * breakpoints) so they are indistinguishable in the markup from a real photo;
 * the AI-generated disclosure lives in the gallery markup and data
 * (src/gallery.njk, src/_data/projects.json), not in the image pipeline.
 *
 * Not idempotent by design -- it is meant to run once per named mapping.
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
  // -- AI-generated ADU concept illustrations (not a built project) --
  ["adu-concepts/coastal-cottage.png", "adu-concept-cottage-1"],
  ["adu-concepts/coastal-carriage-house.png", "adu-concept-carriage-house-1"],
];

function widthsFor(sourceWidth) {
  const core = CORE_WIDTHS.filter((w) => w < sourceWidth);
  if (!core.includes(sourceWidth)) core.push(sourceWidth);
  return core;
}

async function processOne(relSrc, outBase) {
  const srcPath = path.join(stagingRoot, relSrc);
  const img = sharp(srcPath, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const srcWidth = meta.width;
  const srcHeight = meta.height;

  const jpgOut = path.join(imgDir, `${outBase}.jpg`);
  await sharp(srcPath, { failOn: "none" })
    .rotate()
    .flatten({ background: "#ffffff" })
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
