#!/usr/bin/env node
/**
 * Regenerate every brand-mark rendition from one master file.
 *
 * The site shows the same circular house mark in four places at four sizes
 * (schema.org logo, header, badge, favicon). Hand-exporting those from a design
 * tool is how they drift apart: one gets re-cropped, another keeps the old
 * colour, and nobody notices until the favicon and the header disagree. This
 * derives all four from `assets/logo.png` so they cannot.
 *
 * Every rendition is resampled from the owner-supplied original in `brand/`,
 * never from another rendition. That is what makes re-running safe: resampling
 * an already-resampled export compounds the softening each time, so the one
 * pristine source stays the only input. `brand/` sits outside both the Eleventy
 * input dir and the passthrough-copy list, so the master is version-controlled
 * without being published.
 *
 *   node scripts/build-brand-assets.mjs                  # from brand/cc-house-mark.png
 *   node scripts/build-brand-assets.mjs path/to/new.png  # adopt a new master
 *
 * `fill` is the fraction of the square canvas the mark's longest side occupies.
 * Small renditions get a larger fraction on purpose: at 64px, whitespace that
 * reads as breathing room at 1024px just throws away pixels the glyph needs.
 */
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const MASTER = path.join(ROOT, "brand", "cc-house-mark.png");

/** Every brand surface, and what consumes it. Keep this list in sync with
 *  src/_data/business.json `images` and the <link rel> tags in base.njk. */
const RENDITIONS = [
  { file: "logo.png", size: 1024, fill: 0.86, used: "schema.org Organization logo (lib/schema.js)" },
  { file: "logo-header.png", size: 512, fill: 0.86, used: "site header brand lockup (base.njk)" },
  { file: "c-icon.png", size: 256, fill: 0.88, used: "apple-touch-icon, footer badge, gallery mark" },
  { file: "favicon.png", size: 64, fill: 0.96, used: "browser tab icon" },
];

/** Alpha bounding box of the mark. sharp's own .trim() thresholds on colour
 *  distance from a corner pixel, which is the wrong question for a transparent
 *  PNG: it cannot tell a fully transparent pixel from a faint antialiased one.
 *  Reading the alpha channel directly is unambiguous. */
async function contentBox(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Ignore all-but-invisible edge pixels so a stray 1% antialias halo
      // does not quietly widen the box and shrink every rendition.
      if (data[(y * width + x) * channels + 3] < 16) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error("master image is fully transparent, nothing to export");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const source = process.argv[2] ? path.resolve(process.argv[2]) : MASTER;
const box = await contentBox(source);
console.log(`master: ${path.relative(ROOT, source)}, mark occupies ${box.width}x${box.height} at (${box.left},${box.top})`);

// Crop once; every rendition is a resize of this same trimmed mark.
const mark = await sharp(source).extract(box).png().toBuffer();

for (const { file, size, fill, used } of RENDITIONS) {
  const scaled = await sharp(mark)
    .resize({ width: Math.round(size * fill), height: Math.round(size * fill), fit: "inside" })
    .png()
    .toBuffer();
  const { width, height } = await sharp(scaled).metadata();

  const out = path.join(ASSETS, file);
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaled, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    // The mark is flat colour on transparency, so an indexed palette is lossless
    // in practice and roughly halves each file.
    .png({ palette: true, compressionLevel: 9 })
    .toFile(out);

  const { size: bytes } = await stat(out);
  console.log(`  ${file.padEnd(17)} ${String(size).padStart(4)}px  ${String(Math.round(bytes / 102.4) / 10).padStart(5)} KB , ${used}`);
}
