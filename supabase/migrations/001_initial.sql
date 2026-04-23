create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  plan text not null default 'free',
  defense_responses_used int not null default 0,
  contracts_used int not null default 0,
  creem_customer_id text,
  creem_subscription_id text,
  created_at timestamptz default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  original_filename text,
  contract_text text,
  anthropic_file_id text,
  risk_score int,
  risk_level text,
  analysis jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contract_id uuid references public.contracts(id) on delete set null,
  title text not null,
  client_name text not null,
  client_email text,
  project_value numeric,
  currency text default 'EUR',
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

create table public.defense_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tool_type text not null,
  situation text not null,
  extra_context jsonb default '{}'::jsonb,
  response text not null,
  was_copied boolean default false,
  was_sent boolean default false,
  created_at timestamptz default now()
);

alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.contracts enable row level security;
alter table public.defense_responses enable row level security;

create policy "Own data only" on public.user_profiles for all using (auth.uid() = id);
create policy "Own projects only" on public.projects for all using (auth.uid() = user_id);
create policy "Own contracts only" on public.contracts for all using (auth.uid() = user_id);
create policy "Own responses only" on public.defense_responses for all using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
