-- ===========================================================================
-- Skyjo
-- ===========================================================================

-- Skyjo als siebtes Lobby-Spiel: 2–8 Spieler, 150 Karten (−2: 5×, −1: 10×, 0: 15×,
-- 1–12: je 10×). Jeder hat 12 verdeckte Karten im Raster (3 Reihen × 4 Spalten,
-- zeilenweise gezählt, Zelle 0–11, Spalte = Zelle % 4) und deckt zum Rundenstart 2 auf;
-- wer dann die höchste Summe zeigt, beginnt. Am Zug: vom Stapel oder der Ablage ziehen,
-- dann gegen eine eigene Karte tauschen (die alte geht offen auf die Ablage) oder – nur
-- vom Stapel – abwerfen und eine verdeckte Karte aufdecken. Drei gleiche offene Karten
-- in einer Spalte gehen auf die Ablage (abschaltbar). Hat jemand alles offen, hat jeder
-- andere noch einen Zug; dann wird alles aufgedeckt und gezählt. Der Rundenbeender zählt
-- doppelt, wenn er positiv ist und nicht allein am wenigsten hat (abschaltbar). Erreicht
-- jemand das Spielende (50/100/150), gewinnt, wer die wenigsten Punkte hat.
--
-- Wie Nimm 6: alle Züge über die security-definer-Funktionen unten, Clients lesen Spiel
-- und Spieler; jede öffentliche Funktion erhöht game_ticks genau einmal am Ende.
--
-- Geheim: die wahren Werte aller Karten (skyjo_hands) und der Stapel (skyjo_decks), ohne
-- jede Policy – auch der Besitzer kennt seine verdeckten Karten nicht. Öffentlich sind nur
-- die offenen Karten (skyjo_players.cards), die Ablage und die gezogene Karte.

-- ===========================================================================
-- Skyjo: schema
-- ===========================================================================

