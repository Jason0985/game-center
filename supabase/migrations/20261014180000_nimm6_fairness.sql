-- ===========================================================================
-- Nimm 6: Zeit fürs Nachspielen, Mindestzeit der Rundenübersicht, Kartenprüfung
-- ===========================================================================

-- Die Uhr eines Zuges (waiting_since) startet, sobald der vorige Zug angelegt ist. Die
-- Clients spielen das Anlegen aber erst nach (Aufdecken, Karten fliegen, Reihen werden
-- genommen) und lassen solange niemanden wählen. Überspringen und die nächste Runde
-- zählen deshalb erst ab dem Ende dieses Nachspielens.
--
-- replay_ms wird mit waiting_since gesetzt (aus last_events in diesem Moment), weil
-- nimm6_choose die last_events danach überschreibt.

alter table public.nimm6_games
  add column if not exists replay_ms integer not null default 0;

-- Dauer des Nachspielens wie im Client (nimm6.model.ts: REVEAL_MS, PLACE_MS, TAKE_MS)
create or replace function public._nimm6_replay_ms(p_events jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(case e ->> 't'
                        when 'reveal' then 1800
                        when 'place' then 1000
                        when 'six' then 4300
                        when 'take' then 4300
                        else 0 end), 0)::integer
  from jsonb_array_elements(p_events) as e;
$$;

revoke execute on function public._nimm6_replay_ms(jsonb) from public, anon, authenticated;

-- Wie in 20261014120000_nimm6.sql, plus replay_ms = 0 (nach dem Austeilen gibt es nichts
-- nachzuspielen)
create or replace function public._nimm6_deal(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  deck smallint[];
  v_seat smallint;
  i integer := 0;
begin
  select array_agg(n::smallint order by gen_random_uuid()) into deck
  from generate_series(1, 104) as n;

  for v_seat in
    select seat from public.nimm6_players
    where game_id = p_game_id and state = 'active' order by seat
  loop
    update public.nimm6_hands
    set cards = (select array_agg(c order by c) from unnest(deck[i * 10 + 1:i * 10 + 10]) as c),
        chosen = null
    where game_id = p_game_id and seat = v_seat;
    i := i + 1;
  end loop;

  update public.nimm6_players set ready = false, round_bulls = 0 where game_id = p_game_id;
  update public.nimm6_games
  set phase = 'choose', turn_no = 1, revealed = '[]', resolve_at = 0, take_seat = null,
      waiting_since = now(), replay_ms = 0,
      card_rows = (select jsonb_agg(jsonb_build_array(c) order by c)
              from unnest(deck[i * 10 + 1:i * 10 + 4]) as c)
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object(
    't', 'deal', 'round', (select round_no from public.nimm6_games where id = p_game_id)));
end;
$$;

-- Wie in 20261014120000_nimm6.sql, plus replay_ms
create or replace function public._nimm6_end_round(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
begin
  select * into game from public.nimm6_games where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'round_end', 'round', game.round_no));

  if exists (select 1 from public.nimm6_players
             where game_id = p_game_id and state = 'active' and score >= game.end_score) then
    update public.nimm6_games
    set status = 'finished', phase = 'round_over', take_seat = null, waiting_since = null
    where id = p_game_id;
  else
    update public.nimm6_games
    set phase = 'round_over', take_seat = null, waiting_since = now(),
        replay_ms = public._nimm6_replay_ms(last_events)
    where id = p_game_id;
  end if;
end;
$$;

