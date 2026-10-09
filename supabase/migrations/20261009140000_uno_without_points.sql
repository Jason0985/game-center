-- Uno ohne Punkte: Man will nur seine Karten loswerden. Die Restkarten-Wertung
-- (_uno_points, round_points, score) fällt weg; die Statistik speichert stattdessen wie bei
-- Skip-Bo die Karten, die man beim Rundenende noch hatte (Sieger 0), und ordnet danach.

-- Wie in 20261002140000_uno.sql, nur ohne round_points
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
-- Wie in 20261002140000_uno.sql, nur ohne Punkte
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

revoke execute on function public._uno_start_round(uuid) from public, anon, authenticated;
revoke execute on function public._uno_end_round(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._uno_record_result() from public, anon, authenticated;

-- Alte Uno-Ergebnisse hatten Punkte: Sieger hatten 0 Karten, bei den anderen ist die
-- Kartenzahl nicht mehr bekannt
update public.game_results
set score = case when won then 0 end
where game_key = 'uno';

drop function if exists public._uno_points(text[]);
alter table public.uno_players drop column if exists round_points;
alter table public.uno_players drop column if exists score;
