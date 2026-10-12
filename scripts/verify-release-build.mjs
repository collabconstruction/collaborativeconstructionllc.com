import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read = name => fs.readFileSync(name, 'utf8');
const html = read('_site/index.html');
const worker = read('worker/index.js');
const trap = html.match(/<div class="hp-field"[^>]*>[\s\S]*?<\/div>/)?.[0];
assert.ok(trap, 'Built contact form must contain the trap');
assert.match(trap, /name="cc_x7q2m9"/);
assert.match(trap, /\shidden\s/); assert.match(trap, /\sinert\s/);
assert.match(worker, /form\.getAll\("cc_x7q2m9"\)/);
assert.doesNotMatch(html, /name="(?:company_website|website_check)"/);
const siteKey = JSON.parse(read('src/_data/intake.json')).turnstileSiteKey;
assert.ok(siteKey && html.includes(`data-sitekey="${siteKey}"`));
assert.match(html, /data-action="contact"/);
assert.ok(html.indexOf('/js/turnstile-lifecycle.js') >= 0);
assert.ok(html.indexOf('/js/turnstile-lifecycle.js') < html.indexOf('https://challenges.cloudflare.com/turnstile/v0/api.js'));
for (const callback of ['ccChallengeSuccess','ccChallengeExpired','ccChallengeTimeout','ccChallengeError']) assert.ok(html.includes(`="${callback}"`));
assert.match(worker, /data\.action === "contact"/);
assert.match(html, /id="cc-message"[^>]*maxlength="5000"/);
assert.match(worker, /MAX_MESSAGE_CHARS = 5000/);
assert.ok(html.indexOf('/js/intake-context.js') < html.indexOf('/js/main.js'));
assert.doesNotMatch(html, /<script[^>]*src="https:\/\/www\.googletagmanager\.com/);
const files = fs.readdirSync('_site', { recursive: true }).filter(f => fs.statSync(path.join('_site', f)).isFile());
for (const file of files) {
  assert.ok(!/(^|[/\\])(?:docs|tests|scripts|migrations|\.git|\.agents|\.claude|node_modules)([/\\]|$)/.test(file), `Private path in build: ${file}`);
  assert.ok(!/\.(?:sql|map|md|toml|jsonc)$/.test(file), `Non-public artifact in build: ${file}`);
  if (!file.endsWith('.html')) continue;
  for (const match of read(path.join('_site', file)).replace(/<!--[\s\S]*?-->/g, '').matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    if (match[1].startsWith('//')) continue;
    const target = path.join('_site', decodeURIComponent(match[1]));
    assert.ok(fs.existsSync(target) || fs.existsSync(target + '.html'), `Broken local asset/page: ${match[1]}`);
  }
}
console.log(`Release build verified: ${files.length} public files, matching trap/challenge contracts, bounded message, private files excluded, local links resolved.`);