create table if not exists public.skyjo_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- reveal: alle decken 2 Karten auf; turn: turn_seat ist am Zug; round_over: Runde
  -- vorbei, die nächste startet per skyjo_next_round
  phase text not null default 'reveal' check (phase in ('reveal', 'turn', 'round_over')),
  -- Im Zug: draw (ziehen), place (gezogene Karte tauschen bzw. abwerfen), flip (nach dem
  -- Abwerfen eine Karte aufdecken)
  step text check (step in ('draw', 'place', 'flip')),
  seat_count smallint not null check (seat_count between 2 and 8),
  end_score smallint not null default 100 check (end_score in (50, 100, 150)),
  clear_columns boolean not null default true,
  double_ender boolean not null default true,
  round_no integer not null default 1,
  turn_seat smallint,
  -- Gezogene Karte (für alle sichtbar) und woher
  drawn smallint,
  drawn_from text check (drawn_from in ('pile', 'discard')),
  -- Ablage, oberste zuletzt (alle Karten darauf sind offen)
  discard smallint[] not null default '{}',
  deck_count smallint not null default 0,
  -- Hat als Erster alles aufgedeckt; last_turns: wer danach noch einen Zug hat
  ender_seat smallint,
  last_turns smallint[] not null default '{}',
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jedem Zug, beim Rundenstart und am Rundenende
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie nimm6_players
create table if not exists public.skyjo_players (
  game_id uuid not null references public.skyjo_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active' check (state in ('active', 'left')),
  -- Offene Karten des Rasters (Zelle 0–11 an Index 1–12); null = verdeckt bzw. abgeräumt
  cards smallint[] not null default array_fill(null::smallint, array[12]),
  -- Abgeräumte Spalten 0–3 (Index 1–4)
  cleared boolean[] not null default array[false, false, false, false],
  -- Beim Rundenstart schon aufgedeckt (bis 2)
  flips smallint not null default 0,
  -- Punkte aus abgeschlossenen Runden; letzte Runde roh und gewertet (null: keine)
  score integer not null default 0,
  round_raw integer,
  round_score integer,
  -- Für den Endstand
  columns integer not null default 0,
  doubled integer not null default 0,
  best_round integer,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: die wahren Werte aller 12 Karten je Platz
create table if not exists public.skyjo_hands (
  game_id uuid not null references public.skyjo_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  cards smallint[] not null default '{}',
  primary key (game_id, seat)
);

-- Geheim: der Stapel, oberste Karte zuerst
create table if not exists public.skyjo_decks (
  game_id uuid primary key references public.skyjo_games(id) on delete cascade,
  cards smallint[] not null default '{}'
);

-- ===========================================================================
-- Skyjo: row level security and privileges
-- ===========================================================================

alter table public.skyjo_games enable row level security;

alter table public.skyjo_players enable row level security;

alter table public.skyjo_hands enable row level security;

alter table public.skyjo_decks enable row level security;

drop policy if exists "Multiplayer users can read skyjo games" on public.skyjo_games;
create policy "Multiplayer users can read skyjo games"
  on public.skyjo_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read skyjo players" on public.skyjo_players;
create policy "Multiplayer users can read skyjo players"
  on public.skyjo_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Guests only see their skyjo game" on public.skyjo_games;
create policy "Guests only see their skyjo game"
  on public.skyjo_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their skyjo players" on public.skyjo_players;
create policy "Guests only see their skyjo players"
  on public.skyjo_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.skyjo_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

revoke all on public.skyjo_games, public.skyjo_players, public.skyjo_hands, public.skyjo_decks
  from anon;

revoke all on public.skyjo_hands, public.skyjo_decks from authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.skyjo_games, public.skyjo_players from authenticated;

grant select on public.skyjo_games, public.skyjo_players to authenticated;

-- Skyjo in Lobby und Statistik zulassen
alter table public.multiplayer_lobbies
  drop constraint if exists multiplayer_lobbies_game_key_check,
  add constraint multiplayer_lobbies_game_key_check
    check (game_key is null
           or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack', 'nimm-6', 'skyjo'));

alter table public.game_results
  drop constraint if exists game_results_game_key_check,
  add constraint game_results_game_key_check
    check (game_key in ('flip-7', 'skip-bo', 'uno', 'blackjack', 'nimm-6', 'skyjo'));

-- ===========================================================================
-- Skyjo: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Event-Form: {t, seat?, cell?, card?, ...}. Zusätzlich ins round_log mit Runde und Zeit.
create or replace function public._skyjo_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.skyjo_games
  set last_events = last_events || jsonb_build_array(p_event),
      -- ponytail: Verlauf auf 60 Einträge begrenzt und bei jeder Aktion mitgeladen (wie Uno)
      round_log = (
        select coalesce(jsonb_agg(l.e order by l.i), '[]'::jsonb)
        from jsonb_array_elements(
               round_log || jsonb_build_array(p_event || jsonb_build_object('r', round_no, 'at', now()))
             ) with ordinality as l(e, i)
        where l.i > jsonb_array_length(round_log) - 59
      )
  where id = p_game_id;
$$;

-- Neue Runde: 150 Karten mischen, je aktivem Spieler 12 verdeckt, eine auf die Ablage,
-- der Rest ist der Stapel. Danach decken alle 2 Karten auf (phase reveal).
create or replace function public._skyjo_deal(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  deck smallint[];
  v_seat smallint;
  i integer := 0;
  n integer;
begin
  select array_agg(g.v::smallint order by gen_random_uuid()) into deck
  from generate_series(-2, 12) as g(v),
       generate_series(1, case when g.v = -2 then 5 when g.v = 0 then 15 else 10 end);

  for v_seat in
    select seat from public.skyjo_players
    where game_id = p_game_id and state = 'active' order by seat
  loop
    update public.skyjo_hands
    set cards = deck[i * 12 + 1:i * 12 + 12]
    where game_id = p_game_id and seat = v_seat;
    i := i + 1;
  end loop;
  n := i * 12;

  update public.skyjo_hands h
  set cards = '{}'
  from public.skyjo_players p
  where p.game_id = h.game_id and p.seat = h.seat and h.game_id = p_game_id and p.state = 'left';
  update public.skyjo_players
  set cards = array_fill(null::smallint, array[12]), cleared = array[false, false, false, false],
      flips = 0
  where game_id = p_game_id;

  insert into public.skyjo_decks (game_id, cards)
  values (p_game_id, deck[n + 2:cardinality(deck)])
  on conflict (game_id) do update set cards = excluded.cards;

  update public.skyjo_games
  set phase = 'reveal', step = null, turn_seat = null, drawn = null, drawn_from = null,
      discard = array[deck[n + 1]], deck_count = cardinality(deck) - n - 1,
      ender_seat = null, last_turns = '{}', waiting_since = now()
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'deal', 'round', (select round_no from public.skyjo_games where id = p_game_id)));
end;
$$;

-- Verdeckte, nicht abgeräumte Zellen (0–11) eines Platzes
create or replace function public._skyjo_hidden_cells(p_game_id uuid, p_seat smallint)
returns integer[]
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(array_agg(i - 1 order by i), '{}')
  from public.skyjo_players p, generate_subscripts(p.cards, 1) as i
  where p.game_id = p_game_id and p.seat = p_seat
    and p.cards[i] is null and not p.cleared[(i - 1) % 4 + 1];
$$;

-- Zelle aufdecken: der wahre Wert wird öffentlich
create or replace function public._skyjo_reveal(p_game_id uuid, p_seat smallint, p_cell integer)
returns smallint
language plpgsql
security definer set search_path = ''
as $$
declare
  v smallint;
begin
  select cards[p_cell + 1] into v
  from public.skyjo_hands where game_id = p_game_id and seat = p_seat;
  update public.skyjo_players set cards[p_cell + 1] = v
  where game_id = p_game_id and seat = p_seat;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'flip', 'seat', p_seat, 'cell', p_cell, 'card', v));
  return v;
