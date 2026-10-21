import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../js/main.js', import.meta.url),'utf8');
const code = source.slice(source.indexOf('  const form = $("#contact-form");'), source.indexOf('  /* [INTAKE-HANDLER-END]'));
function setup(responses, autoRefresh = true) {
  const events={}, requests=[], tracked=[];
  const fields=Object.fromEntries(['name','email','message','project_type','cc_x7q2m9','cf-turnstile-response'].map(name=>[name,{name,value:name==='email'?'test@example.com':'test',disabled:false}]));
  fields.project_type.value=''; fields.cc_x7q2m9.value='';
  const button={textContent:'Send',disabled:false};
  const elements=[...Object.values(fields),button]; elements.namedItem=n=>fields[n];
  const status={textContent:'',className:'',append(...items){this.textContent+=items.map(i=>i.textContent||'').join('');}};
  const form={elements,addEventListener:(k,v)=>{events[k]=v;},reportValidity:()=>true,reset(){Object.values(fields).forEach(f=>f.value='');}};
  let ids=0, resets=0, now=1000, expired=false;
  const challengeStatus={textContent:""};
  class Payload {constructor(){this.data=new Map(Object.values(fields).map(f=>[f.name,f.value]));}set(k,v){this.data.set(k,v);}delete(k){this.data.delete(k);}append(k,v){this.data.set(k,v);}}
  const sandbox={window:{crypto:{randomUUID:()=>`uuid-${++ids}`},ccTrack:name=>tracked.push(name),turnstile:{isExpired:()=>expired,reset:()=>{resets++; fields["cf-turnstile-response"].value=""; if(autoRefresh) fresh();}}},Date:{now:()=>now},document:{getElementById:()=>challengeStatus,createElement:()=>({textContent:'',href:''}),createTextNode:text=>({textContent:text}),querySelector:()=>null,querySelectorAll:()=>[],readyState:'complete',addEventListener(){}},$:(selector)=>({'#contact-form':form,'.form-status':status,'button[type=submit]':button}[selector]||null),FormData:Payload,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{requests.push(options.body.data);const next=responses.shift();if(next instanceof Error)throw next;return{ok:next.httpOk??true,json:async()=>next};}};
  function fresh() { expired=false; const token=`challenge-${now}-${resets}`; fields['cf-turnstile-response'].value=token; sandbox.window.ccChallengeSuccess(token); }
  vm.runInNewContext(fs.readFileSync(new URL('../js/turnstile-lifecycle.js',import.meta.url),'utf8'),sandbox);
  fresh();
  vm.runInNewContext(code,sandbox);
  return {events,requests,status,fields,tracked,challengeStatus,window:sandbox.window,fresh,advance:ms=>now+=ms,expire:()=>{expired=true;},resets:()=>resets,submit:()=>events.submit({preventDefault(){}})};
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

test('sleeping tab blocks stale token without posting or losing customer fields', async()=>{
 const s=setup([{ok:true,stored:true,id:'saved'}],false); s.advance(240000);
 await s.submit(); assert.equal(s.requests.length,0); assert.equal(s.fields.name.value,'test'); assert.equal(s.fields.message.value,'test'); assert.equal(s.fields.cc_x7q2m9.value,'');
 assert.match(s.status.textContent,/fresh verification/); await s.submit(); assert.equal(s.requests.length,0);
 s.fresh(); await s.submit(); assert.equal(s.requests.length,1); assert.equal(s.tracked.length,1);
});
test('expiry, timeout and error callbacks invalidate even a nonempty field',async()=>{
 for(const name of ['ccChallengeExpired','ccChallengeTimeout','ccChallengeError']) {
  const s=setup([],false); s.window[name](); await s.submit(); assert.equal(s.requests.length,0); assert.equal(s.fields.email.value,'test@example.com');
 }
});
test('widget expiry, token mismatch and missing API fail closed',async()=>{
 for(const invalidate of [s=>s.expire(),s=>s.fields['cf-turnstile-response'].value='other',s=>delete s.window.turnstile]) {
  const s=setup([],false);invalidate(s); await s.submit(); assert.equal(s.requests.length,0);assert.equal(s.fields.name.value,'test');
 }
});
test('server rejection requires new challenge and preserves same submission identity',async()=>{
 const s=setup([{httpOk:false,error:'Please complete the verification and try again.'},{ok:true,stored:true,id:'saved'}],false);
 const old=s.fields['cf-turnstile-response'].value;
 await s.submit(); assert.equal(s.fields.name.value,'test');assert.equal(s.resets(),1);
 s.fields['cf-turnstile-response'].value=old; await s.submit(); assert.equal(s.requests.length,1);
 s.fresh();await s.submit();assert.equal(s.requests.length,2);assert.notEqual(s.requests[1].get('cf-turnstile-response'),old);assert.equal(s.requests[0].get('submission_id'),s.requests[1].get('submission_id'));
});
test('lifecycle script registers callbacks before it loads the async provider', () => {
  // The page no longer carries a static api.js tag. turnstile-lifecycle.js registers the callbacks
  // first and injects api.js itself, only when a visitor heads for the form.
  const html = fs.readFileSync(new URL('../src/index.njk', import.meta.url), 'utf8');
  const lifecycle = fs.readFileSync(new URL('../js/turnstile-lifecycle.js', import.meta.url), 'utf8');
  assert.ok(html.includes('/js/turnstile-lifecycle.js'));
  assert.ok(!html.includes('https://challenges.cloudflare.com/turnstile/v0/api.js'), 'no static api.js tag that could race the callbacks');
  assert.ok(lifecycle.indexOf('window.ccChallengeSuccess') < lifecycle.indexOf('https://challenges.cloudflare.com/turnstile/v0/api.js'));
  for (const callback of ['ccChallengeSuccess', 'ccChallengeExpired', 'ccChallengeTimeout', 'ccChallengeError']) {
    assert.ok(html.includes('="' + callback + '"'));
    assert.ok(lifecycle.includes('window.' + callback));
  }
});

test('double click cannot send or validate the same challenge twice',async()=>{
 const s=setup([{ok:true,stored:true,id:'saved'}]); await Promise.all([s.submit(),s.submit()]);
 assert.equal(s.requests.length,1);assert.equal(s.tracked.length,1);
});
