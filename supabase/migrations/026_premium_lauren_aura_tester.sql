-- Ensure Lauren Tharp (Aura client tester) has Pro billing on file (idempotent).
UPDATE public.profiles
SET
  plan = 'pro',
  subscription_status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE lower(email) = 'lauren.tharp@aura.com' LIMIT 1
);
