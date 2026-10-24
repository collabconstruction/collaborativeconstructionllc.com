import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const textures = [
  'texture-diagonal-streaks.webp',
  'texture-sweeping-wave.webp',
  'texture-network-frame.webp',
];

test('the three selected full-section texture assets exist and are non-empty', () => {
  for (const name of textures) {
    const p = join(ROOT, 'assets/img/textures', name);
    assert.ok(existsSync(p), `assets/img/textures/${name} must exist`);
    const stat = statSync(p);
    assert.ok(stat.size > 1000, `assets/img/textures/${name} must be > 1KB (got ${stat.size})`);
  }
});

test('the protected live overlay publishes the texture directory', () => {
  const overlay = readFileSync(join(ROOT, 'scripts/build-live-overlay.mjs'), 'utf8');

  assert.match(overlay, /const OVERLAY = \[[\s\S]*"assets\/img\/textures"/);
  assert.match(overlay, /rel === "assets\/img\/textures"[\s\S]*await rm\(join\(OUT, rel\)/);
});

test('all three source texture masters exist in brand/textures', () => {
  for (const name of textures) {
    const srcName = name.replace(/^texture-/, 'src-').replace(/\.webp$/, '.png');
    const p = join(ROOT, 'brand/textures', srcName);
    assert.ok(existsSync(p), `brand/textures/${srcName} must exist`);
  }
});

test('stylesheet uses only the three selected textures as full-section artwork', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /\.company-credentials::after/);
  assert.match(css, /\.company-principles::after/);
  assert.match(css, /\.gallery-stage\.project-gallery::before/);
  assert.doesNotMatch(css, /texture-(?:dot-grid|corner-bubbles|wave-ribbon|wave-network)/);

  for (const name of textures) {
    assert.ok(css.includes(`../assets/img/textures/${name}`), `css must reference ${name}`);
  }
});

test('service and Projects artwork stays oversized, faint and behind content', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /\.service-page \.about-page-hero::before\s*\{[^}]*background-size:\s*min\(1580px, 108vw\)[^}]*opacity:\s*0\.065/s);
  assert.match(css, /\.page-gallery \.about-page-hero::before\s*\{[^}]*linear-gradient[^}]*gold-corridor\.webp[^}]*opacity:\s*0\.075/s);
  assert.match(css, /\.service-page \.svc-cta > \.container::before\s*\{[^}]*ribbon-wave-sparkle\.webp[^}]*rotate\(-30deg\)/s);
  assert.match(css, /\.service-page \.svc-cta > \.container::after\s*\{[^}]*gold-crossing-curves\.png[^}]*rotate\(7deg\)/s);
  assert.match(css, /\.service-page \.svc-cta > \.container::before,\s*\.service-page \.svc-cta > \.container::after\s*\{[^}]*opacity:\s*0\.055/s);
  assert.match(css, /\.service-page \.service-editorial \.figure img\s*\{[^}]*height:\s*clamp\(230px, 26vw, 350px\)[^}]*object-fit:\s*cover/s);
});

test('homepage service paths share desktop title, copy, list and action anchors', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /@media \(min-width: 820px\)\s*\{[^}]*\.paths\s*\{[^}]*align-items:\s*stretch/s);
  assert.match(css, /\.svc-path\s*\{[^}]*grid-template-rows:\s*auto minmax\(5\.25rem, auto\) 1fr auto/s);
  assert.match(css, /\.svc-path__head\s*\{[^}]*grid-template-rows:\s*minmax\(3rem, auto\) minmax\(2\.5rem, auto\)/s);
});

test('About and Projects textures cover their complete sections with one consistent treatment', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /\.company-credentials::after,\s*\.company-principles::after,\s*\.gallery-stage\.project-gallery::before\s*\{[^}]*inset:\s*0[^}]*width:\s*100%[^}]*height:\s*100%[^}]*background-size:\s*cover[^}]*opacity:\s*0\.1[^}]*filter:/s);
  assert.match(css, /\.company-credentials::after\s*\{[^}]*texture-network-frame\.webp/s);
  assert.match(css, /\.company-principles::after\s*\{[^}]*texture-sweeping-wave\.webp/s);
  assert.match(css, /\.gallery-stage\.project-gallery::before\s*\{[^}]*texture-diagonal-streaks\.webp/s);
});

test('About and Projects hero images continue the section artwork behind each page title', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /\.page-main:has\(\.company-overview\) \.about-page-hero::before\s*\{[^}]*display:\s*block[^}]*texture-sweeping-wave\.webp[^}]*opacity:\s*0\.14/s);
  assert.match(css, /\.page-gallery \.about-page-hero::before\s*\{[^}]*texture-diagonal-streaks\.webp[^}]*background-size:\s*cover[^}]*opacity:\s*0\.26/s);
  assert.match(css, /\.gallery-stage\.project-gallery\s*\{[^}]*linear-gradient\(125deg, rgba\(201, 173, 119/s);
});

test('the Projects/Gallery "Discuss your project" CTA uses the same restrained ribbon treatment as the service pages, not the brighter generic fallback', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  // Scoped (not .service-page, since gallery.njk has no .service-page wrapper) via the
  // page-gallery class that base.njk applies to <main> from the page's pageClass frontmatter.
  assert.match(
    css,
    /\.page-gallery \.svc-cta > \.container::before,\s*\.page-gallery \.svc-cta > \.container::after\s*\{[^}]*opacity:\s*0\.055[^}]*filter:\s*sepia\(0\.65\) saturate\(0\.72\) hue-rotate\(351deg\) brightness\(1\.04\)[^}]*fine-gold-threads\.webp/s,
    'gallery CTA ribbons must match the service-page opacity/filter/texture, not the brighter generic .svc-cta fallback'
  );

  // The same image the gallery's own hero already uses, so the CTA reads as the same
  // piece of artwork as the rest of the page rather than an unrelated swirl.
  assert.match(css, /\.page-main:has\(\.project-gallery\) \.about-page-hero::before\s*\{[^}]*fine-gold-threads\.webp/s);

  assert.match(
    css,
    /\.page-gallery \.svc-cta > \.container::before\s*\{[^}]*inset:\s*auto auto -38% -9%[^}]*width:\s*58%[^}]*height:\s*168%[^}]*rotate\(-30deg\)/s
  );
  assert.match(
    css,
    /\.page-gallery \.svc-cta > \.container::after\s*\{[^}]*inset:\s*-24% -10% auto auto[^}]*width:\s*57%[^}]*height:\s*154%[^}]*rotate\(7deg\)/s
  );

  // Mobile insets must shrink the same way the service-page ribbons do, so the gallery
  // CTA cannot silently regress to the desktop-sized (clipped/overflowing) ribbons on
  // small screens in a future merge.
  assert.match(
    css,
    /@media \(max-width: 680px\)\s*\{[\s\S]*\.page-gallery \.svc-cta > \.container::before\s*\{[^}]*inset:\s*auto auto -25% -20%[^}]*width:\s*72%[^}]*height:\s*136%/
  );
  assert.match(
    css,
    /@media \(max-width: 680px\)\s*\{[\s\S]*\.page-gallery \.svc-cta > \.container::after\s*\{[^}]*inset:\s*-13% -22% auto auto[^}]*width:\s*70%[^}]*height:\s*128%/
  );
});
