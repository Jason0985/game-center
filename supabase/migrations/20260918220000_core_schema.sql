-- Game Center core schema: builds the complete database on an empty Supabase
-- project. Consolidates all migrations up to 2026-10-09: profiles, roles, friends,
-- notifications, F1 strategy, lobbies (guests, host transfer, inactivity cleanup),
-- Flip 7, Skip-Bo, Uno, game results, saved tool state, push notifications,
-- error monitoring and the name filter.
--
-- Later changes go into small follow-up files in this folder, named
-- <YYYYMMDDHHMMSS>_<what_it_does>.sql, and are run in order after this one.
--
-- Needs the Supabase extensions pg_net and pg_cron (enabled below) and, for push,
-- two Vault secrets (see the push section).

-- ===========================================================================
-- Profiles
-- ===========================================================================

-- Inappropriate user and display names are refused (accounts and guests): the table checks
-- them (profiles_names_allowed), the app asks first via RPC so registration and guest join
-- show a clear message instead of a trigger error.
--
-- Normalisiert wird: klein, ä/ö/ü/ß, Leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, 8→b, @, $, !, |),
-- alles andere als Trenner, doppelte Buchstaben zusammengezogen ("fiiick" → "fick").
-- Zwei Listen (schon zusammengezogen geschrieben):
--   anywhere: verboten auch mitten im Namen ("xXFickerXx")
--   word:     nur als eigenes Wort bzw. als ganzer Name, weil sie in harmlosen Namen stecken
--             ("Thure" → hure, "Annalena" → anal, "Hancock" → cock)
-- ponytail: feste Liste, kein Moderations-Dienst; erweitern, wenn etwas durchrutscht.

create or replace function public.name_is_allowed(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with spaced as (
    select regexp_replace(
             translate(replace(lower(coalesce(p_name, '')), 'ß', 'ss'),
                       'äöü0134578@$!|', 'aouoieastbasii'),
             '[^a-z]+', ' ', 'g') as s
  ), parts as (
    select regexp_replace(replace(s, ' ', ''), '(.)\1+', '\1', 'g') as joined,
           array(select regexp_replace(t, '(.)\1+', '\1', 'g')
                 from unnest(string_to_array(btrim(s), ' ')) as t) as words
    from spaced
  )
  select not exists (
           select 1 from parts, unnest(array[
             'fick', 'fuck', 'fotze', 'wichser', 'wixer', 'hurensohn', 'arschloch', 'arschgeige',
             'schlampe', 'misgeburt', 'spast', 'behindert', 'schwuchtel', 'kanake', 'neger',
             'niger', 'niga', 'hitler', 'siegheil', 'nsdap', 'auschwitz', 'penis', 'vagina',
             'pusy', 'titen', 'scheis', 'shit', 'bitch', 'whore', 'slut', 'retard', 'fagot',
             'porn', 'wanker'
           ]) as bad
           where position(bad in parts.joined) > 0
         )
     and not exists (
           select 1 from parts, unnest(array[
             'hure', 'nute', 'arsch', 'nazi', 'nazis', 'sex', 'dick', 'cock', 'cunt', 'fag',
             'rape', 'anal', 'cum', 'tits', 'mongo', 'kz'
           ]) as bad
           where bad = any(parts.words) or bad = parts.joined
         );
$$;

grant execute on function public.name_is_allowed(text) to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text,
  created_at timestamptz not null default now(),
  -- Extra roles on top of the base "user" role; empty = plain user, admins have every
  -- role. Changed only by admins through set_user_roles (not in the column grant).
  --   admin         everything, incl. system notifications and role management
  --   race_results  may extract race results from screenshots (race-result-ocr)
  roles text[] not null default '{}'
    constraint profiles_roles_known check (roles <@ array['admin', 'race_results']::text[]),
  -- Anonymous guest (lobby code without an account); kept in sync by a trigger on
  -- auth.users, not in the column grant, so clients cannot flip it.
  is_guest boolean not null default false,
  constraint profiles_display_name_len
    check (display_name is null or char_length(display_name) between 1 and 50),
  constraint profiles_names_allowed
    check (public.name_is_allowed(username) and public.name_is_allowed(display_name))
);

-- Block look-alike impersonation ("Jason" vs "jason").
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

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

-- Guests get a generated username and the display name chosen when joining.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.is_anonymous then
    insert into public.profiles (id, username, display_name, is_guest)
    values (
      new.id,
      'guest_' || left(replace(new.id::text, '-', ''), 10),
      coalesce(left(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 50), 'Gast'),
      true
    );
    return new;
  end if;

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
-- friend_request / friend_accepted: created by the friendship trigger
-- game_invite:                      lobby invites
-- system_info / system_alert:       admin broadcasts, dismiss only
-- read_at: read state in the database (not per browser), so the badge and the
-- startup pop-ups agree across devices.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  type text not null
    check (type in ('friend_request', 'friend_accepted', 'game_invite', 'system_info', 'system_alert')),
  title text not null,
  message text not null,
  related_id text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
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
-- The host picks the game and its settings in the waiting lobby (game_settings,
-- e.g. Flip 7 targetScore: null = open game, the host ends it). Monopoly is played
-- externally on richup.io; the lobby only shows a link and cannot start it. The
-- lobby code lives in multiplayer_lobby_codes, readable only by the host.

create table if not exists public.multiplayer_lobbies (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  game_key text default 'flip-7'
    check (game_key is null or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno')),
  status text not null default 'open' check (status in ('open', 'started')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  game_settings jsonb not null default '{"targetScore": 200}'
    check (jsonb_typeof(game_settings) = 'object' and octet_length(game_settings::text) <= 1024)
);

create table if not exists public.multiplayer_lobby_members (
  lobby_id uuid not null references public.multiplayer_lobbies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  ready boolean not null default false,
  primary key (lobby_id, user_id)
);

create index if not exists multiplayer_lobbies_status_created_idx
  on public.multiplayer_lobbies (status, created_at desc);

alter table public.multiplayer_lobbies enable row level security;

alter table public.multiplayer_lobby_members enable row level security;

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
-- ===========================================================================
-- Roles
-- ===========================================================================
-- Users cannot assign themselves a role: authenticated may only update
-- profiles.display_name (column grant below).

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and 'admin' = any(roles)
  );
$$;

-- ===========================================================================
-- Friend request notifications
-- ===========================================================================

create or replace function public.notify_friendship_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  actor_name text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    select coalesce(display_name, username) into actor_name
    from public.profiles where id = new.requester_id;
    actor_name := left(coalesce(actor_name, 'Jemand'), 50);

    insert into public.notifications
      (recipient_id, sender_id, sender_name, type, title, message, related_id)
    values
      (new.addressee_id, new.requester_id, actor_name, 'friend_request',
       'Freundschaftsanfrage', actor_name || ' möchte dich als Freund hinzufügen.', new.id::text);

  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    -- Answered: the request notification is no longer actionable.
    delete from public.notifications
    where type = 'friend_request' and related_id = new.id::text;

    if new.status = 'accepted' then
      select coalesce(display_name, username) into actor_name
      from public.profiles where id = new.addressee_id;
      actor_name := left(coalesce(actor_name, 'Jemand'), 50);

      insert into public.notifications
        (recipient_id, sender_id, sender_name, type, title, message, related_id)
      values
        (new.requester_id, new.addressee_id, actor_name, 'friend_accepted',
         'Anfrage angenommen', actor_name || ' hat deine Freundschaftsanfrage angenommen.',
         new.id::text);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists friendships_notify on public.friendships;
create trigger friendships_notify
after insert or update of status on public.friendships
for each row execute function public.notify_friendship_change();

revoke execute on function public.notify_friendship_change() from public, anon, authenticated;

-- System notifications go to accounts only.
create or replace function public.send_system_notification(
  p_type text,
  p_title text,
  p_message text
)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  sent integer;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Systembenachrichtigungen senden.'
      using errcode = '42501';
  end if;

  if p_type not in ('system_info', 'system_alert') then
    raise exception 'Ungültiger Benachrichtigungstyp.' using errcode = '22023';
  end if;

  if coalesce(btrim(p_title), '') = '' or coalesce(btrim(p_message), '') = '' then
    raise exception 'Titel und Nachricht sind erforderlich.' using errcode = '22023';
  end if;

  insert into public.notifications (recipient_id, sender_id, sender_name, type, title, message)
  select p.id, auth.uid(), 'Game Center', p_type, btrim(p_title), btrim(p_message)
  from public.profiles p
  where not p.is_guest;

  get diagnostics sent = row_count;
  return sent;
end;
$$;

revoke execute on function public.send_system_notification(text, text, text) from public, anon;
grant execute on function public.send_system_notification(text, text, text) to authenticated;

-- ===========================================================================
-- Realtime (new notifications update the badge live; still filtered by RLS)
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

-- Recipients may only set read_at on their own notifications.
drop policy if exists "Users can mark their own notifications as read" on public.notifications;
create policy "Users can mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

grant update (read_at) on public.notifications to authenticated;

-- Friends can be removed again, and declining a request deletes it so the
-- requester can send a new one later (e.g. after an accidental decline).

-- Addressee: decline a request or remove a friend.
-- Requester: withdraw a request or remove a friend (not when blocked).
drop policy if exists "Participants can remove friendships" on public.friendships;
create policy "Participants can remove friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = addressee_id or (auth.uid() = requester_id and status <> 'blocked'));

-- The open request notification disappears together with the request.
create or replace function public.cleanup_friendship_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.notifications
  where type = 'friend_request' and related_id = old.id::text;
  return null;
end;
$$;

drop trigger if exists friendships_cleanup_notifications on public.friendships;
create trigger friendships_cleanup_notifications
after delete on public.friendships
for each row execute function public.cleanup_friendship_notifications();

revoke execute on function public.cleanup_friendship_notifications() from public, anon, authenticated;

-- True if the current user has the role; admins have every role.
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (p_role = any(roles) or 'admin' = any(roles))
  );
$$;

-- Replaces all extra roles of a user. Admins cannot change their own roles, so
-- at least one admin always remains.
create or replace function public.set_user_roles(p_user_id uuid, p_roles text[])
returns public.profiles
language plpgsql
security definer set search_path = ''
as $$
declare
  cleaned text[];
  updated public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Nur Admins dürfen Rollen verwalten.' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du kannst deine eigenen Rollen nicht ändern.' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct role order by role), '{}')
  into cleaned
  from unnest(coalesce(p_roles, '{}')) as role;

  if not cleaned <@ array['admin', 'race_results']::text[] then
    raise exception 'Unbekannte Rolle.' using errcode = '22023';
  end if;

  update public.profiles set roles = cleaned where id = p_user_id returning * into updated;

  if updated.id is null then
    raise exception 'Nutzer nicht gefunden.' using errcode = 'P0002';
  end if;

  return updated;
end;
$$;

revoke execute on function public.set_user_roles(uuid, text[]) from public, anon;
grant execute on function public.set_user_roles(uuid, text[]) to authenticated;

-- ===========================================================================
-- Lobby system
-- ===========================================================================

-- Lobbies are joined with the code only the host sees, an accepted invite or (guests)
-- the code alone. Members mark themselves ready; the host starts once at least half of
-- the (at least 2) members are ready. All writes go through the functions below;
-- clients may only read.

-- Every signed-in user with a profile may play (single place to restrict it again).
create or replace function public.can_use_multiplayer(p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = p_user_id);
$$;

revoke execute on function public.can_use_multiplayer(uuid) from public, anon;
grant execute on function public.can_use_multiplayer(uuid) to authenticated;

-- Everyone is in at most one lobby at a time.
create unique index if not exists multiplayer_lobby_members_one_lobby_idx
  on public.multiplayer_lobby_members (user_id);

-- 6 characters without look-alikes (no I, O, 0, 1). Not in the Realtime publication.
create table if not exists public.multiplayer_lobby_codes (
  lobby_id uuid primary key references public.multiplayer_lobbies(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$')
);

alter table public.multiplayer_lobby_codes enable row level security;

-- start_lobby and the delete trigger remove all invites of a lobby; without
-- this index that is a full scan of notifications.
create index if not exists notifications_game_invite_related_idx
  on public.notifications (related_id)
  where type = 'game_invite';

-- Wrapped in (select ...) so the check runs once per query, not once per row
-- (functions with "set search_path" are never inlined).
drop policy if exists "Multiplayer users can read lobbies" on public.multiplayer_lobbies;
create policy "Multiplayer users can read lobbies"
  on public.multiplayer_lobbies for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read lobby members" on public.multiplayer_lobby_members;
create policy "Multiplayer users can read lobby members"
  on public.multiplayer_lobby_members for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Hosts can read their lobby code" on public.multiplayer_lobby_codes;
create policy "Hosts can read their lobby code"
  on public.multiplayer_lobby_codes for select
  to authenticated
  using (
    exists (
      select 1 from public.multiplayer_lobbies l
      where l.id = lobby_id and l.host_user_id = (select auth.uid())
    )
  );

revoke insert, update, delete on public.multiplayer_lobbies, public.multiplayer_lobby_members
  from authenticated;

revoke all on public.multiplayer_lobby_codes from anon, authenticated;

grant select on public.multiplayer_lobby_codes to authenticated;

-- ===========================================================================
-- Internal helpers (not callable over /rest/v1/rpc)
-- ===========================================================================

create or replace function public._lobby_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(bytes, i) % 32) + 1, 1),
    '' order by i
  )
  from (select uuid_send(gen_random_uuid()) as bytes) random_source,
       generate_series(0, 5) as i;
$$;

revoke execute on function public._lobby_code() from public, anon, authenticated;

-- Adds a user to an open lobby (max. 8). The lobby row is locked so parallel
-- joins cannot overfill it.
create or replace function public._add_lobby_member(p_lobby_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby_status text;
  member_count integer;
begin
  select status into lobby_status
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby_status is distinct from 'open' then
    raise exception 'Die Lobby ist nicht mehr offen.';
  end if;

  if exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = p_user_id
  ) then
    return;
  end if;

  select count(*) into member_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  if member_count >= 8 then
    raise exception 'Die Lobby ist voll.';
  end if;

  begin
    insert into public.multiplayer_lobby_members (lobby_id, user_id)
    values (p_lobby_id, p_user_id);
  exception when unique_violation then
    raise exception 'Du bist bereits in einer anderen Lobby.';
  end;
end;
$$;

revoke execute on function public._add_lobby_member(uuid, uuid) from public, anon, authenticated;

-- Only accounts can host. Before opening, inactive lobbies are closed, so cleanup also
-- happens without pg_cron.
create or replace function public.create_lobby()
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_lobby_id uuid;
  attempt integer := 0;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  if public.is_guest() then
    raise exception 'Als Gast kannst du keine Lobby eröffnen. Melde dich dafür an.';
  end if;

  perform public.cleanup_inactive_lobbies();

  insert into public.multiplayer_lobbies (host_user_id)
  values (auth.uid())
  returning id into new_lobby_id;

  loop
    attempt := attempt + 1;
    begin
      insert into public.multiplayer_lobby_codes (lobby_id, code)
      values (new_lobby_id, public._lobby_code());
      exit;
    exception when unique_violation then
      if attempt >= 5 then
        raise exception 'Es konnte kein Lobby-Code erzeugt werden. Bitte versuche es erneut.';
      end if;
    end;
  end loop;

  perform public._add_lobby_member(new_lobby_id, auth.uid());
  return new_lobby_id;
end;
$$;

create or replace function public.join_lobby(p_lobby_id uuid, p_code text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby_code text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select c.code into lobby_code
  from public.multiplayer_lobby_codes c
  join public.multiplayer_lobbies l on l.id = c.lobby_id
  where l.id = p_lobby_id and l.status = 'open';

  -- Gleiche Meldung für falschen Code und fehlende Lobby (verrät nichts)
  if lobby_code is null or lobby_code <> upper(btrim(coalesce(p_code, ''))) then
    raise exception 'Code ist falsch oder die Lobby ist nicht mehr offen.';
  end if;

  perform public._add_lobby_member(p_lobby_id, auth.uid());
end;
$$;

create or replace function public.invite_to_lobby(p_lobby_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  host_name text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobbies
    where id = p_lobby_id and host_user_id = auth.uid() and status = 'open'
  ) then
    raise exception 'Nur der Host einer offenen Lobby kann einladen.';
  end if;

  if not exists (
    select 1 from public.friendships
    where status = 'accepted'
      and (
        (requester_id = auth.uid() and addressee_id = p_user_id)
        or (requester_id = p_user_id and addressee_id = auth.uid())
      )
  ) then
    raise exception 'Du kannst nur Freunde einladen.';
  end if;

  if not public.can_use_multiplayer(p_user_id) then
    raise exception 'Multiplayer ist für diesen Freund noch nicht freigeschaltet.';
  end if;

  if exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = p_user_id
  ) then
    raise exception 'Dieser Freund ist bereits in der Lobby.';
  end if;

  select coalesce(display_name, username) into host_name
  from public.profiles where id = auth.uid();
  host_name := left(coalesce(host_name, 'Jemand'), 50);

  -- Nur eine offene Einladung pro Freund und Lobby
  delete from public.notifications
  where recipient_id = p_user_id and type = 'game_invite' and related_id = p_lobby_id::text;

  insert into public.notifications
    (recipient_id, sender_id, sender_name, type, title, message, related_id)
  values
    (p_user_id, auth.uid(), host_name, 'game_invite',
     'Lobby-Einladung', host_name || ' lädt dich in eine Lobby ein.', p_lobby_id::text);
end;
$$;

