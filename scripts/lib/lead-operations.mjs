import { randomUUID } from 'node:crypto';
export const stages = ['new','contacted','qualified','consultation','estimate_sent','won','lost','not_a_fit'];
const textFields = ['project_type','project_town','budget_range','desired_timeline','acquisition_source','assigned_to','next_action','outcome','loss_reason','customer_key'];
const dateFields = ['last_contact_at','first_response_at','follow_up_due_at'];
const numberFields = ['estimated_value','estimating_hours','expected_contribution','realized_contribution'];
export const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
function iso(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Use a valid ISO timestamp with timezone.');
  if (!/(Z|[+-]\d\d:\d\d)$/.test(value)) throw new Error('Timestamp timezone required.');
  return new Date(value).toISOString();
}
export function validateUpdates(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Expected a JSON object.');
  const result = {};
  for (const [key,value] of Object.entries(data)) {
    if (textFields.includes(key)) {
      if (value !== null && (typeof value !== 'string' || value.length > 1000 || /\0/.test(value))) throw new Error('Invalid text field.');
      if (['assigned_to','next_action','acquisition_source'].includes(key) && (value === null || !value.trim())) throw new Error('Owner, next action and source must be nonempty.');
      result[key] = value;
    } else if (dateFields.includes(key)) result[key] = value === null ? null : iso(value);
    else if (numberFields.includes(key)) {
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || (['estimated_value','estimating_hours'].includes(key) && value < 0))) throw new Error('Invalid numeric field.');
      result[key] = value;
    } else if (key === 'stage') {
      if (!stages.includes(value)) throw new Error('Invalid stage.');
      result[key] = value;
    } else throw new Error('Unknown update field.');
  }
  if (['lost','not_a_fit'].includes(result.stage) && (typeof result.loss_reason !== 'string' || !result.loss_reason.trim())) throw new Error('A loss reason is required when closing a lost or unsuitable inquiry; use unknown when not established.');
  if (['won','lost','not_a_fit'].includes(result.stage)) {
    result.next_action ??= result.stage === 'won' ? 'Transfer to project planning' : 'Closed; no follow-up requested';
    result.follow_up_due_at ??= null;
  }
  if (!Object.keys(result).length) throw new Error('No fields supplied.');
  return result;
}
export function updateSQL(id, data) {
  if (typeof id !== 'string' || id.length > 200 || !id) throw new Error('Lead ID required.');
  const updates = validateUpdates(data);
  return `UPDATE lead_workflow SET ${Object.entries(updates).map(([key,val])=>`${key}=${quote(val)}`).join(',')} WHERE lead_id=${quote(id)}; SELECT changes() AS changed;`;
}
export function manualSQL(data, now = new Date().toISOString(), id = randomUUID()) {
  const { name, email='', phone='', message, ...workflow } = data;
  for (const value of [name,email,phone,message]) if (typeof value !== 'string' || value.length > 10000 || /\0/.test(value)) throw new Error('Invalid manual inquiry.');
  if (!name.trim() || !message.trim() || (!email.trim() && !phone.trim())) throw new Error('Name, message and a contact method required.');
  if (!['phone','referral'].includes(workflow.acquisition_source)) throw new Error('Manual source must be phone or referral.');
  const updates = validateUpdates(workflow);
  // One statement and its trigger persist both core record and defaults; update details follows.
  // CLI runs these in a single D1 execute file. If interrupted, defaults keep the lead actionable.
  return `INSERT INTO leads(id,created_at,name,email,phone,message) VALUES(${[id,now,name,email,phone,message].map(quote).join(',')});\n${updateSQL(id,updates).replace('SELECT changes() AS changed;', '')}\nUPDATE lead_workflow SET notification_state='not_applicable' WHERE lead_id=${quote(id)};`;
}
export function queueSQL(now) {
  return `SELECT l.*,w.*, CASE WHEN trim(w.assigned_to)='' THEN 1 ELSE 0 END AS unassigned,
    CASE WHEN w.stage NOT IN ('won','lost','not_a_fit') AND w.follow_up_due_at < ${quote(now)} THEN 1 ELSE 0 END AS overdue,
    CASE WHEN w.notification_state IN ('pending','failed','unknown') THEN 1 ELSE 0 END AS notification_exception,
    CASE WHEN w.attachment_state IN ('pending','partial','failed') OR w.attachment_warning IS NOT NULL THEN 1 ELSE 0 END AS attachment_exception,
    CASE WHEN w.stage NOT IN ('won','lost','not_a_fit') AND w.follow_up_due_at IS NULL THEN 1 ELSE 0 END AS missing_follow_up
    FROM leads l JOIN lead_workflow w ON w.lead_id=l.id ORDER BY l.created_at DESC;`;
}
export function reportSQL(from,to,now) {
  return `SELECT COUNT(*) AS total_inquiries,
    SUM(CASE WHEN w.stage='new' THEN 1 ELSE 0 END) AS new_inquiries,
    SUM(CASE WHEN trim(w.assigned_to)='' THEN 1 ELSE 0 END) AS unassigned,
    SUM(CASE WHEN w.stage NOT IN ('won','lost','not_a_fit') AND w.follow_up_due_at<${quote(now)} THEN 1 ELSE 0 END) AS overdue,
    SUM(CASE WHEN w.notification_state IN ('pending','failed','unknown') THEN 1 ELSE 0 END) AS notification_exceptions,
    SUM(CASE WHEN w.stage='won' THEN 1 ELSE 0 END) AS won,
    SUM(CASE WHEN w.stage='lost' THEN 1 ELSE 0 END) AS lost,
    SUM(CASE WHEN w.stage='qualified' THEN 1 ELSE 0 END) AS currently_qualified,
    SUM(CASE WHEN w.stage='consultation' THEN 1 ELSE 0 END) AS currently_consultation,
    SUM(CASE WHEN w.stage='estimate_sent' THEN 1 ELSE 0 END) AS currently_estimate_sent,
    SUM(CASE WHEN w.acquisition_source='phone' THEN 1 ELSE 0 END) AS phone_inquiries,
    SUM(CASE WHEN w.acquisition_source='referral' THEN 1 ELSE 0 END) AS referral_inquiries,
    SUM(CASE WHEN w.acquisition_source='website' THEN 1 ELSE 0 END) AS website_inquiries,
    SUM(CASE WHEN w.acquisition_source NOT IN ('website','phone','referral') THEN 1 ELSE 0 END) AS other_source_inquiries,
    COUNT(w.first_response_at) AS measured_responses,
    AVG(CASE WHEN julianday(w.first_response_at)>=julianday(l.created_at) THEN (julianday(w.first_response_at)-julianday(l.created_at))*24*60 END) AS mean_response_minutes,
    COUNT(*)-COUNT(w.first_response_at) AS unknown_response_count,
    COUNT(*)-COUNT(w.estimated_value) AS unknown_estimated_value_count,
    SUM(w.estimated_value) AS recorded_estimated_value,
    SUM(w.estimating_hours) AS recorded_estimating_hours,
    COUNT(*)-COUNT(w.estimating_hours) AS unknown_estimating_hours_count,
    SUM(w.expected_contribution) AS recorded_expected_contribution,
    COUNT(*)-COUNT(w.expected_contribution) AS unknown_expected_contribution_count,
    SUM(w.realized_contribution) AS recorded_realized_contribution,
    COUNT(*)-COUNT(w.realized_contribution) AS unknown_realized_contribution_count,
    SUM(CASE WHEN l.utm_source IS NOT NULL AND l.utm_source!='' THEN 1 ELSE 0 END) AS has_campaign_source,
    SUM(CASE WHEN w.project_type IS NULL OR w.project_type='' THEN 1 ELSE 0 END) AS unknown_project_type_count,
    SUM(CASE WHEN w.first_response_at<l.created_at THEN 1 ELSE 0 END) AS invalid_response_timestamp_count,
    SUM(CASE WHEN w.follow_up_due_at IS NULL AND w.stage NOT IN ('won','lost','not_a_fit') THEN 1 ELSE 0 END) AS missing_follow_up_count
    FROM leads l JOIN lead_workflow w ON l.id=w.lead_id WHERE l.created_at>=${quote(from)} AND l.created_at<${quote(to)};`;
}
export function interval(from,to) {
  const start=iso(from),end=iso(to);
  if(start>=end) throw new Error('Report end must follow start.');
  return [start,end];
}

export function groupedReportSQL(from,to) {
  // Only controlled labels leave the database; free-text campaign names are hashed by the CLI.
  return `SELECT
    CASE WHEN w.acquisition_source IN ('website','phone','referral') THEN w.acquisition_source WHEN trim(w.acquisition_source)='' THEN 'unknown' ELSE 'other' END AS source,
    CASE WHEN lower(w.project_type) IN ('adu','addition','renovation','custom_home','construction_management','owner_representation','clerk_of_works') THEN lower(w.project_type) WHEN w.project_type IS NULL OR trim(w.project_type)='' THEN 'unknown' ELSE 'other' END AS service,
    w.stage, NULLIF(l.utm_campaign,'') AS private_campaign, COUNT(*) AS inquiries
    FROM leads l JOIN lead_workflow w ON l.id=w.lead_id WHERE l.created_at>=${quote(from)} AND l.created_at<${quote(to)}
    GROUP BY source,service,w.stage,private_campaign ORDER BY source,service,w.stage;`;
}
