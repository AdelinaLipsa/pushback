-- Rename Creem payment columns to Stripe equivalents.
-- Guard: migration 001 was later updated to use stripe_* names directly,
-- so on a fresh DB apply these columns won't exist. Skip silently.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
      AND column_name = 'creem_customer_id'
  ) THEN
    ALTER TABLE public.user_profiles RENAME COLUMN creem_customer_id TO stripe_customer_id;
    ALTER TABLE public.user_profiles RENAME COLUMN creem_subscription_id TO stripe_subscription_id;
  END IF;
END $$;
