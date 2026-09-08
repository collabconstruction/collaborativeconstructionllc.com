-- Lead records for collaborativeconstructionllc.com
-- Applied with:
--   npx wrangler d1 execute cc-leads --file=schema.sql --remote

CREATE TABLE IF NOT EXISTS leads (
  id              TEXT PRIMARY KEY,
  created_at      TEXT NOT NULL,

  -- submitted fields
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  message         TEXT NOT NULL,

  -- attribution: this is what makes conversion analysis possible
  source_page     TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  ga_client_id    TEXT,

  -- operational
  attachment_keys TEXT,           -- JSON array of R2 object keys
  emailed         INTEGER NOT NULL DEFAULT 0,
  email_error     TEXT,
  country         TEXT,
  user_agent      TEXT,

  -- filled in by hand (or the admin UI) once a lead is worked
  status          TEXT NOT NULL DEFAULT 'new',   -- new | contacted | quoted | booked | lost
  booked_at       TEXT,
  reported_to_ga  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_leads_created  ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status   ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_emailed  ON leads (emailed);
