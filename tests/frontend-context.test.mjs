import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('../js/intake-context.js', import.meta.url), 'utf8');
function load(url, storage = new Map(), referrer = '') {
  const listeners = {};
  const sandbox = {window: {}, location: new URL(url), URL, URLSearchParams, Date, Event,
    sessionStorage: {getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)},
    document: {referrer, addEventListener: (k,v) => {listeners[k] = v;}, getElementById: () => null}};
  vm.runInNewContext(code, sandbox);
  return {api:sandbox.window.ccIntakeContext, listeners, storage};
}
test('service CTA retains safe campaign context at contact', () => {
  const first = load('https://example.com/adu-builder-cape-cod/?utm_source=google&utm_medium=organic&utm_campaign=fall_2026&email=private@example.com', new Map(), 'https://search.example/find?q=private');
  first.api.select('adu');
  const next = load('https://example.com/#contact', first.storage);
  assert.equal(next.api.get().project_type, 'adu');
  assert.equal(next.api.get().source_page, '/adu-builder-cape-cod/');
  assert.equal(next.api.get().utm_source, 'google');
  assert.equal(next.api.get().referrer, 'https://search.example');
  assert.ok(!JSON.stringify(next.api.get()).includes('private'));
});
test('expired state and unsafe UTM values are discarded', () => {
  const store = new Map([['cc-intake-context-v1', JSON.stringify({at: Date.now()-31*60*1000, project_type:'advisory', utm_source:'old'})]]);
  const {api} = load('https://example.com/private/customer@example.com?utm_source=customer%40example.com', store);
  assert.equal(api.get().utm_source, '');
  assert.equal(api.get().project_type, '');
  assert.equal(api.get().source_page, '/');
});
test('blocked sessionStorage does not prevent form context', () => {
  const sandbox = {window:{}, URL, URLSearchParams, Date, Event, location:new URL('https://example.com/'), sessionStorage:{getItem(){throw Error();},setItem(){throw Error();}}, document:{referrer:'',addEventListener(){}}};
  vm.runInNewContext(code,sandbox);
  assert.equal(sandbox.window.ccIntakeContext.get().source_page,'/');
});
