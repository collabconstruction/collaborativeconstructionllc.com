const { execFileSync } = require("node:child_process");
const { jsonld } = require("./lib/schema.js");

/**
 * Sitemap <lastmod> from the file's last git commit date.
 *
 * Deliberately NOT file mtime: on a fresh clone or in CI every file's mtime is
 * the checkout time, which would republish the whole sitemap as "just changed"
 * on every build and train crawlers to distrust the signal. Git history is the
 * real answer to "when did this content last change".
 */
const gitDateCache = new Map();
function gitLastModified(inputPath) {
  if (gitDateCache.has(inputPath)) return gitDateCache.get(inputPath);
  let iso;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", inputPath], {
      encoding: "utf8",
    }).trim();
    iso = out ? new Date(out).toISOString().slice(0, 10) : null;
  } catch {
    iso = null;
  }
  // Uncommitted file (new page not yet committed): fall back to today.
  if (!iso) iso = new Date().toISOString().slice(0, 10);
  gitDateCache.set(inputPath, iso);
  return iso;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("gitLastModified", gitLastModified);

  // Static assets keep their existing URLs so no external link, share card, or
  // cached Google result breaks.
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({ "robots.txt": "robots.txt" });

  // Build the JSON-LD @graph for a page. Everything it emits derives from
  // src/_data, so structured data cannot drift from the rendered page.
  eleventyConfig.addFilter("jsonld", jsonld);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
};
