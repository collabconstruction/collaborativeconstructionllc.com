import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');

test('very narrow phones get a smaller header wordmark and gaps so no page scrolls sideways at 320px', () => {
  const m = css.match(/@media \(max-width: 340px\) \{([^}]*\}[^}]*\}[^}]*\}[^}]*\})\s*\}/);
  assert.ok(m, 'a 340px media block exists');
  assert.match(m[1], /\.brand-wm \{ font-size: \.72rem; \}/);
  assert.match(m[1], /\.header-right \{ gap: 6px; \}/);
});

test('the owner-reviewed header enlarges the mark and lowers the text without breaking narrow phones', () => {
  assert.match(css, /\.site-header \.brand \.logo \{ width: 54px; height: 54px; \}/);
  assert.match(css, /\.site-header \.brand-text \{ transform: translateY\(3px\); \}/);
  assert.match(css, /@media \(max-width: 340px\) \{\s*\.site-header \.brand \.logo \{ width: 38px; height: 38px; \}\s*\}/);
});
