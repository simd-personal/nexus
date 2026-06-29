-- Speed up cron sweeps for stuck pending/processing files.
CREATE INDEX IF NOT EXISTS idx_files_stale_processing
  ON files (status, created_at)
  WHERE status IN ('pending', 'processing');
