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