end;
$$;

-- Drei gleiche offene Karten in der Spalte von p_cell: Spalte abräumen, die drei Karten
-- auf die Ablage (wenn die Regel an ist)
create or replace function public._skyjo_check_column(p_game_id uuid, p_seat smallint, p_cell integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  col integer := p_cell % 4;
  player public.skyjo_players;
  v_cards smallint[];
  v_cleared boolean[];
  v smallint;
begin
  if not (select clear_columns from public.skyjo_games where id = p_game_id) then
    return;
  end if;

  select * into player from public.skyjo_players where game_id = p_game_id and seat = p_seat;
  v := player.cards[col + 1];
  if player.cleared[col + 1] or v is null
     or player.cards[col + 5] is distinct from v or player.cards[col + 9] is distinct from v then
    return;
  end if;

  v_cards := player.cards;
  v_cards[col + 1] := null;
  v_cards[col + 5] := null;
  v_cards[col + 9] := null;
  v_cleared := player.cleared;
  v_cleared[col + 1] := true;
  update public.skyjo_players
  set cards = v_cards, cleared = v_cleared, columns = columns + 1
  where game_id = p_game_id and seat = p_seat;
  update public.skyjo_games set discard = discard || array[v, v, v] where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'clear', 'seat', p_seat, 'col', col, 'card', v, 'n', 3 * v));
end;
$$;

-- Oberste Karte vom Stapel; ist er leer, wird die Ablage ohne ihre oberste Karte neu gemischt
create or replace function public._skyjo_take_from_deck(p_game_id uuid)
returns smallint
language plpgsql
security definer set search_path = ''
as $$
declare
  deck smallint[];
  pile smallint[];
begin
  select cards into deck from public.skyjo_decks where game_id = p_game_id for update;

  if cardinality(deck) = 0 then
    select discard into pile from public.skyjo_games where id = p_game_id;
    if cardinality(pile) <= 1 then
      raise exception 'Es gibt keine Karten mehr zum Ziehen.';
    end if;
    select array_agg(c order by gen_random_uuid()) into deck
    from unnest(pile[1:cardinality(pile) - 1]) as c;
    update public.skyjo_games set discard = array[pile[cardinality(pile)]] where id = p_game_id;
    perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'shuffle', 'n', cardinality(deck)));
  end if;

  update public.skyjo_decks set cards = deck[2:cardinality(deck)] where game_id = p_game_id;
  update public.skyjo_games set deck_count = cardinality(deck) - 1 where id = p_game_id;
  return deck[1];
end;
$$;

-- Runde vorbei: alles aufdecken, roh zählen, ggf. den Rundenbeender verdoppeln, Punkte
-- gutschreiben. Hat jemand das Spielende erreicht, endet das Spiel, sonst Rundenübersicht.
create or replace function public._skyjo_end_round(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  r record;
  ender_raw integer;
  v_double boolean;
begin
  select * into game from public.skyjo_games where id = p_game_id;

  for r in
    select p.seat, p.cleared, h.cards
    from public.skyjo_players p
    join public.skyjo_hands h on h.game_id = p.game_id and h.seat = p.seat
    where p.game_id = p_game_id and p.state = 'active'
  loop
    update public.skyjo_players
    set cards = (select array_agg(case when r.cleared[(i - 1) % 4 + 1] then null else r.cards[i] end
                                  order by i)
                 from generate_subscripts(r.cards, 1) as i),
        round_raw = (select coalesce(sum(r.cards[i]), 0)
                     from generate_subscripts(r.cards, 1) as i
                     where not r.cleared[(i - 1) % 4 + 1])
    where game_id = p_game_id and seat = r.seat;
  end loop;

  select round_raw into ender_raw
  from public.skyjo_players
  where game_id = p_game_id and seat = game.ender_seat and state = 'active';
  v_double := game.double_ender and ender_raw is not null and ender_raw > 0
    and exists (select 1 from public.skyjo_players
                where game_id = p_game_id and state = 'active' and seat <> game.ender_seat
                  and round_raw <= ender_raw);

  update public.skyjo_players
  set round_score = case when v_double and seat = game.ender_seat then round_raw * 2 else round_raw end,
      doubled = doubled + (case when v_double and seat = game.ender_seat then 1 else 0 end)
  where game_id = p_game_id and state = 'active';
  update public.skyjo_players
  set score = score + round_score,
      best_round = least(coalesce(best_round, round_score), round_score)
  where game_id = p_game_id and state = 'active';
  update public.skyjo_players set round_raw = null, round_score = null
  where game_id = p_game_id and state = 'left';

  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'round_end', 'round', game.round_no, 'seat', game.ender_seat, 'doubled', v_double));

  if exists (select 1 from public.skyjo_players
             where game_id = p_game_id and state = 'active' and score >= game.end_score) then
    update public.skyjo_games
    set status = 'finished', phase = 'round_over', step = null, turn_seat = null,
        drawn = null, drawn_from = null, waiting_since = null
    where id = p_game_id;
  else
    update public.skyjo_games
    set phase = 'round_over', step = null, turn_seat = null, drawn = null, drawn_from = null,
        waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- Haben alle aktiven Spieler 2 Karten aufgedeckt: wer die höchste Summe zeigt, beginnt
