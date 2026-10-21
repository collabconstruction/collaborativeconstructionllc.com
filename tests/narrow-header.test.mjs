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
