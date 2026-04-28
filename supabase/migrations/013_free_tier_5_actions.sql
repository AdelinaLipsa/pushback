-- Increase free tier from 1 to 5 AI actions so users can experience multiple tools
-- before hitting the upgrade wall. Contract analysis stays at 1 (heavier/costlier).

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
  elsif current_count < 5 then
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