-- (bei Gleichstand der frühere Platz).
create or replace function public._skyjo_reveal_done(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_seat smallint;
  v_total integer;
begin
  if exists (select 1 from public.skyjo_players
             where game_id = p_game_id and state = 'active' and flips < 2) then
    return;
  end if;

  select p.seat, (select coalesce(sum(c), 0) from unnest(p.cards) as c)
  into v_seat, v_total
  from public.skyjo_players p
  where p.game_id = p_game_id and p.state = 'active'
  order by 2 desc, p.seat
  limit 1;

  if v_seat is null then
    return;
  end if;

  update public.skyjo_games
  set phase = 'turn', step = 'draw', turn_seat = v_seat, waiting_since = now()
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'start', 'seat', v_seat, 'n', v_total));
end;
$$;

-- Zug von turn_seat ist fertig: Hat er jetzt alles offen, beginnt die letzte Runde (jeder
-- andere noch einen Zug). Danach der Nächste reihum bzw. Rundenende.
create or replace function public._skyjo_end_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  v_state text;
  v_next smallint;
begin
  select * into game from public.skyjo_games where id = p_game_id;
  select state into v_state
  from public.skyjo_players where game_id = p_game_id and seat = game.turn_seat;

  if game.ender_seat is null then
    if v_state = 'active' and cardinality(public._skyjo_hidden_cells(p_game_id, game.turn_seat)) = 0 then
      update public.skyjo_games
      set ender_seat = game.turn_seat,
          last_turns = (select coalesce(array_agg(p.seat order by (p.seat - game.turn_seat + game.seat_count) % game.seat_count), '{}')
                        from public.skyjo_players p
                        where p.game_id = p_game_id and p.state = 'active' and p.seat <> game.turn_seat)
      where id = p_game_id;
      perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'last', 'seat', game.turn_seat));
    end if;
  else
    update public.skyjo_games set last_turns = array_remove(last_turns, game.turn_seat)
    where id = p_game_id;
  end if;

  select * into game from public.skyjo_games where id = p_game_id;
  if game.ender_seat is not null and cardinality(game.last_turns) = 0 then
    perform public._skyjo_end_round(p_game_id);
    return;
  end if;

  select p.seat into v_next
  from public.skyjo_players p
  where p.game_id = p_game_id and p.state = 'active'
    and (game.ender_seat is null or p.seat = any (game.last_turns))
  order by (p.seat - game.turn_seat - 1 + 2 * game.seat_count) % game.seat_count
  limit 1;

  if v_next is null then
    perform public._skyjo_end_round(p_game_id);
    return;
  end if;

  update public.skyjo_games
  set turn_seat = v_next, step = 'draw', drawn = null, drawn_from = null, waiting_since = now()
  where id = p_game_id;
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst; Regeln aus
-- game_settings. Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._skyjo_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.skyjo_games where lobby_id = p_lobby_id;

  insert into public.skyjo_games (lobby_id, seat_count, end_score, clear_columns, double_ender)
  values (p_lobby_id,
          (select count(*) from public.multiplayer_lobby_members where lobby_id = p_lobby_id),
          coalesce((lobby.game_settings ->> 'endScore')::smallint, 100),
          coalesce((lobby.game_settings ->> 'clearColumns')::boolean, true),
          coalesce((lobby.game_settings ->> 'doubleEnder')::boolean, true))
  returning id into new_game_id;

  insert into public.skyjo_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.skyjo_hands (game_id, seat, user_id)
  select game_id, seat, user_id from public.skyjo_players where game_id = new_game_id;

  perform public._skyjo_deal(new_game_id);

  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist (wie _nimm6_create_game)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie, damit
-- Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück. Ist er am
-- Zug, geht seine gezogene Karte auf die Ablage und der Nächste ist dran.
create or replace function public._skyjo_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  player public.skyjo_players;
begin
  begin
    select * into game from public.skyjo_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.skyjo_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.skyjo_games set last_events = '[]' where id = p_game_id;
    update public.skyjo_players set state = 'left', left_at = now()
    where game_id = p_game_id and seat = player.seat;
    perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status <> 'playing' then
      return;
    end if;

    if (select count(*) from public.skyjo_players
        where game_id = p_game_id and state = 'active') < 2 then
      update public.skyjo_games
      set status = 'finished', step = null, turn_seat = null, drawn = null, drawn_from = null,
          waiting_since = null
      where id = p_game_id;
    elsif game.phase = 'reveal' then
      perform public._skyjo_reveal_done(p_game_id);
    elsif game.phase = 'turn' and game.turn_seat = player.seat then
      if game.drawn is not null then
        update public.skyjo_games
        set discard = discard || game.drawn, drawn = null, drawn_from = null
        where id = p_game_id;
      end if;
      perform public._skyjo_end_turn(p_game_id);
    elsif game.phase = 'turn' and game.ender_seat is not null then
      update public.skyjo_games set last_turns = array_remove(last_turns, player.seat)
      where id = p_game_id;
    end if;
  exception when others then
    raise warning 'Skyjo: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._skyjo_on_member_removed()
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
  from public.skyjo_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._skyjo_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Triggern der anderen Spiele; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_skyjo_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_skyjo_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._skyjo_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._skyjo_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.skyjo_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._skyjo_lock(p_game_id uuid)
returns public.skyjo_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.skyjo_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._skyjo_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.skyjo_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Im Zug: Spiel läuft, Ansicht aktuell und der Aufrufer ist dran. false = veraltete
-- Ansicht (nichts tun); nicht am Zug wirft.
create or replace function public._skyjo_my_turn(
  p_game public.skyjo_games, p_seat smallint, p_waiting_since timestamptz
)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if p_game.status <> 'playing' or p_game.phase <> 'turn'
     or p_game.waiting_since is distinct from p_waiting_since then
    return false;
  end if;
  if p_game.turn_seat is distinct from p_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;
  return true;
end;
$$;

