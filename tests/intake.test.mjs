import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { webcrypto, randomUUID } from 'node:crypto';
import { File } from 'node:buffer';

const sqlBridge = `import sqlite3,json,sys
p=json.load(sys.stdin)
c=sqlite3.connect(p['path']);c.row_factory=sqlite3.Row
try:
 if 'schema' in p: c.executescript(p['schema']);out=[]
 else:
  out=[]
  with c:
   for q in p['queries']:
    cur=c.execute(q['sql'],q.get('args',[]));out.append([dict(r) for r in cur.fetchall()])
 print(json.dumps(out))
except Exception:
 sys.exit(2)
finally: c.close()
`;
function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'cc-intake-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'test.sqlite');
  const call = payload => JSON.parse(execFileSync('python3', ['-c', sqlBridge], { input: JSON.stringify({ path, ...payload }), encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }));
  call({ schema: readFileSync('migrations/0001_existing_leads.sql','utf8') + '\n' + readFileSync('migrations/0002_lead_operations.sql','utf8') });
  const db = { prepare(sql) { return { sql, args: [], bind(...args) { this.args=args;return this; }, async first() { return call({ queries: [this] })[0][0] || null; }, async run() { return call({ queries:[this] }); } }; },
    async batch(queries) { if (options.failBatch?.(queries)) throw Error('synthetic failure'); return call({ queries }); } };
  const sent = [], objects = new Map(), logs = [];
  const env = { DB: db, INTAKE_LOCAL_TEST: 'true', LEAD_INBOX: 'owner@example.com', LEAD_FROM_ADDRESS: 'website@example.com',
    SEND_EMAIL: { async send(message) { if (options.failMail) throw Error('PRIVATE MESSAGE must not be logged'); sent.push(message); } },
    ATTACHMENTS: { async put(key, stream) { if (options.failUpload) throw Error('upload'); objects.set(key, await new Response(stream).arrayBuffer()); }, async delete(key) { objects.delete(key); } },
    INTAKE_RATE_LIMITER: { async limit() { return {success: !options.rateLimited}; } }, TURNSTILE_SECRET_KEY: 'synthetic-test-only' };
  const context = vm.createContext({ Request,Response,FormData,URL,TextEncoder,Uint8Array,crypto:webcrypto,AbortSignal,
    btoa, console:{error:(...a)=>logs.push(a.join(' '))},
    fetch: options.fetch || (async () => new Response(JSON.stringify(options.challenge || {success:true,hostname:'collaborativeconstructionllc.com',action:'contact'}),{status:200})) });
  const module = new vm.SourceTextModule(readFileSync('worker/index.js','utf8'),{context});
  const ready = (async()=> { await module.link(()=>new vm.SyntheticModule(['EmailMessage'],function(){this.setExport('EmailMessage',class{constructor(from,to,raw){Object.assign(this,{from,to,raw});}});},{context}));await module.evaluate();return module.namespace.default; })();
  async function send(fields={}, settings={}) {
    const form = new FormData();
    for (const [k,v] of Object.entries({name:'Synthetic Person',email:'test@example.com',message:'Synthetic inquiry only','cf-turnstile-response':'synthetic',submission_id:randomUUID(),...fields})) {
      if (v !== null) form.append(k,v);
    }
    for(const file of settings.files || []) form.append('attachments',file);
    for(const [key,value] of settings.extraFields || []) form.append(key,value);
    const origin=settings.local?'http://localhost:8787':'https://collaborativeconstructionllc.com';
    const req=new Request(origin+'/api/contact',{method:'POST',headers:{origin,...settings.headers},body:form});
    const pending=[];
    const response=await (await ready).fetch(req,env,{waitUntil:p=>pending.push(p)});
    await Promise.all(pending);
    return {status:response.status,body:await response.json(),headers:response.headers};
  }
  return {env,send,sent,objects,logs,ready,query:(sql,args=[])=>call({queries:[{sql,args}]})[0]};
}

