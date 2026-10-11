import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../js/main.js', import.meta.url),'utf8');
const code = source.slice(source.indexOf('  const form = $("#contact-form");'), source.indexOf('\n  /* ----------------------------------------------------------------------\n     Particles'));
function setup(responses) {
  const events={}, requests=[], tracked=[];
  const fields=Object.fromEntries(['name','email','message','project_type','cc_x7q2m9'].map(name=>[name,{name,value:name==='email'?'test@example.com':'test',disabled:false}]));
  fields.project_type.value=''; fields.cc_x7q2m9.value='';
  const button={textContent:'Send',disabled:false};
  const elements=[...Object.values(fields),button]; elements.namedItem=n=>fields[n];
  const status={textContent:'',className:'',append(...items){this.textContent+=items.map(i=>i.textContent||'').join('');}};
  const form={elements,addEventListener:(k,v)=>{events[k]=v;},reportValidity:()=>true,reset(){Object.values(fields).forEach(f=>f.value='');}};
  let ids=0, resets=0;
  class Payload {constructor(){this.data=new Map(Object.values(fields).map(f=>[f.name,f.value]));}set(k,v){this.data.set(k,v);}delete(k){this.data.delete(k);}append(k,v){this.data.set(k,v);}}
  const sandbox={window:{crypto:{randomUUID:()=>`uuid-${++ids}`},ccTrack:name=>tracked.push(name),turnstile:{reset:()=>resets++}},document:{createElement:()=>({textContent:'',href:''}),createTextNode:text=>({textContent:text})},$:(selector)=>({'#contact-form':form,'.form-status':status,'button[type=submit]':button}[selector]||null),FormData:Payload,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{requests.push(options.body.data);const next=responses.shift();if(next instanceof Error)throw next;return{ok:next.httpOk??true,json:async()=>next};}};
  vm.runInNewContext(code,sandbox);
  return {events,requests,status,fields,tracked,submit:()=>events.submit({preventDefault(){}})};
}
test('uncertain network retry keeps submission identity and customer input',async()=>{
  const s=setup([new Error('offline'),{ok:true,stored:true,id:'saved-reference'}]);
  await s.submit(); assert.equal(s.fields.name.value,'test'); assert.match(s.status.textContent,/could not confirm/i);
  await s.submit(); assert.equal(s.requests[0].get('submission_id'),s.requests[1].get('submission_id')); assert.match(s.status.textContent,/inquiry is saved/i); assert.equal(s.tracked.length,1);
});
test('editing input after failure rotates submission identity',async()=>{
  const s=setup([new Error('offline'),new Error('offline')]); await s.submit(); s.events.input({target:{name:'message'}}); await s.submit();
  assert.notEqual(s.requests[0].get('submission_id'),s.requests[1].get('submission_id'));
});
test('HTTP success without durable storage never resets or tracks conversion',async()=>{
  const s=setup([{ok:true,id:'not-durable'}]);await s.submit();assert.equal(s.fields.name.value,'test'); assert.equal(s.tracked.length,0); assert.match(s.status.textContent,/could not confirm/i);
});
test('server errors remain literal text and attachment failures remain saved inquiries',async()=>{
  const s=setup([{httpOk:false,error:'<img src=x onerror=alert(1)>'},{ok:true,stored:true,id:'saved',attachments:{failedCount:1,pending:true}}]);
  await s.submit();assert.match(s.status.textContent,/<img/);assert.equal(s.status.innerHTML,undefined);
  await s.submit();assert.match(s.status.textContent,/Some attachments/);assert.match(s.status.textContent,/still being processed/);assert.equal(s.tracked.length,1);
});

test('client transmits a populated neutral honeypot unchanged rather than clearing it',async()=>{
 const s=setup([{httpOk:false,error:'Rejected'}]);s.fields.cc_x7q2m9.value='Endicott College';
 await s.submit();assert.equal(s.requests[0].get('cc_x7q2m9'),'Endicott College');assert.equal(s.fields.cc_x7q2m9.value,'Endicott College');
});
test('honeypot markup is nonsemantic, hidden, inert and outside focus navigation',()=>{
 const html=fs.readFileSync(new URL('../src/index.njk',import.meta.url),'utf8');
 const wrapper=html.match(/<div class="hp-field"[^>]*>[\s\S]*?<\/div>/)[0];
 assert.match(wrapper,/\shidden(?:\s|>)/);assert.match(wrapper,/\sinert(?:\s|>)/);assert.match(wrapper,/aria-hidden="true"/);
 assert.match(wrapper,/name="cc_x7q2m9"/);assert.match(wrapper,/tabindex="-1"/);assert.match(wrapper,/autocomplete="off"/);
 assert.doesNotMatch(wrapper,/company_website|website_check|organization|Company website/);
});
