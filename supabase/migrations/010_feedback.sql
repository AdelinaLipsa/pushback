create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  category text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "Users can insert own feedback"
  on feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own feedback"
  on feedback for select
  to authenticated
  using (auth.uid() = user_id);
