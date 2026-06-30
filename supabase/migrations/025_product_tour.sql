-- Product tour progress on user profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS product_tour_prompt_dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS product_tour_part1_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS product_tour_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS product_tour_last_step TEXT;
