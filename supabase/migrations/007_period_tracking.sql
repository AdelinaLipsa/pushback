-- Add per-billing-period usage counters to user_profiles.
-- These reset on invoice.paid (Stripe webhook). Lifetime counters stay for analytics.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS period_responses_used int not null default 0,
  ADD COLUMN IF NOT EXISTS period_contracts_used int not null default 0;

-- Gate: defense responses — pro users now have a 150/period limit
create or replace function public.check_and_increment_defense_responses(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  period_count int;
  allowed boolean;
begin
  select plan, defense_responses_used, period_responses_used
  into current_plan, current_count, period_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    if period_count < 150 then
      update public.user_profiles
      set defense_responses_used = defense_responses_used + 1,
          period_responses_used  = period_responses_used + 1
      where id = uid;
      allowed := true;
    else
      allowed := false;
    end if;
  elsif current_count < 1 then
    update public.user_profiles
    set defense_responses_used = defense_responses_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object(
    'allowed', allowed,
    'current_count', current_count,
    'period_count', period_count,
    'reason', case when not allowed and current_plan = 'pro' then 'PERIOD_LIMIT_REACHED' else 'UPGRADE_REQUIRED' end
  );
end;
$$;

-- Gate: contract analyses — pro users now have a 50/period limit
create or replace function public.check_and_increment_contracts(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  period_count int;
  allowed boolean;
begin
  select plan, contracts_used, period_contracts_used
  into current_plan, current_count, period_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    if period_count < 50 then
      update public.user_profiles
      set contracts_used        = contracts_used + 1,
          period_contracts_used = period_contracts_used + 1
      where id = uid;
      allowed := true;
    else
      allowed := false;
    end if;
  elsif current_count < 1 then
    update public.user_profiles
    set contracts_used = contracts_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object(
    'allowed', allowed,
    'current_count', current_count,
    'period_count', period_count,
    'reason', case when not allowed and current_plan = 'pro' then 'PERIOD_LIMIT_REACHED' else 'UPGRADE_REQUIRED' end
  );
end;
$$;

-- Decrement defense responses on failure — also rolls back period counter for pro users
create or replace function public.decrement_defense_responses(uid uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_plan text;
begin
  select plan into current_plan from public.user_profiles where id = uid;

  if current_plan = 'pro' then
    update public.user_profiles
    set defense_responses_used = greatest(0, defense_responses_used - 1),
        period_responses_used  = greatest(0, period_responses_used - 1)
    where id = uid;
  else
    update public.user_profiles
    set defense_responses_used = greatest(0, defense_responses_used - 1)
    where id = uid;
  end if;
end;
$$;

-- Called by Stripe invoice.paid webhook — resets period counters for a new billing cycle
create or replace function public.reset_period_usage(uid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_profiles
  set period_responses_used = 0,
      period_contracts_used = 0
  where id = uid;
end;
$$;
