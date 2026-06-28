-- Store full inbound email text in the database for view and assign fallbacks

ALTER TABLE inbound_email_events
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS attachments_meta JSONB NOT NULL DEFAULT '[]'::jsonb;
