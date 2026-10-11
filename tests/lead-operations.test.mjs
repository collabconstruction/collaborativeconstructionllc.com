import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { manualSQL, updateSQL, quote, reportSQL, groupedReportSQL, queueSQL, validateUpdates } from '../scripts/lib/lead-operations.mjs';
const first=readFileSync(new URL('../migrations/0001_existing_leads.sql',import.meta.url),'utf8');
const second=readFileSync(new URL('../migrations/0002_lead_operations.sql',import.meta.url),'utf8');
function sqlite(sql,query) {
  const run=spawnSync('python3',['-c',`import sqlite3,json,sys\nx=json.load(sys.stdin)\ndb=sqlite3.connect(':memory:')\ndb.row_factory=sqlite3.Row\ndb.executescript(x['sql'])\nprint(json.dumps([dict(r) for r in db.execute(x['query'])]))`],{input:JSON.stringify({sql,query}),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);return JSON.parse(run.stdout);
}
test('historical rows backfill without rewriting quoted/booked and flag uncertain notification',()=>{
  const sql=first+`INSERT INTO leads(id,created_at,name,email,message,status,emailed) VALUES('old','2026-10-01T00:00:00.000Z','Test','test@example.invalid','test','quoted',0),('won','2026-10-01T00:00:00.000Z','Test','test@example.invalid','test','booked',1);`+second;
  const rows=sqlite(sql,'SELECT status,stage,notification_state FROM leads JOIN lead_workflow ON id=lead_id ORDER BY id');
  assert.deepEqual(rows,[{status:'quoted',stage:'estimate_sent',notification_state:'unknown'},{status:'booked',stage:'won',notification_state:'accepted'}]);
});
test('insert trigger assigns owner, next action, follow-up and auditable stage transitions',()=>{
  const sql=first+second+manualSQL({name:"O'Brien",phone:'555',message:"Hello'); DROP TABLE leads;--",acquisition_source:'phone'},'2026-10-11T12:00:00.000Z','manual')+updateSQL('manual',{stage:'estimate_sent'});
  const rows=sqlite(sql,'SELECT l.name,l.status,w.*, (SELECT COUNT(*) FROM lead_stage_history) AS history_count FROM leads l JOIN lead_workflow w ON l.id=w.lead_id');
  assert.equal(rows[0].name,"O'Brien");assert.equal(rows[0].status,'quoted');assert.equal(rows[0].assigned_to,'Wesleigh Behn');assert.equal(rows[0].follow_up_due_at,'2026-10-12T12:00:00.000Z');assert.equal(rows[0].history_count,2);assert.equal(rows[0].notification_state,'not_applicable');
});
test('unknown economics and response time remain null; report interval is exclusive at end',()=>{
 const sql=first+second+manualSQL({name:'Test',phone:'555',message:'Test',acquisition_source:'referral'},'2026-10-11T12:00:00.000Z','one');
 const rows=sqlite(sql,reportSQL('2026-10-11T00:00:00.000Z','2026-10-12T00:00:00.000Z','2026-10-13T00:00:00.000Z'));
 assert.equal(rows[0].total_inquiries,1);assert.equal(rows[0].overdue,1);assert.equal(rows[0].recorded_estimated_value,null);assert.equal(rows[0].mean_response_minutes,null);assert.equal(rows[0].unknown_response_count,1);
 assert.equal(sqlite(sql,reportSQL('2026-10-10T00:00:00.000Z','2026-10-11T12:00:00.000Z','2026-10-13T00:00:00.000Z'))[0].total_inquiries,0);
});
test('strict update validation rejects executable keys, missing accountability and nonfinite amounts',()=>{
 for(const data of [{'stage; DELETE FROM leads;':'x'},{assigned_to:''},{next_action:null},{stage:'quoted'},{estimated_value:Infinity},{last_contact_at:'tomorrow'}]) assert.throws(()=>validateUpdates(data));
 assert.equal(quote("a'b"),"'a''b'");
});

test('CLI refuses repository exports before provider access and never echoes a supplied identity',{skip:Number(process.versions.node.split('.')[0])<22},()=>{
  const cli=new URL('../scripts/leads.mjs',import.meta.url);
  const target=new URL('../private-test-output.json',import.meta.url).pathname;
  const run=spawnSync(process.execPath,[cli.pathname,'export','--local','--out',target],{encoding:'utf8'});
  assert.equal(run.status,1);assert.equal(run.stdout,'');assert.doesNotMatch(run.stderr,/private-test-output/);
  const bad=spawnSync(process.execPath,[cli.pathname,'update','--id','SENSITIVE_TEST_MARKER'],{encoding:'utf8'});
  assert.equal(bad.status,1);assert.doesNotMatch(bad.stderr,/SENSITIVE_TEST_MARKER/);
});

test('database constraints reject invalid stage and negative estimates',()=>{
  for(const suffix of ["UPDATE lead_workflow SET stage='bogus';","UPDATE lead_workflow SET estimated_value=-5;"]) {
    const sql=first+second+manualSQL({name:'Test',phone:'555',message:'Test',acquisition_source:'phone'},'2026-10-11T12:00:00.000Z','one')+suffix;
    const run=spawnSync('python3',['-c',"import sqlite3,sys; sqlite3.connect(':memory:').executescript(sys.stdin.read())"],{input:sql,encoding:'utf8'});
    assert.notEqual(run.status,0);assert.match(run.stderr,/CHECK constraint failed/);
  }
});


test('Wrangler SQL splitter preserves executable trigger statements',{skip:Number(process.versions.node.split('.')[0])<22},()=>{
  const require=createRequire(import.meta.url);
  const statements=require('wrangler').unstable_splitSqlQuery(second);
  const run=spawnSync('python3',['-c',"import sqlite3,json,sys\nx=json.load(sys.stdin)\ndb=sqlite3.connect(':memory:')\ndb.executescript(x['base'])\nfor q in x['statements']: db.execute(q)"],{input:JSON.stringify({base:first,statements}),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
});

test('closing lost leads requires reason and supplies sensible closure defaults',()=>{
  assert.throws(()=>validateUpdates({stage:'lost'}));
  assert.throws(()=>validateUpdates({stage:'not_a_fit',loss_reason:''}));
  const result=validateUpdates({stage:'lost',loss_reason:'unknown'});
  assert.equal(result.next_action,'Closed; no follow-up requested');assert.equal(result.follow_up_due_at,null);
  assert.equal(validateUpdates({stage:'won'}).next_action,'Transfer to project planning');
});

test('queue flags missing dates and incomplete attachments; grouped report suppresses free-text source/service',()=>{
  const sql=first+second+manualSQL({name:'Test',phone:'555',message:'Test',acquisition_source:'phone'},'2026-10-11T12:00:00.000Z','one')+"UPDATE lead_workflow SET follow_up_due_at=NULL,attachment_state='partial',project_type='PRIVATE_NAME',acquisition_source='PRIVATE_NAME';";
  const queue=sqlite(sql,queueSQL('2026-10-12T00:00:00.000Z'));
  assert.equal(queue[0].missing_follow_up,1);assert.equal(queue[0].attachment_exception,1);
  const grouped=sqlite(sql,groupedReportSQL('2026-10-11T00:00:00.000Z','2026-10-12T00:00:00.000Z'));
  assert.equal(grouped[0].source,'other');assert.equal(grouped[0].service,'other');assert.equal(grouped[0].inquiries,1);
  assert.doesNotMatch(JSON.stringify(grouped),/PRIVATE_NAME/);
});
