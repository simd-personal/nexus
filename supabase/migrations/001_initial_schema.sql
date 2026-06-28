-- BriefNexus initial schema
-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'executive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'watch', 'critical', 'needs_review')),
  last_summary TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'other' CHECK (source_type IN (
    'meeting', 'email', 'deck', 'pdf', 'note', 'transcript', 'audio', 'csv', 'other'
  )),
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'processed', 'failed', 'uploaded_unprocessed'
  )),
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chunks with embeddings (1536 dims for text-embedding-3-small)
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entities extracted from content
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('person', 'facility', 'organization', 'topic', 'date')),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  source_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  source_chunk_id UUID REFERENCES chunks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sunny Updates
CREATE TABLE sunny_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  why_it_matters TEXT,
  suggested_action TEXT,
  source_citations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critical Items
CREATE TABLE critical_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL CHECK (category IN (
    'conflict', 'risk', 'missed_follow_up', 'client_concern', 'ownership_gap',
    'timeline_issue', 'broken_process'
  )),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  sunny_reasoning TEXT,
  suggested_owner TEXT,
  suggested_next_action TEXT,
  source_citations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Action Items
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  source_citations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timeline Events
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'meeting', 'file_upload', 'email', 'note', 'sunny_summary',
    'critical_item', 'action_item', 'playbook', 'follow_up_email', 'contradiction'
  )),
  title TEXT NOT NULL,
  description TEXT,
  source_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated Documents (playbooks, follow-up emails, briefs)
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('playbook', 'follow_up_email', 'brief', 'memo')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_chunks_project ON chunks(project_id);
CREATE INDEX idx_chunks_file ON chunks(file_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_sunny_updates_project ON sunny_updates(project_id);
CREATE INDEX idx_critical_items_project ON critical_items(project_id);
CREATE INDEX idx_critical_items_status ON critical_items(status);
CREATE INDEX idx_action_items_project ON action_items(project_id);
CREATE INDEX idx_timeline_events_project ON timeline_events(project_id);
CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_generated_documents_project ON generated_documents(project_id);

-- Full-text search on chunks
CREATE INDEX idx_chunks_text_search ON chunks USING gin(to_tsvector('english', text));

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  file_id uuid,
  chunk_index int,
  text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.project_id,
    c.file_id,
    c.chunk_index,
    c.text,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_project_id IS NULL OR c.project_id = filter_project_id)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Keyword search function
CREATE OR REPLACE FUNCTION search_chunks_keyword(
  search_query text,
  filter_project_id uuid DEFAULT NULL,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  file_id uuid,
  chunk_index int,
  text text,
  metadata jsonb,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.project_id,
    c.file_id,
    c.chunk_index,
    c.text,
    c.metadata,
    ts_rank(to_tsvector('english', c.text), plainto_tsquery('english', search_query)) AS rank
  FROM chunks c
  WHERE to_tsvector('english', c.text) @@ plainto_tsquery('english', search_query)
    AND (filter_project_id IS NULL OR c.project_id = filter_project_id)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Auto-create profile on signup
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER critical_items_updated_at
  BEFORE UPDATE ON critical_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunny_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Helper: check project ownership for child tables
CREATE OR REPLACE FUNCTION is_project_owner(p_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE id = p_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Child table policies (via project ownership)
CREATE POLICY "Project owners can view files" ON files FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert files" ON files FOR INSERT WITH CHECK (is_project_owner(project_id));
CREATE POLICY "Project owners can update files" ON files FOR UPDATE USING (is_project_owner(project_id));
CREATE POLICY "Project owners can delete files" ON files FOR DELETE USING (is_project_owner(project_id));

CREATE POLICY "Project owners can view chunks" ON chunks FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert chunks" ON chunks FOR INSERT WITH CHECK (is_project_owner(project_id));
CREATE POLICY "Project owners can delete chunks" ON chunks FOR DELETE USING (is_project_owner(project_id));

CREATE POLICY "Project owners can view entities" ON entities FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert entities" ON entities FOR INSERT WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can view sunny_updates" ON sunny_updates FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert sunny_updates" ON sunny_updates FOR INSERT WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can view critical_items" ON critical_items FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert critical_items" ON critical_items FOR INSERT WITH CHECK (is_project_owner(project_id));
CREATE POLICY "Project owners can update critical_items" ON critical_items FOR UPDATE USING (is_project_owner(project_id));

CREATE POLICY "Project owners can view action_items" ON action_items FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert action_items" ON action_items FOR INSERT WITH CHECK (is_project_owner(project_id));
CREATE POLICY "Project owners can update action_items" ON action_items FOR UPDATE USING (is_project_owner(project_id));

CREATE POLICY "Project owners can view timeline_events" ON timeline_events FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert timeline_events" ON timeline_events FOR INSERT WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can view chat_messages" ON chat_messages FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can view generated_documents" ON generated_documents FOR SELECT USING (is_project_owner(project_id));
CREATE POLICY "Project owners can insert generated_documents" ON generated_documents FOR INSERT WITH CHECK (is_project_owner(project_id));

-- Storage bucket policy (run separately in Supabase dashboard or via storage migration)
-- Bucket name: briefnexus-files
-- RLS: users can only access files in their own projects
