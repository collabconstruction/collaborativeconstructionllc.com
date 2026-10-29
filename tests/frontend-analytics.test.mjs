import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
function setup(choice, ctxGet, href) {
  const scripts = [], nodes = [];
  function node(tag) { const n = {tag, listeners:{}, getBoundingClientRect(){return {height:0};}, classList:{add(){},remove(){}},setAttribute(){},appendChild(){},remove(){},addEventListener(k,v){this.listeners[k]=v;}}; nodes.push(n); return n; }
  const sandbox = {window:{__CC_ANALYTICS:{measurementId:'G-TEST',consent:{message:'Consent',accept:'Accept',decline:'Decline'}},ccIntakeContext:{currentPage:()=>'/adu-builder-cape-cod/',get:()=>ctxGet||{}}},location:new URL(href||'https://collaborativeconstructionllc.com/?email=private@example.com'),Date,encodeURIComponent,URLSearchParams,setTimeout: f=>f(),requestAnimationFrame:f=>f(),localStorage:{getItem:()=>choice,setItem(){}},document:{readyState:'complete',addEventListener(){},getElementById:()=>null,createElement:node,head:{appendChild:s=>scripts.push(s)},body:{appendChild(){}},documentElement:{style:{setProperty(){}},classList:{add(){},remove(){}}}}};
  vm.runInNewContext(code,sandbox);
  return {window:sandbox.window,scripts,nodes};
}
test('unknown and denied consent cause no GA loader or queued events',()=>{
  for (const choice of [null,'denied']) {const s=setup(choice); assert.equal(s.scripts.length,0); assert.equal(s.window.ccTrack('generate_lead'),false); assert.equal(s.window.dataLayer,undefined);}
});
test('accept loads once and emits safe events without lead IDs or query strings',()=>{
  const s=setup(null); const accept=s.nodes.find(n=>n.textContent==='Accept'); accept.listeners.click(); accept.listeners.click();
  assert.equal(s.scripts.length,1);
  assert.equal(s.window.ccTrack('generate_lead',{lead_id:'secret-customer',form_location:'/?private'}),true);
  const log=JSON.stringify(s.window.dataLayer.map(v=>Array.from(v)));
  assert.ok(!log.includes('secret-customer')); assert.ok(!log.includes('private')); assert.ok(log.includes('/adu-builder-cape-cod/'));
});

function configOf(s){
  s.nodes.find(n=>n.textContent==='Accept').listeners.click();
  return s.window.dataLayer.map(v=>Array.from(v)).find(v=>v[0]==='config')[2];
}
test('campaign visit: checked utm tags from this page address are forwarded',()=>{
  const s=setup(null,{},'https://collaborativeconstructionllc.com/?utm_source=facebook&utm_medium=social&utm_campaign=intro_post&email=private@example.com&utm_term=bad%20value');
  const cfg=configOf(s);
  assert.equal(cfg.page_location,'https://collaborativeconstructionllc.com/adu-builder-cape-cod/?utm_source=facebook&utm_medium=social&utm_campaign=intro_post');
  assert.ok(!cfg.page_location.includes('private'));
});
test('direct visit: no utm tags and no referrer sends a bare page_location and empty page_referrer',()=>{
  const s=setup(null,{referrer:''},'https://collaborativeconstructionllc.com/');
  const cfg=configOf(s);
  assert.equal(cfg.page_location,'https://collaborativeconstructionllc.com/adu-builder-cape-cod/');
  assert.equal(cfg.page_referrer,'');
});
test('internal navigation: a later page does not inherit remembered utm tags, and our own site is never the referrer',()=>{
  const s=setup(null,{utm_source:'facebook',utm_medium:'social',utm_campaign:'intro_post',referrer:'https://collaborativeconstructionllc.com'},'https://collaborativeconstructionllc.com/gallery/');
  const cfg=configOf(s);
  assert.equal(cfg.page_location,'https://collaborativeconstructionllc.com/adu-builder-cape-cod/');
  assert.equal(cfg.page_referrer,'');
});
test('external referrer: an outside origin is forwarded with no path or query',()=>{
  const s=setup(null,{referrer:'https://www.facebook.com'});
  assert.equal(configOf(s).page_referrer,'https://www.facebook.com');
});
test('malformed utm value is dropped, not forwarded as-is',()=>{
  const s=setup(null,{},'https://collaborativeconstructionllc.com/?utm_source=%3Cscript%3E');
  assert.equal(configOf(s).page_location,'https://collaborativeconstructionllc.com/adu-builder-cape-cod/');
});
test('denied consent still sends nothing, even with utm tags and a referrer',()=>{
  const s=setup('denied',{utm_source:'facebook',referrer:'https://www.facebook.com'});
  assert.equal(s.scripts.length,0); assert.equal(s.window.dataLayer,undefined);
});
