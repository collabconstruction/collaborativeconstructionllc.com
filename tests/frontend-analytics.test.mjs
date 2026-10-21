import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
function setup(choice, ctxGet) {
  const scripts = [], nodes = [];
  function node(tag) { const n = {tag, listeners:{}, getBoundingClientRect(){return {height:0};}, classList:{add(){},remove(){}},setAttribute(){},appendChild(){},remove(){},addEventListener(k,v){this.listeners[k]=v;}}; nodes.push(n); return n; }
  const sandbox = {window:{__CC_ANALYTICS:{measurementId:'G-TEST',consent:{message:'Consent',accept:'Accept',decline:'Decline'}},ccIntakeContext:{currentPage:()=>'/adu-builder-cape-cod/',get:()=>ctxGet||{}}},location:new URL('https://collaborativeconstructionllc.com/?email=private@example.com'),Date,encodeURIComponent,setTimeout: f=>f(),requestAnimationFrame:f=>f(),localStorage:{getItem:()=>choice,setItem(){}},document:{readyState:'complete',addEventListener(){},getElementById:()=>null,createElement:node,head:{appendChild:s=>scripts.push(s)},body:{appendChild(){}},documentElement:{style:{setProperty(){}},classList:{add(){},remove(){}}}}};
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

function pageLocationSent(s){
  s.nodes.find(n=>n.textContent==='Accept').listeners.click();
  const cfg=s.window.dataLayer.map(v=>Array.from(v)).find(v=>v[0]==='config');
  return cfg[2].page_location;
}
test('page_location carries only checked utm tags, never other query values',()=>{
  const s=setup(null,{utm_source:'facebook',utm_medium:'social',utm_campaign:'intro_post',email:'private@example.com'});
  const loc=pageLocationSent(s);
  assert.equal(loc,'https://collaborativeconstructionllc.com/adu-builder-cape-cod/?utm_source=facebook&utm_medium=social&utm_campaign=intro_post');
  assert.ok(!loc.includes('private'));
});
test('page_location has no query string when there are no utm tags',()=>{
  const s=setup(null,{utm_source:'',utm_medium:'',utm_campaign:''});
  assert.equal(pageLocationSent(s),'https://collaborativeconstructionllc.com/adu-builder-cape-cod/');
});
test('denied consent still sends nothing, even with utm tags',()=>{
  const s=setup('denied',{utm_source:'facebook'});
  assert.equal(s.scripts.length,0); assert.equal(s.window.dataLayer,undefined);
});
