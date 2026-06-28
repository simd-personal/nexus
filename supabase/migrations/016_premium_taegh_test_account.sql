-- Ensure the Taegh premium test account has Pro billing on file (idempotent).
UPDATE public.profiles
SET
  plan = 'pro',
  subscription_status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users WHERE lower(email) = 'taegh@test.com' LIMIT 1
);
