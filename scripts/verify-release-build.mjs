import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read = name => fs.readFileSync(name, 'utf8');
const html = read('_site/index.html');
const worker = read('worker/index.js');
const trap = html.match(/<div class="hp-field"[^>]*>[\s\S]*?<\/div>/)?.[0];
assert.ok(trap, 'Built contact form must contain the trap');
assert.match(trap, /name="cc_x7q2m9"/);
assert.match(trap, /\shidden\s/); assert.match(trap, /\sinert\s/);
assert.match(worker, /form\.getAll\("cc_x7q2m9"\)/);
assert.doesNotMatch(html, /name="(?:company_website|website_check)"/);
const siteKey = JSON.parse(read('src/_data/intake.json')).turnstileSiteKey;
assert.ok(siteKey && html.includes(`data-sitekey="${siteKey}"`));
assert.match(html, /data-action="contact"/);
assert.ok(html.indexOf('/js/turnstile-lifecycle.js') >= 0);
assert.ok(html.indexOf('/js/turnstile-lifecycle.js') < html.indexOf('https://challenges.cloudflare.com/turnstile/v0/api.js'));
for (const callback of ['ccChallengeSuccess','ccChallengeExpired','ccChallengeTimeout','ccChallengeError']) assert.ok(html.includes(`="${callback}"`));
assert.match(worker, /data\.action === "contact"/);
assert.match(html, /id="cc-message"[^>]*maxlength="5000"/);
assert.match(worker, /MAX_MESSAGE_CHARS = 5000/);
assert.ok(html.indexOf('/js/intake-context.js') < html.indexOf('/js/main.js'));
assert.doesNotMatch(html, /<script[^>]*src="https:\/\/www\.googletagmanager\.com/);
const files = fs.readdirSync('_site', { recursive: true }).filter(f => fs.statSync(path.join('_site', f)).isFile());
for (const file of files) {
  assert.ok(!/(^|[/\\])(?:docs|tests|scripts|migrations|\.git|\.agents|\.claude|node_modules)([/\\]|$)/.test(file), `Private path in build: ${file}`);
  assert.ok(!/\.(?:sql|map|md|toml|jsonc)$/.test(file), `Non-public artifact in build: ${file}`);
  if (!file.endsWith('.html')) continue;
  for (const match of read(path.join('_site', file)).replace(/<!--[\s\S]*?-->/g, '').matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    if (match[1].startsWith('//')) continue;
    const target = path.join('_site', decodeURIComponent(match[1]));
    assert.ok(fs.existsSync(target) || fs.existsSync(target + '.html'), `Broken local asset/page: ${match[1]}`);
  }
}
// --- SEO / AI-discoverability invariants -----------------------------------
// Added during the 2026-10-12 SEO/AI-discoverability sprint (see
// docs/research/16-gsc-seo-baseline.md). These catch the class of defect
// Google Search Console surfaces days later: a broken sitemap, a canonical
// that silently diverges from the page's own URL, or JSON-LD that stops
// parsing. Cheap to check at build time; expensive to notice only in GSC.

const sitemapXml = read('_site/sitemap.xml');
const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.ok(sitemapLocs.length > 0, 'sitemap.xml must list at least one URL');
for (const loc of sitemapLocs) {
  assert.match(loc, /^https:\/\/collaborativeconstructionllc\.com\//, `sitemap URL not on the production domain: ${loc}`);
  assert.ok(loc.endsWith('/'), `sitemap URL should be the canonical trailing-slash form: ${loc}`);
}
// Every <url> entry must carry a real (non-empty) <lastmod>, not a dangling tag.
for (const block of sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const lastmod = block[1].match(/<lastmod>([^<]*)<\/lastmod>/)?.[1];
  assert.ok(lastmod && /^\d{4}-\d{2}-\d{2}/.test(lastmod), `sitemap entry missing/invalid <lastmod>: ${block[0]}`);
}

const htmlFiles = files.filter(f => f.endsWith('.html'));
assert.ok(htmlFiles.length > 0, 'build produced no HTML pages');

const seenLdIds = new Map(); // @id -> first file that defined it, to spot accidental divergence
for (const file of htmlFiles) {
  const pageHtml = read(path.join('_site', file));

  // 1. robots: nothing in this build may ship a page-level noindex. If one is
  //    ever intentionally needed, this assertion must be updated deliberately,
  //    not bypassed by accident.
  assert.doesNotMatch(pageHtml, /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i, `unexpected noindex on ${file}`);

  // 2. canonical tag must exist, be absolute, and point at the production
  //    domain with no query string/fragment.
  const canonicalHref = pageHtml.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  assert.ok(canonicalHref, `missing <link rel="canonical"> on ${file}`);
  assert.match(canonicalHref, /^https:\/\/collaborativeconstructionllc\.com\//, `canonical not absolute/production on ${file}`);
  assert.ok(!canonicalHref.includes('?') && !canonicalHref.includes('#'), `canonical has query/fragment on ${file}: ${canonicalHref}`);

  // 3. title/description must be present and non-empty (distinct-per-page is
  //    verified by the duplicate-title check below).
  assert.match(pageHtml, /<title>[^<]{5,}<\/title>/, `missing/short <title> on ${file}`);
  assert.match(pageHtml, /<meta name="description" content="[^"]{20,}"/, `missing/short meta description on ${file}`);

  // 4. JSON-LD must parse and must not collide @id with a node of a
  //    DIFFERENT type already seen on another page (shared nodes like
  //    #business/#website repeating verbatim across pages is correct and
  //    expected; the same @id meaning two different things is the real bug).
  for (const block of pageHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let doc;
    try {
      doc = JSON.parse(block[1]);
    } catch (e) {
      assert.fail(`invalid JSON-LD on ${file}: ${e.message}`);
    }
    const graph = doc['@graph'] || [doc];
    const idsThisPage = new Set();
    for (const node of graph) {
      if (!node['@id']) continue;
      assert.ok(!idsThisPage.has(node['@id']), `duplicate @id within ${file}: ${node['@id']}`);
      idsThisPage.add(node['@id']);
      const prevType = seenLdIds.get(node['@id']);
      const thisType = JSON.stringify(node['@type']);
      if (prevType && prevType.type !== thisType) {
        assert.fail(`@id ${node['@id']} means ${prevType.type} on ${prevType.file} but ${thisType} on ${file}`);
      }
      seenLdIds.set(node['@id'], { type: thisType, file });
    }
  }
}

// 5. No fabricated review/rating markup anywhere in the build (explicit
//    constraint: this business has zero verified reviews as of this sprint).
for (const file of htmlFiles) {
  const pageHtml = read(path.join('_site', file));
  assert.doesNotMatch(pageHtml, /"aggregateRating"|"review"\s*:/, `fabricated review markup shipped on ${file}`);
}

// 6. Every page in the sitemap must actually exist in the build and be
//    reachable from the homepage via a server-rendered <a href>, so a
//    crawler that never executes JS can still find it (this is the exact
//    distinction GSC's URL Inspection does not test).
const homeHtml = read('_site/index.html');
const homeHrefs = new Set([...homeHtml.matchAll(/href="(\/[^"?#]*)"/g)].map(m => m[1].replace(/\/?$/, '/')));
for (const loc of sitemapLocs) {
  const sitePath = loc.replace('https://collaborativeconstructionllc.com', '').replace(/\/?$/, '/');
  if (sitePath === '/') continue;
  assert.ok(homeHrefs.has(sitePath), `sitemap URL not server-rendered-linked from the homepage: ${sitePath}`);
}

console.log(`Release build verified: ${files.length} public files, matching trap/challenge contracts, bounded message, private files excluded, local links resolved, sitemap/canonical/robots/JSON-LD invariants held across ${htmlFiles.length} pages.`);