-- Wie in 20261014120000_nimm6.sql, plus replay_ms bei jeder neuen Wartesituation
create or replace function public._nimm6_resolve(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
  v_seat smallint;
  v_card integer;
  target integer;
  best integer;
  last_card integer;
  i integer;
begin
  loop
    select * into game from public.nimm6_games where id = p_game_id;
    exit when game.resolve_at >= jsonb_array_length(game.revealed);

    v_seat := (game.revealed -> game.resolve_at ->> 's')::smallint;
    v_card := (game.revealed -> game.resolve_at ->> 'c')::integer;

    target := null;
    best := -1;
    for i in 0 .. jsonb_array_length(game.card_rows) - 1 loop
      last_card := (game.card_rows -> i ->> -1)::integer;
      if last_card < v_card and last_card > best then
        best := last_card;
        target := i;
      end if;
    end loop;

    if target is null then
      if exists (select 1 from public.nimm6_players
                 where game_id = p_game_id and seat = v_seat and state = 'active') then
        update public.nimm6_games
        set phase = 'take', take_seat = v_seat, waiting_since = now(),
            replay_ms = public._nimm6_replay_ms(last_events)
        where id = p_game_id;
        return;
      end if;
      perform public._nimm6_take(p_game_id, v_seat, public._nimm6_cheapest_row(p_game_id), v_card, 'take');
    elsif jsonb_array_length(game.card_rows -> target) >= 5 then
      perform public._nimm6_take(p_game_id, v_seat, target, v_card, 'six');
    else
      update public.nimm6_games
      set card_rows = jsonb_set(card_rows, array[target::text], (card_rows -> target) || to_jsonb(v_card))
      where id = p_game_id;
      perform public._nimm6_log(p_game_id, jsonb_build_object(
        't', 'place', 'seat', v_seat, 'card', v_card, 'row', target));
    end if;

    update public.nimm6_games set resolve_at = resolve_at + 1 where id = p_game_id;
  end loop;

  update public.nimm6_games set take_seat = null where id = p_game_id;

  if game.turn_no >= 10
     or not exists (select 1 from public.nimm6_hands h
                    join public.nimm6_players p on p.game_id = h.game_id and p.seat = h.seat
                    where h.game_id = p_game_id and p.state = 'active' and cardinality(h.cards) > 0) then
    perform public._nimm6_end_round(p_game_id);
  else
    update public.nimm6_games
    set phase = 'choose', turn_no = turn_no + 1, waiting_since = now(),
        replay_ms = public._nimm6_replay_ms(last_events)
    where id = p_game_id;
  end if;
end;
$$;

-- Wie in 20261014120000_nimm6.sql, plus Prüfung der Karte vor dem Cast (sonst Überlauf-
-- Fehler statt verständlicher Meldung)
create or replace function public.nimm6_choose(p_game_id uuid, p_waiting_since timestamptz, p_card integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
  my_seat smallint;
  hand public.nimm6_hands;
begin
  game := public._nimm6_lock(p_game_id);
  my_seat := public._nimm6_my_seat(p_game_id);

  if game.status <> 'playing' or game.phase <> 'choose'
     or game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  select * into hand from public.nimm6_hands where game_id = p_game_id and seat = my_seat;
  if hand.chosen is not null then
    return;
  end if;

  if p_card is null or p_card not between 1 and 104
     or not (p_card::smallint = any (hand.cards)) then
    raise exception 'Diese Karte hast du nicht.';
  end if;

  update public.nimm6_hands set chosen = p_card where game_id = p_game_id and seat = my_seat;
  update public.nimm6_players set ready = true where game_id = p_game_id and seat = my_seat;
  -- Nur fürs Anzeigen (Rücken am Platz), nicht im Verlauf
  update public.nimm6_games
  set last_events = jsonb_build_array(jsonb_build_object('t', 'ready', 'seat', my_seat))
  where id = p_game_id;

  perform public._nimm6_reveal_if_ready(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Wie in 20261014120000_nimm6.sql; die Wartezeit zählt erst nach dem Nachspielen
-- (Client: 30 s danach, 25 s lassen Luft für Verzögerung)
create or replace function public.nimm6_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
  v_seat smallint;
begin
  game := public._nimm6_lock(p_game_id);

  if not public._nimm6_is_host(p_game_id) then
    perform public._nimm6_my_seat(p_game_id);
  end if;

  -- Inzwischen ist es weitergegangen: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since
     or game.status <> 'playing' or game.phase not in ('choose', 'take') then
    return;
  end if;

  if game.waiting_since > now() - interval '25 seconds'
                              - make_interval(secs => game.replay_ms / 1000.0) then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.nimm6_games set last_events = '[]' where id = p_game_id;

  if game.phase = 'choose' then
    for v_seat in
      select p.seat from public.nimm6_players p
      where p.game_id = p_game_id and p.state = 'active' and not p.ready
      order by p.seat
    loop
      update public.nimm6_hands
      set chosen = cards[1 + floor(random() * cardinality(cards))::integer]
      where game_id = p_game_id and seat = v_seat and cardinality(cards) > 0;
      update public.nimm6_players set ready = true where game_id = p_game_id and seat = v_seat;
      perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', v_seat));
    end loop;
    perform public._nimm6_reveal_if_ready(p_game_id);
  else
    perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.take_seat));
    perform public._nimm6_take(p_game_id, game.take_seat, public._nimm6_cheapest_row(p_game_id),
                               (game.revealed -> game.resolve_at ->> 'c')::integer, 'take');
    update public.nimm6_games set resolve_at = resolve_at + 1 where id = p_game_id;
    perform public._nimm6_resolve(p_game_id);
  end if;

  perform public._game_tick(game.lobby_id);
end;
$$;

-- Wie in 20261014120000_nimm6.sql; die Rundenübersicht steht nach dem Nachspielen
-- mindestens 4 s (Client: Knopf erst nach Pause und 3 s, die Uhr nach NIMM6_NEXT_ROUND_S)
create or replace function public.nimm6_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
begin
  game := public._nimm6_lock(p_game_id);
  perform public._nimm6_my_seat(p_game_id);

  if game.status <> 'playing' or game.phase <> 'round_over'
     or game.round_no is distinct from p_round_no then
    return;
  end if;

  if game.waiting_since > now() - make_interval(secs => (game.replay_ms + 4000) / 1000.0) then
    raise exception 'Die Rundenübersicht läuft noch.';
  end if;

  update public.nimm6_games set last_events = '[]', round_no = round_no + 1 where id = p_game_id;
  perform public._nimm6_deal(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;
