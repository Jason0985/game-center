-- Skip-Bo: Der Host stellt ein, mit wie vielen Karten jeder Spielstapel startet (5–50).
-- game_settings {"stockSize": n}; {} (ältere Lobbys, Standard) = 30, ab 5 Spielern 20.
-- 6 × 50 Karten passen nicht in ein Deck (162): dann kommen weitere gemischte Decks dazu,
-- wie beim unbegrenzten Nachziehstapel.

-- Wie in 20261002140000_uno.sql, nur der Skip-Bo-Zweig ist neu.
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

-- Wie in 20261001130000_skipbo.sql, plus Stapelgröße aus den Einstellungen und weitere Decks.
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

revoke execute on function public._skipbo_create_game(uuid) from public, anon, authenticated;
