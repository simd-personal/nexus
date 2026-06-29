-- Rate limiting + lightweight bot/abuse detection.
-- All tables are written via the service-role client only; RLS is enabled with
-- no policies so normal authenticated users cannot read or tamper with them.

-- Fixed-window counters. One row per (key, window) bucket; rows self-expire.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_expires_at
  ON rate_limit_hits (expires_at);

ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;

-- Per-user behavioral signals for bot detection. One row per user, updated in place.
CREATE TABLE IF NOT EXISTS request_signals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_request_at TIMESTAMPTZ,
  last_message_hash TEXT,
  repeat_count INTEGER NOT NULL DEFAULT 0,
  recent_intervals_ms INTEGER[] NOT NULL DEFAULT '{}',
  suspicion_score INTEGER NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE request_signals ENABLE ROW LEVEL SECURITY;

-- Audit log of abuse trips, for monitoring + manual review.
CREATE TABLE IF NOT EXISTS abuse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip TEXT,
  kind TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  endpoint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_events_user_created
  ON abuse_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_events_created
  ON abuse_events (created_at DESC);

ALTER TABLE abuse_events ENABLE ROW LEVEL SECURITY;

-- Atomic fixed-window check-and-increment.
-- Returns { allowed, count, limit, retry_after } as JSONB.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_index BIGINT;
  v_bucket TEXT;
  v_window_start TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_count INTEGER;
  v_retry_after INTEGER;
BEGIN
  v_window_index := floor(extract(epoch FROM now()) / p_window_seconds);
  v_bucket := p_key || ':' || v_window_index::text;
  v_window_start := to_timestamp(v_window_index * p_window_seconds);
  v_expires_at := v_window_start + make_interval(secs => p_window_seconds);

  INSERT INTO rate_limit_hits (bucket, count, window_start, expires_at)
  VALUES (v_bucket, 1, v_window_start, v_expires_at)
  ON CONFLICT (bucket)
  DO UPDATE SET count = rate_limit_hits.count + 1
  RETURNING count INTO v_count;

  v_retry_after := GREATEST(1, CEIL(extract(epoch FROM (v_expires_at - now())))::int);

  RETURN jsonb_build_object(
    'allowed', v_count <= p_max,
    'count', v_count,
    'limit', p_max,
    'retry_after', v_retry_after
  );
END;
$$;

-- Opportunistic cleanup of expired counter rows. Safe to call from anywhere.
CREATE OR REPLACE FUNCTION purge_expired_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM rate_limit_hits WHERE expires_at < now() - interval '1 hour';
$$;

-- Restrict SECURITY DEFINER RPCs to service role only (not callable via anon JWT).
REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION purge_expired_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION purge_expired_rate_limits() TO service_role;
