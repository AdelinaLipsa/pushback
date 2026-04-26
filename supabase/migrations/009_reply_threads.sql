-- 999.1-01: reply_threads table — one client reply analysis per defense_response (v1).
-- D-09: separate child table (not columns on defense_responses) for clean queries + extensibility.
-- D-08: UNIQUE index on defense_response_id enforces one-shot v1 design.

create table public.reply_threads (
  id                   uuid primary key default gen_random_uuid(),
  defense_response_id  uuid references public.defense_responses(id) on delete cascade not null,
  user_id              uuid references auth.users(id) on delete cascade not null,
  client_reply         text not null,
  risk_signal          text not null,
  signal_explanation   text not null,
  follow_up            text not null,
  created_at           timestamptz default now()
);

alter table public.reply_threads enable row level security;

create policy "Own reply threads only" on public.reply_threads
  for all using (auth.uid() = user_id);

-- One reply per defense_response (D-08). Unique violation (23505) is handled in the API route as upsert-style return-existing.
create unique index reply_threads_one_per_response
  on public.reply_threads (defense_response_id);
