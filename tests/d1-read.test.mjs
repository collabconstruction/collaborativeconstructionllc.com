import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQueryResults,readRemoteQuery} from '../scripts/lib/d1-read.mjs';
import {queueSQL} from '../scripts/lib/lead-operations.mjs';

test('real D1 query shape returns selected rows and flattens multiple results',()=>{
 assert.deepEqual(parseQueryResults(JSON.stringify([{success:true,results:[{id:'synthetic',stage:'new',assigned_to:'Synthetic owner'}],meta:{rows_written:0}},{success:true,results:[{recovery_probe:42}]}])),[{id:'synthetic',stage:'new',assigned_to:'Synthetic owner'},{recovery_probe:42}]);
});
test('empty SELECT is valid but missing or failed envelopes and import summaries are not',()=>{
 assert.deepEqual(parseQueryResults('[{"success":true,"results":[]}]'),[]);
 for(const data of ['[]','null','{}','PRIVATE not JSON','[{"success":false,"results":[]}]','[{"success":true}]','[{"results":[]}]','[{"success":true,"results":[null]}]','[{"success":true,"results":[{"Total queries executed":1}]}]']) {
  assert.throws(()=>parseQueryResults(data),/Invalid database query response/);
 }
});
test('remote reader uses command query path and protects provider failures',async()=>{
 const rows=await readRemoteQuery('SELECT 42 AS recovery_probe;',{root:'/synthetic',env:{},run:async(exe,args,options)=>{
  assert.equal(exe,process.execPath);assert.ok(args.includes('--remote'));assert.ok(!args.includes('--file'));
  assert.equal(args[args.indexOf('--command')+1],'SELECT 42 AS recovery_probe;');assert.equal(options.cwd,'/synthetic');
  return{stdout:'[{"success":true,"results":[{"recovery_probe":42}]}]'};
 }});assert.deepEqual(rows,[{recovery_probe:42}]);
 await assert.rejects(readRemoteQuery('SELECT 1',{root:'/synthetic',env:{},run:async()=>{throw Error('PRIVATE CUSTOMER')}}),e=>!e.message.includes('PRIVATE') && /Database read failed/.test(e.message));
});
test('queue can scope reads to one lead without changing default queue',()=>{
 assert.match(queueSQL('2026-10-12',"synthetic'id"),/WHERE l.id='synthetic''id'/);
 assert.doesNotMatch(queueSQL('2026-10-12'),/WHERE l.id=/);
});
