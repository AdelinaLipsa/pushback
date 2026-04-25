-- WR-03: atomic relative decrement to replace hard-set compensating writes.
-- Uses greatest(0, ...) to prevent negative counts on edge cases.
-- Skips pro users — their usage is not tracked.
create or replace function public.decrement_defense_responses(uid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_profiles
  set defense_responses_used = greatest(0, defense_responses_used - 1)
  where id = uid and plan != 'pro';
end;
$$;
