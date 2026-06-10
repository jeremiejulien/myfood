create table if not exists public.user_journals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  journal_data jsonb not null default '{"suspects": [], "entries": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_journals enable row level security;

drop policy if exists "Users can read their own journal" on public.user_journals;
create policy "Users can read their own journal"
  on public.user_journals
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own journal" on public.user_journals;
create policy "Users can insert their own journal"
  on public.user_journals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own journal" on public.user_journals;
create policy "Users can update their own journal"
  on public.user_journals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
