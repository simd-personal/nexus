-- B2C individual accounts + B2B organization tenancy, access requests, PHI settings

-- Extend profiles for account type
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'enterprise')),
  ADD COLUMN IF NOT EXISTS default_organization_id UUID;

-- Organizations (B2B tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL DEFAULT 'other'
    CHECK (industry IN ('software', 'healthcare', 'other')),
  phi_protection_enabled BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_organization_id_fkey
  FOREIGN KEY (default_organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- Organization membership with roles
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);

-- Access requests (join org / request project access)
CREATE TABLE organization_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_access_requests_org ON organization_access_requests(organization_id, status);

-- Link projects to organizations (null = personal B2C project)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_projects_organization ON projects(organization_id);

-- Enterprise audit trail
CREATE TABLE organization_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_audit_org ON organization_audit_events(organization_id, created_at DESC);

-- Slug helper
CREATE OR REPLACE FUNCTION slugify_org_name(input TEXT)
RETURNS TEXT AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input, 'org')), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- Project access: owner OR active org member
CREATE OR REPLACE FUNCTION can_access_project(p_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = p_id
      AND (
        p.owner_id = auth.uid()
        OR (
          p.organization_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM organization_members om
            WHERE om.organization_id = p.organization_id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
          )
        )
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND om.role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Replace project ownership check used by child tables
CREATE OR REPLACE FUNCTION is_project_owner(p_id uuid)
RETURNS boolean AS $$
  SELECT can_access_project(p_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Expand project policies for org members
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (can_access_project(id));

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    AND (
      organization_id IS NULL
      OR is_org_admin(organization_id)
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = projects.organization_id
          AND om.user_id = auth.uid()
          AND om.status = 'active'
      )
    )
  );

CREATE POLICY "Project owners and org admins can update projects" ON projects
  FOR UPDATE USING (
    auth.uid() = owner_id
    OR (organization_id IS NOT NULL AND is_org_admin(organization_id))
  );

CREATE POLICY "Project owners and org admins can delete projects" ON projects
  FOR DELETE USING (
    auth.uid() = owner_id
    OR (organization_id IS NOT NULL AND is_org_admin(organization_id))
  );

-- Profile signup hook
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Org admins can update organizations" ON organizations
  FOR UPDATE USING (is_org_admin(id));

CREATE POLICY "Members can view org membership" ON organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_org_admin(organization_id)
  );

CREATE POLICY "Org admins can manage membership" ON organization_members
  FOR ALL USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Users can insert own membership when creating org" ON organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own access requests" ON organization_access_requests
  FOR SELECT USING (user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY "Users can request org access" ON organization_access_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org admins can review access requests" ON organization_access_requests
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY "Org admins can view audit events" ON organization_audit_events
  FOR SELECT USING (is_org_admin(organization_id));

CREATE POLICY "Org admins can insert audit events" ON organization_audit_events
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
