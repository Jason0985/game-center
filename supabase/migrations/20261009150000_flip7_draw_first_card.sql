-- Flip 7: Keine automatische Austeil-Phase mehr. Jede Runde beginnt gleich mit dem Zug des
-- Spielers nach dem Geber, jeder zieht seine erste Karte selbst (vorher teilte der Server
-- reihum aus und stoppte nur bei Aktionskarten; das wirkte mal automatisch, mal nicht).
-- Sichern geht erst mit mindestens einer Karte. Der 'deal'-Zweig in _flip7_run wird damit
-- nicht mehr erreicht.

-- Wie in 20260930161000_flip7.sql, nur phase = 'turn' statt 'deal'
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

-- Wie in 20260930161000_flip7.sql, plus: nicht ohne Karte sichern
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
