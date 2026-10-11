import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const trap = 'cc_x7q2m9';

// Exercise the real Worker entry point with synthetic bindings only. This
// deliberately needs no Phase 1 migration, live account, or notification.
async function request(extra = [], challengeSuccess = true) {
  let inserts = 0, challenges = 0;
  const db = {
    prepare(sql) {
      return { bind() { return this; }, async first() { return null; },
        async run() { if (/^\s*INSERT INTO leads\b/.test(sql)) inserts++; } };
    },
    async batch(statements) { return Promise.all(statements.map(s => s.run())); },
  };
  const context = vm.createContext({ Request, Response, FormData, URL,
    TextEncoder, Uint8Array, AbortSignal, crypto: webcrypto, btoa,
    console: { error() {} }, fetch: async () => {
      challenges++;
      return Response.json({ success: challengeSuccess,
        hostname: 'collaborativeconstructionllc.com', action: 'contact' });
    } });
  const module = new vm.SourceTextModule(read('worker/index.js'), { context });
  await module.link(() => new vm.SyntheticModule(['EmailMessage'], function () {
    this.setExport('EmailMessage', class {});
  }, { context }));
  await module.evaluate();
  const form = new FormData();
  for (const [key, value] of [
    ['name', 'Synthetic Autofill Check'], ['email', 'test@example.invalid'],
    ['message', 'Synthetic regression inquiry'], ['cf-turnstile-response', 'synthetic'],
    [trap, ''], ...extra,
  ]) form.append(key, value);
  const origin = 'https://collaborativeconstructionllc.com';
  const pending = [];
  const response = await module.namespace.default.fetch(new Request(origin + '/api/contact', {
    method: 'POST', headers: { origin }, body: form,
  }), { DB: db, TURNSTILE_SECRET_KEY: 'synthetic-test-only',
    INTAKE_RATE_LIMITER: { async limit() { return { success: true }; } },
  }, { waitUntil(promise) { pending.push(promise); } });
  await Promise.all(pending);
  return { status: response.status, body: await response.json(), inserts, challenges };
}

test('organization autofill does not trigger the neutral honeypot', async () => {
  const result = await request([
    ['company_website', 'Endicott College'], ['organization', 'Endicott College'],
    ['website_check', 'Endicott College'],
  ]);
  assert.equal(result.status, 200); assert.equal(result.body.ok, true);
  assert.equal(result.inserts, 1); assert.equal(result.challenges, 1);
});

test('a populated trap rejects even when an empty duplicate comes first', async () => {
  const result = await request([[trap, 'Endicott College']]);
  assert.equal(result.status, 422); assert.equal(result.body.ok, false);
  assert.equal(result.inserts, 0);
});

test('non-string honeypot values cannot evade rejection', async () => {
  const result = await request([[trap, new Blob(['spam'], { type: 'text/plain' })]]);
  assert.equal(result.status, 422); assert.equal(result.inserts, 0);
});

test('legitimate autofill still requires a successful challenge', async () => {
  const result = await request([['company_website', 'Endicott College']], false);
  assert.equal(result.status, 403); assert.equal(result.body.ok, false);
  assert.equal(result.inserts, 0); assert.equal(result.challenges, 1);
});

test('trap markup excludes autofill semantics, keyboard and accessibility navigation', () => {
  const markup = read('src/index.njk').match(/<div class="hp-field"[^>]*>[\s\S]*?<\/div>/)?.[0];
  assert.ok(markup);
  for (const pattern of [/\shidden(?:\s|>)/, /\sinert(?:\s|>)/,
    /aria-hidden="true"/, /name="cc_x7q2m9"/, /tabindex="-1"/,
    /autocomplete="off"/, /data-1p-ignore/, /data-lpignore="true"/, /data-bwignore/]) {
    assert.match(markup, pattern);
  }
  assert.doesNotMatch(markup, /company_website|website_check|organization|Company website/);
  assert.match(read('css/styles.css'), /\.hp-field\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('analytics ignores the renamed trap', () => {
  assert.match(read('js/analytics.js'), /if \(e\.target\.name === "cc_x7q2m9"\) return;/);
});

test('the actual submit handler sends the populated trap without clearing it', async () => {
  const source = read('js/main.js');
  const start = source.indexOf('  const form = $("#contact-form");');
  const end = source.indexOf('\n  /* ----------------------------------------------------------------------\n     Particles', start);
  assert.ok(start >= 0 && end > start);
  const events = {}, requests = [];
  const fields = Object.fromEntries([['name', 'Synthetic Check'], ['email', 'test@example.invalid'],
    ['message', 'Synthetic only'], [trap, 'Endicott College']].map(([name, value]) =>
    [name, { name, value, disabled: false }]));
  const button = { textContent: 'Send', disabled: false };
  const elements = [...Object.values(fields), button]; elements.namedItem = name => fields[name];
  const form = { ...fields, elements, reportValidity: () => true,
    addEventListener: (name, callback) => { events[name] = callback; },
    reset() { throw Error('A rejected submission must not reset the form'); } };
  const status = { textContent: '', classList: { add() {} }, append() {} };
  class Payload {
    constructor() { this.values = new Map(Object.values(fields).map(f => [f.name, f.value])); }
    set(key, value) { this.values.set(key, value); }
    delete(key) { this.values.delete(key); }
    append(key, value) { this.values.set(key, value); }
  }
  vm.runInNewContext(source.slice(start, end), {
    window: { crypto: webcrypto }, document: { cookie: '', referrer: '',
      createElement: () => ({}), createTextNode: text => ({ textContent: text }) },
    location: { pathname: '/', search: '' }, URLSearchParams, FormData: Payload,
    DataTransfer: class { files = []; }, AbortController, setTimeout, clearTimeout,
    $: selector => ({ '#contact-form': form, '.form-status': status,
      'button[type=submit]': button }[selector] || null),
    fetch: async (_url, options) => {
      requests.push(options.body.values);
      return { ok: false, json: async () => ({ ok: false, error: 'Rejected' }) };
    },
  });
  await events.submit({ preventDefault() {} });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].get(trap), 'Endicott College');
  assert.equal(fields[trap].value, 'Endicott College');
});
