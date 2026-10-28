-- Beta only: brings an existing Game Center Beta database (old core schema +
-- 20260918221000_notifications + 20260919090000_add_friendships) up to the
-- consolidated core schema from the live repo. Safe to run more than once and
-- a no-op on a fresh database that was built from the new core schema.
--
-- Run order on the beta database (SQL editor):
--   1. this file
--   2. 20260929140000_notifications_and_roles.sql
--   3. 20260929150000_role_management.sql
--   4. 20260929160000_notification_read_state.sql
--   5. 20260929170000_friendship_removal.sql

-- ===========================================================================
-- Remove the old, too permissive policies
-- ===========================================================================

-- Clients must not create notifications (server-side triggers/functions only).
drop policy if exists "Users can create notifications for another user" on public.notifications;
-- Replaced by "Addressee can answer pending requests".
drop policy if exists "Users can update their friendships" on public.friendships;

-- ===========================================================================
-- Clean up existing data so the new constraints/indexes can be created
-- ===========================================================================

update public.profiles
set display_name = nullif(left(btrim(display_name), 50), '')
where display_name is not null
  and char_length(display_name) not between 1 and 50;

update public.notifications
set sender_name = left(sender_name, 50),
    title = left(title, 100),
    message = left(message, 500),
    related_id = left(related_id, 64)
where char_length(sender_name) > 50
   or char_length(title) > 100
   or char_length(message) > 500
   or char_length(related_id) > 64;

-- A→B and B→A may both exist in the old schema. Keep one row per pair
-- (accepted first, then the oldest request).
delete from public.friendships f
using (
  select id,
    row_number() over (
      partition by least(requester_id, addressee_id), greatest(requester_id, addressee_id)
      order by (status = 'accepted') desc, created_at, id
    ) as rn
  from public.friendships
) ranked
where f.id = ranked.id and ranked.rn > 1;

-- ===========================================================================
-- Constraints that "create table if not exists" does not add to old tables
-- ===========================================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_len') then
    alter table public.profiles add constraint profiles_display_name_len
      check (display_name is null or char_length(display_name) between 1 and 50);
  end if;

  -- NOT VALID: existing oversized saves stay readable, new writes are checked.
  if not exists (select 1 from pg_constraint where conname = 'ranking_games_players_size') then
    alter table public.ranking_games add constraint ranking_games_players_size
      check (jsonb_typeof(players) = 'array' and octet_length(players::text) <= 65536) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'notifications_sender_name_len') then
    alter table public.notifications add constraint notifications_sender_name_len
      check (char_length(sender_name) <= 50);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_title_len') then
    alter table public.notifications add constraint notifications_title_len
      check (char_length(title) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_message_len') then
    alter table public.notifications add constraint notifications_message_len
      check (char_length(message) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_related_id_len') then
    alter table public.notifications add constraint notifications_related_id_len
      check (char_length(related_id) <= 64);
  end if;

  -- Usernames that only differ in case cannot be merged automatically.
  if exists (
    select 1 from public.profiles group by lower(username) having count(*) > 1
  ) then
    raise notice 'profiles_username_lower_key skipped: usernames differing only in case exist. Rename them and run this file again.';
  else
    create unique index if not exists profiles_username_lower_key
      on public.profiles (lower(username));
  end if;
end;
$$;

-- ===========================================================================
-- Everything below is the consolidated core schema (idempotent): new tables
-- (F1 strategy overrides, multiplayer lobbies), policies and privileges.
-- ===========================================================================

-- ===========================================================================
-- Profiles
-- ===========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text,
  created_at timestamptz not null default now(),
  constraint profiles_display_name_len
    check (display_name is null or char_length(display_name) between 1 and 50)
);

-- (profiles_username_lower_key is created in the guarded block above.)

alter table public.profiles enable row level security;

drop policy if exists "Profile dürfen gelesen werden" on public.profiles;
create policy "Profile dürfen gelesen werden"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Eigenes Profil darf geändert werden" on public.profiles;
create policy "Eigenes Profil darf geändert werden"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create a profile for every new auth user from the signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'user_' || replace(left(new.id::text, 8), '-', '')
    ),
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles for auth users that existed before the trigger.
insert into public.profiles (id, username, display_name)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'username', ''),
    'user_' || replace(left(u.id::text, 8), '-', '')
  ),
  nullif(u.raw_user_meta_data ->> 'display_name', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ===========================================================================
-- Ranking games (one saved game per user)
-- ===========================================================================

create table if not exists public.ranking_games (
  user_id uuid primary key references auth.users(id) on delete cascade,
  players jsonb not null default '[]'::jsonb,
  round_count integer not null default 0 check (round_count >= 0),
  phase text not null default 'setup'
    check (phase in ('setup', 'playing', 'finished')),
  updated_at timestamptz not null default now(),
  constraint ranking_games_players_size
    check (jsonb_typeof(players) = 'array' and octet_length(players::text) <= 65536)
);

alter table public.ranking_games enable row level security;

drop policy if exists "own ranking game - select" on public.ranking_games;
create policy "own ranking game - select"
  on public.ranking_games for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "own ranking game - insert" on public.ranking_games;
create policy "own ranking game - insert"
  on public.ranking_games for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "own ranking game - update" on public.ranking_games;
create policy "own ranking game - update"
  on public.ranking_games for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===========================================================================
-- Friendships
-- ===========================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self_request check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create index if not exists friendships_requester_idx
  on public.friendships (requester_id);

create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id);

