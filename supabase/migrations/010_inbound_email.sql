-- Inbound email forwarding: per-project and per-user routing tokens

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS inbound_token TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS inbound_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS projects_inbound_token_key
  ON projects (inbound_token)
  WHERE inbound_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_inbound_token_key
  ON profiles (inbound_token)
  WHERE inbound_token IS NOT NULL;

-- Backfill tokens for existing rows
UPDATE projects
SET inbound_token = replace(gen_random_uuid()::text, '-', '')
WHERE inbound_token IS NULL;

UPDATE profiles
SET inbound_token = replace(gen_random_uuid()::text, '-', '')
WHERE inbound_token IS NULL;

ALTER TABLE projects
  ALTER COLUMN inbound_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE profiles
  ALTER COLUMN inbound_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, account_type, inbound_token)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual'),
    replace(gen_random_uuid()::text, '-', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS inbound_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_address TEXT,
  subject TEXT,
  status TEXT NOT NULL CHECK (status IN ('processed', 'failed', 'unmatched')),
  detail TEXT,
  file_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_email_events_project ON inbound_email_events(project_id);
CREATE INDEX IF NOT EXISTS idx_inbound_email_events_owner ON inbound_email_events(owner_id);

ALTER TABLE inbound_email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbound email events" ON inbound_email_events
  FOR SELECT USING (auth.uid() = owner_id);