-- Returns the lobby id, or null if the lobby no longer exists / is not open.
create or replace function public.accept_lobby_invite(p_notification_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  invite_lobby_id uuid;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select related_id::uuid into invite_lobby_id
  from public.notifications
  where id = p_notification_id and recipient_id = auth.uid() and type = 'game_invite';

  if not found then
    raise exception 'Diese Einladung gibt es nicht mehr.';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobbies where id = invite_lobby_id and status = 'open'
  ) then
    delete from public.notifications where id = p_notification_id;
    return null;
  end if;

  perform public._add_lobby_member(invite_lobby_id, auth.uid());
  delete from public.notifications where id = p_notification_id;
  return invite_lobby_id;
end;
$$;

create or replace function public.set_lobby_ready(p_lobby_id uuid, p_ready boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby_status text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  -- Sperre gegen gleichzeitiges Starten
  select status into lobby_status
  from public.multiplayer_lobbies where id = p_lobby_id
  for share;

  if lobby_status is distinct from 'open' then
    raise exception 'Die Lobby ist nicht mehr offen.';
  end if;

  update public.multiplayer_lobby_members
  set ready = coalesce(p_ready, false)
  where lobby_id = p_lobby_id and user_id = auth.uid();

  if not found then
    raise exception 'Du bist nicht in dieser Lobby.';
  end if;
end;
$$;

create or replace function public.kick_lobby_member(p_lobby_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobbies
    where id = p_lobby_id and host_user_id = auth.uid()
  ) then
    raise exception 'Nur der Host kann Spieler entfernen.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du kannst dich nicht selbst entfernen.';
  end if;

  delete from public.multiplayer_lobby_members
  where lobby_id = p_lobby_id and user_id = p_user_id;

  if not found then
    raise exception 'Dieser Spieler ist nicht mehr in der Lobby.';
  end if;
end;
$$;

-- The host leaving closes the lobby for everyone.
create or replace function public.leave_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.multiplayer_lobbies
    where id = p_lobby_id and host_user_id = auth.uid()
  ) then
    delete from public.multiplayer_lobbies where id = p_lobby_id;
  else
    delete from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = auth.uid();
  end if;
end;
$$;

-- ===========================================================================
-- Lobby game functions (pick a game, start)
-- ===========================================================================

create or replace function public.start_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  member_count integer;
  ready_count integer;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann die Lobby starten.';
  end if;

  if lobby.status <> 'open' then
    raise exception 'Die Lobby wurde bereits gestartet.';
  end if;

  -- Wer gerade geht, ist danach entweder schon weg oder wartet auf das neue
  -- Spiel (der Trigger nimmt ihn dann heraus) – so entsteht kein leerer Platz.
  perform 1 from public.multiplayer_lobby_members where lobby_id = p_lobby_id for update;

  select count(*), count(*) filter (where ready) into member_count, ready_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  if member_count < 2 then
    raise exception 'Zum Starten braucht es mindestens 2 Spieler.';
  end if;

  if ready_count * 2 < member_count then
    raise exception 'Mindestens die Hälfte muss bereit sein.';
  end if;

  if lobby.game_key is null then
    raise exception 'Bitte wähle zuerst ein Spiel aus.';
  end if;

  if lobby.game_key = 'monopoly' then
    raise exception 'Monopoly spielt ihr direkt auf richup.io.';
  end if;

  if lobby.game_key = 'skip-bo' and member_count > 6 then
    raise exception 'Skip-Bo geht mit höchstens 6 Spielern.';
  end if;

  update public.multiplayer_lobbies
  set status = 'started', started_at = now()
  where id = p_lobby_id;

  delete from public.notifications
  where type = 'game_invite' and related_id = p_lobby_id::text;

  if lobby.game_key = 'skip-bo' then
    perform public._skipbo_create_game(p_lobby_id);
  elsif lobby.game_key = 'uno' then
    perform public._uno_create_game(p_lobby_id);
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;

revoke execute on function public.create_lobby() from public, anon;

revoke execute on function public.join_lobby(uuid, text) from public, anon;

revoke execute on function public.invite_to_lobby(uuid, uuid) from public, anon;

revoke execute on function public.accept_lobby_invite(uuid) from public, anon;

revoke execute on function public.set_lobby_ready(uuid, boolean) from public, anon;

revoke execute on function public.kick_lobby_member(uuid, uuid) from public, anon;

revoke execute on function public.leave_lobby(uuid) from public, anon;

revoke execute on function public.start_lobby(uuid) from public, anon;
grant execute on function public.create_lobby() to authenticated;

grant execute on function public.join_lobby(uuid, text) to authenticated;

grant execute on function public.invite_to_lobby(uuid, uuid) to authenticated;

grant execute on function public.accept_lobby_invite(uuid) to authenticated;

grant execute on function public.set_lobby_ready(uuid, boolean) to authenticated;

grant execute on function public.kick_lobby_member(uuid, uuid) to authenticated;

grant execute on function public.leave_lobby(uuid) to authenticated;

grant execute on function public.start_lobby(uuid) to authenticated;

-- ===========================================================================
-- Open invites disappear together with the lobby
-- ===========================================================================

create or replace function public._cleanup_lobby_invites()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.notifications
  where type = 'game_invite' and related_id = old.id::text;
  return null;
end;
$$;

drop trigger if exists multiplayer_lobbies_cleanup_invites on public.multiplayer_lobbies;
create trigger multiplayer_lobbies_cleanup_invites
after delete on public.multiplayer_lobbies
for each row execute function public._cleanup_lobby_invites();

revoke execute on function public._cleanup_lobby_invites() from public, anon, authenticated;

-- Skip-Bo: Der Host stellt ein, mit wie vielen Karten jeder Spielstapel startet (5–50).
-- game_settings {"stockSize": n}; {} (ältere Lobbys, Standard) = 30, ab 5 Spielern 20.
-- 6 × 50 Karten passen nicht in ein Deck (162): dann kommen weitere gemischte Decks dazu,
-- wie beim unbegrenzten Nachziehstapel.

create or replace function public.set_lobby_game(p_lobby_id uuid, p_game_key text, p_settings jsonb)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  target jsonb;
  target_score integer;
  stock jsonb;
  settings jsonb;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  -- Sperre gegen gleichzeitiges Starten
  perform 1 from public.multiplayer_lobbies
  where id = p_lobby_id and host_user_id = auth.uid() and status = 'open'
  for update;

  if not found then
    raise exception 'Nur der Host kann das Spiel einstellen.';
  end if;

  if p_settings is null or jsonb_typeof(p_settings) <> 'object' then
    raise exception 'Ungültige Einstellungen.';
  end if;

  if p_game_key = 'flip-7' then
    if not (p_settings ? 'targetScore') then
      raise exception 'Ungültige Einstellungen.';
    end if;

    target := p_settings -> 'targetScore';
    if jsonb_typeof(target) = 'null' then
      target_score := null;
    elsif jsonb_typeof(target) = 'number'
          and target::numeric = trunc(target::numeric)
          and target::numeric between 50 and 1000 then
      target_score := target::numeric::integer;
    else
      raise exception 'Ungültige Einstellungen.';
    end if;
    settings := jsonb_build_object('targetScore', target_score);
  elsif p_game_key = 'skip-bo' then
    -- {} = Standard nach Spielerzahl, sonst genau {"stockSize": 5..50}
    if p_settings = '{}'::jsonb then
      settings := '{}'::jsonb;
    else
      stock := p_settings -> 'stockSize';
      if (select count(*) from jsonb_object_keys(p_settings)) <> 1
         or jsonb_typeof(stock) is distinct from 'number'
         or stock::numeric <> trunc(stock::numeric)
         or stock::numeric not between 5 and 50 then
        raise exception 'Ungültige Einstellungen.';
      end if;
      settings := jsonb_build_object('stockSize', stock::numeric::integer);
    end if;
  elsif p_game_key = 'monopoly' then
    -- Läuft extern
    if p_settings <> '{}'::jsonb then
      raise exception 'Ungültige Einstellungen.';
    end if;
    settings := '{}'::jsonb;
  elsif p_game_key = 'uno' then
    -- Genau die drei Hausregeln, jede als true/false
    if (select array_agg(k order by k) from jsonb_object_keys(p_settings) as k)
         is distinct from array['drawUntilPlayable', 'sevenZero', 'stacking']
       or exists (select 1 from jsonb_each(p_settings) as e where jsonb_typeof(e.value) <> 'boolean') then
      raise exception 'Ungültige Einstellungen.';
    end if;
    settings := p_settings;
  else
    raise exception 'Ungültige Einstellungen.';
  end if;

  update public.multiplayer_lobbies
  set game_key = p_game_key,
      game_settings = settings
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.set_lobby_game(uuid, text, jsonb) from public, anon;
grant execute on function public.set_lobby_game(uuid, text, jsonb) to authenticated;

-- ===========================================================================
-- Flip 7
-- ===========================================================================

-- Flip 7 card game, played inside a started lobby. The server is the only
-- authority: all rules run in the security definer functions below, clients
-- may only read games and players. The order of the draw pile is hidden in
-- flip7_decks, which clients cannot read at all.
--
-- Card codes: '0'..'12', '+2' '+4' '+6' '+8' '+10', 'x2',
-- 'FREEZE', 'FLIP3' (Flip Three), 'SC' (Second Chance). 94 cards in total.
--
-- Invariant: draw pile + discard pile + all hands + action_queue + pending_card
-- always hold exactly the 94 cards of the deck.
--
-- Live updates: only flip7_game_ticks is in the Realtime publication. Every
-- public function that changes a game (and the member-delete trigger) bumps its
-- lobby's tick exactly once at the end, so one action = one Realtime event per
-- client, no matter how many engine steps it took. flip7_return_to_lobby only
-- changes the lobby, which clients already watch.

-- ===========================================================================
-- Flip 7: schema
-- ===========================================================================

create table if not exists public.flip7_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  -- null = open game, the host ends it
  target_score integer check (target_score is null or target_score between 50 and 1000),
  status text not null default 'playing' check (status in ('playing', 'round_over', 'finished')),
  -- Fixed at start, seats 0..seat_count-1 (host = 0)
  seat_count smallint not null check (seat_count between 2 and 8),
  round_no integer not null default 0,
  dealer_seat smallint not null,
  -- null outside a round
  phase text check (phase in ('deal', 'turn', 'resolve')),
  -- Next seat to deal, null = dealing is done
  deal_seat smallint,
  turn_seat smallint,
  -- Action card that waits for pending_seat to choose a target
  pending_card text check (pending_card in ('FREEZE', 'FLIP3', 'SC')),
  pending_seat smallint,
  flip3_seat smallint,
  flip3_left smallint check (flip3_left between 0 and 3),
  -- Freeze/Flip Three drawn during a Flip Three: [{card, seat}], resolved afterwards
  action_queue jsonb not null default '[]' check (jsonb_typeof(action_queue) = 'array'),
  draw_count smallint not null default 0,
  discard_count smallint not null default 0,
  -- Events of the last action, for display only
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  waiting_since timestamptz,
  round_ended_at timestamptz,
  created_at timestamptz not null default now(),
  -- Events of the running round with time (history) and the top discard cards, display only
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  discard_top text[] not null default '{}',
  check ((pending_card is null) = (pending_seat is null))
);

