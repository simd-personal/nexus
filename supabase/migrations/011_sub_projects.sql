-- Sub-projects: one level of nesting (program / workstream)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS parent_project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);

-- Parents must be top-level (no nested programs)
CREATE OR REPLACE FUNCTION check_project_parent_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_project_id = NEW.id THEN
    RAISE EXCEPTION 'A project cannot be its own parent';
  END IF;

  IF EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = NEW.parent_project_id
      AND p.parent_project_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Sub-projects can only be attached to a top-level program project';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_parent_depth ON projects;
CREATE TRIGGER projects_parent_depth
  BEFORE INSERT OR UPDATE OF parent_project_id ON projects
  FOR EACH ROW EXECUTE FUNCTION check_project_parent_depth();