test('durable intake, accountable workflow, sanitized attribution and provider acceptance',async t=>{
 const f=fixture(t); const r=await f.send({project_type:'advisory',project_town:'Falmouth',source_page:'/construction-advisory?email=secret',referrer:'https://example.org/page?name=secret',utm_source:'google',ga_client_id:'do-not-store'});
 assert.equal(r.status,200);assert.equal(r.body.stored,true);assert.equal(r.body.notification,'pending');
 const row=f.query('SELECT * FROM leads')[0],w=f.query('SELECT * FROM lead_workflow')[0];
 assert.equal(row.source_page,'/construction-advisory');assert.equal(row.referrer,'https://example.org');assert.equal(row.ga_client_id,null);
 assert.equal(w.assigned_to,'Wesleigh Behn');assert.ok(w.next_action);assert.ok(w.follow_up_due_at);assert.equal(w.project_type,'advisory');assert.equal(w.notification_state,'accepted');assert.equal(f.sent.length,1);
});
test('email failure is visible without losing or falsely rejecting saved lead',async t=>{
 const f=fixture(t,{failMail:true});const r=await f.send();assert.equal(r.body.stored,true);assert.equal(f.query('SELECT notification_state FROM lead_workflow')[0].notification_state,'failed');assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,1);assert.ok(!JSON.stringify(f.logs).includes('PRIVATE'));
});
test('missing DB fails even when email transport exists',async t=>{
 const f=fixture(t);delete f.env.DB;const r=await f.send();assert.equal(r.status,503);assert.equal(r.body.ok,false);assert.equal(f.sent.length,0);
});
test('transaction failure rolls back and sends no mail',async t=>{
 const f=fixture(t,{failBatch:q=>q.some(x=>x.sql.includes('INSERT INTO leads'))});const r=await f.send();assert.equal(r.status,503);assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,0);assert.equal(f.sent.length,0);
});
test('unchanged retry returns original receipt without duplicate notification',async t=>{
 const f=fixture(t);const submission_id=randomUUID();const a=await f.send({submission_id});const b=await f.send({submission_id});assert.equal(a.body.id,b.body.id);assert.equal(f.sent.length,1);assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,1);
});
test('concurrent identical retries remain one lead',async t=>{
 const f=fixture(t);const submission_id=randomUUID();const [a,b]=await Promise.all([f.send({submission_id}),f.send({submission_id})]);assert.equal(a.body.id,b.body.id);assert.equal(f.sent.length,1);
});
test('same receipt cannot silently drop edited project details',async t=>{
 const f=fixture(t);const submission_id=randomUUID();await f.send({submission_id});const r=await f.send({submission_id,message:'Changed inquiry'});assert.equal(r.status,409);assert.equal(f.sent.length,1);
});
test('invalid email, missing message and excessive fields never persist',async t=>{
 const f=fixture(t);for(const fields of [{email:'bad'},{message:''},{name:'a'.repeat(121)},{project_type:'invented'}]) assert.equal((await f.send(fields)).status,400);
 assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,0);
});
test('honeypot never reports a stored inquiry',async t=>{const f=fixture(t);const r=await f.send({cc_x7q2m9:'spam'});assert.equal(r.status,422);assert.equal(r.body.ok,false);});
test('origin and burst rate failures prevent intake',async t=>{
 const f=fixture(t,{rateLimited:true});assert.equal((await f.send({}, {headers:{origin:'https://evil.example'}})).status,403);assert.equal((await f.send({}, {production:true})).status,429);assert.equal(f.sent.length,0);
});
test('production cannot use local bypass or missing challenge configuration',async t=>{
 const f=fixture(t);delete f.env.TURNSTILE_SECRET_KEY;assert.equal((await f.send({}, {production:true})).status,503);
});
test('Turnstile verifies hostname and action and supports valid challenge',async t=>{
 const good=fixture(t);assert.equal((await good.send({'cf-turnstile-response':'synthetic'},{production:true})).status,200);
 const bad=fixture(t,{challenge:{success:true,hostname:'evil.example',action:'contact'}});assert.equal((await bad.send({'cf-turnstile-response':'synthetic'},{production:true})).status,403);
 const wrongAction=fixture(t,{challenge:{success:true,hostname:'collaborativeconstructionllc.com',action:'login'}});assert.equal((await wrongAction.send({'cf-turnstile-response':'synthetic'},{production:true})).status,403);
});
test('saved attachments stay private and linked to durable lead',async t=>{
 const f=fixture(t);const r=await f.send({}, {files:[new File(['synthetic pdf'],'plan.pdf',{type:'application/pdf'})]});assert.equal(r.status,200);assert.equal(f.objects.size,1);assert.equal(JSON.parse(f.query('SELECT attachment_keys FROM leads')[0].attachment_keys).length,1);assert.equal(r.body.attachments.failedCount,0);
});
test('attachment failure preserves inquiry and is visible to customer and staff',async t=>{
 const f=fixture(t,{failUpload:true});const r=await f.send({}, {files:[new File(['x'],'photo.png',{type:'image/png'})]});assert.equal(r.body.stored,true);assert.equal(r.body.attachments.failedCount,1);assert.equal(f.query('SELECT attachment_state FROM lead_workflow')[0].attachment_state,'partial_failure');
});
test('unconfirmed attachment metadata is surfaced as pending and orphan cleaned',async t=>{
 const f=fixture(t,{failBatch:q=>q.some(x=>x.sql.startsWith('UPDATE leads SET attachment_keys'))});const r=await f.send({}, {files:[new File(['x'],'photo.png',{type:'image/png'})]});assert.equal(r.body.attachments.failedCount,1);assert.equal(f.objects.size,0);assert.equal(f.query('SELECT attachment_state FROM lead_workflow')[0].attachment_state,'pending');
});
test('missing R2, unsupported/empty MIME and too many attachments fail visibly',async t=>{
 const f=fixture(t);assert.equal((await f.send({}, {files:[new File(['x'],'x.exe',{type:'application/octet-stream'})]})).status,400);
 assert.equal((await f.send({}, {files:[new File(['x'],'x.png')]})).status,400);
 assert.equal((await f.send({}, {files:Array.from({length:7},()=>new File(['x'],'x.png',{type:'image/png'}))})).status,400);
 delete f.env.ATTACHMENTS;assert.equal((await f.send({}, {files:[new File(['x'],'x.png',{type:'image/png'})]})).status,503);
});
test('body and individual upload size bounded',async t=>{
 const f=fixture(t);assert.equal((await f.send({}, {headers:{'content-length':String(30*1024*1024)}})).status,413);
 assert.equal((await f.send({}, {files:[new File([new Uint8Array(10*1024*1024+1)],'large.png',{type:'image/png'})]})).status,413);
});
test('notification status write failure remains a visible pending exception',async t=>{
 const f=fixture(t,{failBatch:q=>q.some(x=>x.sql.startsWith('UPDATE leads SET emailed'))});const r=await f.send();assert.equal(r.body.stored,true);assert.equal(f.query('SELECT notification_state FROM lead_workflow')[0].notification_state,'pending');
});
test('header injection rejected in email and removed from name',async t=>{
 const f=fixture(t);assert.equal((await f.send({email:'a@example.com\r\nBcc: bad@example.com'})).status,400);await f.send({name:'Name\r\nBcc: bad@example.com'});assert.ok(!f.sent[0].raw.includes('\r\nBcc:'));
});
test('redirects retain tags and API rejects GET without touching data',async t=>{
 const f=fixture(t),worker=await f.ready;
 const expect=[
  ['https://collaborativeconstructionllc.com/about.html?utm_source=google','https://collaborativeconstructionllc.com/about/?utm_source=google'],
  ['https://www.collaborativeconstructionllc.com/?utm_source=google','https://collaborativeconstructionllc.com/?utm_source=google'],
 ];
 for(const [url,location] of expect) {
  const r=await worker.fetch(new Request(url),f.env,{});assert.equal(r.status,301);assert.equal(r.headers.get('location'),location);
 }
 const r=await worker.fetch(new Request('https://collaborativeconstructionllc.com/api/contact'),f.env,{});assert.equal(r.status,405);assert.equal(r.headers.get('cache-control'),'no-store');
});