-- One row per user pair regardless of direction (A→B blocks B→A).
create unique index if not exists friendships_unique_unordered_pair
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

alter table public.friendships enable row level security;

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Requests must start as 'pending'.
drop policy if exists "Users can create friendship requests" on public.friendships;
create policy "Users can create friendship requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and status = 'pending');

-- Only the addressee answers a pending request (column grants below limit
-- the update to status/updated_at).
drop policy if exists "Addressee can answer pending requests" on public.friendships;
create policy "Addressee can answer pending requests"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id and status = 'pending')
  with check (auth.uid() = addressee_id and status in ('accepted', 'declined', 'blocked'));

-- ===========================================================================
-- Notifications (read/delete only; created server-side, never by clients)
-- ===========================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  type text not null check (type in ('game_invite', 'friend_request')),
  title text not null,
  message text not null,
  related_id text,
  created_at timestamptz not null default now(),
  constraint notifications_sender_name_len check (char_length(sender_name) <= 50),
  constraint notifications_title_len check (char_length(title) <= 100),
  constraint notifications_message_len check (char_length(message) <= 500),
  constraint notifications_related_id_len check (char_length(related_id) <= 64)
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = recipient_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = recipient_id);

-- ===========================================================================
-- F1 strategy overrides (per user and track)
-- ===========================================================================

create table if not exists public.f1_strategy_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  overrides jsonb not null default '{}'::jsonb
    check (jsonb_typeof(overrides) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id),
  constraint f1_strategy_overrides_size check (octet_length(overrides::text) <= 32768),
  constraint f1_strategy_overrides_track_id_len check (char_length(track_id) <= 64)
);

alter table public.f1_strategy_overrides enable row level security;

drop policy if exists "Users can read their own F1 strategy overrides"
  on public.f1_strategy_overrides;
create policy "Users can read their own F1 strategy overrides"
  on public.f1_strategy_overrides for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own F1 strategy overrides"
  on public.f1_strategy_overrides;
create policy "Users can create their own F1 strategy overrides"
  on public.f1_strategy_overrides for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own F1 strategy overrides"
  on public.f1_strategy_overrides;
create policy "Users can update their own F1 strategy overrides"
  on public.f1_strategy_overrides for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own F1 strategy overrides"
  on public.f1_strategy_overrides;
create policy "Users can delete their own F1 strategy overrides"
  on public.f1_strategy_overrides for delete
  to authenticated
  using (auth.uid() = user_id);

-- ===========================================================================
-- Multiplayer lobbies
-- ===========================================================================

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

-- Live lobby updates via Supabase Realtime (still filtered by RLS).
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

-- ===========================================================================
-- Privileges
-- ===========================================================================
-- Supabase grants everything to anon/authenticated by default. No policy
-- targets anon, TRUNCATE bypasses RLS, and some columns must stay read-only.

revoke all on
  public.profiles,
  public.ranking_games,
  public.friendships,
  public.notifications,
  public.f1_strategy_overrides,
  public.multiplayer_lobbies,
  public.multiplayer_lobby_members
from anon;

revoke truncate, references, trigger on
  public.profiles,
  public.ranking_games,
  public.friendships,
  public.notifications,
  public.f1_strategy_overrides,
  public.multiplayer_lobbies,
  public.multiplayer_lobby_members
from authenticated;

grant select, insert, update, delete on
  public.ranking_games,
  public.f1_strategy_overrides,
  public.multiplayer_lobbies,
  public.multiplayer_lobby_members
to authenticated;

-- Profiles: only the display name is editable.
grant select, insert, delete on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Friendships: only status/updated_at are editable.
grant select, insert, delete on public.friendships to authenticated;
revoke update on public.friendships from authenticated;
grant update (status, updated_at) on public.friendships to authenticated;

-- Notifications: clients may only read and delete.
grant select, delete on public.notifications to authenticated;
revoke insert, update on public.notifications from authenticated;

-- Trigger functions are not meant to be callable over /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
