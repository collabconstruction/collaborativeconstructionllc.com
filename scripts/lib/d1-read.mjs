// Remote reads must use D1's query path: --file is the import API and returns
// execution summaries, not SELECT rows. Never recover by scraping noisy output.
export function parseQueryResults(stdout) {
  let data;
  try { data = JSON.parse(stdout); } catch { throw Error('Invalid database query response.'); }
  if (!Array.isArray(data) || !data.length || data.some(item =>
    !item || item.success !== true || !Array.isArray(item.results) || item.results.some(row =>
      !row || typeof row !== 'object' || Array.isArray(row) || Object.hasOwn(row,'Total queries executed')))) {
    throw Error('Invalid database query response.');
  }
  return data.flatMap(item => item.results);
}
export async function readRemoteQuery(sql, {root, env, run}) {
  try {
    const {stdout} = await run(process.execPath, [
      `${root}/node_modules/wrangler/bin/wrangler.js`, 'd1', 'execute', 'cc-leads',
      '--remote', '--config', `${root}/wrangler.jsonc`, '--command', sql, '--json',
    ], {cwd:root, maxBuffer:20*1024*1024, timeout:120000, env});
    return parseQueryResults(stdout);
  } catch { throw Error('Database read failed; provider output withheld to protect customer data.'); }
}
