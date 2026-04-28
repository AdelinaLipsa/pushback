-- C-04: atomic relative decrement for contract quota — mirrors decrement_defense_responses.
-- Replaces the absolute compensating writes in contracts/analyze/route.ts which were
-- vulnerable to TOCTOU race conditions under concurrent requests.
CREATE OR REPLACE FUNCTION public.decrement_contracts(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_plan text;
BEGIN
  SELECT plan INTO current_plan FROM public.user_profiles WHERE id = uid;

  IF current_plan = 'pro' THEN
    UPDATE public.user_profiles
    SET contracts_used        = GREATEST(0, contracts_used - 1),
        period_contracts_used = GREATEST(0, period_contracts_used - 1)
    WHERE id = uid;
  ELSE
    UPDATE public.user_profiles
    SET contracts_used = GREATEST(0, contracts_used - 1)
    WHERE id = uid;
  END IF;
END;
$$;
