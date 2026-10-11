import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
function setup(choice) {
  const scripts = [], nodes = [];
  function node(tag) { const n = {tag, listeners:{}, classList:{add(){},remove(){}},setAttribute(){},appendChild(){},remove(){},addEventListener(k,v){this.listeners[k]=v;}}; nodes.push(n); return n; }
  const sandbox = {window:{__CC_ANALYTICS:{measurementId:'G-TEST',consent:{message:'Consent',accept:'Accept',decline:'Decline'}},ccIntakeContext:{currentPage:()=>'/adu-builder-cape-cod/'}},location:new URL('https://example.com/?email=private@example.com'),Date,encodeURIComponent,setTimeout: f=>f(),requestAnimationFrame:f=>f(),localStorage:{getItem:()=>choice,setItem(){}},document:{readyState:'complete',addEventListener(){},getElementById:()=>null,createElement:node,head:{appendChild:s=>scripts.push(s)},body:{appendChild(){}},documentElement:{classList:{add(){},remove(){}}}}};
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
