create table if not exists public.multiplayer_lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  game_key text check (game_key is null or game_key in ('flip-7')),
  status text not null default 'open' check (status in ('open')),
  created_at timestamptz not null default now()
);

create table if not exists public.multiplayer_lobby_members (
  lobby_id uuid not null references public.multiplayer_lobbies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (lobby_id, user_id)
);

create index if not exists multiplayer_lobbies_status_created_idx
  on public.multiplayer_lobbies (status, created_at desc);

alter table public.multiplayer_lobbies enable row level security;
alter table public.multiplayer_lobby_members enable row level security;

drop policy if exists "Open lobbies are visible" on public.multiplayer_lobbies;
create policy "Open lobbies are visible"
  on public.multiplayer_lobbies for select
  to authenticated
  using (status = 'open' or auth.uid() = host_user_id);

drop policy if exists "Users can create their own lobbies" on public.multiplayer_lobbies;
create policy "Users can create their own lobbies"
  on public.multiplayer_lobbies for insert
  to authenticated
  with check (auth.uid() = host_user_id);

drop policy if exists "Hosts can update their lobbies" on public.multiplayer_lobbies;
create policy "Hosts can update their lobbies"
  on public.multiplayer_lobbies for update
  to authenticated
  using (auth.uid() = host_user_id)
  with check (auth.uid() = host_user_id);

drop policy if exists "Hosts can close their lobbies" on public.multiplayer_lobbies;
create policy "Hosts can close their lobbies"
  on public.multiplayer_lobbies for delete
  to authenticated
  using (auth.uid() = host_user_id);

drop policy if exists "Lobby members are visible" on public.multiplayer_lobby_members;
create policy "Lobby members are visible"
  on public.multiplayer_lobby_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.multiplayer_lobbies
      where id = lobby_id and status = 'open'
    )
  );

drop policy if exists "Users can join open lobbies" on public.multiplayer_lobby_members;
create policy "Users can join open lobbies"
  on public.multiplayer_lobby_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.multiplayer_lobbies
      where id = lobby_id and status = 'open'
    )
  );

drop policy if exists "Members can leave their lobbies" on public.multiplayer_lobby_members;
create policy "Members can leave their lobbies"
  on public.multiplayer_lobby_members for delete
  to authenticated
  using (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'multiplayer_lobbies'
  ) then
    alter publication supabase_realtime add table public.multiplayer_lobbies;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'multiplayer_lobby_members'
  ) then
    alter publication supabase_realtime add table public.multiplayer_lobby_members;
  end if;
end;
$$;