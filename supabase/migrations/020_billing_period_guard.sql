-- H-05: idempotency guard for invoice.paid period resets.
-- Stores the current billing period end so duplicate webhook deliveries
-- (or concurrent checkout.session.completed + invoice.paid) cannot zero out
-- counters for a period that has already been reset.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS billing_period_end timestamptz;

-- Updated reset_period_usage: only resets if new_period_end is strictly newer
-- than the stored billing_period_end (or either is NULL for backward compat).
CREATE OR REPLACE FUNCTION public.reset_period_usage(uid uuid, new_period_end timestamptz DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET period_responses_used = 0,
      period_contracts_used = 0,
      billing_period_end    = COALESCE(new_period_end, billing_period_end)
  WHERE id = uid
    AND (
      new_period_end IS NULL
      OR billing_period_end IS NULL
      OR new_period_end > billing_period_end
    );
END;
$$;