test('every legacy/duplicate URL form redirects 301 directly to its final canonical page, in one hop',async t=>{
 const f=fixture(t),worker=await f.ready;
 // Mirrors the exact 18-entry list in worker/index.js's LEGACY_REDIRECTS and the
 // matching run_worker_first entries in wrangler.jsonc. Kept as a literal table here
 // (not re-imported) so this test fails loudly if the two ever drift apart.
 //
 // The General Contracting page was removed 2026-10-24: it's no longer a canonical
 // destination, so all three of its historical URL forms (including its own former
 // canonical trailing-slash path) now redirect straight to the homepage instead.
 const legacy=[
  ['/index.html','/'],
  ['/about','/about/'],['/about.html','/about/'],
  ['/gallery','/gallery/'],['/gallery.html','/gallery/'],
  ['/construction-advisory','/construction-advisory/'],['/construction-advisory.html','/construction-advisory/'],
  ['/adu-builder-cape-cod','/adu-builder-cape-cod/'],['/adu-builder-cape-cod.html','/adu-builder-cape-cod/'],
  ['/custom-home-builder-cape-cod','/custom-home-builder-cape-cod/'],['/custom-home-builder-cape-cod.html','/custom-home-builder-cape-cod/'],
  ['/home-additions-cape-cod','/home-additions-cape-cod/'],['/home-additions-cape-cod.html','/home-additions-cape-cod/'],
  ['/home-renovation-cape-cod','/home-renovation-cape-cod/'],['/home-renovation-cape-cod.html','/home-renovation-cape-cod/'],
  ['/general-contractor-falmouth-ma','/'],['/general-contractor-falmouth-ma.html','/'],['/general-contractor-falmouth-ma/','/'],
 ];
 assert.equal(legacy.length,18);
 const destinations=new Set(legacy.map(([,to])=>to));
 for(const [from,to] of legacy) {
  // No entry's destination is itself a key elsewhere in the table -- i.e. a redirect can never chain into a second redirect.
  assert.ok(!legacy.some(([otherFrom])=>otherFrom===to),`destination ${to} must not also be a legacy source (would chain)`);
  const r=await worker.fetch(new Request(`https://collaborativeconstructionllc.com${from}?x=1`),f.env,{});
  assert.equal(r.status,301,`${from} should redirect 301`);
  assert.equal(r.headers.get('location'),`https://collaborativeconstructionllc.com${to}?x=1`,`${from} should land on its final canonical URL with the query string preserved`);
 }
 assert.equal(destinations.size,8,'the 18 legacy forms should collapse onto exactly the 8 remaining canonical pages');
});

