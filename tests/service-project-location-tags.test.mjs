import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const servicePages = [
  'adu-builder-cape-cod',
  'custom-home-builder-cape-cod',
  'home-additions-cape-cod',
  'home-renovation-cape-cod',
  'general-contractor-falmouth-ma',
];

test('service-page related project headings do not include location badges', () => {
  for (const slug of servicePages) {
    const page = readFileSync(new URL(`../src/${slug}/index.njk`, import.meta.url), 'utf8');
    const related = page.split('RELATED PROJECTS')[1];
    assert.ok(related, `${slug}: related-projects section exists`);
    assert.match(related, /class="project-head"/, `${slug}: project cards still present`);
    assert.doesNotMatch(related, /<span class="tag">/, `${slug}: no uneven location badges`);
  }
});

test('service-page CSS has no dead project-head tag selector', () => {
  const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /\.service-page\s+\.project-head\s+\.tag\s*\{/);
  assert.match(css, /\.service-page\s+\.project-head\s*\{/);
});
