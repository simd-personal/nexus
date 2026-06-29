-- Harden search RPCs so chunks from other accounts never leak, even if RLS is misconfigured.
-- Also force RLS on chunks so table owners cannot bypass policies.

ALTER TABLE chunks FORCE ROW LEVEL SECURITY;

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
SECURITY INVOKER
SET search_path = public
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
    AND can_access_project(c.project_id)
    AND (filter_project_id IS NULL OR c.project_id = filter_project_id)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

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
  rank real
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
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
    ts_rank(
      to_tsvector('english', c.text),
      websearch_to_tsquery('english', search_query)
    )::real AS rank
  FROM chunks c
  WHERE can_access_project(c.project_id)
    AND to_tsvector('english', c.text) @@ websearch_to_tsquery('english', search_query)
    AND (filter_project_id IS NULL OR c.project_id = filter_project_id)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_chunks_fuzzy(
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
  rank real
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  terms text[];
BEGIN
  SELECT array_agg(DISTINCT t)
  INTO terms
  FROM unnest(
    regexp_split_to_array(
      lower(regexp_replace(search_query, '[^a-zA-Z0-9]+', ' ', 'g')),
      '\s+'
    )
  ) AS t
  WHERE length(t) >= 2
    AND t NOT IN (
      'me', 'my', 'the', 'and', 'for', 'are', 'was', 'were', 'has', 'have', 'had',
      'tell', 'everything', 'latest', 'about', 'what', 'when', 'where', 'who',
      'how', 'all', 'any', 'can', 'you', 'from', 'with', 'that', 'this', 'into'
    );

  IF terms IS NULL OR array_length(terms, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.project_id,
    c.file_id,
    c.chunk_index,
    c.text,
    c.metadata,
    (
      SELECT count(*)::real
      FROM unnest(terms) AS term
      WHERE c.text ILIKE '%' || term || '%'
         OR p.project_name ILIKE '%' || term || '%'
         OR p.client_name ILIKE '%' || term || '%'
         OR coalesce(p.last_summary, '') ILIKE '%' || term || '%'
         OR coalesce(p.description, '') ILIKE '%' || term || '%'
    ) AS rank
  FROM chunks c
  JOIN projects p ON p.id = c.project_id
  WHERE can_access_project(c.project_id)
    AND (
      SELECT count(*)
      FROM unnest(terms) AS term
      WHERE c.text ILIKE '%' || term || '%'
         OR p.project_name ILIKE '%' || term || '%'
         OR p.client_name ILIKE '%' || term || '%'
         OR coalesce(p.last_summary, '') ILIKE '%' || term || '%'
         OR coalesce(p.description, '') ILIKE '%' || term || '%'
    ) > 0
    AND (filter_project_id IS NULL OR c.project_id = filter_project_id)
  ORDER BY rank DESC, c.created_at DESC
  LIMIT match_count;
END;
$$;