revoke execute on function public._skyjo_log(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public._skyjo_deal(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_hidden_cells(uuid, smallint) from public, anon, authenticated;

revoke execute on function public._skyjo_reveal(uuid, smallint, integer) from public, anon, authenticated;

revoke execute on function public._skyjo_check_column(uuid, smallint, integer)
  from public, anon, authenticated;

revoke execute on function public._skyjo_take_from_deck(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_end_round(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_reveal_done(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_end_turn(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_on_member_removed() from public, anon, authenticated;

revoke execute on function public._skyjo_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_lock(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_is_host(uuid) from public, anon, authenticated;

revoke execute on function public._skyjo_my_turn(public.skyjo_games, smallint, timestamptz)
  from public, anon, authenticated;

-- ===========================================================================
-- Skyjo: öffentliche Funktionen
-- ===========================================================================

-- Karte aufdecken: beim Rundenstart (bis 2 je Spieler, alle gleichzeitig) bzw. im Zug nach
-- dem Abwerfen. Veraltete Ansicht oder schon offen: nichts tun.
create or replace function public.skyjo_flip(p_game_id uuid, p_waiting_since timestamptz, p_cell integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  my_seat smallint;
  player public.skyjo_players;
begin
  game := public._skyjo_lock(p_game_id);
  my_seat := public._skyjo_my_seat(p_game_id);

  if game.status <> 'playing' or game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if p_cell is null or p_cell not between 0 and 11 then
    raise exception 'Diese Karte gibt es nicht.';
  end if;

  select * into player from public.skyjo_players where game_id = p_game_id and seat = my_seat;
  if player.cleared[p_cell % 4 + 1] or player.cards[p_cell + 1] is not null then
    return;
  end if;

  if game.phase = 'reveal' then
    if player.flips >= 2 then
      return;
    end if;
    update public.skyjo_games set last_events = '[]' where id = p_game_id;
    perform public._skyjo_reveal(p_game_id, my_seat, p_cell);
    update public.skyjo_players set flips = flips + 1 where game_id = p_game_id and seat = my_seat;
    perform public._skyjo_reveal_done(p_game_id);
  elsif public._skyjo_my_turn(game, my_seat, p_waiting_since) and game.step = 'flip' then
    update public.skyjo_games set last_events = '[]' where id = p_game_id;
    perform public._skyjo_reveal(p_game_id, my_seat, p_cell);
    perform public._skyjo_check_column(p_game_id, my_seat, p_cell);
    perform public._skyjo_end_turn(p_game_id);
  else
    return;
  end if;

  perform public._game_tick(game.lobby_id);
end;
$$;

-- Karte ziehen: p_source pile (Stapel) oder discard (oberste Ablagekarte).
create or replace function public.skyjo_draw(p_game_id uuid, p_waiting_since timestamptz, p_source text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  my_seat smallint;
  v smallint;
begin
  game := public._skyjo_lock(p_game_id);
  my_seat := public._skyjo_my_seat(p_game_id);

  if not public._skyjo_my_turn(game, my_seat, p_waiting_since) or game.step <> 'draw' then
    return;
  end if;

  update public.skyjo_games set last_events = '[]' where id = p_game_id;
  if p_source = 'pile' then
    v := public._skyjo_take_from_deck(p_game_id);
  elsif p_source = 'discard' then
    if cardinality(game.discard) = 0 then
      raise exception 'Die Ablage ist leer.';
    end if;
    v := game.discard[cardinality(game.discard)];
    update public.skyjo_games set discard = discard[1:cardinality(discard) - 1] where id = p_game_id;
  else
    raise exception 'Diesen Stapel gibt es nicht.';
  end if;

  update public.skyjo_games set drawn = v, drawn_from = p_source, step = 'place' where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'draw', 'seat', my_seat, 'from', p_source, 'card', v));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Gezogene Karte gegen Zelle p_cell tauschen (offen oder verdeckt); die alte Karte geht
-- offen auf die Ablage.
create or replace function public.skyjo_swap(p_game_id uuid, p_waiting_since timestamptz, p_cell integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  my_seat smallint;
  player public.skyjo_players;
  old smallint;
begin
  game := public._skyjo_lock(p_game_id);
  my_seat := public._skyjo_my_seat(p_game_id);

  if not public._skyjo_my_turn(game, my_seat, p_waiting_since) or game.step <> 'place' then
    return;
  end if;

  if p_cell is null or p_cell not between 0 and 11 then
    raise exception 'Diese Karte gibt es nicht.';
  end if;

  select * into player from public.skyjo_players where game_id = p_game_id and seat = my_seat;
  if player.cleared[p_cell % 4 + 1] then
    raise exception 'Diese Spalte ist schon abgeräumt.';
  end if;

  select cards[p_cell + 1] into old
  from public.skyjo_hands where game_id = p_game_id and seat = my_seat;
  update public.skyjo_hands set cards[p_cell + 1] = game.drawn
  where game_id = p_game_id and seat = my_seat;
  update public.skyjo_players set cards[p_cell + 1] = game.drawn
  where game_id = p_game_id and seat = my_seat;
  update public.skyjo_games
  set last_events = '[]', discard = discard || old, drawn = null, drawn_from = null
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'swap', 'seat', my_seat, 'cell', p_cell, 'card', game.drawn, 'old', old,
    'hidden', player.cards[p_cell + 1] is null, 'from', game.drawn_from));

  perform public._skyjo_check_column(p_game_id, my_seat, p_cell);
  perform public._skyjo_end_turn(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Gezogene Stapelkarte abwerfen; danach eine verdeckte Karte aufdecken (skyjo_flip).
create or replace function public.skyjo_discard(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  my_seat smallint;
begin
  game := public._skyjo_lock(p_game_id);
  my_seat := public._skyjo_my_seat(p_game_id);

  if not public._skyjo_my_turn(game, my_seat, p_waiting_since) or game.step <> 'place' then
    return;
  end if;

  if game.drawn_from is distinct from 'pile' then
    raise exception 'Eine Karte von der Ablage musst du tauschen.';
  end if;

  update public.skyjo_games
  set last_events = '[]', discard = discard || game.drawn, drawn = null, drawn_from = null,
      step = 'flip'
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object(
    't', 'discard', 'seat', my_seat, 'card', game.drawn));

  -- Nichts mehr verdeckt (kommt praktisch nicht vor): Zug ist fertig
  if cardinality(public._skyjo_hidden_cells(p_game_id, my_seat)) = 0 then
    perform public._skyjo_end_turn(p_game_id);
  end if;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zeit abgelaufen: beim Rundenstart deckt der Tisch für die Fehlenden zufällig auf; im Zug
-- geht eine gezogene Karte auf die Ablage und eine zufällige verdeckte Karte wird
-- aufgedeckt. Jeder am Tisch (und der Host) darf das auslösen, nur für die Lage, die er
-- gesehen hat, und erst nach einer Weile (Client nach 30 s, 25 s lassen Luft).
create or replace function public.skyjo_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
  r record;
  hidden integer[];
  v_cell integer;
  k integer;
begin
  game := public._skyjo_lock(p_game_id);

  if not public._skyjo_is_host(p_game_id) then
    perform public._skyjo_my_seat(p_game_id);
  end if;

  -- Inzwischen ist es weitergegangen: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since
     or game.status <> 'playing' or game.phase not in ('reveal', 'turn') then
    return;
  end if;

  if game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.skyjo_games set last_events = '[]' where id = p_game_id;

  if game.phase = 'reveal' then
    for r in
      select p.seat, p.flips from public.skyjo_players p
      where p.game_id = p_game_id and p.state = 'active' and p.flips < 2
      order by p.seat
    loop
      perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', r.seat));
      for k in 1 .. 2 - r.flips loop
        hidden := public._skyjo_hidden_cells(p_game_id, r.seat);
        exit when cardinality(hidden) = 0;
        perform public._skyjo_reveal(p_game_id, r.seat,
                                     hidden[1 + floor(random() * cardinality(hidden))::integer]);
      end loop;
      update public.skyjo_players set flips = 2 where game_id = p_game_id and seat = r.seat;
    end loop;
    perform public._skyjo_reveal_done(p_game_id);
  else
    perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
    if game.drawn is not null then
      update public.skyjo_games
      set discard = discard || game.drawn, drawn = null, drawn_from = null
      where id = p_game_id;
    end if;
    hidden := public._skyjo_hidden_cells(p_game_id, game.turn_seat);
    if cardinality(hidden) > 0 then
      v_cell := hidden[1 + floor(random() * cardinality(hidden))::integer];
      perform public._skyjo_reveal(p_game_id, game.turn_seat, v_cell);
      perform public._skyjo_check_column(p_game_id, game.turn_seat, v_cell);
    end if;
    perform public._skyjo_end_turn(p_game_id);
  end if;

  perform public._game_tick(game.lobby_id);
end;
$$;

-- Nächste Runde nach der Rundenübersicht (mindestens 5 s). Jeder am Tisch darf das auslösen
-- (Knopf oder Uhr); p_round_no ist die Runde, die er gesehen hat (Doppeltipp tut nichts).
create or replace function public.skyjo_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
begin
  game := public._skyjo_lock(p_game_id);
  perform public._skyjo_my_seat(p_game_id);

  if game.status <> 'playing' or game.phase <> 'round_over'
     or game.round_no is distinct from p_round_no then
    return;
  end if;

  if game.waiting_since > now() - interval '5 seconds' then
    raise exception 'Die Rundenübersicht läuft noch.';
  end if;

  update public.skyjo_games set last_events = '[]', round_no = round_no + 1 where id = p_game_id;
  perform public._skyjo_deal(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet das Spiel; gewertet werden die abgeschlossenen Runden.
create or replace function public.skyjo_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
begin
  game := public._skyjo_lock(p_game_id);

  if not public._skyjo_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.skyjo_games
  set last_events = '[]', status = 'finished', step = null, turn_seat = null, drawn = null,
      drawn_from = null, waiting_since = null
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie nimm6_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick.
create or replace function public.skyjo_return_to_lobby(p_lobby_id uuid)
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
  from public.skyjo_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.skyjo_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.skyjo_flip(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.skyjo_draw(uuid, timestamptz, text) from public, anon;

revoke execute on function public.skyjo_swap(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.skyjo_discard(uuid, timestamptz) from public, anon;

revoke execute on function public.skyjo_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.skyjo_next_round(uuid, integer) from public, anon;

revoke execute on function public.skyjo_end_game(uuid) from public, anon;

revoke execute on function public.skyjo_return_to_lobby(uuid) from public, anon;

grant execute on function public.skyjo_flip(uuid, timestamptz, integer) to authenticated;

grant execute on function public.skyjo_draw(uuid, timestamptz, text) to authenticated;

grant execute on function public.skyjo_swap(uuid, timestamptz, integer) to authenticated;

grant execute on function public.skyjo_discard(uuid, timestamptz) to authenticated;

grant execute on function public.skyjo_skip(uuid, timestamptz) to authenticated;

grant execute on function public.skyjo_next_round(uuid, integer) to authenticated;

grant execute on function public.skyjo_end_game(uuid) to authenticated;

grant execute on function public.skyjo_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Skyjo: Statistik und Abend-Wertung
-- ===========================================================================

-- Ein Ergebnis je Spieler, Rang nach Punkten (wenigste zuerst). Am Ende allein oder ohne
-- eine abgeschlossene Runde zählt nichts. Ein Fehler hier darf den Zug nie abbrechen.
create or replace function public._skyjo_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (new.round_no <= 1 and new.phase <> 'round_over')
     or (select count(*) from public.skyjo_players
         where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'skyjo', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.score
  from (
    select p.user_id, p.state, p.score,
           rank() over (order by p.state = 'left', p.score) as placement,
           count(*) over () as player_count
    from public.skyjo_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Skyjo: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists skyjo_games_record_result on public.skyjo_games;
create trigger skyjo_games_record_result
after update of status on public.skyjo_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._skyjo_record_result();

revoke execute on function public._skyjo_record_result() from public, anon, authenticated;

-- ===========================================================================
-- Lobby: Skyjo wählen und starten
-- ===========================================================================

-- Wie in 20261014120000_nimm6.sql, plus Skyjo ({} oder genau endScore 50/100/150,
-- clearColumns und doubleEnder als true/false). Rechte bleiben bei create or replace.
create or replace function public.set_lobby_game(p_lobby_id uuid, p_game_key text, p_settings jsonb)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  target jsonb;
  target_score integer;
  stock jsonb;
  money jsonb;
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
  elsif p_game_key in ('monopoly', 'nimm-6') then
    -- Monopoly läuft extern, Nimm 6 hat keine Einstellungen
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
  elsif p_game_key = 'blackjack' then
    if p_settings = '{}'::jsonb then
      settings := '{}'::jsonb;
    else
      money := p_settings -> 'startMoney';
      if (select count(*) from jsonb_object_keys(p_settings)) <> 1
         or jsonb_typeof(money) is distinct from 'number'
         or money::numeric <> trunc(money::numeric)
         or money::numeric not between 100 and 10000
         or money::numeric % 10 <> 0 then
        raise exception 'Ungültige Einstellungen.';
      end if;
      settings := jsonb_build_object('startMoney', money::numeric::integer);
    end if;
  elsif p_game_key = 'skyjo' then
    -- {} = Standard (100, beide Regeln an), sonst genau die drei Werte
    if p_settings = '{}'::jsonb then
      settings := '{}'::jsonb;
    else
      if (select array_agg(k order by k) from jsonb_object_keys(p_settings) as k)
           is distinct from array['clearColumns', 'doubleEnder', 'endScore']
         or jsonb_typeof(p_settings -> 'clearColumns') is distinct from 'boolean'
         or jsonb_typeof(p_settings -> 'doubleEnder') is distinct from 'boolean'
         or jsonb_typeof(p_settings -> 'endScore') is distinct from 'number'
         or (p_settings ->> 'endScore')::numeric not in (50, 100, 150) then
        raise exception 'Ungültige Einstellungen.';
      end if;
      settings := jsonb_build_object(
        'endScore', (p_settings ->> 'endScore')::numeric::integer,
        'clearColumns', (p_settings ->> 'clearColumns')::boolean,
        'doubleEnder', (p_settings ->> 'doubleEnder')::boolean);
    end if;
  else
    raise exception 'Ungültige Einstellungen.';
  end if;

  update public.multiplayer_lobbies
  set game_key = p_game_key,
      game_settings = settings
  where id = p_lobby_id;
end;
$$;

-- Wie in 20261014120000_nimm6.sql, plus Skyjo (2–8 Spieler, Grenze der Lobby).
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

  if lobby.game_key is null then
    raise exception 'Bitte wähle zuerst ein Spiel aus.';
  end if;

  if member_count < (case when lobby.game_key = 'blackjack' then 1 else 2 end) then
    raise exception 'Zum Starten braucht es mindestens 2 Spieler.';
  end if;

  if ready_count < member_count then
    raise exception 'Alle Spieler müssen bereit sein.';
  end if;

  if lobby.game_key = 'monopoly' then
    raise exception 'Monopoly spielt ihr direkt auf richup.io.';
  end if;

  if lobby.game_key = 'skip-bo' and member_count > 6 then
    raise exception 'Skip-Bo geht mit höchstens 6 Spielern.';
  end if;

  if lobby.game_key = 'blackjack' and member_count > 5 then
    raise exception 'Blackjack geht mit höchstens 5 Spielern.';
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
  elsif lobby.game_key = 'blackjack' then
    perform public._blackjack_create_game(p_lobby_id);
  elsif lobby.game_key = 'nimm-6' then
    perform public._nimm6_create_game(p_lobby_id);
  elsif lobby.game_key = 'skyjo' then
    perform public._skyjo_create_game(p_lobby_id);
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;