test('legacy-redirect logic does not affect unrelated paths or /api/contact',async t=>{
 const f=fixture(t),worker=await f.ready;
 f.env.ASSETS={fetch:async()=>new Response('passthrough-ok')};
 const r=await worker.fetch(new Request('https://collaborativeconstructionllc.com/not-a-legacy-path'),f.env,{});
 assert.equal(r.status,200);assert.equal(await r.text(),'passthrough-ok');
 // A POST to /api/contact with no body should still be handled by the real intake logic (400, not redirected/altered by the legacy-path change).
 const r2=await worker.fetch(new Request('https://collaborativeconstructionllc.com/api/contact',{method:'POST',headers:{origin:'https://collaborativeconstructionllc.com'},body:new FormData()}),f.env,{});
 assert.equal(r2.status,400);
});

test('local-only bypass never sends even if notification bindings are present',async t=>{
 const f=fixture(t);const r=await f.send({}, {local:true});assert.equal(r.body.stored,true);assert.equal(f.sent.length,0);assert.equal(f.query('SELECT email_error FROM leads')[0].email_error,'local-notification-disabled');
});

test('legitimate autofill organization fields are not interpreted as the neutral honeypot',async t=>{
 const f=fixture(t); const r=await f.send({name:'Synthetic Autofill Customer',company_website:'Endicott College',organization:'Endicott College',website_check:'Endicott College',cc_x7q2m9:''});
 assert.equal(r.status,200);assert.equal(r.body.stored,true);assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,1);
});
test('populated neutral honeypot rejects duplicate-field and file-value evasions',async t=>{
 const f=fixture(t);
 for(const options of [{extraFields:[['cc_x7q2m9','Endicott College']]},{extraFields:[['cc_x7q2m9',new File(['spam'],'x.txt',{type:'text/plain'})]]}]) {
  const r=await f.send({cc_x7q2m9:''},options);assert.equal(r.status,422);assert.equal(r.body.ok,false);
 }
 assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,0);assert.equal(f.sent.length,0);
});
test('legitimate autofill does not bypass failed Turnstile',async t=>{
 const f=fixture(t,{challenge:{success:false}}); const r=await f.send({company_website:'Endicott College',cc_x7q2m9:''});assert.equal(r.status,403);assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,0);
});

