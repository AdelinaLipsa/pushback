-- Rename Creem payment columns to Stripe equivalents
ALTER TABLE public.user_profiles
  RENAME COLUMN creem_customer_id TO stripe_customer_id;

ALTER TABLE public.user_profiles
  RENAME COLUMN creem_subscription_id TO stripe_subscription_id;
