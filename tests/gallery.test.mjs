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

const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
const galleryCss = css.slice(css.indexOf('.gallery-stage {'));

test('Residential rows put the town directly under the title, in the same place every time, with no big background word', () => {
  assert.ok(!page.includes('gallery-row__town'), 'the large faint town word is gone from the markup');
  assert.ok(!galleryCss.includes('gallery-row__town'), 'and from the styles');
  const block = page.slice(page.indexOf('<article class="gallery-row'), page.indexOf('</article>', page.indexOf('<article class="gallery-row')));
  assert.match(block, /<h3>[^<]*<\/h3>\s*<p class="gallery-row__place">/, 'the town line follows the title');
  assert.ok(block.indexOf('gallery-row__place') < block.indexOf('gallery-row__shows'), 'the short description comes after the town');
});

test('tabs are large serif text with no dot, no underline and no box', () => {
  const tabs = galleryCss.slice(galleryCss.indexOf('.gallery-views {'), galleryCss.indexOf('/* shared: a slot'));
  assert.ok(!/border-radius\s*:\s*50%/.test(tabs), 'no round dot');
  assert.ok(!/translateY|scale\(0\)/.test(tabs), 'no bobbing or dot animation');
  assert.ok(!/underline|border-bottom/.test(tabs), 'no underline');
  assert.ok(!/background\s*:/.test(tabs), 'no box');
  assert.match(tabs, /min-height:\s*44px/, 'a comfortable tap target');
  assert.match(tabs, /a\[aria-current="true"\]\s*\{[^}]*color:\s*var\(--navy\)/, 'the active tab is solid navy');
  assert.match(tabs, /a:not\(:last-child\)::after\s*\{\s*content:\s*"\/"/, 'thin slash between tabs');
  assert.match(tabs, /focus-visible\s*\{\s*outline:\s*2px solid/, 'keyboard focus stays visible');
});

test('the gallery is tighter than before: short banner, smaller gaps, shorter bands', () => {
  assert.match(css, /\.page-main:has\(\.project-gallery\) \.about-page-hero \{ padding-block: 30px 20px; \}/);
  assert.match(galleryCss, /margin-bottom: clamp\(22px, 3\.4vw, 46px\)/);
  assert.match(galleryCss, /min-height: clamp\(300px, 48vh, 480px\)/);
  assert.match(galleryCss, /column-gap: clamp\(10px, 1\.6vw, 20px\)/);
});

test('no gallery rule underlines text', () => {
  assert.ok(!/text-decoration\s*:\s*underline/.test(galleryCss));
});
