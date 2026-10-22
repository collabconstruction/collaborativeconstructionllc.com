// Pure HTML rendering for the private local lead dashboard. No filesystem or
// network access here, keeping this pure makes it directly unit-testable
// without touching real customer data. See scripts/dashboard.mjs for the CLI
// wrapper that reads a queue export and writes this output privately.

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// Matches the computed flag columns from scripts/lib/lead-operations.mjs's queueSQL.
export const FLAG_LABELS = {
  overdue: 'Overdue',
  unassigned: 'Unassigned',
  missing_follow_up: 'No follow-up date',
  notification_exception: 'Notification issue',
  attachment_exception: 'Attachment issue',
};

function flagsFor(record) {
  return Object.keys(FLAG_LABELS).filter((key) => Number(record[key]) === 1);
}

export function summarize(records) {
  const counts = Object.fromEntries(Object.keys(FLAG_LABELS).map((k) => [k, 0]));
  const byStage = {};
  for (const record of records) {
    for (const key of Object.keys(FLAG_LABELS)) if (Number(record[key]) === 1) counts[key] += 1;
    const stage = record.stage || 'unknown';
    byStage[stage] = (byStage[stage] || 0) + 1;
  }
  return { counts, byStage };
}

function row(record) {
  const flags = flagsFor(record);
  const badges = flags.length
    ? flags.map((f) => `<span class="badge badge-${esc(f)}">${esc(FLAG_LABELS[f])}</span>`).join(' ')
    : '<span class="badge badge-ok">OK</span>';
  const stage = esc(record.stage || 'unknown');
  const dataFlags = esc(flags.join(' '));
  const project = [record.project_type, record.project_town].filter(Boolean).map(esc).join(' / ');
  const contact = [record.email, record.phone].filter(Boolean).map(esc).join('<br>');
  return `<tr data-stage="${stage}" data-flags="${dataFlags}">
    <td class="col-created">${esc(record.created_at)}</td>
    <td>${esc(record.name)}</td>
    <td>${contact}</td>
    <td>${project}</td>
    <td>${stage}</td>
    <td>${esc(record.assigned_to || '')}</td>
    <td class="col-followup">${esc(record.follow_up_due_at || '')}</td>
    <td>${esc(record.notification_state || '')}</td>
    <td>${esc(record.attachment_state || '')}</td>
    <td>${badges}</td>
    <td><details><summary>Message</summary>${esc(record.message || '')}${
      record.next_action ? `<br><strong>Next action:</strong> ${esc(record.next_action)}` : ''
    }</details></td>
  </tr>`;
}

