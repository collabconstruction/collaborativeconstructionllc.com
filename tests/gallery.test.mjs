import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const projects = JSON.parse(fs.readFileSync(new URL('../src/_data/projects.json', import.meta.url), 'utf8')).items;
const page = fs.readFileSync(new URL('../src/gallery.njk', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('../js/gallery.js', import.meta.url), 'utf8');

const groupsBlock = page.match(/set groups = \[([\s\S]*?)\] -%\}/)[1];
const groupTypes = [...groupsBlock.matchAll(/type: "([a-z-]+)"/g)].map(m => m[1]);

test('one page, grouped by type: residential types first, Decks and railings last among them, Commercial last of all', () => {
  assert.deepEqual(groupTypes, ['custom-homes', 'kitchen-remodels', 'bath-remodels', 'pool-projects', 'decks-and-railings', 'commercial']);
  assert.equal(groupTypes.at(-1), 'commercial');
  assert.equal(groupTypes.at(-2), 'decks-and-railings');
  for (const p of projects) assert.ok(groupTypes.includes(p.type), `${p.title} has a known type (${p.type})`);
  for (const p of projects.filter(x => x.type === 'commercial')) assert.equal(p.category, 'Commercial', p.title);
  for (const p of projects.filter(x => x.type !== 'commercial')) assert.equal(p.category, 'Residential', p.title);
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

test('no tabs or views; the only buttons are the two arrows on a project that has more than one photo', () => {
  assert.ok(!/data-gallery-tab|data-gallery-view|gallery-views/.test(page), 'the tab and view switcher is gone');
  assert.ok(!/carousel__btn/.test(page));
  const buttons = page.match(/<button[^>]*>/g) || [];
  assert.equal(buttons.length, 2, 'one previous and one next arrow in the template');
  for (const b of buttons) { assert.match(b, /type="button"/); assert.match(b, /\bhidden\b/, 'hidden until the script runs'); assert.match(b, /aria-label="(Previous|Next) photo of \{\{ p\.title \}\}"/); }
  assert.match(page, /\{%- if p\.images \| length > 1 %\}/, 'single photo projects get no arrows');
  assert.ok(!/data-gallery-tab|hashchange|history\.replaceState/.test(script), 'the script no longer switches views');
});

test('photos change only when the visitor clicks: no timers, short fade, keyboard and screen reader support', () => {
  assert.ok(!/setInterval|setTimeout|data-interval|data-cycle/.test(script + page), 'nothing changes automatically');
  assert.match(script, /addEventListener\("click"/);
  assert.match(script, /ArrowLeft/); assert.match(script, /ArrowRight/);
  assert.match(script, /aria-hidden/); assert.match(script, /Photo " \+ \(idx \+ 1\) \+ " of "/);
  assert.match(script, /naturalWidth > 0/, 'never fades to a photo that has not loaded');
});

const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
const galleryCss = css.slice(css.indexOf('.gallery-stage {'));

test('the gallery shows no towns anywhere in its markup or its styles', () => {
  assert.ok(!/p\.location|__town|__place|gallery-row|gallery-band|gallery-tile/.test(page), 'the template never prints a location');
  assert.ok(!/__town|__place|gallery-row|gallery-band|gallery-tile|gallery-collage/.test(galleryCss), 'no old view styles remain');
});

test('each card is a photo slot with the project title and the short description below it, and a type with no projects is skipped', () => {
  assert.match(page, /<figcaption><span class="gallery-card__title">\{\{ p\.title \}\}<\/span>\{% if p\.shows %\}<span class="gallery-card__shows">/);
  assert.match(page, /\{%- if items %\}/);
  assert.match(page, /groupby\("type"\)/);
  assert.ok(!/gallery-card__town/.test(page));
});

test('groups are compact: tight gaps, short cards, Commercial set apart by space and a hairline', () => {
  assert.match(galleryCss, /\.gallery-grid \{[^}]*gap: clamp\(12px, 1\.8vw, 22px\)/);
  assert.match(galleryCss, /\.gallery-media \{[^}]*aspect-ratio: 3 \/ 2/);
  assert.match(galleryCss, /\.gallery-group--commercial::before \{[^}]*height: 1px/);
  assert.match(css, /\.page-gallery \.about-page-hero \{ padding-block: 30px 20px; \}/);
});

test('the built gallery lists the types in order and prints no town names', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = fs.mkdtempSync(new URL('../', import.meta.url).pathname.replace(/\/$/, '') + '/.gallery-test-');
  try {
    execFileSync('npx', ['eleventy', `--output=${out}`], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', timeout: 180000 });
    const html = fs.readFileSync(`${out}/gallery/index.html`, 'utf8');
    const main = html.slice(html.indexOf('class="gallery-stage'), html.indexOf('svc-cta'));
    const headings = [...main.matchAll(/<h2 id="[a-z-]+-heading">([^<]+)<\/h2>/g)].map(m => m[1]);
    assert.deepEqual(headings, ['Custom homes', 'Kitchen remodels', 'Bath remodels', 'Pool projects', 'Decks and railings', 'Commercial projects']);
    for (const town of ['Belmont', 'Carlisle', 'Falmouth', 'Rockland', 'Dudley', 'Hingham', 'New Seabury', 'Monomoscoy']) assert.ok(!main.includes(town), `${town} appears in the gallery`);
    assert.equal((main.match(/<figure class="gallery-card">/g) || []).length, projects.length, 'every project is shown exactly once');
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('no gallery rule underlines text', () => {
  assert.ok(!/text-decoration\s*:\s*underline/.test(galleryCss));
});

test('the shorter banner uses a dedicated page class, not :has(), and the class is set on the gallery page only', () => {
  assert.match(page, /pageClass: page-gallery/);
  const base = fs.readFileSync(new URL('../src/_includes/base.njk', import.meta.url), 'utf8');
  assert.match(base, /class="page-main\{% if pageClass %\} \{\{ pageClass \}\}\{% endif %\}"/);
  assert.ok(!/\.page-main:has\(\.project-gallery\) \.about-page-hero \{ padding-block: 30px/.test(css), 'the :has() version of the new rules is gone');
  for (const f of ['about.njk', 'index.njk', 'construction-advisory.njk']) assert.ok(!/pageClass: page-gallery/.test(fs.readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8')));
});

test('the arrows are plain: a translucent round control, a short fade only, no zoom, and visible keyboard focus', () => {
  const arrows = galleryCss.slice(galleryCss.indexOf('.gallery-arrow {'), galleryCss.indexOf('.gallery-group {'));
  assert.match(arrows, /width: 44px; height: 44px/, 'a comfortable tap target');
  assert.match(arrows, /focus-visible \{ outline: 2px solid/);
  assert.ok(!/animation|scale\(|keyframes/.test(arrows + galleryCss.slice(galleryCss.indexOf('.gallery-frame {'), galleryCss.indexOf('.gallery-frame.is-live'))), 'no zoom or keyframe motion');
  assert.match(galleryCss, /\.gallery-frame \{[^}]*transition: opacity \.25s ease/);
});

test('the page is called Projects, in the heading, the title, the breadcrumb and the structured data name', () => {
  assert.match(page, /<h1>Projects<\/h1>/);
  assert.match(page, /title: "Projects \| Collaborative Construction, LLC"/);
  assert.match(page, /breadcrumbName: "Projects"/);
  assert.match(page, /schemaName: "Projects"/);
  assert.ok(!/<h1>Gallery/.test(page) && !/title: "Gallery/.test(page));
  assert.match(page, /permalink: \/gallery\/index\.html/, 'the address does not change');
});
