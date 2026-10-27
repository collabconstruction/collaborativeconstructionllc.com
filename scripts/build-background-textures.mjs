#!/usr/bin/env node
/**
 * Derive the four published background-texture watermarks from their
 * untouched masters in brand/textures/src-*.png.
 *
 * The masters are owner-supplied transparent line-art PNGs (dot grids, a
 * corner bubble cluster, two flowing wave patterns). Each is already a
 * near-transparent overlay by construction (mean alpha well under 10%) -
 * the "ink" is the gray linework, not a background fill. This script does
 * three things to make them feel like one brand-consistent family rather
 * than four unrelated stock exports:
 *
 *   1. Tints the gray linework toward --brass-300 (#d4be91), the same warm
 *      accent used elsewhere in the Midnight & Brass system, instead of a
 *      cool neutral gray that would read as generic stock art.
 *   2. Resizes every master to the same 1100px max dimension, so none of
 *      them is disproportionately soft or sharp relative to the others at
 *      the shared CSS display width.
 *   3. Re-compresses as PNG (alpha required) at the same effort/quality
 *      settings for all four.
 *
 * One exception: wave-network is placed on .advisory-pm, whose background is
 * --paper-2 (a light tan). --brass-300 against that tan is too low-contrast
 * to read as a texture rather than a smudge, so wave-network alone tints to
 * --brass-700 (#776339) - darker/more saturated - instead of raising its
 * opacity. Opacity stays identical across all four placements; only this
 * one texture's color changes, because the fix is a contrast problem, not
 * a "needs to be more visible" problem.
 *
 * Every rendition resamples from its own master only. Re-run freely.
 *
 *   node scripts/build-background-textures.mjs
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = path.join(process.cwd(), "brand/textures");
const OUT_DIR = path.join(process.cwd(), "assets/img/textures");
const MAX_DIM = 1100;
const TINT = "#d4be91"; // --brass-300
const TINT_OVERRIDES = {
  "wave-network": "#776339", // --brass-700; sits on --paper-2 (tan), needs more contrast
};

async function main() {
  const files = (await readdir(SRC_DIR)).filter(
    (f) => f.startsWith("src-") && f.endsWith(".png"),
  );
  if (files.length === 0) {
    throw new Error(`No src-*.png masters found in ${SRC_DIR}`);
  }

  for (const file of files) {
    const name = file.replace(/^src-/, "").replace(/\.png$/, "");
    const srcPath = path.join(SRC_DIR, file);
    const outPath = path.join(OUT_DIR, `texture-${name}.png`);
    const tint = TINT_OVERRIDES[name] ?? TINT;

    await sharp(srcPath)
      .resize({
        width: MAX_DIM,
        height: MAX_DIM,
        fit: "inside",
        withoutEnlargement: true,
      })
      // Flatten to grayscale luminance before tinting. Several masters have
      // soft gradient fills (not pure line art), and tinting those directly
      // leaves uneven, muddy patches because tint() recolors per-channel
      // rather than per-luminance. Greyscaling first guarantees one clean,
      // uniform hue across all four, which is what "consistent" requires.
      .greyscale()
      .tint(tint)
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(outPath);

    const { size } = await sharp(outPath).metadata();
    console.log(`${file} -> ${path.relative(process.cwd(), outPath)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
