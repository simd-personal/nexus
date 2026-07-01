-- Company deck template + voice guidance per project (Deck workspace).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS deck_style JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN projects.deck_style IS 'Deck workspace settings: guidance text, template file id, updated_at.';