-- user_id without foreign key to auth.users on purpose: on account deletion
-- the member-delete trigger must still find the row to take the player out of
-- the game properly (turn, pending choice, cards back to the discard pile).
-- The row goes with the game, at the latest when the lobby is closed.
create table if not exists public.flip7_players (
  game_id uuid not null references public.flip7_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active'
    check (state in ('active', 'stayed', 'frozen', 'busted', 'flip7', 'left')),
  cards text[] not null default '{}'
    check (cards <@ array['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                          '+2', '+4', '+6', '+8', '+10', 'x2', 'FREEZE', 'FLIP3', 'SC']::text[]),
  total_score integer not null default 0,
  -- Points of the last finished round
  round_score integer,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Hidden: no policy, no grants, not in the Realtime publication.
create table if not exists public.flip7_decks (
  game_id uuid primary key references public.flip7_games(id) on delete cascade,
  -- draw_pile[1] is the next card
  draw_pile text[] not null,
  discard_pile text[] not null default '{}'
);

-- One row per lobby with a game (so far), bumped once per action. Clients
-- listen to this table only and then reload the game with one query.
create table if not exists public.flip7_game_ticks (
  lobby_id uuid primary key references public.multiplayer_lobbies(id) on delete cascade,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Flip 7: row level security and privileges
-- ===========================================================================

alter table public.flip7_games enable row level security;

alter table public.flip7_players enable row level security;

alter table public.flip7_decks enable row level security;

alter table public.flip7_game_ticks enable row level security;

drop policy if exists "Multiplayer users can read flip7 games" on public.flip7_games;
create policy "Multiplayer users can read flip7 games"
  on public.flip7_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read flip7 players" on public.flip7_players;
create policy "Multiplayer users can read flip7 players"
  on public.flip7_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read flip7 ticks" on public.flip7_game_ticks;
create policy "Multiplayer users can read flip7 ticks"
  on public.flip7_game_ticks for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

revoke all on public.flip7_games, public.flip7_players, public.flip7_decks,
  public.flip7_game_ticks from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.flip7_games, public.flip7_players, public.flip7_game_ticks from authenticated;

grant select on public.flip7_games, public.flip7_players, public.flip7_game_ticks to authenticated;

revoke all on public.flip7_decks from authenticated;

-- Only the ticks go out live (see top). Games, players and decks stay out of
-- the publication; the decks must never be in it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'flip7_game_ticks'
  ) then
    alter publication supabase_realtime add table public.flip7_game_ticks;
  end if;
end;
$$;

-- ===========================================================================
-- Flip 7: engine (internal, not callable over /rest/v1/rpc)
-- ===========================================================================

-- One 0, n copies of every n from 1 to 12, one of each modifier, 3 of each action.
create or replace function public._flip7_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select '0' as card
    union all
    select n::text from generate_series(1, 12) as n, generate_series(1, n)
    union all
    select unnest(array['+2', '+4', '+6', '+8', '+10', 'x2'])
    union all
    select action from unnest(array['FREEZE', 'FLIP3', 'SC']) as action, generate_series(1, 3)
  ) deck;
$$;

-- Numbers (doubled by x2), plus modifiers, plus 15 for 7 different numbers.
-- A busted hand is 0; the callers handle that.
create or replace function public._flip7_score(p_cards text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select (
    coalesce(sum(card::integer) filter (where card ~ '^[0-9]+$'), 0)
      * (case when 'x2' = any(p_cards) then 2 else 1 end)
    + coalesce(sum(substr(card, 2)::integer) filter (where card ~ '^\+[0-9]+$'), 0)
    + (case when count(distinct card) filter (where card ~ '^[0-9]+$') >= 7 then 15 else 0 end)
  )::integer
  from unnest(p_cards) as card;
$$;

-- Letzte Aktion (last_events) und Verlauf der Runde (round_log, mit Rundennummer und
-- Zeit). Beginnt eine neue Runde, fängt das Log von vorn an.
create or replace function public._flip7_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.flip7_games
  set last_events = last_events || jsonb_build_array(p_event),
      round_log = case when (round_log -> -1 ->> 'r')::integer = round_no
                       then round_log else '[]'::jsonb end
        || jsonb_build_array(p_event || jsonb_build_object('r', round_no, 'at', now()))
  where id = p_game_id;
$$;

-- The one Realtime event of an action (see top). Called last.
create or replace function public._flip7_tick(p_lobby_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.flip7_game_ticks as t (lobby_id) values (p_lobby_id)
  on conflict (lobby_id) do update set version = t.version + 1, updated_at = now();
$$;

-- Next card. An empty draw pile is refilled from the shuffled discard pile
-- (cards on the table stay out). null only if both piles are empty.
create or replace function public._flip7_draw(p_game_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  deck public.flip7_decks;
  card text;
begin
  select * into deck from public.flip7_decks where game_id = p_game_id;

  if cardinality(deck.draw_pile) = 0 then
    if cardinality(deck.discard_pile) = 0 then
      return null;
    end if;
    deck.draw_pile := array(select c from unnest(deck.discard_pile) as c order by gen_random_uuid());
    deck.discard_pile := '{}';
    perform public._flip7_log(p_game_id, jsonb_build_object('t', 'reshuffle'));
  end if;

  card := deck.draw_pile[1];
  deck.draw_pile := deck.draw_pile[2:];

  update public.flip7_decks
  set draw_pile = deck.draw_pile, discard_pile = deck.discard_pile
  where game_id = p_game_id;

  update public.flip7_games
  set draw_count = cardinality(deck.draw_pile), discard_count = cardinality(deck.discard_pile)
  where id = p_game_id;

  return card;
end;
$$;

-- Karten auf den (offenen) Ablagestapel, dazu die obersten zwei für die Anzeige.
-- Nach dem Neumischen bleibt discard_top stehen; die Anzeige zeigt die Ablage nur bei
-- discard_count > 0.
create or replace function public._flip7_discard(p_game_id uuid, p_cards text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  discard_size integer;
  top text[];
begin
  if coalesce(cardinality(p_cards), 0) = 0 then
    return;
  end if;

  update public.flip7_decks
  set discard_pile = discard_pile || p_cards
  where game_id = p_game_id
  returning cardinality(discard_pile),
            discard_pile[greatest(cardinality(discard_pile) - 1, 1):]
  into discard_size, top;

  update public.flip7_games
  set discard_count = discard_size, discard_top = top
  where id = p_game_id;
end;
$$;

-- First seat after p_after (in turn order, wrapping) that is still active
-- (p_only_active) or at least still in the game. null if there is none.
create or replace function public._flip7_next_seat(p_game_id uuid, p_after smallint, p_only_active boolean)
returns smallint
language sql
stable
security definer set search_path = ''
as $$
  select p.seat
  from public.flip7_players p
  join public.flip7_games g on g.id = p.game_id
  where p.game_id = p_game_id
    and (case when p_only_active then p.state = 'active' else p.state <> 'left' end)
  order by (p.seat - coalesce(p_after, -1) - 1 + 2 * g.seat_count) % g.seat_count
  limit 1;
$$;

-- Who may receive an action card drawn by p_seat: Freeze/Flip Three any active
-- player incl. the drawer; Second Chance only other active players without
-- one. Ordered in turn order starting at the drawer.
create or replace function public._flip7_candidates(p_game_id uuid, p_seat smallint, p_card text)
returns smallint[]
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(array_agg(p.seat order by (p.seat - p_seat + g.seat_count) % g.seat_count), '{}')
  from public.flip7_players p
  join public.flip7_games g on g.id = p.game_id
  where p.game_id = p_game_id
    and p.state = 'active'
    and (p_card <> 'SC' or (p.seat <> p_seat and not ('SC' = any(p.cards))));
$$;

create or replace function public._flip7_resolve_action(
  p_game_id uuid, p_seat smallint, p_card text, p_target smallint
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_card = 'FREEZE' then
    update public.flip7_players
    set cards = cards || p_card, state = 'frozen'
    where game_id = p_game_id and seat = p_target;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'freeze', 'seat', p_seat, 'target', p_target));
  elsif p_card = 'FLIP3' then
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_target;
    update public.flip7_games set flip3_seat = p_target, flip3_left = 3 where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'flip3', 'seat', p_seat, 'target', p_target));
  else
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_target;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'sc_given', 'seat', p_seat, 'target', p_target));
  end if;
end;
$$;

-- No candidate: discard. One: resolve right away. Several: p_seat chooses.
create or replace function public._flip7_offer_action(p_game_id uuid, p_seat smallint, p_card text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  candidates smallint[];
begin
  candidates := public._flip7_candidates(p_game_id, p_seat, p_card);

  if cardinality(candidates) = 0 then
    perform public._flip7_discard(p_game_id, array[p_card]);
    if p_card = 'SC' then
      perform public._flip7_log(p_game_id, jsonb_build_object('t', 'sc_discarded', 'seat', p_seat));
    end if;
  elsif cardinality(candidates) = 1 then
    perform public._flip7_resolve_action(p_game_id, p_seat, p_card, candidates[1]);
  else
    update public.flip7_games
    set pending_card = p_card, pending_seat = p_seat, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- A drawn card lands in front of p_seat (all cards are face up).
create or replace function public._flip7_receive(
  p_game_id uuid, p_seat smallint, p_card text, p_in_flip3 boolean
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  hand text[];
begin
  perform public._flip7_log(p_game_id,
    jsonb_build_object('t', 'draw', 'seat', p_seat, 'card', p_card));

  select cards into hand
  from public.flip7_players where game_id = p_game_id and seat = p_seat;

  if p_card ~ '^[0-9]+$' then
    if p_card = any(hand) then
      if 'SC' = any(hand) then
        update public.flip7_players
        set cards = array_remove(cards, 'SC')
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_discard(p_game_id, array[p_card, 'SC']);
        perform public._flip7_log(p_game_id,
          jsonb_build_object('t', 'second_chance', 'seat', p_seat, 'card', p_card));
      else
        -- Die doppelte Karte bleibt sichtbar liegen
        update public.flip7_players
        set cards = cards || p_card, state = 'busted'
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_log(p_game_id,
          jsonb_build_object('t', 'bust', 'seat', p_seat, 'card', p_card));
      end if;
    else
      update public.flip7_players
      set cards = cards || p_card
      where game_id = p_game_id and seat = p_seat
      returning cards into hand;

      if (select count(*) from unnest(hand) as c where c ~ '^[0-9]+$') >= 7 then
        update public.flip7_players set state = 'flip7'
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_log(p_game_id, jsonb_build_object('t', 'flip7', 'seat', p_seat));
      end if;
    end if;
  elsif p_card = 'x2' or p_card like '+%' then
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_seat;
  elsif p_card = 'SC' then
    if 'SC' = any(hand) then
      -- Nur eine Zweite Chance pro Spieler: die zweite wird verschenkt
      perform public._flip7_offer_action(p_game_id, p_seat, p_card);
    else
      update public.flip7_players
      set cards = cards || p_card
      where game_id = p_game_id and seat = p_seat;
    end if;
  elsif p_in_flip3 then
    -- Freeze/Flip Three während Drei ziehen: erst danach auflösen
    update public.flip7_games
    set action_queue = action_queue || jsonb_build_array(
      jsonb_build_object('card', p_card, 'seat', p_seat))
    where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'set_aside', 'seat', p_seat, 'card', p_card));
  else
    perform public._flip7_offer_action(p_game_id, p_seat, p_card);
  end if;
end;
$$;

-- Scores the round (unless p_score is false) and decides whether the game is over.
-- Hands stay on the table for the round summary.
create or replace function public._flip7_end_round(p_game_id uuid, p_score boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  leftover text[];
begin
  select * into game from public.flip7_games where id = p_game_id;

  if p_score then
    update public.flip7_players
    set round_score = case when state = 'busted' then 0 else public._flip7_score(cards) end,
        total_score = total_score
          + case when state = 'busted' then 0 else public._flip7_score(cards) end
    where game_id = p_game_id and state <> 'left';
  end if;

  update public.flip7_players set round_score = null
  where game_id = p_game_id and state = 'left';

  leftover := array(select item ->> 'card' from jsonb_array_elements(game.action_queue) as item);
  if game.pending_card is not null then
    leftover := leftover || game.pending_card;
  end if;
  perform public._flip7_discard(p_game_id, leftover);

  update public.flip7_games g
  set pending_card = null, pending_seat = null, flip3_seat = null, flip3_left = null,
      action_queue = '[]', phase = null, deal_seat = null, turn_seat = null,
      waiting_since = null, round_ended_at = now(),
      status = case
        when (select count(*) from public.flip7_players
              where game_id = p_game_id and state <> 'left') < 2 then 'finished'
        when p_score and g.target_score is not null and exists (
              select 1 from public.flip7_players
              where game_id = p_game_id and state <> 'left' and total_score >= g.target_score
            ) then 'finished'
        else 'round_over'
      end
  where id = p_game_id;
end;
$$;

-- The loop that moves the game on until a player has to act or the round ends.
create or replace function public._flip7_run(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  iterations integer := 0;
  card text;
  item jsonb;
  v_seat smallint;
begin
  loop
    iterations := iterations + 1;
    if iterations > 300 then
      raise exception 'Flip 7: Die Spiellogik hängt fest.';
    end if;

    select * into game from public.flip7_games where id = p_game_id;
    if game.status <> 'playing' then
      exit;
    end if;

    -- 1. Flip 7 oder niemand mehr aktiv: Runde vorbei
    if exists (select 1 from public.flip7_players where game_id = p_game_id and state = 'flip7')
       or not exists (select 1 from public.flip7_players
                      where game_id = p_game_id and state = 'active') then
      perform public._flip7_end_round(p_game_id, true);
      exit;
    end if;

    -- 2. Jemand muss ein Ziel wählen (waiting_since setzt _flip7_offer_action)
    if game.pending_card is not null then
      exit;
    end if;

    -- 3. Laufendes Drei ziehen
    if game.flip3_seat is not null then
      if game.flip3_left = 0 or not exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = game.flip3_seat and state = 'active'
      ) then
        update public.flip7_games set flip3_seat = null, flip3_left = null where id = p_game_id;
      else
        update public.flip7_games set flip3_left = flip3_left - 1 where id = p_game_id;
        card := public._flip7_draw(p_game_id);
        if card is null then
          perform public._flip7_end_round(p_game_id, true);
          exit;
        end if;
        perform public._flip7_receive(p_game_id, game.flip3_seat, card, true);
      end if;
      continue;
    end if;

    -- 4. Zurückgelegte Aktionskarten, nur wenn der Spieler noch aktiv ist
    if jsonb_array_length(game.action_queue) > 0 then
      item := game.action_queue -> 0;
      update public.flip7_games set action_queue = action_queue - 0 where id = p_game_id;
      v_seat := (item ->> 'seat')::smallint;
      if exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = v_seat and state = 'active'
      ) then
        perform public._flip7_offer_action(p_game_id, v_seat, item ->> 'card');
      else
        perform public._flip7_discard(p_game_id, array[item ->> 'card']);
      end if;
      continue;
    end if;

    -- 5. Austeilen / nächster Zug
    if game.phase = 'deal' then
      if game.deal_seat is null then
        update public.flip7_games
        set phase = 'turn',
            turn_seat = public._flip7_next_seat(p_game_id, game.dealer_seat, true),
            waiting_since = now()
        where id = p_game_id;
        exit;
      end if;

      v_seat := game.deal_seat;
      update public.flip7_games
      set deal_seat = case when v_seat = game.dealer_seat then null else (v_seat + 1) % seat_count end
      where id = p_game_id;

      if exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = v_seat and state = 'active'
      ) then
        card := public._flip7_draw(p_game_id);
        if card is null then
          perform public._flip7_end_round(p_game_id, true);
          exit;
        end if;
        perform public._flip7_receive(p_game_id, v_seat, card, false);
      end if;
      continue;
    elsif game.phase = 'resolve' then
      update public.flip7_games
      set phase = 'turn',
          turn_seat = public._flip7_next_seat(p_game_id, game.turn_seat, true),
          waiting_since = now()
      where id = p_game_id;
    end if;

    exit;
  end loop;
end;
$$;

