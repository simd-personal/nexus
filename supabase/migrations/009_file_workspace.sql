-- Project-scoped file workspace: notes, lineage, and transfer timeline events

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS user_note TEXT,
  ADD COLUMN IF NOT EXISTS origin_file_id UUID REFERENCES files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_files_origin ON files(origin_file_id);

ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;
ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_event_type_check CHECK (event_type IN (
  'meeting', 'file_upload', 'email', 'note', 'sunny_summary',
  'critical_item', 'action_item', 'playbook', 'follow_up_email', 'contradiction',
  'file_moved', 'file_shared'
));
