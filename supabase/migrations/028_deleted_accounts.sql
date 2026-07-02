-- Records deleted accounts so free users who consumed their quota can't
-- reset limits by deleting and re-creating an account with the same email.
-- Paying users (any subscription history) may always sign up again.

CREATE TABLE IF NOT EXISTS deleted_accounts (
  email TEXT PRIMARY KEY,
  was_paid BOOLEAN NOT NULL DEFAULT FALSE,
  hit_free_limit BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service-role access only: RLS enabled with no policies.
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- DB-level backstop: blocks every signup path (email, web OAuth, and mobile
-- signInWithIdToken, which never touches our API routes). App routes check
-- first for a friendly message; this trigger guarantees enforcement.
-- SECURITY DEFINER: the auth admin role can't read public.deleted_accounts.
CREATE OR REPLACE FUNCTION block_deleted_free_account_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.deleted_accounts
    WHERE email = LOWER(NEW.email)
      AND was_paid = FALSE
      AND hit_free_limit = TRUE
  ) THEN
    RAISE EXCEPTION 'signup_blocked_deleted_account'
      USING HINT = 'This email belonged to a deleted account and cannot sign up again.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION block_deleted_free_account_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS before_auth_user_insert_block_deleted ON auth.users;
CREATE TRIGGER before_auth_user_insert_block_deleted
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION block_deleted_free_account_signup();