-- Jede Runde beginnt gleich mit dem Zug des Spielers nach dem Geber; ausgeteilt wird nicht,
-- jeder zieht seine erste Karte selbst (Sichern erst ab einer Karte, siehe flip7_stay). Die
-- Phase 'deal' und deal_seat bleiben im Schema erlaubt, werden aber nicht mehr gesetzt.
create or replace function public._flip7_start_round(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  dealer smallint;
begin
  select * into game from public.flip7_games where id = p_game_id;

  perform public._flip7_discard(p_game_id,
    array(select c from public.flip7_players p, unnest(p.cards) as c
          where p.game_id = p_game_id order by p.seat));

  update public.flip7_players
  set cards = '{}',
      state = case when state = 'left' then 'left' else 'active' end,
      round_score = null
  where game_id = p_game_id;

  if game.round_no = 0 then
    dealer := game.seat_count - 1;
  else
    dealer := public._flip7_next_seat(p_game_id, game.dealer_seat, false);
  end if;

  update public.flip7_games
  set round_no = round_no + 1, dealer_seat = dealer, status = 'playing',
      phase = 'turn', deal_seat = null, turn_seat = null,
      pending_card = null, pending_seat = null, flip3_seat = null, flip3_left = null,
      action_queue = '[]', waiting_since = now(), round_ended_at = null
  where id = p_game_id;

  update public.flip7_games
  set turn_seat = public._flip7_next_seat(p_game_id, dealer, true)
  where id = p_game_id;

  perform public._flip7_run(p_game_id);
end;
$$;

-- Replaces an old game of the lobby. Seats in join order, host first.
-- The caller (start_lobby) holds the locks on the lobby and its members.
create or replace function public._flip7_create_game(p_lobby_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  player_count integer;
  deck text[];
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.flip7_games where lobby_id = p_lobby_id;

  select count(*) into player_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  deck := public._flip7_new_deck();

  insert into public.flip7_games (lobby_id, target_score, seat_count, dealer_seat, draw_count)
  values (
    p_lobby_id,
    (lobby.game_settings ->> 'targetScore')::integer,
    player_count,
    0,
    cardinality(deck)
  )
  returning id into new_game_id;

  insert into public.flip7_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.flip7_decks (game_id, draw_pile) values (new_game_id, deck);

  perform public._flip7_start_round(new_game_id);
  perform public._flip7_tick(p_lobby_id);
  return new_game_id;
end;
$$;

-- A player leaves the game (kick, leave, deleted account). Never raises, so
-- leaving the lobby always works; a failure only rolls back the game part.
create or replace function public._flip7_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  player public.flip7_players;
  queued jsonb;
begin
  begin
    select * into game from public.flip7_games where id = p_game_id;
    if not found then
      return;
    end if;

    update public.flip7_games set last_events = '[]' where id = p_game_id;

    select * into player
    from public.flip7_players where game_id = p_game_id and user_id = p_user_id;

    if found and player.state <> 'left' then
      perform public._flip7_discard(p_game_id, player.cards);
      update public.flip7_players
      set state = 'left', left_at = now(), cards = '{}', round_score = null
      where game_id = p_game_id and user_id = p_user_id;

      -- Offene Auswahl, laufendes Drei ziehen und zurückgelegte Karten des Spielers
      if game.pending_seat = player.seat then
        perform public._flip7_discard(p_game_id, array[game.pending_card]);
        update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
      end if;

      if game.flip3_seat = player.seat then
        update public.flip7_games set flip3_seat = null, flip3_left = null where id = p_game_id;
      end if;

      select coalesce(jsonb_agg(item order by ord), '[]') into queued
      from jsonb_array_elements(game.action_queue) with ordinality as q(item, ord)
      where (item ->> 'seat')::smallint <> player.seat;
      perform public._flip7_discard(p_game_id,
        array(select item ->> 'card' from jsonb_array_elements(game.action_queue) as item
              where (item ->> 'seat')::smallint = player.seat));
      update public.flip7_games set action_queue = queued where id = p_game_id;

      if game.status = 'playing' and game.phase = 'turn' and game.turn_seat = player.seat then
        update public.flip7_games set phase = 'resolve' where id = p_game_id;
      end if;

      perform public._flip7_log(p_game_id,
        jsonb_build_object('t', 'left', 'seat', player.seat));
    end if;

    select * into game from public.flip7_games where id = p_game_id;

    -- Wählt jemand anderes gerade ein Ziel, gibt es evtl. nicht mehr genug Ziele
    if game.pending_card is not null
       and cardinality(public._flip7_candidates(p_game_id, game.pending_seat, game.pending_card)) < 2 then
      update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
      perform public._flip7_offer_action(p_game_id, game.pending_seat, game.pending_card);
    end if;

    if (select count(*) from public.flip7_players
        where game_id = p_game_id and state <> 'left') < 2 then
      if game.status <> 'finished' then
        perform public._flip7_end_round(p_game_id, false);
      end if;
      update public.flip7_games set status = 'finished' where id = p_game_id;
    elsif game.status = 'playing' then
      perform public._flip7_run(p_game_id);
    end if;

    perform public._flip7_tick(game.lobby_id);
  exception when others then
    raise warning 'Flip 7: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._flip7_on_member_removed()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_game_id uuid;
begin
  -- Wird die ganze Lobby gelöscht, verschwindet das Spiel ohnehin
  if not exists (select 1 from public.multiplayer_lobbies where id = old.lobby_id) then
    return null;
  end if;

  select id into v_game_id
  from public.flip7_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._flip7_remove_player(v_game_id, old.user_id);
  end if;
  return null;
end;
$$;

drop trigger if exists multiplayer_lobby_members_flip7_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_flip7_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._flip7_on_member_removed();

-- Seat of the caller, if they still play in this game.
create or replace function public._flip7_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.flip7_players
  where game_id = p_game_id and user_id = auth.uid() and state <> 'left';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Locks the game for a public function and clears the events of the last action.
create or replace function public._flip7_lock(p_game_id uuid)
returns public.flip7_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.flip7_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._flip7_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.flip7_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

revoke execute on function public._flip7_new_deck() from public, anon, authenticated;

revoke execute on function public._flip7_score(text[]) from public, anon, authenticated;

revoke execute on function public._flip7_log(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public._flip7_tick(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_draw(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_discard(uuid, text[]) from public, anon, authenticated;

revoke execute on function public._flip7_next_seat(uuid, smallint, boolean) from public, anon, authenticated;

revoke execute on function public._flip7_candidates(uuid, smallint, text) from public, anon, authenticated;

revoke execute on function public._flip7_resolve_action(uuid, smallint, text, smallint) from public, anon, authenticated;

revoke execute on function public._flip7_offer_action(uuid, smallint, text) from public, anon, authenticated;

revoke execute on function public._flip7_receive(uuid, smallint, text, boolean) from public, anon, authenticated;

revoke execute on function public._flip7_end_round(uuid, boolean) from public, anon, authenticated;

revoke execute on function public._flip7_run(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_start_round(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._flip7_on_member_removed() from public, anon, authenticated;

revoke execute on function public._flip7_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_lock(uuid) from public, anon, authenticated;

revoke execute on function public._flip7_is_host(uuid) from public, anon, authenticated;

-- Hit, Stay, choosing a target and skipping take the waiting_since the client
-- saw. It changes with every new turn or choice, so a double tap or a click on
-- an outdated view does nothing instead of making a second, unintended move.

create or replace function public.flip7_hit(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  my_seat smallint;
  card text;
begin
  game := public._flip7_lock(p_game_id);
  my_seat := public._flip7_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.phase is distinct from 'turn'
     or game.pending_card is not null or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  update public.flip7_games set last_events = '[]', phase = 'resolve' where id = p_game_id;

  card := public._flip7_draw(p_game_id);
  if card is null then
    perform public._flip7_end_round(p_game_id, true);
  else
    perform public._flip7_receive(p_game_id, my_seat, card, false);
    perform public._flip7_run(p_game_id);
  end if;

  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Sichern beendet die Runde für diesen Spieler; erst ab der ersten eigenen Karte.
create or replace function public.flip7_stay(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  my_seat smallint;
begin
  game := public._flip7_lock(p_game_id);
  my_seat := public._flip7_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.phase is distinct from 'turn'
     or game.pending_card is not null or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if exists (select 1 from public.flip7_players
             where game_id = p_game_id and seat = my_seat and cardinality(cards) = 0) then
    raise exception 'Zieh zuerst eine Karte.';
  end if;

  update public.flip7_games set last_events = '[]', phase = 'resolve' where id = p_game_id;
  update public.flip7_players set state = 'stayed'
  where game_id = p_game_id and seat = my_seat;
  perform public._flip7_log(p_game_id, jsonb_build_object('t', 'stay', 'seat', my_seat));
  perform public._flip7_run(p_game_id);

  perform public._flip7_tick(game.lobby_id);
end;
$$;

create or replace function public.flip7_choose_target(
  p_game_id uuid, p_target_seat smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  my_seat smallint;
begin
  game := public._flip7_lock(p_game_id);
  my_seat := public._flip7_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.pending_card is null or game.pending_seat <> my_seat then
    raise exception 'Du musst gerade nichts auswählen.';
  end if;

  if p_target_seat is null
     or not (p_target_seat = any(public._flip7_candidates(p_game_id, my_seat, game.pending_card))) then
    raise exception 'Dieses Ziel ist nicht erlaubt.';
  end if;

  update public.flip7_games
  set last_events = '[]', pending_card = null, pending_seat = null
  where id = p_game_id;
  perform public._flip7_resolve_action(p_game_id, my_seat, game.pending_card, p_target_seat);
  perform public._flip7_run(p_game_id);

  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Host moves an AFK player on: a pending Freeze/Flip Three hits the chooser,
-- a Second Chance goes to the next possible player, otherwise the turn counts
-- as Stay. Only for the situation the host saw (p_waiting_since), and only
-- after it has been waiting for a while (the client shows the button after
-- 30 s of local time; 25 s here leave room for delays).
create or replace function public.flip7_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  candidates smallint[];
  target smallint;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann Spieler überspringen.';
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' then
    raise exception 'Gerade läuft keine Runde.';
  end if;

  if game.waiting_since is null or game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;

  if game.pending_card is not null then
    update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'skip', 'seat', game.pending_seat));

    candidates := public._flip7_candidates(p_game_id, game.pending_seat, game.pending_card);
    if game.pending_card <> 'SC' and game.pending_seat = any(candidates) then
      target := game.pending_seat;
    else
      target := candidates[1];
    end if;

    if target is null then
      perform public._flip7_discard(p_game_id, array[game.pending_card]);
    else
      perform public._flip7_resolve_action(p_game_id, game.pending_seat, game.pending_card, target);
    end if;
  elsif game.phase = 'turn' and game.turn_seat is not null then
    update public.flip7_players set state = 'stayed'
    where game_id = p_game_id and seat = game.turn_seat and state = 'active';
    update public.flip7_games set phase = 'resolve' where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  else
    raise exception 'Gerade gibt es nichts zu überspringen.';
  end if;

  perform public._flip7_run(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Idempotent: called by every client when the round summary times out. The
-- host may go on at once, the others only 8 s after the round ended.
create or replace function public.flip7_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if game.status <> 'round_over' or game.round_no is distinct from p_round_no then
    return;
  end if;

  perform public._flip7_my_seat(p_game_id);

  if not public._flip7_is_host(p_game_id)
     and now() < game.round_ended_at + interval '8 seconds' then
    return;
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;
  perform public._flip7_start_round(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Host ends the game; a running round is not scored.
create or replace function public.flip7_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status = 'finished' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;
  if game.status = 'playing' then
    perform public._flip7_end_round(p_game_id, false);
  end if;

  update public.flip7_games set status = 'finished' where id = p_game_id;
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- "Weiterspielen": the finished game goes on without a target score.
create or replace function public.flip7_continue_open(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann weiterspielen.';
  end if;

  if game.status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  if (select count(*) from public.flip7_players
      where game_id = p_game_id and state <> 'left') < 2 then
    raise exception 'Zum Weiterspielen braucht es mindestens 2 Spieler.';
  end if;

  update public.flip7_games set last_events = '[]', target_score = null where id = p_game_id;
  perform public._flip7_start_round(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Back to the waiting room with the same people: game gone, lobby open again,
-- everyone has to get ready again. Lock order lobby -> members -> game, like
-- leave/kick (member -> game via the trigger), so the two cannot deadlock.
create or replace function public.flip7_return_to_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  game_status text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann zur Warte-Lobby zurückkehren.';
  end if;

  if lobby.status <> 'started' then
    raise exception 'Die Lobby ist bereits wieder offen.';
  end if;

  update public.multiplayer_lobby_members set ready = false where lobby_id = p_lobby_id;

  select status into game_status
  from public.flip7_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.flip7_games where lobby_id = p_lobby_id;

  -- Kein Tick: die Lobby-Änderung schaltet alle Clients zurück in die Warte-Lobby,
  -- ein Tick würde das Spiel vorher noch als "kein Spiel" neu laden lassen
  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.flip7_hit(uuid, timestamptz) from public, anon;

revoke execute on function public.flip7_stay(uuid, timestamptz) from public, anon;

revoke execute on function public.flip7_choose_target(uuid, smallint, timestamptz) from public, anon;

revoke execute on function public.flip7_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.flip7_next_round(uuid, integer) from public, anon;

revoke execute on function public.flip7_end_game(uuid) from public, anon;

revoke execute on function public.flip7_continue_open(uuid) from public, anon;

revoke execute on function public.flip7_return_to_lobby(uuid) from public, anon;
grant execute on function public.flip7_hit(uuid, timestamptz) to authenticated;

grant execute on function public.flip7_stay(uuid, timestamptz) to authenticated;

grant execute on function public.flip7_choose_target(uuid, smallint, timestamptz) to authenticated;

grant execute on function public.flip7_skip(uuid, timestamptz) to authenticated;

grant execute on function public.flip7_next_round(uuid, integer) to authenticated;

grant execute on function public.flip7_end_game(uuid) to authenticated;

grant execute on function public.flip7_continue_open(uuid) to authenticated;

grant execute on function public.flip7_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Skip-Bo
-- ===========================================================================

-- Skip-Bo, gespielt in einer gestarteten Lobby. Der Server ist die einzige
-- Instanz für die Regeln: alle Züge laufen über die security-definer-Funktionen
-- unten, Clients lesen nur Spiele, Spieler und ihre eigene Hand.
--
-- Karten: '1'..'12' je 12-mal und 18 Joker 'SB' = 162 Karten.
-- Invariante: Nachziehstapel + alle Spielstapel + alle Hände + alle Ablagen
-- + Aufbaustapel = immer genau 162. Volle Aufbaustapel (12) kommen sofort
-- gemischt unter den Nachziehstapel (kein eigener Abräumstapel).
--
-- Geheim: Hände (skipbo_hands, RLS nur eigene Zeile), Spielstapel unter der
-- Oberkarte (skipbo_stocks) und Nachziehstapel (skipbo_decks) – die beiden
-- letzten ohne Policy und ohne Grants. Öffentlich sind nur Zähler und offene
-- Karten (Stock-Oberkarte, Ablagen, Aufbaustapel).
--
-- Live: nur skipbo_games ist in der Realtime-Publikation. Eine Aktion macht
-- mehrere UPDATEs, der Client bündelt sie (watchTables mit Debounce).
-- ponytail: ganze Zeile inkl. round_log pro UPDATE; bei spürbarem Traffic auf
-- eine Tick-Tabelle wie flip7_game_ticks umstellen.

-- ===========================================================================
-- Skip-Bo: schema
-- ===========================================================================

create table if not exists public.skipbo_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- Fest ab Start, Sitze 0..seat_count-1 (Host = 0)
  seat_count smallint not null check (seat_count between 2 and 6),
  -- = seat_count - 1, Sitz 0 beginnt
  dealer_seat smallint not null,
  -- null, wenn beendet
  turn_seat smallint,
  -- = r im round_log
  turn_no integer not null default 0,
  -- 4 Aufbaustapel, unten -> oben; Joker bleiben 'SB', ihr Wert ist die Position
  build_piles jsonb not null default '[[],[],[],[]]'
    check (jsonb_typeof(build_piles) = 'array' and jsonb_array_length(build_piles) = 4),
  draw_count smallint not null default 0,
  -- null bei beendetem Spiel: vorzeitig beendet
  winner_seat smallint,
  -- Ereignisse der letzten Aktion, nur für die Anzeige
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  -- Verlauf mit r = turn_no und at, letzte 60 Einträge
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jeder Aktion und jedem Zugwechsel
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie flip7_players: beim Löschen des Kontos muss
-- der Trigger die Zeile noch finden, um die Karten zurückzulegen.
create table if not exists public.skipbo_players (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 5),
  state text not null default 'active' check (state in ('active', 'left')),
  -- Bleibt beim Verlassen stehen (Endstand)
  stock_count smallint not null default 0,
  -- Offene Oberkarte des Spielstapels, null = leer
  stock_top text
    check (stock_top in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'SB')),
  hand_count smallint not null default 0,
  -- 4 eigene Ablagen, unten -> oben, offen
  discards jsonb not null default '[[],[],[],[]]'
    check (jsonb_typeof(discards) = 'array' and jsonb_array_length(discards) = 4),
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: jeder sieht nur seine eigene Zeile.
create table if not exists public.skipbo_hands (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  cards text[] not null default '{}'
    check (cardinality(cards) <= 5
           and cards <@ array['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'SB']::text[]),
  primary key (game_id, seat)
);

-- Geheim: keine Policy, keine Grants, nicht in der Realtime-Publikation.
create table if not exists public.skipbo_stocks (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  seat smallint not null,
  -- cards[1] ist die offene Oberkarte (= skipbo_players.stock_top)
  cards text[] not null,
  primary key (game_id, seat)
);

create table if not exists public.skipbo_decks (
  game_id uuid primary key references public.skipbo_games(id) on delete cascade,
  -- draw_pile[1] ist die nächste Karte
  draw_pile text[] not null
);

-- ===========================================================================
-- Skip-Bo: row level security and privileges
-- ===========================================================================

alter table public.skipbo_games enable row level security;

alter table public.skipbo_players enable row level security;

alter table public.skipbo_hands enable row level security;

alter table public.skipbo_stocks enable row level security;

alter table public.skipbo_decks enable row level security;

drop policy if exists "Multiplayer users can read skipbo games" on public.skipbo_games;
create policy "Multiplayer users can read skipbo games"
  on public.skipbo_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read skipbo players" on public.skipbo_players;
create policy "Multiplayer users can read skipbo players"
  on public.skipbo_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Players can read their own skipbo hand" on public.skipbo_hands;
create policy "Players can read their own skipbo hand"
  on public.skipbo_hands for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.skipbo_games, public.skipbo_players, public.skipbo_hands,
  public.skipbo_stocks, public.skipbo_decks from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.skipbo_games, public.skipbo_players, public.skipbo_hands from authenticated;

grant select on public.skipbo_games, public.skipbo_players, public.skipbo_hands to authenticated;

revoke all on public.skipbo_stocks, public.skipbo_decks from authenticated;

-- Nur das Spiel geht live raus. Hände, Stocks und Decks dürfen nie hinein.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'skipbo_games'
  ) then
    alter publication supabase_realtime add table public.skipbo_games;
  end if;
end;
$$;

-- ===========================================================================
-- Skip-Bo: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- 1..12 je 12-mal und 18 Joker, gemischt.
create or replace function public._skipbo_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select n::text as card from generate_series(1, 12) as n, generate_series(1, 12)
    union all
    select 'SB' from generate_series(1, 18)
  ) deck;
$$;

-- Event-Form: {t, seat?, ...}. Zusätzlich ins round_log mit Zug und Zeit.
create or replace function public._skipbo_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.skipbo_games
  set last_events = last_events || jsonb_build_array(p_event),
      -- ponytail: Verlauf auf 60 Einträge begrenzt
      round_log = (
        select coalesce(jsonb_agg(l.e order by l.i), '[]'::jsonb)
        from jsonb_array_elements(
               round_log || jsonb_build_array(p_event || jsonb_build_object('r', turn_no, 'at', now()))
             ) with ordinality as l(e, i)
        where l.i > jsonb_array_length(round_log) - 59
      )
  where id = p_game_id;
$$;

-- Karten gemischt unter den Nachziehstapel.
create or replace function public._skipbo_bury(p_game_id uuid, p_cards text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  draw_size integer;
begin
  if coalesce(cardinality(p_cards), 0) = 0 then
    return;
  end if;

  update public.skipbo_decks
  set draw_pile = draw_pile || array(select c from unnest(p_cards) as c order by gen_random_uuid())
  where game_id = p_game_id
  returning cardinality(draw_pile) into draw_size;

  update public.skipbo_games set draw_count = draw_size where id = p_game_id;
end;
$$;

-- Unbegrenzte Nachziehstapel für Skip-Bo und Uno: Reicht der Stapel nicht, kommt ein
-- frisch gemischtes Deck darunter (sonst könnte er leerlaufen, weil Karten in Händen und
-- Ablagen stecken, und das Spiel hinge). draw_count wird gepflegt, die App zeigt ihn nicht an.

-- Hand auf 5 auffüllen; fehlt etwas, kommt ein neues Deck unter den Nachziehstapel.
create or replace function public._skipbo_refill(p_game_id uuid, p_seat smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  need integer;
  drawn text[];
  draw_size integer;
begin
  select 5 - cardinality(cards) into need
  from public.skipbo_hands where game_id = p_game_id and seat = p_seat;

  if coalesce(need, 0) <= 0 then
    return;
  end if;

  -- Ein Deck (162 Karten) reicht immer für höchstens 5 fehlende Karten
  update public.skipbo_decks
  set draw_pile = draw_pile || public._skipbo_new_deck()
  where game_id = p_game_id and cardinality(draw_pile) < need;

  select draw_pile[1:need] into drawn
  from public.skipbo_decks where game_id = p_game_id
  for update;

  if coalesce(cardinality(drawn), 0) = 0 then
    return;
  end if;

  update public.skipbo_decks
  set draw_pile = draw_pile[cardinality(drawn) + 1:]
  where game_id = p_game_id
  returning cardinality(draw_pile) into draw_size;

  update public.skipbo_hands set cards = cards || drawn
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_players set hand_count = hand_count + cardinality(drawn)
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_games set draw_count = draw_size where id = p_game_id;

  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'draw', 'seat', p_seat, 'n', cardinality(drawn)));
end;
$$;

-- Hand leer und weder Stock-Oberkarte noch eine Ablage-Oberkarte passt
-- irgendwo: der Spieler kann nichts tun. (Mit Handkarten kann man immer ablegen.)
-- Joker per case abfangen, bevor ::integer castet (and/or haben keine feste Reihenfolge).
create or replace function public._skipbo_stuck(p_game_id uuid, p_seat smallint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select cardinality(h.cards) = 0 and not exists (
    select 1
    from (
      select p.stock_top as card
      union all
      select d ->> -1 from jsonb_array_elements(p.discards) as d
    ) c,
    jsonb_array_elements(g.build_piles) as b
    where c.card is not null
      and jsonb_array_length(b) < 12
      and case when c.card = 'SB' then true else c.card::integer = jsonb_array_length(b) + 1 end
  )
  from public.skipbo_hands h
  join public.skipbo_players p on p.game_id = h.game_id and p.seat = h.seat
  join public.skipbo_games g on g.id = h.game_id
  where h.game_id = p_game_id and h.seat = p_seat;
$$;

-- Erster aktiver Sitz nach p_after (reihum). null, wenn es keinen gibt.
create or replace function public._skipbo_next_seat(p_game_id uuid, p_after smallint)
returns smallint
language sql
stable
security definer set search_path = ''
as $$
  select p.seat
  from public.skipbo_players p
  join public.skipbo_games g on g.id = p.game_id
  where p.game_id = p_game_id and p.state = 'active'
  order by (p.seat - coalesce(p_after, -1) - 1 + 2 * g.seat_count) % g.seat_count
  limit 1;
$$;

-- Nächster Zug: auf 5 auffüllen; wer dann nichts tun kann, passt.
create or replace function public._skipbo_next_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  v_seat smallint;
  passes integer := 0;
begin
  loop
    select * into game from public.skipbo_games where id = p_game_id;
    exit when game.status <> 'playing';

    v_seat := public._skipbo_next_seat(p_game_id, game.turn_seat);
    -- Passen ändert nichts am Spiel: nach seat_count Pässen in Folge hängen alle fest
    if v_seat is null or passes >= game.seat_count then
      -- ponytail: alle ohne Karten und ohne Zug – Spiel endet ohne Sieger
      update public.skipbo_games
      set status = 'finished', turn_seat = null, waiting_since = null
      where id = p_game_id;
      perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'end'));
      exit;
    end if;

    update public.skipbo_games
    set turn_seat = v_seat, turn_no = turn_no + 1, waiting_since = now()
    where id = p_game_id;

    -- Zugbeginn: auf 5 auffüllen
    perform public._skipbo_refill(p_game_id, v_seat);
    exit when not public._skipbo_stuck(p_game_id, v_seat);

    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', v_seat));
    passes := passes + 1;
  end loop;
end;
$$;

create or replace function public._skipbo_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  player_count integer;
  stock_size integer;
  deck text[];
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.skipbo_games where lobby_id = p_lobby_id;

  select count(*) into player_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  stock_size := coalesce(
    (lobby.game_settings ->> 'stockSize')::integer,
    case when player_count >= 5 then 20 else 30 end);

  -- Genug für alle Spielstapel und die erste Hand; den Rest füllt _skipbo_refill nach
  deck := public._skipbo_new_deck();
  while cardinality(deck) < player_count * stock_size + 5 loop
    deck := deck || public._skipbo_new_deck();
  end loop;

  insert into public.skipbo_games (lobby_id, seat_count, dealer_seat, turn_seat, draw_count)
  values (p_lobby_id, player_count, player_count - 1, player_count - 1,
          cardinality(deck) - player_count * stock_size)
  returning id into new_game_id;

  insert into public.skipbo_players (game_id, user_id, seat, stock_count)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1),
         stock_size
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.skipbo_stocks (game_id, seat, cards)
  select new_game_id, p.seat, deck[p.seat * stock_size + 1 : (p.seat + 1) * stock_size]
  from public.skipbo_players p where p.game_id = new_game_id;

  update public.skipbo_players p
  set stock_top = s.cards[1]
  from public.skipbo_stocks s
  where s.game_id = p.game_id and s.seat = p.seat and p.game_id = new_game_id;

  insert into public.skipbo_hands (game_id, seat, user_id)
  select game_id, seat, user_id from public.skipbo_players where game_id = new_game_id;

  insert into public.skipbo_decks (game_id, draw_pile)
  values (new_game_id, deck[player_count * stock_size + 1:]);

  perform public._skipbo_log(new_game_id,
    jsonb_build_object('t', 'start', 'seat', player_count - 1));
  -- Sitz 0 ist am Zug und zieht 5
  perform public._skipbo_next_turn(new_game_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie,
-- damit Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück.
create or replace function public._skipbo_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  player public.skipbo_players;
begin
  begin
    select * into game from public.skipbo_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.skipbo_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.skipbo_games set last_events = '[]' where id = p_game_id;

    -- Alle Karten des Spielers gemischt unter den Nachziehstapel (162 bleiben vollständig)
    perform public._skipbo_bury(p_game_id,
      (select cards from public.skipbo_stocks where game_id = p_game_id and seat = player.seat)
      || (select cards from public.skipbo_hands where game_id = p_game_id and seat = player.seat)
      || array(select c from jsonb_array_elements(player.discards) as d,
                             jsonb_array_elements_text(d) as c));

    update public.skipbo_stocks set cards = '{}'
    where game_id = p_game_id and seat = player.seat;
    update public.skipbo_hands set cards = '{}'
    where game_id = p_game_id and seat = player.seat;
    update public.skipbo_players
    set state = 'left', left_at = now(), stock_top = null, hand_count = 0,
        discards = '[[],[],[],[]]'
    where game_id = p_game_id and seat = player.seat;

    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status = 'playing' then
      if (select count(*) from public.skipbo_players
          where game_id = p_game_id and state = 'active') < 2 then
        update public.skipbo_games
        set status = 'finished', turn_seat = null, waiting_since = null
        where id = p_game_id;
      elsif game.turn_seat = player.seat then
        perform public._skipbo_next_turn(p_game_id);
      end if;
    end if;
  exception when others then
    raise warning 'Skip-Bo: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._skipbo_on_member_removed()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_game_id uuid;
begin
  -- Wird die ganze Lobby gelöscht, verschwindet das Spiel ohnehin
  if not exists (select 1 from public.multiplayer_lobbies where id = old.lobby_id) then
    return null;
  end if;

  select id into v_game_id
  from public.skipbo_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._skipbo_remove_player(v_game_id, old.user_id);
  end if;
  return null;
end;
$$;

-- Läuft neben dem Flip-7-Trigger; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_skipbo_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_skipbo_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._skipbo_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._skipbo_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.skipbo_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._skipbo_lock(p_game_id uuid)
returns public.skipbo_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.skipbo_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._skipbo_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.skipbo_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

revoke execute on function public._skipbo_new_deck() from public, anon, authenticated;

revoke execute on function public._skipbo_log(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public._skipbo_bury(uuid, text[]) from public, anon, authenticated;

revoke execute on function public._skipbo_refill(uuid, smallint) from public, anon, authenticated;

revoke execute on function public._skipbo_stuck(uuid, smallint) from public, anon, authenticated;

revoke execute on function public._skipbo_next_seat(uuid, smallint) from public, anon, authenticated;

revoke execute on function public._skipbo_next_turn(uuid) from public, anon, authenticated;

revoke execute on function public._skipbo_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._skipbo_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._skipbo_on_member_removed() from public, anon, authenticated;

revoke execute on function public._skipbo_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._skipbo_lock(uuid) from public, anon, authenticated;

revoke execute on function public._skipbo_is_host(uuid) from public, anon, authenticated;

-- Spielen, Ablegen und Überspringen nehmen das waiting_since, das der Client
-- gesehen hat. Es ändert sich bei jeder Aktion, so tut ein Doppeltipp oder ein
-- Klick auf eine veraltete Ansicht nichts. Indizes sind 0-basiert.

-- Eine Karte (Hand, Spielstapel-Oberkarte oder Ablage-Oberkarte) auf einen
-- Aufbaustapel. Der Zug geht weiter.
create or replace function public.skipbo_play(
  p_game_id uuid, p_source text, p_index smallint, p_pile smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  me public.skipbo_players;
  my_seat smallint;
  card text;
  pile jsonb;
  value integer;
  top text;
  stock_left integer;
begin
  game := public._skipbo_lock(p_game_id);
  my_seat := public._skipbo_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if p_pile is null or p_pile not between 0 and 3 then
    raise exception 'Diesen Aufbaustapel gibt es nicht.';
  end if;

  select * into me from public.skipbo_players where game_id = p_game_id and seat = my_seat;

  if p_source = 'hand' and p_index between 0 and 4 then
    select cards[p_index + 1] into card
    from public.skipbo_hands where game_id = p_game_id and seat = my_seat;
  elsif p_source = 'stock' then
    card := me.stock_top;
  elsif p_source = 'discard' and p_index between 0 and 3 then
    card := (me.discards -> p_index::integer) ->> (-1);
  end if;

  if card is null then
    raise exception 'Diese Karte kannst du nicht spielen.';
  end if;

  pile := game.build_piles -> p_pile::integer;
  value := jsonb_array_length(pile) + 1;

  -- Der Joker nimmt den nächsten Wert an. case in Klammern: plpgsql liest die
  -- if-Bedingung sonst nur bis zum ersten then.
  if value > 12 or (case when card = 'SB' then false else card::integer <> value end) then
    raise exception 'Die % passt nicht auf diesen Stapel.', card;
  end if;

  if p_source = 'hand' then
    update public.skipbo_hands set cards = cards[:p_index] || cards[p_index + 2:]
    where game_id = p_game_id and seat = my_seat;
    update public.skipbo_players set hand_count = hand_count - 1
    where game_id = p_game_id and seat = my_seat;
  elsif p_source = 'stock' then
    update public.skipbo_stocks set cards = cards[2:]
    where game_id = p_game_id and seat = my_seat
    returning cards[1], cardinality(cards) into top, stock_left;
    update public.skipbo_players set stock_top = top, stock_count = stock_left
    where game_id = p_game_id and seat = my_seat;
  else
    update public.skipbo_players
    set discards = jsonb_set(discards, array[p_index::text], (discards -> p_index::integer) - (-1))
    where game_id = p_game_id and seat = my_seat;
  end if;

  -- Bei 12 ist der Stapel voll: gar nicht erst ablegen, sondern gleich abräumen
  pile := pile || to_jsonb(card);
  update public.skipbo_games
  set last_events = '[]', waiting_since = now(),
      build_piles = jsonb_set(build_piles, array[p_pile::text],
                              case when value = 12 then '[]'::jsonb else pile end)
  where id = p_game_id;

  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'play', 'seat', my_seat, 'src', p_source,
                       -- Beim Spielstapel ist p_index ungeprüft: nicht loggen
                       'i', case when p_source = 'stock' then null else p_index end,
                       'card', card, 'pile', p_pile, 'value', value)
    || case when p_source = 'stock' then jsonb_build_object('left', stock_left) else '{}'::jsonb end);

  if value = 12 then
    perform public._skipbo_bury(p_game_id, array(select jsonb_array_elements_text(pile)));
    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'clear', 'pile', p_pile));
  end if;

  if stock_left = 0 then
    update public.skipbo_games
    set status = 'finished', winner_seat = my_seat, turn_seat = null, waiting_since = null
    where id = p_game_id;
    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'win', 'seat', my_seat));
    return;
  end if;

  -- Hand leer (alle 5 ausgespielt): sofort 5 neue. Geht dann gar nichts mehr, endet der Zug.
  if (select cardinality(cards) from public.skipbo_hands
      where game_id = p_game_id and seat = my_seat) = 0 then
    perform public._skipbo_refill(p_game_id, my_seat);
    if public._skipbo_stuck(p_game_id, my_seat) then
      perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', my_seat));
      perform public._skipbo_next_turn(p_game_id);
    end if;
  end if;
end;
$$;

-- Eine Handkarte auf eine eigene Ablage: beendet den Zug.
create or replace function public.skipbo_discard(
  p_game_id uuid, p_hand_index smallint, p_pile smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  my_seat smallint;
  card text;
begin
  game := public._skipbo_lock(p_game_id);
  my_seat := public._skipbo_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if p_pile is null or p_pile not between 0 and 3 then
    raise exception 'Diese Ablage gibt es nicht.';
  end if;

  if p_hand_index between 0 and 4 then
    select cards[p_hand_index + 1] into card
    from public.skipbo_hands where game_id = p_game_id and seat = my_seat;
  end if;

  if card is null then
    raise exception 'Diese Karte kannst du nicht ablegen.';
  end if;

  update public.skipbo_hands set cards = cards[:p_hand_index] || cards[p_hand_index + 2:]
  where game_id = p_game_id and seat = my_seat;
  update public.skipbo_players
  set hand_count = hand_count - 1,
      discards = jsonb_set(discards, array[p_pile::text], (discards -> p_pile::integer) || to_jsonb(card))
  where game_id = p_game_id and seat = my_seat;

  update public.skipbo_games set last_events = '[]' where id = p_game_id;
  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'discard', 'seat', my_seat, 'i', p_hand_index, 'card', card, 'pile', p_pile));
  perform public._skipbo_next_turn(p_game_id);
end;
$$;

-- Host schiebt einen abwesenden Spieler weiter: der Zug endet ohne Ablegen,
-- die Handkarten bleiben. Nur für die Lage, die der Host gesehen hat, und erst
-- nach einer Weile (Client zeigt den Knopf nach 30 s, 25 s lassen Luft für Verzögerung).
create or replace function public.skipbo_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  game := public._skipbo_lock(p_game_id);

  if not public._skipbo_is_host(p_game_id) then
    raise exception 'Nur der Host kann Spieler überspringen.';
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is null then
    raise exception 'Gerade gibt es nichts zu überspringen.';
  end if;

  if game.waiting_since is null or game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.skipbo_games set last_events = '[]' where id = p_game_id;
  perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  perform public._skipbo_next_turn(p_game_id);
end;
$$;

-- Host beendet das Spiel vorzeitig, ohne Sieger.
create or replace function public.skipbo_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  game := public._skipbo_lock(p_game_id);

  if not public._skipbo_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.skipbo_games
  set last_events = '[]', status = 'finished', winner_seat = null,
      turn_seat = null, waiting_since = null
  where id = p_game_id;
  perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'end'));
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie flip7_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick (Mitglied ->
-- Spiel über den Trigger), damit sich beide nicht gegenseitig blockieren.
create or replace function public.skipbo_return_to_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  game_status text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann zur Warte-Lobby zurückkehren.';
  end if;

  if lobby.status <> 'started' then
    raise exception 'Die Lobby ist bereits wieder offen.';
  end if;

  update public.multiplayer_lobby_members set ready = false where lobby_id = p_lobby_id;

  select status into game_status
  from public.skipbo_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.skipbo_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.skipbo_play(uuid, text, smallint, smallint, timestamptz) from public, anon;

revoke execute on function public.skipbo_discard(uuid, smallint, smallint, timestamptz) from public, anon;

revoke execute on function public.skipbo_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.skipbo_end_game(uuid) from public, anon;

revoke execute on function public.skipbo_return_to_lobby(uuid) from public, anon;
grant execute on function public.skipbo_play(uuid, text, smallint, smallint, timestamptz) to authenticated;

grant execute on function public.skipbo_discard(uuid, smallint, smallint, timestamptz) to authenticated;

grant execute on function public.skipbo_skip(uuid, timestamptz) to authenticated;

grant execute on function public.skipbo_end_game(uuid) to authenticated;

grant execute on function public.skipbo_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Uno
-- ===========================================================================

-- Uno als viertes Lobby-Spiel (2–8 Spieler), Runde für Runde am gemeinsamen Tisch.
-- Der Server ist die einzige Instanz für die Regeln: alle Züge laufen über die
-- security-definer-Funktionen unten, Clients lesen nur Spiele, Spieler und ihre
-- eigene Hand.
--
-- Karten: je Farbe R/Y/G/B eine 0, je zwei 1–9, Aussetzen (S), Richtungswechsel (R)
-- und +2; dazu 4 'W' (Farbwahl) und 4 'W+4' = 108 Karten. Codes 'R0', 'YS', 'GR',
-- 'B+2', 'W', 'W+4'. Hausregeln (game_settings): stacking, sevenZero, drawUntilPlayable.
--
-- Geheim: Hände (uno_hands, RLS nur eigene Zeile, inkl. der gerade gezogenen Karte)
-- und Stapel (uno_decks, ohne Policy und ohne Grants). Öffentlich sind nur Zähler
-- und gespielte Karten. round_log/last_events nennen nie gezogene, getauschte oder
-- übrige Handkarten (draw/penalty nur mit n, swap nur mit Sitzen).
--
-- Live: nur game_ticks ist in der Realtime-Publikation (eine Zeile pro Lobby,
-- allgemein für alle Spiele). Jede öffentliche Uno-Funktion und der Trigger beim
-- Verlassen erhöhen den Tick genau einmal am Ende; uno_return_to_lobby ändert nur
-- die Lobby, die Clients ohnehin beobachten.

-- ===========================================================================
-- Uno: schema
-- ===========================================================================

-- Eine Zeile pro Lobby mit Spiel, pro Aktion genau einmal erhöht. Clients hören nur
-- hierauf und laden das Spiel dann mit einer Abfrage neu.
create table if not exists public.game_ticks (
  lobby_id uuid primary key references public.multiplayer_lobbies(id) on delete cascade,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.uno_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  -- finished = Runde vorbei (mit Sieger) oder vorzeitig beendet (ohne)
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- Hausregeln, beim Start aus lobby.game_settings kopiert
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  -- Fest ab Start, Sitze 0..seat_count-1 (Host = 0)
  seat_count smallint not null check (seat_count between 2 and 8),
  round_no integer not null default 1,
  -- Runde 1: seat_count - 1, damit Sitz 0 beginnt; danach reihum
  dealer_seat smallint not null,
  -- null, wenn beendet
  turn_seat smallint,
  -- = r im round_log
  turn_no integer not null default 0,
  -- 1 = in Sitzreihenfolge (im Uhrzeigersinn), -1 = umgekehrt
  direction smallint not null default 1 check (direction in (1, -1)),
  -- Aktuelle Farbe (eine Farbwahl setzt sie)
  color text check (color in ('R', 'Y', 'G', 'B')),
  -- Die letzten bis zu 3 gespielten Karten, oberste zuletzt (öffentlich)
  discard_top text[] not null default '{}',
  draw_count smallint not null default 0,
  -- Offene Zieh-Strafe aus +2/+4 für den Spieler am Zug
  pending_draw smallint not null default 0,
  -- Der Spieler am Zug hat eine passende Karte gezogen (spielen oder behalten)
  drew boolean not null default false,
  -- Wer mit einer Karte ohne Uno-Ruf dasteht: die nächste Aktion kostet ihn 2 Karten
  uno_open_seat smallint,
  -- null bei beendetem Spiel: vorzeitig beendet
  winner_seat smallint,
  -- Ereignisse der letzten Aktion, nur für die Anzeige
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  -- Verlauf mit r = turn_no und at, letzte 60 Einträge
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jedem Zugwechsel und nach dem Ziehen einer passenden Karte
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie skipbo_players: beim Löschen des Kontos muss
-- der Trigger die Zeile noch finden, um die Karten zurückzulegen.
create table if not exists public.uno_players (
  game_id uuid not null references public.uno_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active' check (state in ('active', 'left')),
  hand_count smallint not null default 0,
  uno_called boolean not null default false,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: jeder sieht nur seine eigene Zeile.
create table if not exists public.uno_hands (
  game_id uuid not null references public.uno_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  -- Immer sortiert (_uno_sort)
  cards text[] not null default '{}',
  -- Gerade gezogene Karte, die noch gespielt werden darf
  drawn text,
  primary key (game_id, seat)
);

-- Geheim: keine Policy, keine Grants, nicht in der Realtime-Publikation.
create table if not exists public.uno_decks (
  game_id uuid primary key references public.uno_games(id) on delete cascade,
  -- draw_pile[1] ist die nächste Karte
  draw_pile text[] not null default '{}',
  -- Alle gespielten Karten, oberste zuletzt
  discard_pile text[] not null default '{}'
);

-- ===========================================================================
-- Uno: row level security and privileges
-- ===========================================================================

alter table public.game_ticks enable row level security;

alter table public.uno_games enable row level security;

alter table public.uno_players enable row level security;

alter table public.uno_hands enable row level security;

alter table public.uno_decks enable row level security;

drop policy if exists "Multiplayer users can read game ticks" on public.game_ticks;
create policy "Multiplayer users can read game ticks"
  on public.game_ticks for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read uno games" on public.uno_games;
create policy "Multiplayer users can read uno games"
  on public.uno_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read uno players" on public.uno_players;
create policy "Multiplayer users can read uno players"
  on public.uno_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Players can read their own uno hand" on public.uno_hands;
create policy "Players can read their own uno hand"
  on public.uno_hands for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands,
  public.uno_decks from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands from authenticated;

grant select on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands
  to authenticated;

revoke all on public.uno_decks from authenticated;

-- Nur die Ticks gehen live raus. Spiele, Spieler, Hände und Stapel bleiben draußen.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_ticks'
  ) then
    alter publication supabase_realtime add table public.game_ticks;
  end if;
end;
$$;

-- ===========================================================================
-- Uno: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Das eine Realtime-Event einer Aktion. Immer zuletzt aufrufen.
create or replace function public._game_tick(p_lobby_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.game_ticks as t (lobby_id) values (p_lobby_id)
  on conflict (lobby_id) do update set version = t.version + 1, updated_at = now();
$$;

-- 108 Karten, gemischt.
create or replace function public._uno_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select c || v as card
    from unnest(array['R', 'Y', 'G', 'B']) as c,
         unnest(array['1', '2', '3', '4', '5', '6', '7', '8', '9', 'S', 'R', '+2']) as v,
         generate_series(1, 2)
    union all
    select c || '0' from unnest(array['R', 'Y', 'G', 'B']) as c
    union all
    select w from unnest(array['W', 'W+4']) as w, generate_series(1, 4)
  ) deck;
$$;

-- Feste Handreihenfolge: R, Y, G, B, dann Farbwahl; je Farbe 0–9, S, R, +2.
create or replace function public._uno_sort(p_cards text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(c order by
           array_position(array['R', 'Y', 'G', 'B', 'W'], left(c, 1)),
           array_position(array['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'S', 'R', '+2', '', '+4'],
                          substr(c, 2))), '{}')
  from unnest(p_cards) as c;
$$;

-- Passt die Karte? Farbe, Wert/Symbol oder Farbwahl (+4 immer, ohne Prüfung). Mit
-- offener Zieh-Strafe nur Stapeln (Hausregel): auf +2 ein +2 oder +4, auf +4 nur +4.
create or replace function public._uno_fits(p_game public.uno_games, p_card text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_game.pending_draw > 0 then
      coalesce((p_game.settings ->> 'stacking')::boolean, false)
      and (p_card = 'W+4'
           or (substr((p_game.discard_top)[cardinality(p_game.discard_top)], 2) = '+2'
               and left((p_game.discard_top)[cardinality(p_game.discard_top)], 1) <> 'W'
               and substr(p_card, 2) = '+2' and left(p_card, 1) <> 'W'))
    else
      left(p_card, 1) = 'W'
      or left(p_card, 1) = p_game.color
      or substr(p_card, 2) = substr((p_game.discard_top)[cardinality(p_game.discard_top)], 2)
  end;
$$;

-- Event-Form: {t, seat?, ...}. Zusätzlich ins round_log mit Zug und Zeit; ohne
-- p_animate nur dorthin (last_events der letzten Aktion bleibt stehen).
create or replace function public._uno_log(p_game_id uuid, p_event jsonb, p_animate boolean default true)
returns void
language sql
security definer set search_path = ''
as $$
  update public.uno_games
  set last_events = case when p_animate then last_events || jsonb_build_array(p_event) else last_events end,
      -- ponytail: Verlauf auf 60 Einträge begrenzt und bei jeder Aktion mitgeladen;
      -- bei spürbarem Traffic erst beim Öffnen des Verlaufs laden
      round_log = (
        select coalesce(jsonb_agg(l.e order by l.i), '[]'::jsonb)
        from jsonb_array_elements(
               round_log || jsonb_build_array(p_event || jsonb_build_object('r', turn_no, 'at', now()))
             ) with ordinality as l(e, i)
        where l.i > jsonb_array_length(round_log) - 59
      )
  where id = p_game_id;
$$;

-- p_n Karten für einen Sitz. Reicht der Nachziehstapel nicht, kommt erst die Ablage ohne
-- oberste Karte gemischt darunter, dann so viele neue Decks wie nötig. Gibt die gezogenen
-- Karten zurück. Nie loggen, welche Karten es waren.
create or replace function public._uno_draw(p_game_id uuid, p_seat smallint, p_n integer)
returns text[]
language plpgsql
security definer set search_path = ''
as $$
declare
  deck public.uno_decks;
  taken text[];
begin
  select * into deck from public.uno_decks where game_id = p_game_id for update;

  if cardinality(deck.draw_pile) < p_n and cardinality(deck.discard_pile) > 1 then
    deck.draw_pile := deck.draw_pile || array(
      select c from unnest(deck.discard_pile[:cardinality(deck.discard_pile) - 1]) as c
      order by gen_random_uuid());
    deck.discard_pile := deck.discard_pile[cardinality(deck.discard_pile):];
  end if;

  while cardinality(deck.draw_pile) < p_n loop
    deck.draw_pile := deck.draw_pile || public._uno_new_deck();
  end loop;

  taken := deck.draw_pile[:p_n];
  update public.uno_decks
  set draw_pile = deck.draw_pile[p_n + 1:], discard_pile = deck.discard_pile
  where game_id = p_game_id;

  update public.uno_games
  set draw_count = greatest(cardinality(deck.draw_pile) - p_n, 0)
  where id = p_game_id;

  if cardinality(taken) > 0 then
    update public.uno_hands set cards = public._uno_sort(cards || taken)
    where game_id = p_game_id and seat = p_seat;
    update public.uno_players
    set hand_count = hand_count + cardinality(taken),
        uno_called = uno_called and hand_count + cardinality(taken) <= 1
    where game_id = p_game_id and seat = p_seat;
  end if;
  return taken;
end;
$$;

-- Nächster aktiver Sitz in Spielrichtung, p_steps-mal.
create or replace function public._uno_next_seat(p_game_id uuid, p_from smallint, p_steps integer)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  v_seat smallint := p_from;
begin
  select * into game from public.uno_games where id = p_game_id;
  for i in 1..p_steps loop
    select p.seat into v_seat
    from public.uno_players p
    where p.game_id = p_game_id and p.state = 'active'
    order by ((p.seat - v_seat) * game.direction - 1 + 2 * game.seat_count) % game.seat_count
    limit 1;
  end loop;
  return v_seat;
end;
$$;

-- Zugwechsel um p_steps Plätze; die gezogene Karte darf danach nicht mehr gespielt werden.
create or replace function public._uno_advance(p_game_id uuid, p_steps integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  select * into game from public.uno_games where id = p_game_id;
  update public.uno_games
  set turn_seat = public._uno_next_seat(p_game_id, game.turn_seat, p_steps),
      turn_no = turn_no + 1, waiting_since = now(), drew = false
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id and drawn is not null;
end;
$$;

-- Uno-Fenster schließen: Wer mit einer Karte nicht gerufen hat, zieht 2. Läuft vor
-- jeder Spielaktion (spielen, ziehen, behalten, überspringen), nicht vor uno_call.
create or replace function public._uno_close_window(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_seat smallint;
  taken text[];
begin
  select uno_open_seat into v_seat from public.uno_games where id = p_game_id;
  if v_seat is null then
    return;
  end if;

  update public.uno_games set uno_open_seat = null where id = p_game_id;
  if exists (select 1 from public.uno_players
             where game_id = p_game_id and seat = v_seat and state = 'active' and not uno_called) then
    taken := public._uno_draw(p_game_id, v_seat, 2);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'penalty', 'seat', v_seat, 'n', cardinality(taken)));
  end if;
end;
$$;

-- Uno zählt keine Punkte: man will nur seine Karten loswerden. Die Statistik speichert wie
-- bei Skip-Bo die Karten, die man beim Rundenende noch hatte (Sieger 0), und ordnet danach.

create or replace function public._uno_start_round(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  deck text[];
  first_pos integer;
  first_card text;
  dealt integer;
begin
  update public.uno_hands set cards = '{}', drawn = null where game_id = p_game_id;
  update public.uno_players
  set hand_count = 0, uno_called = false
  where game_id = p_game_id;

  deck := public._uno_new_deck();
  with active as (
    select seat, (row_number() over (order by seat) - 1)::integer as i
    from public.uno_players where game_id = p_game_id and state = 'active'
  )
  update public.uno_hands h
  set cards = public._uno_sort(deck[a.i * 7 + 1 : a.i * 7 + 7])
  from active a
  where h.game_id = p_game_id and h.seat = a.seat;

  update public.uno_players set hand_count = 7
  where game_id = p_game_id and state = 'active';

  select count(*) * 7 into dealt
  from public.uno_players where game_id = p_game_id and state = 'active';
  deck := deck[dealt + 1:];

  -- Erste offene Karte: die erste Zahlenkarte; was davor lag, kommt gemischt zurück
  select min(i) into first_pos
  from unnest(deck) with ordinality as d(c, i)
  where substr(c, 2) ~ '^[0-9]$' and left(c, 1) <> 'W';
  first_card := deck[first_pos];
  deck := array(
    select c from unnest(deck[:first_pos - 1] || deck[first_pos + 1:]) as c
    order by gen_random_uuid());

  insert into public.uno_decks as d (game_id, draw_pile, discard_pile)
  values (p_game_id, deck, array[first_card])
  on conflict (game_id) do update set draw_pile = excluded.draw_pile, discard_pile = excluded.discard_pile;

  update public.uno_games
  set status = 'playing', direction = 1, color = left(first_card, 1),
      discard_top = array[first_card], draw_count = cardinality(deck),
      pending_draw = 0, drew = false, uno_open_seat = null, winner_seat = null,
      last_events = '[]'
  where id = p_game_id
  returning * into game;

  update public.uno_games
  set turn_seat = public._uno_next_seat(p_game_id, game.dealer_seat, 1),
      turn_no = turn_no + 1, waiting_since = now()
  where id = p_game_id;

  perform public._uno_log(p_game_id,
    jsonb_build_object('t', 'start', 'round', game.round_no, 'seat', game.dealer_seat));
end;
$$;

-- Runde vorbei: Der Nächste zieht noch eine offene Strafe (zählt mit), dann ist Schluss.
create or replace function public._uno_end_round(p_game_id uuid, p_winner smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  v_seat smallint;
  taken text[];
begin
  select * into game from public.uno_games where id = p_game_id;

  if game.pending_draw > 0 then
    v_seat := public._uno_next_seat(p_game_id, p_winner, 1);
    taken := public._uno_draw(p_game_id, v_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', v_seat, 'n', cardinality(taken)));
  end if;

  update public.uno_games
  set status = 'finished', winner_seat = p_winner, turn_seat = null, waiting_since = null,
      pending_draw = 0, drew = false, uno_open_seat = null
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'win', 'seat', p_winner));
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._uno_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  player_count integer;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.uno_games where lobby_id = p_lobby_id;

  select count(*) into player_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  -- Geber ist der letzte Sitz, so beginnt der Host (Sitz 0)
  insert into public.uno_games (lobby_id, settings, seat_count, dealer_seat)
  values (p_lobby_id, coalesce(lobby.game_settings, '{}'::jsonb), player_count, player_count - 1)
  returning id into new_game_id;

  insert into public.uno_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.uno_hands (game_id, seat, user_id)
  select game_id, seat, user_id from public.uno_players where game_id = new_game_id;

  perform public._uno_start_round(new_game_id);
  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist: später würde ihr
  -- Fremdschlüssel die Lobby nach dem Spiel sperren (umgekehrt zu uno_return_to_lobby)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie,
-- damit Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück.
create or replace function public._uno_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  player public.uno_players;
  draw_size integer;
begin
  begin
    select * into game from public.uno_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.uno_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.uno_games set last_events = '[]' where id = p_game_id;

    -- Handkarten gemischt unter den Nachziehstapel
    update public.uno_decks
    set draw_pile = draw_pile || array(
      select c from unnest((select cards from public.uno_hands
                            where game_id = p_game_id and seat = player.seat)) as c
      order by gen_random_uuid())
    where game_id = p_game_id
    returning cardinality(draw_pile) into draw_size;

    update public.uno_hands set cards = '{}', drawn = null
    where game_id = p_game_id and seat = player.seat;
    update public.uno_players
    set state = 'left', left_at = now(), hand_count = 0, uno_called = false
    where game_id = p_game_id and seat = player.seat;
    update public.uno_games
    set draw_count = coalesce(draw_size, draw_count),
        uno_open_seat = case when uno_open_seat = player.seat then null else uno_open_seat end
    where id = p_game_id;

    perform public._uno_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status = 'playing' then
      if (select count(*) from public.uno_players
          where game_id = p_game_id and state = 'active') < 2 then
        update public.uno_games
        set status = 'finished', turn_seat = null, waiting_since = null, pending_draw = 0, drew = false
        where id = p_game_id;
      elsif game.turn_seat = player.seat then
        -- Eine offene Strafe verfällt mit dem Spieler
        update public.uno_games set pending_draw = 0 where id = p_game_id;
        perform public._uno_advance(p_game_id, 1);
      end if;
    end if;
  exception when others then
    raise warning 'Uno: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._uno_on_member_removed()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_game_id uuid;
begin
  -- Wird die ganze Lobby gelöscht, verschwindet das Spiel ohnehin
  if not exists (select 1 from public.multiplayer_lobbies where id = old.lobby_id) then
    return null;
  end if;

  select id into v_game_id
  from public.uno_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._uno_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Flip-7- und Skip-Bo-Triggern; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_uno_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_uno_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._uno_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._uno_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.uno_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._uno_lock(p_game_id uuid)
returns public.uno_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.uno_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._uno_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.uno_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Gemeinsame Prüfung der Zug-Aktionen: Stand wie gesehen (sonst null = still
-- ignorieren), ich bin am Zug. Setzt last_events zurück und schließt das Uno-Fenster.
create or replace function public._uno_begin_turn(p_game_id uuid, p_waiting_since timestamptz)
returns public.uno_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
begin
  game := public._uno_lock(p_game_id);
  my_seat := public._uno_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return null;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  update public.uno_games set last_events = '[]' where id = p_game_id;
  perform public._uno_close_window(p_game_id);
  select * into game from public.uno_games where id = p_game_id;
  return game;
end;
$$;

revoke execute on function public._game_tick(uuid) from public, anon, authenticated;

revoke execute on function public._uno_new_deck() from public, anon, authenticated;

revoke execute on function public._uno_sort(text[]) from public, anon, authenticated;

revoke execute on function public._uno_fits(public.uno_games, text) from public, anon, authenticated;

revoke execute on function public._uno_log(uuid, jsonb, boolean) from public, anon, authenticated;

revoke execute on function public._uno_draw(uuid, smallint, integer) from public, anon, authenticated;

revoke execute on function public._uno_next_seat(uuid, smallint, integer) from public, anon, authenticated;

revoke execute on function public._uno_advance(uuid, integer) from public, anon, authenticated;

revoke execute on function public._uno_close_window(uuid) from public, anon, authenticated;

revoke execute on function public._uno_start_round(uuid) from public, anon, authenticated;

revoke execute on function public._uno_end_round(uuid, smallint) from public, anon, authenticated;

revoke execute on function public._uno_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._uno_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._uno_on_member_removed() from public, anon, authenticated;

revoke execute on function public._uno_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._uno_lock(uuid) from public, anon, authenticated;

revoke execute on function public._uno_is_host(uuid) from public, anon, authenticated;

revoke execute on function public._uno_begin_turn(uuid, timestamptz) from public, anon, authenticated;

-- Zug-Aktionen nehmen das waiting_since, das der Client gesehen hat. Es ändert sich
-- bei jedem Zugwechsel, so tut ein Doppeltipp oder ein Klick auf eine veraltete
-- Ansicht nichts. Karten werden per Code genannt, nicht per Index.

-- Eine Karte spielen. Farbwahl braucht p_color, eine 7 unter „7 tauscht, 0 dreht“
-- (nicht als letzte Karte) braucht p_target_seat.
create or replace function public.uno_play(
  p_game_id uuid, p_card text, p_color text, p_target_seat smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
  hand public.uno_hands;
  pos integer;
  wild boolean;
  v_value text;
  seven_zero boolean;
  top text[];
  steps integer := 1;
  active_count integer;
  target_cards text[];
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;
  my_seat := game.turn_seat;

  select * into hand from public.uno_hands where game_id = p_game_id and seat = my_seat;
  pos := array_position(hand.cards, p_card);
  if pos is null then
    raise exception 'Diese Karte hast du nicht.';
  end if;

  if game.drew and p_card is distinct from hand.drawn then
    raise exception 'Nach dem Ziehen darfst du nur die gezogene Karte spielen.';
  end if;

  if not public._uno_fits(game, p_card) then
    raise exception 'Diese Karte passt nicht.';
  end if;

  wild := left(p_card, 1) = 'W';
  v_value := substr(p_card, 2);
  if wild and (p_color is null or p_color not in ('R', 'Y', 'G', 'B')) then
    raise exception 'Bitte wähle eine Farbe.';
  end if;

  -- Als letzte Karte wirken 7 und 0 nicht
  seven_zero := coalesce((game.settings ->> 'sevenZero')::boolean, false)
                and cardinality(hand.cards) > 1 and not wild;
  if seven_zero and v_value = '7'
     and (p_target_seat is null or p_target_seat = my_seat
          or not exists (select 1 from public.uno_players
                         where game_id = p_game_id and seat = p_target_seat and state = 'active')) then
    raise exception 'Bitte wähle, mit wem du tauschst.';
  end if;

  update public.uno_hands set cards = cards[:pos - 1] || cards[pos + 1:], drawn = null
  where game_id = p_game_id and seat = my_seat;
  update public.uno_players set hand_count = hand_count - 1
  where game_id = p_game_id and seat = my_seat;
  update public.uno_decks set discard_pile = discard_pile || p_card where game_id = p_game_id;

  top := game.discard_top || p_card;
  update public.uno_games
  set discard_top = top[greatest(cardinality(top) - 2, 1):],
      color = case when wild then p_color else left(p_card, 1) end,
      drew = false,
      pending_draw = pending_draw + case v_value when '+2' then 2 when '+4' then 4 else 0 end
  where id = p_game_id;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'play', 'seat', my_seat, 'card', p_card));
  if wild then
    perform public._uno_log(p_game_id, jsonb_build_object('t', 'color', 'seat', my_seat, 'color', p_color));
  end if;

  -- Letzte Karte: Runde vorbei (eine offene +2/+4 zieht der Nächste noch)
  if cardinality(hand.cards) = 1 then
    perform public._uno_end_round(p_game_id, my_seat);
    perform public._game_tick(game.lobby_id);
    return;
  end if;

  if seven_zero and v_value = '7' then
    -- Hände tauschen; welche Karten, bleibt geheim
    select cards into target_cards from public.uno_hands where game_id = p_game_id and seat = p_target_seat;
    update public.uno_hands h
    set cards = case when h.seat = my_seat then target_cards else mine.cards end
    from (select cards from public.uno_hands where game_id = p_game_id and seat = my_seat) as mine
    where h.game_id = p_game_id and h.seat in (my_seat, p_target_seat);
    update public.uno_players p
    set hand_count = cardinality(h.cards), uno_called = false
    from public.uno_hands h
    where p.game_id = p_game_id and h.game_id = p.game_id and h.seat = p.seat
      and p.seat in (my_seat, p_target_seat);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'swap', 'seat', my_seat, 'target', p_target_seat));
  elsif seven_zero and v_value = '0' then
    -- Alle Hände wandern einen Platz in Spielrichtung (Unterabfrage liest den alten Stand)
    update public.uno_hands h
    set cards = src.cards
    from (
      select public._uno_next_seat(p_game_id, x.seat, 1) as dest, x.cards
      from public.uno_hands x
      join public.uno_players p on p.game_id = x.game_id and p.seat = x.seat
      where x.game_id = p_game_id and p.state = 'active'
    ) as src
    where h.game_id = p_game_id and h.seat = src.dest;
    update public.uno_players p
    set hand_count = cardinality(h.cards), uno_called = false
    from public.uno_hands h
    where p.game_id = p_game_id and h.game_id = p.game_id and h.seat = p.seat and p.state = 'active';
    perform public._uno_log(p_game_id, jsonb_build_object('t', 'rotate', 'dir', game.direction));
  end if;

  -- Eine Karte ohne Uno-Ruf: Die nächste Aktion (egal von wem) kostet mich 2 Karten
  update public.uno_games
  set uno_open_seat = my_seat
  where id = p_game_id
    and exists (select 1 from public.uno_players
                where game_id = p_game_id and seat = my_seat and hand_count = 1 and not uno_called);

  if v_value = 'S' then
    steps := 2;
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'skipped', 'seat', public._uno_next_seat(p_game_id, my_seat, 1), 'by', my_seat));
  elsif v_value = 'R' then
    update public.uno_games set direction = -direction where id = p_game_id
    returning direction into game.direction;
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'reverse', 'seat', my_seat, 'dir', game.direction));
    -- Zu zweit wirkt der Richtungswechsel wie Aussetzen
    select count(*) into active_count
    from public.uno_players where game_id = p_game_id and state = 'active';
    if active_count = 2 then
      steps := 2;
    end if;
  end if;

  perform public._uno_advance(p_game_id, steps);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Ziehen: mit offener Strafe alles ziehen (Zug endet); sonst 1 Karte (Hausregel: bis
-- eine passt). Passt die letzte gezogene, darf nur sie gespielt oder behalten werden.
create or replace function public.uno_draw(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
  taken text[];
  n integer := 0;
  fits boolean := false;
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;
  my_seat := game.turn_seat;

  if game.pending_draw > 0 then
    taken := public._uno_draw(p_game_id, my_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', my_seat, 'n', cardinality(taken)));
    update public.uno_games set pending_draw = 0 where id = p_game_id;
    perform public._uno_advance(p_game_id, 1);
    perform public._game_tick(game.lobby_id);
    return;
  end if;

  if game.drew then
    raise exception 'Du hast schon gezogen.';
  end if;

  loop
    taken := public._uno_draw(p_game_id, my_seat, 1);
    exit when cardinality(taken) = 0;
    n := n + 1;
    fits := public._uno_fits(game, taken[1]);
    exit when fits or not coalesce((game.settings ->> 'drawUntilPlayable')::boolean, false);
  end loop;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'draw', 'seat', my_seat, 'n', n));

  if fits then
    update public.uno_games set drew = true, waiting_since = now() where id = p_game_id;
    update public.uno_hands set drawn = taken[1] where game_id = p_game_id and seat = my_seat;
  else
    perform public._uno_advance(p_game_id, 1);
  end if;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Gezogene Karte behalten: Zug endet.
