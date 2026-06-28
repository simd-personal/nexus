-- Pending inbound emails: store payload for manual project assignment

ALTER TABLE inbound_email_events
  ADD COLUMN IF NOT EXISTS body_preview TEXT,
  ADD COLUMN IF NOT EXISTS payload_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_count INT NOT NULL DEFAULT 0;

ALTER TABLE inbound_email_events DROP CONSTRAINT IF EXISTS inbound_email_events_status_check;

ALTER TABLE inbound_email_events ADD CONSTRAINT inbound_email_events_status_check
  CHECK (status IN ('processed', 'failed', 'unmatched', 'pending_assignment', 'dismissed'));

CREATE POLICY "Users can update own pending inbound emails" ON inbound_email_events
  FOR UPDATE USING (auth.uid() = owner_id AND status = 'pending_assignment')
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_inbound_email_events_pending
  ON inbound_email_events (owner_id, created_at DESC)
  WHERE status = 'pending_assignment';
