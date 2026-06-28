-- Fix keyword search (ts_rank returns real, not double precision)
-- Add fuzzy fallback for natural-language queries like "latest q3 review"

DROP FUNCTION IF EXISTS search_chunks_keyword(text, uuid, integer);

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
  WHERE to_tsvector('english', c.text) @@ websearch_to_tsquery('english', search_query)
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
  WHERE (
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
