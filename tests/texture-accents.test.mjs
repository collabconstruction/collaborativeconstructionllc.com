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
