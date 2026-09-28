create table if not exists public.f1_strategy_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  overrides jsonb not null default '{}'::jsonb
    check (jsonb_typeof(overrides) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.f1_strategy_overrides enable row level security;

grant select, insert, update, delete on public.f1_strategy_overrides to authenticated;

drop policy if exists "Users can read their own F1 strategy overrides"
  on public.f1_strategy_overrides;
drop policy if exists "Users can create their own F1 strategy overrides"
  on public.f1_strategy_overrides;
drop policy if exists "Users can update their own F1 strategy overrides"
  on public.f1_strategy_overrides;
drop policy if exists "Users can delete their own F1 strategy overrides"
  on public.f1_strategy_overrides;

create policy "Users can read their own F1 strategy overrides"
  on public.f1_strategy_overrides for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own F1 strategy overrides"
  on public.f1_strategy_overrides for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own F1 strategy overrides"
  on public.f1_strategy_overrides for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own F1 strategy overrides"
  on public.f1_strategy_overrides for delete
  to authenticated
  using (auth.uid() = user_id);