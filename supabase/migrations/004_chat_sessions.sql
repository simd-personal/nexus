-- Chat sessions (GPT/Claude-style saved conversations)

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('project', 'search')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_owner ON chat_sessions(owner_id);
CREATE INDEX idx_chat_sessions_project ON chat_sessions(project_id);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ALTER COLUMN project_id DROP NOT NULL;

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat_sessions"
  ON chat_sessions FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users view messages via session"
  ON chat_messages FOR SELECT
  USING (
    (session_id IS NOT NULL AND session_id IN (
      SELECT id FROM chat_sessions WHERE owner_id = auth.uid()
    ))
    OR (project_id IS NOT NULL AND is_project_owner(project_id))
  );

CREATE POLICY "Users insert messages via session"
  ON chat_messages FOR INSERT
  WITH CHECK (
    (session_id IS NOT NULL AND session_id IN (
      SELECT id FROM chat_sessions WHERE owner_id = auth.uid()
    ))
    OR (project_id IS NOT NULL AND is_project_owner(project_id))
  );

CREATE OR REPLACE FUNCTION touch_chat_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_id IS NOT NULL THEN
    UPDATE chat_sessions SET updated_at = now() WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER chat_message_touch_session
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION touch_chat_session();
