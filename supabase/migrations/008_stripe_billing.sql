-- B2C Stripe billing fields on profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'pro_annual')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
    CHECK (
      subscription_status IS NULL
      OR subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')
    );

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_key
  ON profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
