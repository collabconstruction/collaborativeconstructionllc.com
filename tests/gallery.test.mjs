import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const projects = JSON.parse(fs.readFileSync(new URL('../src/_data/projects.json', import.meta.url), 'utf8')).items;
const page = fs.readFileSync(new URL('../src/gallery.njk', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../js/gallery.js', import.meta.url), 'utf8');

test('Deck and Railings, then Porches and Upper Balcony, are the last two projects', () => {
  const titles = projects.map(p => p.title);
  assert.deepEqual(titles.slice(-2), ['Deck and Railings', 'Porches and Upper Balcony']);
  const order = page.match(/set order = \[([^\]]*)\]/)[1].split(',').map(s => s.trim().replace(/"/g, ''));
  assert.deepEqual(order.slice(-2), ['Deck and Railings', 'Porches and Upper Balcony']);
  assert.deepEqual([...order].sort(), [...titles].sort(), 'every project is placed exactly once');
});

test('the curated photo reductions are kept and every photo keeps real alt text', () => {
  const by = Object.fromEntries(projects.map(p => [p.title, p]));
  assert.equal(by['Deck and Railings'].images.length, 3);
  assert.equal(by['Porches and Upper Balcony'].images.length, 2);
  for (const p of projects) for (const img of p.images) {
    assert.ok(img.alt && img.alt.length > 10, `${p.title}: alt text missing on ${img.src}`);
    assert.ok(img.w > 0 && img.h > 0 && img.widths.length > 0, `${p.title}: size data missing on ${img.src}`);
    assert.ok(fs.existsSync(new URL(`..${img.src}`, import.meta.url)), `${img.src} exists`);
  }
});

test('three views, text links not buttons, no arrow controls', () => {
  assert.equal((page.match(/data-gallery-view="/g) || []).length, 3);
  assert.equal((page.match(/data-gallery-tab="/g) || []).length, 3);
  assert.ok(!/<button/i.test(page), 'no <button> on the gallery page');
  assert.ok(!/carousel__btn/.test(page));
});

test('cycling respects reduced motion, pauses on hover and focus, and runs only on screen', () => {
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /mouseenter/); assert.match(script, /focusin/);
  assert.match(script, /IntersectionObserver/); assert.match(script, /document\.hidden/);
});

test('each project is listed under its own category only', () => {
  for (const p of projects) assert.ok(['Residential', 'Commercial'].includes(p.category), p.title);
  assert.equal(projects.filter(p => p.category === 'Commercial').length, 3);
});