create or replace function public.uno_pass(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;

  if not game.drew then
    raise exception 'Du musst zuerst ziehen.';
  end if;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', game.turn_seat));
  perform public._uno_advance(p_game_id, 1);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Uno rufen, sobald man höchstens 2 Karten hat (auch vorab, mitten im eigenen Zug).
-- Ohne waiting_since und ohne es zu ändern: die anderen Tipps bleiben gültig.
create or replace function public.uno_call(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  me public.uno_players;
begin
  game := public._uno_lock(p_game_id);

  select * into me
  from public.uno_players where game_id = p_game_id and seat = public._uno_my_seat(p_game_id);

  if game.status <> 'playing' then
    raise exception 'Die Runde ist schon vorbei.';
  end if;

  -- Doppeltipp: schon gerufen, nichts zu tun
  if me.uno_called then
    return;
  end if;

  if me.hand_count > 2 then
    raise exception 'Uno rufen geht erst bei zwei Karten.';
  end if;

  update public.uno_players set uno_called = true where game_id = p_game_id and seat = me.seat;
  update public.uno_games
  set uno_open_seat = case when uno_open_seat = me.seat then null else uno_open_seat end
  where id = p_game_id;
  -- Nur in den Verlauf: wer die letzte Aktion noch nicht geladen hat, sieht sie sonst nie
  perform public._uno_log(p_game_id, jsonb_build_object('t', 'uno', 'seat', me.seat), false);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host schiebt einen abwesenden Spieler weiter (eine offene Strafe zieht er noch).
-- Nur für die Lage, die der Host gesehen hat, und erst nach einer Weile (Client zeigt
-- den Knopf nach 30 s, 25 s lassen Luft für Verzögerung).
create or replace function public.uno_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  taken text[];
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann Spieler überspringen.';
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is null then
    raise exception 'Gerade gibt es nichts zu überspringen.';
  end if;

  if game.waiting_since is null or game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.uno_games set last_events = '[]' where id = p_game_id;
  perform public._uno_close_window(p_game_id);
  select * into game from public.uno_games where id = p_game_id;

  if game.pending_draw > 0 then
    taken := public._uno_draw(p_game_id, game.turn_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', game.turn_seat, 'n', cardinality(taken)));
    update public.uno_games set pending_draw = 0 where id = p_game_id;
  end if;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  perform public._uno_advance(p_game_id, 1);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet die laufende Runde vorzeitig, ohne Sieger und ohne Wertung.
create or replace function public.uno_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.uno_games
  set last_events = '[]', status = 'finished', winner_seat = null, turn_seat = null,
      waiting_since = null, pending_draw = 0, drew = false, uno_open_seat = null
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id;
  perform public._uno_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host startet die nächste Runde im selben Spiel; der Geber rückt weiter.
-- p_round_no: Runde, die der Host gesehen hat (Doppeltipp tut nichts).
create or replace function public.uno_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann die nächste Runde starten.';
  end if;

  if game.status <> 'finished' or game.round_no is distinct from p_round_no then
    return;
  end if;

  if (select count(*) from public.uno_players
      where game_id = p_game_id and state = 'active') < 2 then
    raise exception 'Für eine neue Runde braucht es mindestens 2 Spieler.';
  end if;

  -- Erst die Richtung zurück, dann den nächsten Geber in Sitzreihenfolge
  update public.uno_games set round_no = round_no + 1, direction = 1 where id = p_game_id;
  update public.uno_games
  set dealer_seat = public._uno_next_seat(p_game_id, dealer_seat, 1)
  where id = p_game_id;

  perform public._uno_start_round(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie skipbo_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick (Mitglied ->
-- Spiel über den Trigger), damit sich beide nicht gegenseitig blockieren.
create or replace function public.uno_return_to_lobby(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  game_status text;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann zur Warte-Lobby zurückkehren.';
  end if;

  if lobby.status <> 'started' then
    raise exception 'Die Lobby ist bereits wieder offen.';
  end if;

  update public.multiplayer_lobby_members set ready = false where lobby_id = p_lobby_id;

  select status into game_status
  from public.uno_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.uno_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.uno_play(uuid, text, text, smallint, timestamptz) from public, anon;

revoke execute on function public.uno_draw(uuid, timestamptz) from public, anon;

revoke execute on function public.uno_pass(uuid, timestamptz) from public, anon;

revoke execute on function public.uno_call(uuid) from public, anon;

revoke execute on function public.uno_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.uno_end_game(uuid) from public, anon;

revoke execute on function public.uno_next_round(uuid, integer) from public, anon;

revoke execute on function public.uno_return_to_lobby(uuid) from public, anon;
grant execute on function public.uno_play(uuid, text, text, smallint, timestamptz) to authenticated;

grant execute on function public.uno_draw(uuid, timestamptz) to authenticated;

grant execute on function public.uno_pass(uuid, timestamptz) to authenticated;

grant execute on function public.uno_call(uuid) to authenticated;

grant execute on function public.uno_skip(uuid, timestamptz) to authenticated;

grant execute on function public.uno_end_game(uuid) to authenticated;

grant execute on function public.uno_next_round(uuid, integer) to authenticated;

grant execute on function public.uno_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Guests
-- ===========================================================================

-- Guest players: people without an account join a lobby with its code and a
-- display name. The client signs them in with Supabase Anonymous Sign-Ins
-- (Dashboard: Authentication > Sign In / Providers > "Allow anonymous sign-ins"
-- must be on). Guests are normal "authenticated" users whose JWT carries
-- is_anonymous = true, so every lobby and game function keeps working through
-- auth.uid(). This section only:
--   * marks guest profiles,
--   * lets everyone join a lobby with just the code,
--   * fences guests into their own lobby and out of account features,
--   * removes guests again (on request and by a daily cleanup),
--   * keeps profiles.is_guest in sync when a guest becomes an account (the
--     guest_… username stays).
--
-- Anonymous sign-in is open to anyone who knows the anon key, so the read
-- restrictions below are what keeps a guest session from seeing other users.

-- ===========================================================================
-- Helpers
-- ===========================================================================

create or replace function public.is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

revoke execute on function public.is_guest() from public, anon;
grant execute on function public.is_guest() to authenticated;

-- The caller's lobby (everyone is in at most one). Security definer so the
-- policies below can use it without recursing into the members policy.
create or replace function public.my_lobby_id()
returns uuid
language sql
stable
security definer set search_path = ''
as $$
  select lobby_id from public.multiplayer_lobby_members where user_id = auth.uid();
$$;

revoke execute on function public.my_lobby_id() from public, anon;
grant execute on function public.my_lobby_id() to authenticated;

-- A guest that links an email becomes an account and is no longer a guest (and vice versa).
create or replace function public.handle_user_guest_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles set is_guest = new.is_anonymous where id = new.id;
  return null;
end;
$$;

revoke execute on function public.handle_user_guest_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_guest_changed on auth.users;
create trigger on_auth_user_guest_changed
after update of is_anonymous on auth.users
for each row
when (old.is_anonymous is distinct from new.is_anonymous)
execute function public.handle_user_guest_change();

-- ===========================================================================
-- Guests only see their own lobby (restrictive: combined with AND)
-- ===========================================================================
-- Wrapped in (select ...) so both checks run once per query, not per row.

-- "id in (uncorrelated subquery)" becomes a hashed SubPlan that runs once per
-- query; a correlated "exists" inside an OR runs once per profile row before
-- Postgres 18.
drop policy if exists "Guests only see themselves and their lobby" on public.profiles;
create policy "Guests only see themselves and their lobby"
  on public.profiles as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or id = (select auth.uid())
    or id in (
      select m.user_id from public.multiplayer_lobby_members m
      where m.lobby_id = (select public.my_lobby_id())
    )
  );

drop policy if exists "Guests only see their lobby" on public.multiplayer_lobbies;
create policy "Guests only see their lobby"
  on public.multiplayer_lobbies as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their lobby members" on public.multiplayer_lobby_members;
create policy "Guests only see their lobby members"
  on public.multiplayer_lobby_members as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their flip7 game" on public.flip7_games;
create policy "Guests only see their flip7 game"
  on public.flip7_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their flip7 players" on public.flip7_players;
create policy "Guests only see their flip7 players"
  on public.flip7_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.flip7_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

drop policy if exists "Guests only see their flip7 ticks" on public.flip7_game_ticks;
create policy "Guests only see their flip7 ticks"
  on public.flip7_game_ticks as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their skipbo game" on public.skipbo_games;
create policy "Guests only see their skipbo game"
  on public.skipbo_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their skipbo players" on public.skipbo_players;
create policy "Guests only see their skipbo players"
  on public.skipbo_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.skipbo_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

drop policy if exists "Guests only see their game ticks" on public.game_ticks;
create policy "Guests only see their game ticks"
  on public.game_ticks as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their uno game" on public.uno_games;
create policy "Guests only see their uno game"
  on public.uno_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their uno players" on public.uno_players;
create policy "Guests only see their uno players"
  on public.uno_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.uno_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

-- ===========================================================================
-- Account features stay closed for guests
-- ===========================================================================

drop policy if exists "Guests cannot use friendships" on public.friendships;
create policy "Guests cannot use friendships"
  on public.friendships as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (
    not (select public.is_guest())
    and not exists (
      select 1 from public.profiles p where p.id = addressee_id and p.is_guest
    )
  );

drop policy if exists "Guests cannot save ranking games" on public.ranking_games;
create policy "Guests cannot save ranking games"
  on public.ranking_games as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

drop policy if exists "Guests cannot save F1 strategy overrides" on public.f1_strategy_overrides;
create policy "Guests cannot save F1 strategy overrides"
  on public.f1_strategy_overrides as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

-- ===========================================================================
-- Join with just the code (accounts and guests)
-- ===========================================================================

-- Returns the lobby id. Same message for a wrong code and a closed lobby.
create or replace function public.join_lobby_by_code(p_code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  code_lobby_id uuid;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select c.lobby_id into code_lobby_id
  from public.multiplayer_lobby_codes c
  join public.multiplayer_lobbies l on l.id = c.lobby_id
  where c.code = upper(btrim(coalesce(p_code, ''))) and l.status = 'open';

  if code_lobby_id is null then
    raise exception 'Code ist falsch oder die Lobby ist nicht mehr offen.';
  end if;

  perform public._add_lobby_member(code_lobby_id, auth.uid());
  return code_lobby_id;
end;
$$;

revoke execute on function public.join_lobby_by_code(text) from public, anon;
grant execute on function public.join_lobby_by_code(text) to authenticated;

-- ===========================================================================
-- Removing guests
-- ===========================================================================

-- A guest ends their session: the user and (by cascade) profile and lobby seat
-- go away; the member delete trigger also takes them out of a running game.
create or replace function public.end_guest_session()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_guest() then
    raise exception 'Nur Gäste können ihre Sitzung so beenden.';
  end if;

  delete from auth.users where id = auth.uid() and is_anonymous;
end;
$$;

revoke execute on function public.end_guest_session() from public, anon;
grant execute on function public.end_guest_session() to authenticated;

-- Guests that are in no lobby after a day, and all guests after three days.
create or replace function public.cleanup_guest_users()
returns integer
language sql
security definer set search_path = ''
as $$
  with deleted as (
    delete from auth.users u
    where u.is_anonymous
      and (
        u.created_at < now() - interval '3 days'
        or (
          u.created_at < now() - interval '1 day'
          and not exists (
            select 1 from public.multiplayer_lobby_members m where m.user_id = u.id
          )
        )
      )
    returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.cleanup_guest_users() from public, anon, authenticated;

-- ===========================================================================
-- Lobby inactivity
-- ===========================================================================

-- Lobbys schließen sich nach 5 Stunden ohne Aktivität (vergessen oder aus Versehen eröffnet).
--
-- Schließen = löschen wie bei leave_lobby durch den Host: Spiele, Mitglieder, Codes und
-- game_ticks hängen per on delete cascade daran, Einladungen räumt der Trigger
-- multiplayer_lobbies_cleanup_invites weg. Clients in der Lobby sehen „Die Lobby wurde
-- geschlossen.“
--
-- Aktivität aus vorhandenen Zeitstempeln (kein eigenes Feld, das bei jedem Zug geschrieben
-- würde: die Lobby-Zeile wird live beobachtet): Eröffnen, Starten, Beitritte, der letzte
-- Zugwechsel der Spiele (waiting_since) und Uno-Ticks. Bereit-Haken und Spielwahl haben
-- keinen Zeitstempel; die gibt es ohne Beitritte oder Züge aber nicht stundenlang.

create or replace function public.cleanup_inactive_lobbies()
returns integer
language sql
security definer set search_path = ''
as $$
  with deleted as (
    delete from public.multiplayer_lobbies l
    where greatest(
      l.created_at,
      l.started_at,
      (select max(m.joined_at) from public.multiplayer_lobby_members m where m.lobby_id = l.id),
      (select f.waiting_since from public.flip7_games f where f.lobby_id = l.id),
      (select s.waiting_since from public.skipbo_games s where s.lobby_id = l.id),
      (select u.waiting_since from public.uno_games u where u.lobby_id = l.id),
      (select t.updated_at from public.game_ticks t where t.lobby_id = l.id)
    ) < now() - interval '5 hours'
    returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.cleanup_inactive_lobbies() from public, anon, authenticated;

-- Zeitgesteuert per pg_cron: Lobbys alle 30 Minuten, Gäste täglich um 04:17
-- (gleicher Jobname überschreibt, erneut einplanen schadet nicht).
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-inactive-lobbies', '*/30 * * * *', 'select public.cleanup_inactive_lobbies()'
);

select cron.schedule('cleanup-guest-users', '17 4 * * *', 'select public.cleanup_guest_users()');

-- ===========================================================================
-- Game results (statistics)
-- ===========================================================================

-- Spielergebnisse für Statistiken (Profil, Statistik-Seite, Home).
--
-- Spiele hängen an der Lobby und verschwinden mit „Zurück zur Lobby“ und dem Lobby-Cleanup,
-- die Ergebnisse bleiben. Ein Trigger je Spiel schreibt beim Wechsel auf 'finished' eine Zeile
-- je Spieler. Vorzeitig beendete Spiele (ohne Sieger bzw. mit weniger als 2 Spielern) zählen
-- nicht. Uno hat kein Punkteziel: jede Runde ist ein Ergebnis.

create table if not exists public.game_results (
  game_id uuid not null,
  -- Uno: Rundennummer, sonst 0
  round_no integer not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in ('flip-7', 'skip-bo', 'uno')),
  placement smallint not null check (placement >= 1),
  player_count smallint not null check (player_count >= 2),
  won boolean not null,
  -- Flip 7: Gesamtpunkte; Uno: Rundenpunkte (Sieger: Summe der anderen, sonst Restkarten);
  -- Skip-Bo: Karten, die noch im Spielstapel lagen
  score integer,
  finished_at timestamptz not null default now(),
  primary key (game_id, round_no, user_id)
);

create index if not exists game_results_user_finished_idx
  on public.game_results (user_id, finished_at desc);

alter table public.game_results enable row level security;

drop policy if exists "Users can read their own game results" on public.game_results;
create policy "Users can read their own game results"
  on public.game_results for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Schreiben nur über die Trigger
revoke all on public.game_results from anon, authenticated;

grant select on public.game_results to authenticated;

-- Platzierung über alle Spieler, gespeichert nur für noch vorhandene Konten. Ein Fehler hier
-- darf den Spielzug nie abbrechen, daher nur eine Warnung.

create or replace function public._flip7_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.flip7_players
      where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'flip-7', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.total_score
  from (
    select p.user_id, p.state, p.total_score,
           rank() over (order by p.state = 'left', p.total_score desc) as placement,
           count(*) over () as player_count
    from public.flip7_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  return null;
exception when others then
  raise warning 'Flip 7: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

create or replace function public._skipbo_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'skip-bo', r.placement, r.player_count, r.won, r.stock_count
  from (
    select p.user_id, p.stock_count, p.seat = new.winner_seat as won,
           rank() over (order by p.seat = new.winner_seat desc, p.state = 'left', p.stock_count)
             as placement,
           count(*) over () as player_count
    from public.skipbo_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  return null;
exception when others then
  raise warning 'Skip-Bo: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

-- game_results.score für Uno: Karten auf der Hand beim Rundenende
create or replace function public._uno_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.game_results
    (game_id, round_no, user_id, game_key, placement, player_count, won, score)
  select new.id, new.round_no, r.user_id, 'uno', r.placement, r.player_count, r.won, r.hand_count
  from (
    select p.user_id, p.hand_count, p.seat = new.winner_seat as won,
           rank() over (
             order by p.seat = new.winner_seat desc, p.state = 'left', p.hand_count
           ) as placement,
           count(*) over () as player_count
    from public.uno_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  return null;
exception when others then
  raise warning 'Uno: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists flip7_games_record_result on public.flip7_games;
create trigger flip7_games_record_result
after update of status on public.flip7_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._flip7_record_result();

drop trigger if exists skipbo_games_record_result on public.skipbo_games;
create trigger skipbo_games_record_result
after update of status on public.skipbo_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and new.winner_seat is not null)
execute function public._skipbo_record_result();

drop trigger if exists uno_games_record_result on public.uno_games;
create trigger uno_games_record_result
after update of status on public.uno_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and new.winner_seat is not null)
execute function public._uno_record_result();

revoke execute on function public._flip7_record_result() from public, anon, authenticated;

revoke execute on function public._skipbo_record_result() from public, anon, authenticated;

revoke execute on function public._uno_record_result() from public, anon, authenticated;

-- Härtung: Profile legt nur handle_new_user an, gelöscht wird über das Konto. Ohne Policy
-- blockiert RLS das schon, die Rechte braucht der Client aber nie.
revoke insert, delete on public.profiles from authenticated;

-- ===========================================================================
-- Saved tool state
-- ===========================================================================

-- Werkzeug-Stände pro Konto (Paddle Tabelle, Ankunftsplaner), damit sie nicht mit den
-- Browserdaten verloren gehen. localStorage bleibt Zwischenspeicher für Gäste und offline.

create table if not exists public.user_app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('paddle', 'arrival-planner', 'arrival-planner-train')),
  value jsonb not null check (octet_length(value::text) <= 65536),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_app_state enable row level security;

drop policy if exists "Users manage their own app state" on public.user_app_state;
create policy "Users manage their own app state"
  on public.user_app_state for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests cannot save app state" on public.user_app_state;
create policy "Guests cannot save app state"
  on public.user_app_state as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

revoke all on public.user_app_state from anon, authenticated;

grant select, insert, update, delete on public.user_app_state to authenticated;

-- ===========================================================================
-- Push notifications
-- ===========================================================================

-- Push-Nachrichten (Web Push): Mitteilungen kommen als System-Benachrichtigung aufs Gerät,
-- auch wenn die App geschlossen ist.
--
-- Ablauf: Die App meldet das Gerät über save_push_subscription an. Jede neue Zeile in
-- notifications ruft per pg_net die Edge Function send-push auf, die an alle Geräte des
-- Empfängers schickt und abgelaufene Geräte löscht.
--
-- Einrichtung (einmalig, nicht im Repo, weil geheim):
--   select vault.create_secret('https://<projekt>.supabase.co', 'project_url');
--   select vault.create_secret('<zufälliger Wert>', 'push_webhook_secret');
-- und dieselben Werte als Edge-Function-Secrets: PUSH_WEBHOOK_SECRET, VAPID_PUBLIC_KEY,
-- VAPID_PRIVATE_KEY. Fehlt etwas, verschickt der Trigger einfach nichts.

create extension if not exists pg_net;

create table if not exists public.push_subscriptions (
  -- Adresse beim Push-Dienst des Browsers, je Gerät und Browser eine
  endpoint text primary key check (char_length(endpoint) <= 1000),
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read their own push subscriptions" on public.push_subscriptions;
create policy "Users can read their own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own push subscriptions" on public.push_subscriptions;
create policy "Users can remove their own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Anlegen nur über save_push_subscription
revoke all on public.push_subscriptions from anon, authenticated;

grant select, delete on public.push_subscriptions to authenticated;

-- Gerät für das aktuelle Konto speichern. Meldet sich auf dem Gerät ein anderes Konto an,
-- gehört es danach diesem. Nur bekannte Push-Dienste, damit send-push keine beliebigen
-- Adressen aufruft.
create or replace function public.save_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_guest() then
    raise exception 'Push-Nachrichten gibt es nur mit Konto.' using errcode = '42501';
  end if;

  if p_endpoint !~ '^https://(fcm\.googleapis\.com|[a-z0-9.-]+\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)/' then
    raise exception 'Dieser Browser wird nicht unterstützt.' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update
  set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
      created_at = now();
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- Jede neue Mitteilung (Freunde, Einladungen, System) auch als Push
create or replace function public._push_notification()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public._send_push(new.recipient_id, new.type, new.title, new.message);
  return null;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
after insert on public.notifications
for each row execute function public._push_notification();

revoke execute on function public._push_notification() from public, anon, authenticated;

-- Push-Einstellungen pro Konto: welche Mitteilungsarten als Push kommen. Gespeichert wird,
-- was stumm ist, damit neue Arten automatisch an sind. Die Mitteilungen in der App bleiben
-- unberührt, es geht nur um die Benachrichtigung aufs Gerät.

create table if not exists public.push_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  muted_types text[] not null default '{}'
    check (muted_types <@ array['friend_request', 'friend_accepted', 'game_invite',
                                'system_info', 'system_alert', 'your_turn',
                                'game_started']::text[]),
  updated_at timestamptz not null default now()
);

alter table public.push_preferences enable row level security;

drop policy if exists "Users manage their own push preferences" on public.push_preferences;
create policy "Users manage their own push preferences"
  on public.push_preferences for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Guests cannot save push preferences" on public.push_preferences;
create policy "Guests cannot save push preferences"
  on public.push_preferences as restrictive for all
  to authenticated
  using (not (select public.is_guest()))
  with check (not (select public.is_guest()));

revoke all on public.push_preferences from anon, authenticated;

grant select, insert, update, delete on public.push_preferences to authenticated;

-- ===========================================================================
-- Error monitoring
-- ===========================================================================

-- Fehler-Überwachung: Unerwartete Fehler aus dem Browser (AppErrorHandler) landen hier,
-- Admins sehen sie auf der Admin-Seite. Schreiben dürfen alle (auch ohne Konto), lesen
-- und löschen nur Admins. Nach 30 Tagen räumt pg_cron auf.

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  message text not null check (char_length(message) <= 1000),
  stack text check (char_length(stack) <= 8000),
  url text check (char_length(url) <= 500),
  user_agent text check (char_length(user_agent) <= 500),
  app_version text check (char_length(app_version) <= 20)
);

create index if not exists client_errors_created_at_idx on public.client_errors (created_at desc);

create index if not exists client_errors_user_id_idx on public.client_errors (user_id);

alter table public.client_errors enable row level security;

-- user_id muss zur Sitzung passen, damit niemand Fehler anderen unterschiebt
drop policy if exists "Anyone can report errors" on public.client_errors;
create policy "Anyone can report errors"
  on public.client_errors for insert
  to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));

drop policy if exists "Admins read errors" on public.client_errors;
create policy "Admins read errors"
  on public.client_errors for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins delete errors" on public.client_errors;
create policy "Admins delete errors"
  on public.client_errors for delete
  to authenticated
  using ((select public.is_admin()));

revoke all on public.client_errors from anon, authenticated;

grant insert (message, stack, url, user_agent, app_version) on public.client_errors to anon, authenticated;

grant select, delete on public.client_errors to authenticated;

select cron.schedule(
  'cleanup-client-errors', '43 4 * * *',
  $$delete from public.client_errors where created_at < now() - interval '30 days'$$
);

-- ===========================================================================
-- Lobby host transfer
-- ===========================================================================

-- Host-Wechsel: Der Host gibt die Rolle in der Warte-Lobby an einen anderen Spieler ab.
-- Gäste können keine Lobby eröffnen und darum auch nicht Host werden. Den Lobby-Code
-- sieht danach automatisch der neue Host ("Hosts can read their lobby code" hängt an
-- host_user_id); alle Clients bekommen den Wechsel über Realtime auf multiplayer_lobbies.

create or replace function public.transfer_lobby_host(p_lobby_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann die Host-Rolle abgeben.';
  end if;

  if lobby.status <> 'open' then
    raise exception 'Während eines Spiels kann der Host nicht wechseln.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du bist schon Host.';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = p_user_id
  ) then
    raise exception 'Dieser Spieler ist nicht mehr in der Lobby.';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id and is_guest) then
    raise exception 'Gäste können nicht Host werden.';
  end if;

  update public.multiplayer_lobbies set host_user_id = p_user_id where id = p_lobby_id;
end;
$$;

revoke execute on function public.transfer_lobby_host(uuid, uuid) from public, anon;
grant execute on function public.transfer_lobby_host(uuid, uuid) to authenticated;

-- ===========================================================================
-- Push: presence, turns and game start
-- ===========================================================================

-- Push nur, wenn man gerade nicht in der App ist, und neu auch fürs Spielen:
--   your_turn     Du bist dran (Flip 7, Skip-Bo, Uno; auch Zielwahl bei Flip 7)
--   game_started  Der Host hat das Spiel in deiner Lobby gestartet
-- Anwesenheit: Die sichtbare App meldet sich alle 30 s (gilt 45 s), beim Verlassen sofort ab.
-- Spiel-Pushes einer Lobby tragen denselben Tag und ersetzen sich auf dem Gerät gegenseitig.
-- send-push muss dafür neu deployt werden (nimmt jetzt url und tag mit).

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_until timestamptz not null
);

