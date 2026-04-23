create or replace function public.check_and_increment_defense_responses(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  allowed boolean;
begin
  select plan, defense_responses_used
  into current_plan, current_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    allowed := true;
  elsif current_count < 3 then
    update public.user_profiles
    set defense_responses_used = defense_responses_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object('allowed', allowed, 'current_count', current_count);
end;
$$;

create or replace function public.check_and_increment_contracts(uid uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_plan text;
  current_count int;
  allowed boolean;
begin
  select plan, contracts_used
  into current_plan, current_count
  from public.user_profiles
  where id = uid
  for update;

  if current_plan = 'pro' then
    allowed := true;
  elsif current_count < 1 then
    update public.user_profiles
    set contracts_used = contracts_used + 1
    where id = uid;
    allowed := true;
  else
    allowed := false;
  end if;

  return jsonb_build_object('allowed', allowed, 'current_count', current_count);
end;
$$;
