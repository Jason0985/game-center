-- Skip-Bo as second game in the lobby. The host can pick it already, starting
-- only works once the Skip-Bo backend exists (start_lobby refuses it until then).

alter table public.multiplayer_lobbies drop constraint if exists multiplayer_lobbies_game_key_check;
alter table public.multiplayer_lobbies
  add constraint multiplayer_lobbies_game_key_check
  check (game_key is null or game_key in ('flip-7', 'skip-bo'));

-- Same as in 20260930160000_lobby_game_settings.sql, plus Skip-Bo (no settings).
create or replace function public.set_lobby_game(p_lobby_id uuid, p_game_key text, p_settings jsonb)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  target jsonb;
  target_score integer;
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
    -- Stapelgröße ergibt sich aus der Spielerzahl (30, ab 5 Spielern 20)
    if p_settings <> '{}'::jsonb then
      raise exception 'Ungültige Einstellungen.';
    end if;
    settings := '{}'::jsonb;
  else
    raise exception 'Ungültige Einstellungen.';
  end if;

  update public.multiplayer_lobbies
  set game_key = p_game_key,
      game_settings = settings
  where id = p_lobby_id;
end;
$$;

-- Same as in 20260930161000_flip7.sql, plus the Skip-Bo player limit and the
-- lock until its backend exists.
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

  if lobby.game_key = 'skip-bo' then
    if member_count > 6 then
      raise exception 'Skip-Bo geht mit höchstens 6 Spielern.';
    end if;
    -- Kommt mit dem Skip-Bo-Backend: perform public._skipbo_create_game(p_lobby_id)
    raise exception 'Skip-Bo ist noch nicht verfügbar.';
  end if;

  update public.multiplayer_lobbies
  set status = 'started', started_at = now()
  where id = p_lobby_id;

  delete from public.notifications
  where type = 'game_invite' and related_id = p_lobby_id::text;

  perform public._flip7_create_game(p_lobby_id);
end;
$$;

revoke execute on function public.set_lobby_game(uuid, text, jsonb) from public, anon;
revoke execute on function public.start_lobby(uuid) from public, anon;
grant execute on function public.set_lobby_game(uuid, text, jsonb) to authenticated;
grant execute on function public.start_lobby(uuid) to authenticated;
