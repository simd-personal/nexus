-- Tighten action item defaults: new rows should not assume applies_to_me until relevance is confirmed.

ALTER TABLE action_items
  ALTER COLUMN applies_to_me SET DEFAULT false;
