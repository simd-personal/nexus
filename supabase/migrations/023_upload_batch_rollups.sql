-- Idempotent lock for multi-file upload Sunny update rollups
CREATE TABLE upload_batch_rollups (
  batch_id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_upload_batch_rollups_project ON upload_batch_rollups(project_id);

ALTER TABLE upload_batch_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can view upload batch rollups"
  ON upload_batch_rollups FOR SELECT
  USING (is_project_owner(project_id));
