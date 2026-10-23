import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const textures = [
  'texture-dot-grid.png',
  'texture-corner-bubbles.png',
  'texture-wave-ribbon.png',
  'texture-wave-network.png',
];

test('all four published background texture assets exist and are non-empty', () => {
  for (const name of textures) {
    const p = join(ROOT, 'assets/img/textures', name);
    assert.ok(existsSync(p), `assets/img/textures/${name} must exist`);
    const stat = statSync(p);
    assert.ok(stat.size > 1000, `assets/img/textures/${name} must be > 1KB (got ${stat.size})`);
  }
});

test('all four source texture masters exist in brand/textures', () => {
  for (const name of textures) {
    const srcName = name.replace(/^texture-/, 'src-');
    const p = join(ROOT, 'brand/textures', srcName);
    assert.ok(existsSync(p), `brand/textures/${srcName} must exist`);
  }
});

test('stylesheet defines texture accents for all four sections', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  // Check section rules
  assert.match(css, /#services::after/);
  assert.match(css, /\.company-principles::after/);
  assert.match(css, /\.home-work::after/);
  assert.match(css, /\.advisory-pm::after/);

  // Check all four asset URLs
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

test('all four selected textures have visible theme-tinted About or Projects placements', () => {
  const css = readFileSync(join(ROOT, 'css/styles.css'), 'utf8');

  assert.match(css, /\.company-credentials::after\s*\{[^}]*texture-wave-network\.png[^}]*opacity:\s*0\.2[^}]*filter:/s);
  assert.match(css, /\.company-principles::after\s*\{[^}]*width:\s*min\(900px, 68vw\)[^}]*opacity:\s*0\.13[^}]*filter:/s);
  assert.match(css, /\.gallery-stage\.project-gallery::before\s*\{[^}]*texture-wave-ribbon\.png[^}]*opacity:\s*0\.12[^}]*filter:/s);
  assert.match(css, /\.gallery-stage\.project-gallery::after\s*\{[^}]*texture-dot-grid\.png[^}]*opacity:\s*0\.18[^}]*filter:/s);
});