alter table public.user_presence enable row level security;

-- Kein direkter Zugriff, nur über set_app_active
revoke all on public.user_presence from anon, authenticated;

create or replace function public.set_app_active(p_active boolean)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.user_presence (user_id, active_until)
  select auth.uid(), case when p_active then now() + interval '45 seconds' else now() end
  where auth.uid() is not null
  on conflict (user_id) do update set active_until = excluded.active_until;
$$;

revoke execute on function public.set_app_active(boolean) from public, anon;
grant execute on function public.set_app_active(boolean) to authenticated;

-- Gemeinsamer Versand: nur mit Gerät, nicht stumm geschaltet und nicht gerade in der App.
-- pg_net schickt erst nach dem Commit; ein Fehler hier darf nie den Spielzug abbrechen.
create or replace function public._send_push(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_url text default 'notifications',
  p_tag text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not exists (select 1 from public.push_subscriptions where user_id = p_user_id)
     or exists (select 1 from public.push_preferences
                where user_id = p_user_id and p_type = any(muted_types))
     or exists (select 1 from public.user_presence
                where user_id = p_user_id and active_until > now()) then
    return;
  end if;

  select btrim(decrypted_secret, E' \r\n\t') into v_url
  from vault.decrypted_secrets where name = 'project_url';
  select btrim(decrypted_secret, E' \r\n\t') into v_secret
  from vault.decrypted_secrets where name = 'push_webhook_secret';
  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_url, '/') || '/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
    body := jsonb_build_object(
      'recipient_id', p_user_id,
      'type', p_type,
      'title', p_title,
      'message', p_message,
      'url', p_url,
      'tag', p_tag));
