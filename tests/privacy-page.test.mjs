import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page = fs.readFileSync(new URL('../src/privacy/index.njk', import.meta.url), 'utf8');
const business = JSON.parse(fs.readFileSync(new URL('../src/_data/business.json', import.meta.url), 'utf8'));

test('the privacy page names every data use it must disclose', () => {
  for (const word of ['Google Analytics', 'Cloudflare Web Analytics', 'Turnstile', 'IP address', 'photos or plans', 'remove your information']) {
    assert.ok(page.includes(word), `privacy page is missing: ${word}`);
  }
});

test('Decline wording says Google Analytics stops, not that nothing is sent', () => {
  assert.ok(!/nothing is sent/i.test(page));
  assert.ok(/Google Analytics does not run/.test(page));
});

test('the page cannot be published while owner markers remain', () => {
  if (business.privacyPublished) {
    assert.ok(!/\[Owner/.test(page), 'replace every [Owner ...] marker before publishing');
  } else {
    assert.ok(/\[Owner/.test(page), 'draft should still carry its owner markers until published');
  }
});