export function renderDashboard(queueExport) {
  const records = Array.isArray(queueExport?.records) ? queueExport.records : [];
  const { counts, byStage } = summarize(records);
  const stageOptions = Object.keys(byStage).sort()
    .map((s) => `<option value="${esc(s)}">${esc(s)} (${byStage[s]})</option>`).join('');
  const flagCheckboxes = Object.entries(FLAG_LABELS)
    .map(([key, label]) =>
      `<label class="flag-toggle"><input type="checkbox" value="${esc(key)}" class="flag-filter"> ${esc(label)} (${counts[key]})</label>`
    ).join('');
  const rows = records.map(row).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>Private lead dashboard (local only)</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 0 16px 40px; color: #222; }
  .privacy-banner { background: #c0392b; color: #fff; padding: 10px 16px; font-size: 14px; font-weight: 600; }
  .meta { color: #666; font-size: 13px; margin: 10px 0; }
  .cards { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; min-width: 140px; }
  .card .n { font-size: 22px; font-weight: 700; display: block; }
  .card .l { font-size: 12px; color: #666; }
  .filters { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin: 16px 0; padding: 10px; background: #f6f6f6; border-radius: 8px; }
  .flag-toggle { font-size: 13px; white-space: nowrap; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { cursor: pointer; background: #fafafa; position: sticky; top: 0; user-select: none; }
  th.sorted::after { content: " \\25BC"; }
  th.sorted-desc::after { content: " \\25B2"; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin: 1px; color: #fff; }
  .badge-overdue { background: #c0392b; }
  .badge-unassigned { background: #e67e22; }
  .badge-missing_follow_up { background: #d35400; }
  .badge-notification_exception { background: #8e44ad; }
  .badge-attachment_exception { background: #2980b9; }
  .badge-ok { background: #27ae60; }
  details summary { cursor: pointer; color: #2980b9; }
  #search { padding: 6px 10px; font-size: 13px; min-width: 220px; }
  tr.hidden-row { display: none; }
</style>
</head>
<body>
  <div class="privacy-banner">
    PRIVATE, contains customer information. Do not commit, email, screenshot, upload, or place this file in any
    cloud-synced folder. Delete it once you are done reviewing it. Nothing on this page loads from the network.
  </div>
  <div class="meta">
    Generated: ${esc(queueExport?.generated_at || 'unknown')} &middot;
    Environment: ${esc(queueExport?.environment || 'unknown')} &middot;
    Rows: ${esc(String(queueExport?.row_count ?? records.length))} &middot;
    ${esc(queueExport?.completeness || '')}
  </div>
  <div class="cards">
    <div class="card"><span class="n">${records.length}</span><span class="l">Total leads in export</span></div>
    ${Object.entries(FLAG_LABELS).map(([key, label]) =>
      `<div class="card"><span class="n">${counts[key]}</span><span class="l">${esc(label)}</span></div>`
    ).join('')}
  </div>
  <div class="filters">
    <input id="search" type="search" placeholder="Search name, email, phone, message...">
    <select id="stage-filter"><option value="">All stages</option>${stageOptions}</select>
    ${flagCheckboxes}
  </div>
  <table id="leads">
    <thead>
      <tr>
        <th data-key="created">Created</th>
        <th>Name</th>
        <th>Contact</th>
        <th>Project</th>
        <th>Stage</th>
        <th>Assigned</th>
        <th data-key="followup">Follow-up due</th>
        <th>Notification</th>
        <th>Attachment</th>
        <th>Flags</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <script>
    (function () {
      var table = document.getElementById('leads');
      var tbody = table.tBodies[0];
      var search = document.getElementById('search');
      var stageFilter = document.getElementById('stage-filter');
      var flagChecks = Array.prototype.slice.call(document.querySelectorAll('.flag-filter'));

      function applyFilters() {
        var term = search.value.trim().toLowerCase();
        var stage = stageFilter.value;
        var checkedFlags = flagChecks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
        Array.prototype.forEach.call(tbody.rows, function (tr) {
          var matchesText = !term || tr.textContent.toLowerCase().indexOf(term) !== -1;
          var matchesStage = !stage || tr.getAttribute('data-stage') === stage;
          var rowFlags = (tr.getAttribute('data-flags') || '').split(' ');
          var matchesFlags = checkedFlags.length === 0 || checkedFlags.some(function (f) { return rowFlags.indexOf(f) !== -1; });
          tr.classList.toggle('hidden-row', !(matchesText && matchesStage && matchesFlags));
        });
      }
      search.addEventListener('input', applyFilters);
      stageFilter.addEventListener('change', applyFilters);
      flagChecks.forEach(function (c) { c.addEventListener('change', applyFilters); });

      var sortState = {};
      Array.prototype.forEach.call(table.querySelectorAll('th[data-key]'), function (th) {
        th.addEventListener('click', function () {
          var key = th.getAttribute('data-key');
          var colIndex = Array.prototype.indexOf.call(th.parentNode.children, th);
          var asc = !(sortState[key] === 'asc');
          sortState = {};
          sortState[key] = asc ? 'asc' : 'desc';
          Array.prototype.forEach.call(table.querySelectorAll('th'), function (h) { h.classList.remove('sorted', 'sorted-desc'); });
          th.classList.add(asc ? 'sorted' : 'sorted-desc');
          var rows = Array.prototype.slice.call(tbody.rows);
          rows.sort(function (a, b) {
            var av = a.cells[colIndex].textContent.trim();
            var bv = b.cells[colIndex].textContent.trim();
            if (av < bv) return asc ? -1 : 1;
            if (av > bv) return asc ? 1 : -1;
            return 0;
          });
          rows.forEach(function (r) { tbody.appendChild(r); });
        });
      });
    })();
  </script>
</body>
</html>
`;
}