exception when others then
  raise warning 'Push (%) an % nicht verschickt: %', p_type, p_user_id, sqlerrm;
end;
$$;

revoke execute on function public._send_push(uuid, text, text, text, text, text)
  from public, anon, authenticated;

-- Du bist dran: an den Spieler auf dem Platz, der neu am Zug ist
create or replace function public._push_turn(
  p_lobby_id uuid,
  p_user_id uuid,
  p_message text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_user_id is not null then
    perform public._send_push(p_user_id, 'your_turn', 'Du bist dran', p_message,
                              'multiplayer/' || p_lobby_id, 'game-' || p_lobby_id);
  end if;
end;
$$;

create or replace function public._flip7_push_turn()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status <> 'playing' then
    return null;
  end if;
  if new.pending_seat is not null and new.pending_seat is distinct from old.pending_seat then
    perform public._push_turn(new.lobby_id,
      (select user_id from public.flip7_players where game_id = new.id and seat = new.pending_seat),
      'Flip 7 – wähle, wer deine Aktionskarte bekommt.');
  elsif new.turn_seat is not null and new.turn_seat is distinct from old.turn_seat then
    perform public._push_turn(new.lobby_id,
      (select user_id from public.flip7_players where game_id = new.id and seat = new.turn_seat),
      'Flip 7 – zieh eine Karte oder sichere deine Punkte.');
  end if;
  return null;
end;
$$;

create or replace function public._skipbo_push_turn()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'playing' and new.turn_seat is not null
     and new.turn_seat is distinct from old.turn_seat then
    perform public._push_turn(new.lobby_id,
      (select user_id from public.skipbo_players where game_id = new.id and seat = new.turn_seat),
      'Skip-Bo – du bist am Zug.');
  end if;
  return null;
end;
$$;

create or replace function public._uno_push_turn()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'playing' and new.turn_seat is not null
     and new.turn_seat is distinct from old.turn_seat then
    perform public._push_turn(new.lobby_id,
      (select user_id from public.uno_players where game_id = new.id and seat = new.turn_seat),
      'Uno – du bist am Zug.');
  end if;
  return null;
end;
$$;

drop trigger if exists flip7_games_push_turn on public.flip7_games;
create trigger flip7_games_push_turn
after update of turn_seat, pending_seat on public.flip7_games
for each row execute function public._flip7_push_turn();

drop trigger if exists skipbo_games_push_turn on public.skipbo_games;
create trigger skipbo_games_push_turn
after update of turn_seat on public.skipbo_games
for each row execute function public._skipbo_push_turn();

drop trigger if exists uno_games_push_turn on public.uno_games;
create trigger uno_games_push_turn
after update of turn_seat on public.uno_games
for each row execute function public._uno_push_turn();

-- Spielstart: an alle in der Lobby außer dem Host
create or replace function public._push_game_started()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_host text;
  v_game text;
begin
  select coalesce(display_name, username) into v_host
  from public.profiles where id = new.host_user_id;
  v_game := case new.game_key
              when 'flip-7' then 'Flip 7'
              when 'skip-bo' then 'Skip-Bo'
              when 'uno' then 'Uno'
              else 'das Spiel'
            end;

  perform public._send_push(m.user_id, 'game_started', 'Das Spiel geht los',
                            coalesce(v_host, 'Der Host') || ' hat ' || v_game || ' gestartet.',
                            'multiplayer/' || new.id, 'game-' || new.id)
  from public.multiplayer_lobby_members m
  where m.lobby_id = new.id and m.user_id <> new.host_user_id;
  return null;
end;
$$;

drop trigger if exists multiplayer_lobbies_push_started on public.multiplayer_lobbies;
create trigger multiplayer_lobbies_push_started
after update of status on public.multiplayer_lobbies
for each row when (old.status = 'open' and new.status = 'started')
execute function public._push_game_started();

revoke execute on function public._push_turn(uuid, uuid, text) from public, anon, authenticated;

revoke execute on function public._flip7_push_turn() from public, anon, authenticated;

revoke execute on function public._skipbo_push_turn() from public, anon, authenticated;

revoke execute on function public._uno_push_turn() from public, anon, authenticated;

revoke execute on function public._push_game_started() from public, anon, authenticated;
