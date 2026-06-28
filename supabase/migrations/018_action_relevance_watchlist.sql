-- Account and project watchlists for filtering action item noise from transcripts.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS name_aliases TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS watch_keywords TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS watch_keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS my_role TEXT;

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS applies_to_me BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS item_kind TEXT,
  ADD COLUMN IF NOT EXISTS matched_terms TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_action_items_applies_to_me
  ON action_items (project_id, applies_to_me)
  WHERE status = 'open';
