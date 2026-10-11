-- Additive migration: preserves the existing leads schema and legacy statuses.
CREATE TABLE lead_workflow (
  lead_id TEXT PRIMARY KEY REFERENCES leads(id),
  project_type TEXT, project_town TEXT, budget_range TEXT, desired_timeline TEXT,
  acquisition_source TEXT NOT NULL DEFAULT 'website',
  assigned_to TEXT NOT NULL DEFAULT 'Wesleigh Behn',
  stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new','contacted','qualified','consultation','estimate_sent','won','lost','not_a_fit')),
  last_contact_at TEXT, first_response_at TEXT,
  next_action TEXT NOT NULL DEFAULT 'Review inquiry and contact prospect',
  follow_up_due_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now','+1 day')),
  outcome TEXT, loss_reason TEXT,
  estimated_value REAL CHECK(estimated_value IS NULL OR estimated_value >= 0),
  estimating_hours REAL CHECK(estimating_hours IS NULL OR estimating_hours >= 0),
  expected_contribution REAL, realized_contribution REAL, customer_key TEXT,
  notification_state TEXT NOT NULL DEFAULT 'pending' CHECK(notification_state IN ('pending','accepted','failed','unknown','not_applicable')),
  notification_attempted_at TEXT,
  attachment_state TEXT NOT NULL DEFAULT 'none', attachment_warning TEXT
);
CREATE TABLE lead_stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  from_stage TEXT, to_stage TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  origin TEXT NOT NULL DEFAULT 'workflow'
);
CREATE TABLE intake_receipts (
  request_key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
  lead_id TEXT UNIQUE REFERENCES leads(id), created_at TEXT NOT NULL
);
CREATE INDEX idx_workflow_due ON lead_workflow(follow_up_due_at);
CREATE INDEX idx_workflow_stage ON lead_workflow(stage);
CREATE INDEX idx_stage_history_lead ON lead_stage_history(lead_id, changed_at);
CREATE TRIGGER lead_workflow_stage_audit AFTER UPDATE OF stage ON lead_workflow
WHEN NEW.stage != OLD.stage
BEGIN
  INSERT INTO lead_stage_history(lead_id, from_stage, to_stage) VALUES(NEW.lead_id, OLD.stage, NEW.stage);
  UPDATE leads SET status= CASE NEW.stage WHEN 'estimate_sent' THEN 'quoted' WHEN 'won' THEN 'booked' ELSE NEW.stage END ,
    booked_at= CASE WHEN NEW.stage='won' THEN COALESCE(booked_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ELSE booked_at END
    WHERE id=NEW.lead_id;
END;
INSERT INTO lead_workflow(lead_id, stage, follow_up_due_at, notification_state, attachment_state)
SELECT id, CASE status WHEN 'quoted' THEN 'estimate_sent' WHEN 'booked' THEN 'won'
  WHEN 'contacted' THEN 'contacted' WHEN 'qualified' THEN 'qualified' WHEN 'consultation' THEN 'consultation'
  WHEN 'lost' THEN 'lost' WHEN 'not_a_fit' THEN 'not_a_fit' ELSE 'new' END ,
  strftime('%Y-%m-%dT%H:%M:%fZ',created_at,'+1 day'),
  CASE WHEN emailed=1 THEN 'accepted' ELSE 'unknown' END ,
  CASE WHEN attachment_keys IS NOT NULL AND attachment_keys!='[]' THEN 'stored' ELSE 'none' END FROM leads;
INSERT INTO lead_stage_history(lead_id,to_stage,origin) SELECT lead_id,stage,'migration-baseline' FROM lead_workflow;
CREATE TRIGGER lead_workflow_on_intake AFTER INSERT ON leads BEGIN
  INSERT INTO lead_workflow(lead_id, stage, follow_up_due_at)
  VALUES(NEW.id, CASE NEW.status WHEN 'quoted' THEN 'estimate_sent' WHEN 'booked' THEN 'won'
    WHEN 'contacted' THEN 'contacted' WHEN 'lost' THEN 'lost' ELSE 'new' END ,
    strftime('%Y-%m-%dT%H:%M:%fZ',NEW.created_at,'+1 day'));
  INSERT INTO lead_stage_history(lead_id,to_stage,origin) SELECT NEW.id,stage,'intake' FROM lead_workflow WHERE lead_id=NEW.id;
END;
