import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const servicePages = ['adu-builder-cape-cod', 'home-additions-cape-cod', 'home-renovation-cape-cod', 'custom-home-builder-cape-cod', 'general-contractor-falmouth-ma'];

test('every check mark on the five service pages is different, so the pages do not read as copies', () => {
  const all = [];
  for (const dir of servicePages) {
    const items = [...read(`src/${dir}/index.njk`).match(/<ul class="service-checks">(.*?)<\/ul>/s)[1].matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
    assert.equal(items.length, 3, dir);
    all.push(...items);
  }
  assert.equal(new Set(all).size, all.length, `duplicate check marks: ${all.filter((x, i) => all.indexOf(x) !== i).join('; ')}`);
});

test('the site copy contains no em or en dashes', () => {
  for (const f of ['index.njk', 'about.njk', 'gallery.njk', 'construction-advisory.njk', ...servicePages.map((d) => `${d}/index.njk`)]) {
    assert.ok(!/[—–]|&mdash;|&ndash;/.test(read(`src/${f}`)), `${f} has a dash`);
  }
});

test('buttons and closing headings use sentence case, including the Gallery closing call to action', () => {
  for (const f of ['gallery.njk', ...servicePages.map((d) => `${d}/index.njk`)]) {
    const s = read(`src/${f}`);
    assert.ok(!s.includes('Contact Us Today'), `${f} still has Title Case "Contact Us Today"`);
    assert.ok(!/Discuss Your /.test(s), `${f} still has a Title Case "Discuss Your ..." heading`);
    assert.ok(!s.includes('View Full Project Gallery'), `${f}`);
  }
  assert.match(read('src/gallery.njk'), /<h2 data-reveal-words>Discuss your project<\/h2>/);
  assert.match(read('src/gallery.njk'), /Contact us today<\/a>/);
});

test('credentials are bold on the About page, the owner is not named, and the brand tagline is kept', () => {
  const about = read('src/about.njk');
  for (const strong of ['<strong>30 years</strong>', '<strong>Construction Supervisor License (CSL)</strong>', "<strong>Bachelor's degree, Boston University.</strong>", '<strong>licensed Massachusetts builder</strong>']) assert.ok(about.includes(strong), strong);
  for (const f of ['index.njk', 'about.njk', 'gallery.njk', ...servicePages.map((d) => `${d}/index.njk`)]) assert.ok(!/Wesleigh|Behn/.test(read(`src/${f}`)), `${f} names the owner`);
  assert.match(read('src/index.njk'), /Experience, Quality, Trust/);
});

test('the About heading speaks of experience, and the line below attributes it to the person leading the work', () => {
  const about = read('src/about.njk');
  assert.match(about, /Over 30 years of residential and commercial construction experience\.<\/h2>/);
  assert.match(about, /Your project is led by a <strong>licensed Massachusetts builder<\/strong>/);
});

test('no invented claims: no review, testimonial, rating or concept project wording was added to the pages', () => {
  for (const f of ['index.njk', 'about.njk', 'gallery.njk', ...servicePages.map((d) => `${d}/index.njk`)]) {
    const s = read(`src/${f}`);
    assert.ok(!/testimonial|five-star|5-star|rated |concept (?:design|visuali)/i.test(s), `${f} contains review or concept wording`);
  }
});
