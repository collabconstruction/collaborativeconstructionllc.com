#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm, realpath, stat, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manualSQL, updateSQL, queueSQL, reportSQL, groupedReportSQL, interval, quote } from './lib/lead-operations.mjs';
import { readRemoteQuery } from './lib/d1-read.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=promisify(execFile);
const help=`Private lead operations (no public endpoint):
  node scripts/leads.mjs export --local|--remote --out /private/path/leads.json
  node scripts/leads.mjs queue --local|--remote [--id UUID] --out /private/path/queue.json
  node scripts/leads.mjs add --local|--remote --input /private/path/inquiry.json
  node scripts/leads.mjs update --local|--remote --id UUID --input /private/path/update.json
  node scripts/leads.mjs history --local|--remote --id UUID --out /private/path/history.json
  node scripts/leads.mjs report --local|--remote --from ISO --to ISO
Requires Node.js 22 or newer. Use --local for synthetic tests (wrangler.local.jsonc). Remote operations use existing Wrangler account permissions;
obtain applicable authorization first. No live operation is performed by installing this CLI.
Reports are received-date cohorts; counts are current stages, not transition counts.
Private input/output files must be outside the repository. Existing exports are never overwritten.`;
async function privatePath(filename,existing=false) {
  if(!filename || !path.isAbsolute(filename)) throw Error('Use an absolute private path.');
  const resolved=existing?await realpath(filename):path.join(await realpath(path.dirname(filename)),path.basename(filename));
  const repository=await realpath(root);
  if(resolved===repository || resolved.startsWith(repository+path.sep)) throw Error('Private files must be outside the repository.');
  if(existing) {
    const info=await stat(resolved);
    if(!info.isFile() || (info.mode&0o077)!==0 || info.size>1024*1024) throw Error('Input must be a private regular file (chmod 600), at most 1 MB.');
  }
  return resolved;
}
async function input(filename) {return JSON.parse(await readFile(await privatePath(filename,true),'utf8'));}
async function execute(sql,remote,readOnly=false) {
  const dir=await mkdtemp(path.join(tmpdir(),'cc-leads-'));
  try {
    if (remote && readOnly) return await readRemoteQuery(sql, {root,run,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:path.join(dir,'wrangler.log')}});
    const filename=path.join(dir,'query.sql');
    await writeFile(filename,sql,{mode:0o600});
    const {stdout}=await run(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','cc-leads',remote?'--remote':'--local','--config',path.join(root,remote?'wrangler.jsonc':'wrangler.local.jsonc'),'--file',filename,'--json'],{
      cwd:root, maxBuffer:20*1024*1024, timeout:120000,
      env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:path.join(dir,'wrangler.log')}
    });
    const data=JSON.parse(stdout);
    if(!Array.isArray(data)||data.some(item=>item.success===false)) throw Error('Database operation failed.');
    return data.flatMap(item=>item.results||[]);
  } catch { throw Error('Database operation failed; provider output withheld to protect customer data. Check authentication, migrations and database permissions.'); }
  finally {await rm(dir,{recursive:true,force:true});}
}
async function main() {
  const [command,...args]=process.argv.slice(2);
  if(!command || command==='--help') {console.log(help);return;}
  if(Number(process.versions.node.split('.')[0])<22) {console.error('Lead operations require Node.js 22 or newer. Select a supported Node installation and retry.');process.exitCode=1;return;}
  const flags={};
  for(let i=0;i<args.length;i++) {
    const key=args[i];
    if(!['--local','--remote','--input','--out','--id','--from','--to'].includes(key)||Object.hasOwn(flags,key)) throw Error('Unknown or duplicate option.');
    flags[key]=['--local','--remote'].includes(key)?true:args[++i];
    if(flags[key]===undefined) throw Error('Missing option value.');
  }
  if(Boolean(flags['--local'])===Boolean(flags['--remote'])) throw Error('Choose exactly one of --local or --remote.');
  const now=new Date().toISOString();
  let sql, outputFile, dates;
  if(['export','queue','history'].includes(command)) {
    outputFile=await privatePath(flags['--out']);
    if(command==='history') {
      if(!flags['--id']||flags['--id'].length>200) throw Error('Lead ID required.');
      sql=`SELECT * FROM lead_stage_history WHERE lead_id=${quote(flags['--id'])} ORDER BY id;`;
    } else {
      const id=command==='queue'?flags['--id']:undefined;
      if(id !== undefined && (id.length>200 || !id.trim())) throw Error('Invalid lead ID.');
      sql=queueSQL(now,id);
    }
  } else if(command==='add') sql=manualSQL(await input(flags['--input']));
  else if(command==='update') sql=updateSQL(flags['--id'],await input(flags['--input']));
  else if(command==='report') {dates=interval(flags['--from'],flags['--to']);sql=reportSQL(...dates,now);}
  else throw Error('Unknown command.');
  // Reserve private output before reading customer records; wx rejects files and symlinks.
  const handle=outputFile?await open(outputFile,'wx',0o600):null;
  try {
    const rows=await execute(sql,Boolean(flags['--remote']),['export','queue','history','report'].includes(command));
    if(handle) {
      await handle.writeFile(JSON.stringify({generated_at:now,environment:flags['--remote']?'remote':'local',row_count:rows.length,completeness:command==='queue' && flags['--id']?'Selected lead with workflow only.':command==='history'?'All available history for the selected lead; pre-migration events are unavailable.':'All leads with workflow rows, without pagination or date filtering. Review migration reconciliation; attachment contents are not exported.',records:rows},null,2)+'\n');
      console.log('Private export saved. Contains customer information; restrict access and remove when no longer needed.');
    } else if(command==='report') {
      const grouped=(await execute(groupedReportSQL(...dates),Boolean(flags['--remote']),true)).map(({private_campaign,...row})=>({...row,campaign_id:private_campaign?createHash('sha256').update(private_campaign).digest('hex').slice(0,16):null}));
      console.log(JSON.stringify({generated_at:now,environment:flags['--remote']?'remote':'local',received_from_inclusive:dates[0],received_to_exclusive:dates[1],metrics:rows[0],grouped_source_service_stage_campaign:grouped,customer_metrics:{unique_customers:null,new_customers:null,repeat_customers:null},external_metrics:{acquisition_cost:null,search_impressions:null,search_clicks:null,organic_traffic:null,capacity:null},notes:['Campaign identifiers are hashed to avoid printing untrusted free text; labels can be reconciled privately from exports.','Group totals and summary are separate snapshots and can differ if an inquiry changes during reporting.','Null means unknown or no applicable observations.','Current-stage counts do not measure historical progress.','Provider accepted does not prove inbox receipt.','Economics totals include recorded values only; currency and cost basis must be consistent.']},null,2));
    } else if(command==='update' && !rows.some(row=>row.changed===1)) throw Error('Lead not found; no update made.');
    else console.log('Operation completed. No customer details printed.');
  } finally {if(handle) await handle.close();}
}
main().catch(()=>{console.error('Lead operation failed. No customer data printed. Check command syntax (--help), private file permissions, account access and migrations.');process.exitCode=1;});
