-- Let users see and claim smart-inbox emails that failed subject matching

CREATE POLICY "Users can view unclaimed smart inbox failures" ON inbound_email_events
  FOR SELECT USING (
    owner_id IS NULL
    AND status IN ('unmatched', 'pending_assignment')
    AND (
      detail ILIKE '%Could not determine which project%'
      OR detail ILIKE '%Awaiting manual assignment%'
    )
  );

CREATE POLICY "Users can claim unclaimed smart inbox failures" ON inbound_email_events
  FOR UPDATE USING (
    owner_id IS NULL
    AND status IN ('unmatched', 'pending_assignment')
    AND (
      detail ILIKE '%Could not determine which project%'
      OR detail ILIKE '%Awaiting manual assignment%'
    )
  )
  WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

-- Upgrade legacy rows and add a dashboard preview when body was not stored
UPDATE inbound_email_events
SET
  status = 'pending_assignment',
  body_preview = COALESCE(
    NULLIF(body_preview, ''),
    'Original message content was not saved. Forward this email again from Outlook, then assign the new entry.'
  ),
  detail = 'Awaiting manual assignment from dashboard.'
WHERE status = 'unmatched'
  AND detail ILIKE '%Could not determine which project%';
