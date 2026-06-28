-- INSERT ... RETURNING evaluates SELECT policies on the new row.
-- can_access_project() re-queries projects and fails during RETURNING;
-- a direct owner check on the new row fixes create-project flows.

CREATE POLICY "Project owners can select own projects" ON projects
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner_id);
