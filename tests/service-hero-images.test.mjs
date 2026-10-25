import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serviceHeroSelectors = [
  '.service-page--additions .about-page-hero::before',
  '.service-page--adu .about-page-hero::before',
  '.service-page--renovation .about-page-hero::before',
  '.service-page--custom .about-page-hero::before',
  '.service-page--advisory .about-page-hero::before',
];

test('service page hero background images are centered and do not have translate offsets', () => {
  const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');

  // Ensure the shared service-page hero rule centers the background and sets low opacity
  assert.match(css, /\.service-page\s+\.about-page-hero::before\s*\{[^}]*background-position:\s*center/);
  assert.match(css, /\.service-page\s+\.about-page-hero::before\s*\{[^}]*opacity:\s*0\.1[0-9]/);

  // Ensure none of the individual service page rules apply translateX/translateY offsets
  for (const selector of serviceHeroSelectors) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`);
    const match = css.match(regex);
    assert.ok(match, `${selector} exists in styles.css`);
    const ruleBody = match[1];
    assert.doesNotMatch(ruleBody, /translate[XY]?\s*\(/i, `${selector} must not shift position with translate`);
    assert.match(ruleBody, /background-image:\s*url\(/i, `${selector} must specify its background image`);
  }
});
