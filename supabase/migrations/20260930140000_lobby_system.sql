-- Lobby system: lobbies are joined with a code only the host sees, or through
-- an accepted invite. Members mark themselves ready; the host starts once at
-- least half of the (at least 2) members are ready.
-- For now only admins may use multiplayer (can_use_multiplayer). All writes go
-- through the functions below; clients may only read.

-- ===========================================================================
-- Access
-- ===========================================================================

-- Single place to change when multiplayer opens up for more users.
create or replace function public.can_use_multiplayer(p_user_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = p_user_id and 'admin' = any(roles)
  );
$$;

revoke execute on function public.can_use_multiplayer(uuid) from public, anon;
grant execute on function public.can_use_multiplayer(uuid) to authenticated;

-- ===========================================================================
-- Schema
-- ===========================================================================

-- The code moves into its own table that only the host can read.
alter table public.multiplayer_lobbies drop column if exists code;

alter table public.multiplayer_lobbies drop constraint if exists multiplayer_lobbies_status_check;
alter table public.multiplayer_lobbies
  add constraint multiplayer_lobbies_status_check check (status in ('open', 'started')),
  add column if not exists started_at timestamptz;

alter table public.multiplayer_lobby_members
  add column if not exists ready boolean not null default false;

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

-- ===========================================================================
-- Row level security and privileges
-- ===========================================================================

drop policy if exists "Open lobbies are visible" on public.multiplayer_lobbies;
drop policy if exists "Users can create their own lobbies" on public.multiplayer_lobbies;
drop policy if exists "Hosts can update their lobbies" on public.multiplayer_lobbies;
drop policy if exists "Hosts can close their lobbies" on public.multiplayer_lobbies;
drop policy if exists "Lobby members are visible" on public.multiplayer_lobby_members;
drop policy if exists "Users can join open lobbies" on public.multiplayer_lobby_members;
drop policy if exists "Members can leave their lobbies" on public.multiplayer_lobby_members;

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

-- ===========================================================================
-- Lobby functions
-- ===========================================================================

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

-- Needs at least 2 members and ready * 2 >= members (see lobby.model.ts).
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

  select count(*), count(*) filter (where ready) into member_count, ready_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  if member_count < 2 then
    raise exception 'Zum Starten braucht es mindestens 2 Spieler.';
  end if;

  if ready_count * 2 < member_count then
    raise exception 'Mindestens die Hälfte muss bereit sein.';
  end if;

  update public.multiplayer_lobbies
  set status = 'started', started_at = now()
  where id = p_lobby_id;

  delete from public.notifications
  where type = 'game_invite' and related_id = p_lobby_id::text;
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