for (const [category, fields, options] of [
 ['missing-token',{'cf-turnstile-response':null},{}],
 ['token-too-long',{'cf-turnstile-response':'s'.repeat(2049)},{}],
 ['invalid-token-type',{'cf-turnstile-response':new File(['private'],'private.txt')},{}],
 ['siteverify-http',{}, {fetch:async()=>new Response('PRIVATE',{status:502})}],
 ['siteverify-invalid-response',{}, {fetch:async()=>new Response('null')}],
 ['parse-failure',{}, {fetch:async()=>new Response('PRIVATE not JSON')}],
 ['network-failure',{}, {fetch:async()=>{throw Error('PRIVATE')}}],
 ['timeout',{}, {fetch:async()=>{throw Object.assign(Error('PRIVATE'),{name:'TimeoutError'})}}],
 ['siteverify-rejected',{}, {challenge:{success:false,'error-codes':['timeout-or-duplicate','PRIVATE email@example.com','timeout-or-duplicate'],hostname:'PRIVATE',action:'PRIVATE'}}],
 ['siteverify-context',{}, {challenge:{success:true,hostname:'PRIVATE',action:'PRIVATE'}}],
]) test('safe challenge diagnostic: '+category,async t=>{
 const f=fixture(t,options); const r=await f.send(fields);assert.equal(r.status,403);assert.equal(r.body.error,'Please complete the verification and try again.');
 const log=JSON.parse(f.logs[0]);assert.equal(log.category,category);assert.equal(log.event,'intake-turnstile-rejected');
 assert.doesNotMatch(JSON.stringify(f.logs),/PRIVATE|email@example|synthetic|Synthetic Person/);
 if(category==='siteverify-rejected')assert.deepEqual(log.codes,['timeout-or-duplicate','unknown-code']);
 if(category==='siteverify-context'){assert.equal(log.hostnameMatch,false);assert.equal(log.actionMatch,false);}
 assert.equal(f.query('SELECT COUNT(*) n FROM leads')[0].n,0);
});
test('missing secret diagnostic retains existing unavailable response',async t=>{
 const f=fixture(t);delete f.env.TURNSTILE_SECRET_KEY;assert.equal((await f.send()).status,503);assert.equal(JSON.parse(f.logs[0]).category,'missing-secret');
});
test('Siteverify sends correct fields once and unchanged durable retries do not revalidate',async t=>{
 let calls=0;
 const f=fixture(t,{fetch:async(url,options)=>{
  calls++;assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.equal(options.method,'POST');
  assert.equal(options.body.get('secret'),'synthetic-test-only');assert.equal(options.body.get('response'),'synthetic');
  return new Response(JSON.stringify({success:true,hostname:'collaborativeconstructionllc.com',action:'contact'}));
 }});
 const submission_id=randomUUID();assert.equal((await f.send({submission_id})).status,200);assert.equal((await f.send({submission_id})).status,200);assert.equal(calls,1);assert.equal(f.logs.length,0);
});
