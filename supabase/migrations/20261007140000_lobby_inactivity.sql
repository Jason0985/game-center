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

-- Wie in 20261007120000_guest_players.sql, plus: vor dem Eröffnen alte Lobbys schließen.
-- So wird auch ohne pg_cron regelmäßig aufgeräumt.
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

-- Zeitgesteuert per pg_cron: Lobbys alle 30 Minuten. Die Gäste-Bereinigung aus
-- 20261007120000_guest_players.sql wurde dort nur eingeplant, wenn pg_cron schon aktiv
-- war (hier war es das nicht); gleicher Jobname überschreibt, doppelt einplanen schadet nicht.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-inactive-lobbies', '*/30 * * * *', 'select public.cleanup_inactive_lobbies()'
);
select cron.schedule('cleanup-guest-users', '17 4 * * *', 'select public.cleanup_guest_users()');
