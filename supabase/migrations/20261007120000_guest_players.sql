-- Guest players: people without an account join a lobby with its code and a
-- display name. The client signs them in with Supabase Anonymous Sign-Ins
-- (Dashboard: Authentication > Sign In / Providers > "Allow anonymous sign-ins"
-- must be on). Guests are normal "authenticated" users whose JWT carries
-- is_anonymous = true, so every lobby and game function keeps working through
-- auth.uid(). This file only:
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

-- ===========================================================================
-- Profiles
-- ===========================================================================

-- Not in the column grant (only display_name is updatable), so clients cannot flip it.
alter table public.profiles
  add column if not exists is_guest boolean not null default false;

update public.profiles p
set is_guest = true
from auth.users u
where u.id = p.id and u.is_anonymous and not p.is_guest;

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

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

-- Only accounts can host (and therefore invite friends).
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

-- Daily at 04:17 if pg_cron is enabled (Dashboard: Database > Extensions);
-- otherwise run "select public.cleanup_guest_users();" by hand now and then.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('cleanup-guest-users', '17 4 * * *', 'select public.cleanup_guest_users()');
  end if;
end;
$$;
