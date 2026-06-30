-- Track replace-in-place diffs and Sunny summaries for living documents

CREATE TABLE file_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  summary TEXT NOT NULL,
  ai_summary TEXT NOT NULL,
  additions JSONB NOT NULL DEFAULT '[]',
  removals JSONB NOT NULL DEFAULT '[]',
  diff_stats JSONB NOT NULL DEFAULT '{}',
  diff_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_revisions_file ON file_revisions(file_id, created_at DESC);
CREATE INDEX idx_file_revisions_project ON file_revisions(project_id, created_at DESC);

ALTER TABLE file_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view file revisions" ON file_revisions
  FOR SELECT USING (is_project_owner(project_id));

CREATE POLICY "Project members can insert file revisions" ON file_revisions
  FOR INSERT WITH CHECK (is_project_owner(project_id));

ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_event_type_check;
ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_event_type_check CHECK (event_type IN (
  'meeting', 'file_upload', 'email', 'note', 'sunny_summary',
  'critical_item', 'action_item', 'playbook', 'follow_up_email', 'contradiction',
  'file_moved', 'file_shared', 'file_replaced'
));
