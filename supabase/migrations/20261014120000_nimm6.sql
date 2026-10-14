-- ===========================================================================
-- Nimm 6
-- ===========================================================================

-- Nimm 6 als sechstes Lobby-Spiel: 2–8 Spieler, Karten 1–104 mit Hornochsen
-- (1; endet auf 5: 2; endet auf 0: 3; Schnapszahl: 5; 55: 7). Je Runde 10 Karten pro
-- Spieler und 4 Reihen. Alle wählen gleichzeitig verdeckt eine Karte; sind alle bereit,
-- werden die Karten aufgedeckt und aufsteigend angelegt: an die Reihe mit dem höchsten
-- Ende unter der Karte. Wäre sie dort die 6. Karte, nimmt der Spieler die 5 Karten und
-- beginnt die Reihe neu. Ist sie kleiner als jedes Reihenende (das kann nur die kleinste
-- aufgedeckte Karte sein), wählt der Spieler eine Reihe, nimmt sie und beginnt sie neu.
-- Nach 10 Zügen endet die Runde; hat dann jemand 66 Hornochsen oder mehr, endet das
-- Spiel, und es gewinnt, wer die wenigsten hat.
--
-- Wie Uno und Blackjack: alle Züge über die security-definer-Funktionen unten, Clients
-- lesen Spiel und Spieler; jede öffentliche Funktion erhöht game_ticks genau einmal am Ende.
--
-- Geheim: Hände samt gewählter Karte (nimm6_hands, RLS nur eigene Zeile). Öffentlich ist
-- nur, wer schon gewählt hat (nimm6_players.ready). Erst beim Aufdecken stehen die
-- gewählten Karten in revealed und im Verlauf.

-- ===========================================================================
-- Nimm 6: schema
-- ===========================================================================

create table if not exists public.nimm6_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- choose: alle wählen eine Karte; take: take_seat wählt eine Reihe; round_over: Runde
  -- vorbei, die nächste startet per nimm6_next_round
  phase text not null default 'choose' check (phase in ('choose', 'take', 'round_over')),
  seat_count smallint not null check (seat_count between 2 and 8),
  end_score smallint not null default 66,
  round_no integer not null default 1,
  -- Zug in der Runde, 1–10
  turn_no smallint not null default 1,
  -- Die 4 Reihen, je ein Array der Karten (älteste zuerst)
  card_rows jsonb not null default '[]' check (jsonb_typeof(card_rows) = 'array'),
  -- Aufgedeckte Karten des letzten Zuges, aufsteigend: [{"s": Sitz, "c": Karte}]
  revealed jsonb not null default '[]' check (jsonb_typeof(revealed) = 'array'),
  -- So viele Karten aus revealed liegen schon
  resolve_at smallint not null default 0,
  -- Wer gerade eine Reihe wählen muss (phase take)
  take_seat smallint,
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jedem Zug, jeder Reihenwahl und am Rundenende
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie uno_players
create table if not exists public.nimm6_players (
  game_id uuid not null references public.nimm6_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active' check (state in ('active', 'left')),
  -- Hornochsen gesamt (inklusive laufender Runde) und in dieser Runde
  score integer not null default 0,
  round_bulls integer not null default 0,
  -- Hat in diesem Zug schon eine Karte gewählt
  ready boolean not null default false,
  -- Für den Endstand
  rows_taken integer not null default 0,
  sixths integer not null default 0,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: jeder sieht nur seine eigene Zeile.
create table if not exists public.nimm6_hands (
  game_id uuid not null references public.nimm6_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  -- Aufsteigend sortiert; die gewählte Karte bleibt bis zum Aufdecken darin
  cards smallint[] not null default '{}',
  chosen smallint,
  primary key (game_id, seat)
);

-- ===========================================================================
-- Nimm 6: row level security and privileges
-- ===========================================================================

alter table public.nimm6_games enable row level security;

alter table public.nimm6_players enable row level security;

alter table public.nimm6_hands enable row level security;

drop policy if exists "Multiplayer users can read nimm6 games" on public.nimm6_games;
create policy "Multiplayer users can read nimm6 games"
  on public.nimm6_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read nimm6 players" on public.nimm6_players;
create policy "Multiplayer users can read nimm6 players"
  on public.nimm6_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Players can read their own nimm6 hand" on public.nimm6_hands;
create policy "Players can read their own nimm6 hand"
  on public.nimm6_hands for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Guests only see their nimm6 game" on public.nimm6_games;
create policy "Guests only see their nimm6 game"
  on public.nimm6_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their nimm6 players" on public.nimm6_players;
create policy "Guests only see their nimm6 players"
  on public.nimm6_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.nimm6_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

revoke all on public.nimm6_games, public.nimm6_players, public.nimm6_hands from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.nimm6_games, public.nimm6_players, public.nimm6_hands from authenticated;

grant select on public.nimm6_games, public.nimm6_players, public.nimm6_hands to authenticated;

-- Nimm 6 in Lobby und Statistik zulassen
alter table public.multiplayer_lobbies
  drop constraint if exists multiplayer_lobbies_game_key_check,
  add constraint multiplayer_lobbies_game_key_check
    check (game_key is null
           or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack', 'nimm-6'));

alter table public.game_results
  drop constraint if exists game_results_game_key_check,
  add constraint game_results_game_key_check
    check (game_key in ('flip-7', 'skip-bo', 'uno', 'blackjack', 'nimm-6'));

-- ===========================================================================
-- Nimm 6: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Hornochsen einer Karte
create or replace function public._nimm6_bulls(p_card integer)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (case when p_card = 55 then 7
               when p_card % 11 = 0 then 5
               when p_card % 10 = 0 then 3
               when p_card % 5 = 0 then 2
               else 1 end)::smallint;
$$;

-- Hornochsen einer Reihe (jsonb-Array von Karten)
create or replace function public._nimm6_row_bulls(p_row jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(public._nimm6_bulls(c::integer)), 0)::integer
  from jsonb_array_elements_text(p_row) as c;
$$;

-- Event-Form: {t, seat?, card?, row?, n?, ...}. Zusätzlich ins round_log mit Runde und Zeit.
create or replace function public._nimm6_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.nimm6_games
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

-- Neue Runde: 104 Karten mischen, je aktivem Spieler 10, dazu 4 Reihen (aufsteigend).
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
      waiting_since = now(),
      card_rows = (select jsonb_agg(jsonb_build_array(c) order by c)
              from unnest(deck[i * 10 + 1:i * 10 + 4]) as c)
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object(
    't', 'deal', 'round', (select round_no from public.nimm6_games where id = p_game_id)));
end;
$$;

-- Reihe p_row nehmen: Hornochsen auf den Spieler, p_card beginnt die Reihe neu.
-- p_kind: take (zu klein, Reihe gewählt) oder six (6. Karte).
create or replace function public._nimm6_take(
  p_game_id uuid, p_seat smallint, p_row integer, p_card integer, p_kind text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_rows jsonb;
  bulls integer;
begin
  select card_rows into v_rows from public.nimm6_games where id = p_game_id;
  bulls := public._nimm6_row_bulls(v_rows -> p_row);

  update public.nimm6_players
  set score = score + bulls, round_bulls = round_bulls + bulls, rows_taken = rows_taken + 1,
      sixths = sixths + (case when p_kind = 'six' then 1 else 0 end)
  where game_id = p_game_id and seat = p_seat;
  update public.nimm6_games
  set card_rows = jsonb_set(card_rows, array[p_row::text], jsonb_build_array(p_card))
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object(
    't', p_kind, 'seat', p_seat, 'card', p_card, 'row', p_row, 'n', bulls,
    'cards', v_rows -> p_row));
end;
$$;

-- Reihe mit den wenigsten Hornochsen (bei Gleichstand die obere): für abgelaufene Zeit
-- und verlassene Spieler
create or replace function public._nimm6_cheapest_row(p_game_id uuid)
returns integer
language sql
stable
security definer set search_path = ''
as $$
  select (r.i - 1)::integer
  from public.nimm6_games g,
       jsonb_array_elements(g.card_rows) with ordinality as r(cards, i)
  where g.id = p_game_id
  order by public._nimm6_row_bulls(r.cards), r.i
  limit 1;
$$;

-- Runde vorbei: hat jemand das Limit erreicht, endet das Spiel, sonst Rundenübersicht.
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
    set phase = 'round_over', take_seat = null, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- Aufgedeckte Karten der Reihe nach anlegen, ab resolve_at. Braucht eine Karte eine
-- Reihenwahl, wartet das Spiel auf take_seat (verlassene Spieler nehmen sofort die
-- billigste Reihe). Danach nächster Zug bzw. Rundenende.
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
        set phase = 'take', take_seat = v_seat, waiting_since = now()
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
    set phase = 'choose', turn_no = turn_no + 1, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- Haben alle aktiven Spieler gewählt: aufdecken (Karten aus den Händen nehmen) und anlegen.
create or replace function public._nimm6_reveal_if_ready(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_revealed jsonb;
begin
  if exists (select 1 from public.nimm6_players
             where game_id = p_game_id and state = 'active' and not ready) then
    return;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('s', h.seat, 'c', h.chosen) order by h.chosen), '[]')
  into v_revealed
  from public.nimm6_hands h
  join public.nimm6_players p on p.game_id = h.game_id and p.seat = h.seat
  where h.game_id = p_game_id and p.state = 'active' and h.chosen is not null;

  if jsonb_array_length(v_revealed) = 0 then
    return;
  end if;

  update public.nimm6_hands
  set cards = array_remove(cards, chosen), chosen = null
  where game_id = p_game_id and chosen is not null;
  update public.nimm6_players set ready = false where game_id = p_game_id;
  update public.nimm6_games
  set revealed = v_revealed, resolve_at = 0, take_seat = null
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'reveal', 'played', v_revealed));
  perform public._nimm6_resolve(p_game_id);
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._nimm6_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.nimm6_games where lobby_id = p_lobby_id;

  insert into public.nimm6_games (lobby_id, seat_count)
  values (p_lobby_id,
          (select count(*) from public.multiplayer_lobby_members where lobby_id = p_lobby_id))
  returning id into new_game_id;

  insert into public.nimm6_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.nimm6_hands (game_id, seat, user_id)
  select game_id, seat, user_id from public.nimm6_players where game_id = new_game_id;

  perform public._nimm6_deal(new_game_id);

  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist (wie _uno_create_game)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie, damit
-- Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück. Seine
-- schon aufgedeckte Karte wird noch angelegt (eine Reihenwahl übernimmt der Server).
create or replace function public._nimm6_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
  player public.nimm6_players;
  v_card integer;
begin
  begin
    select * into game from public.nimm6_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.nimm6_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.nimm6_games set last_events = '[]' where id = p_game_id;
    update public.nimm6_hands set cards = '{}', chosen = null
    where game_id = p_game_id and seat = player.seat;
    update public.nimm6_players set state = 'left', left_at = now(), ready = false
    where game_id = p_game_id and seat = player.seat;
    perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status <> 'playing' then
      return;
    end if;

    if (select count(*) from public.nimm6_players
        where game_id = p_game_id and state = 'active') < 2 then
      update public.nimm6_games
      set status = 'finished', take_seat = null, waiting_since = null
      where id = p_game_id;
    elsif game.phase = 'choose' then
      perform public._nimm6_reveal_if_ready(p_game_id);
    elsif game.phase = 'take' and game.take_seat = player.seat then
      v_card := (game.revealed -> game.resolve_at ->> 'c')::integer;
      perform public._nimm6_take(p_game_id, player.seat, public._nimm6_cheapest_row(p_game_id), v_card, 'take');
      update public.nimm6_games set resolve_at = resolve_at + 1 where id = p_game_id;
      perform public._nimm6_resolve(p_game_id);
    end if;
  exception when others then
    raise warning 'Nimm 6: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._nimm6_on_member_removed()
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
  from public.nimm6_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._nimm6_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Triggern der anderen Spiele; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_nimm6_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_nimm6_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._nimm6_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._nimm6_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.nimm6_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._nimm6_lock(p_game_id uuid)
returns public.nimm6_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.nimm6_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._nimm6_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.nimm6_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

revoke execute on function public._nimm6_bulls(integer) from public, anon, authenticated;

revoke execute on function public._nimm6_row_bulls(jsonb) from public, anon, authenticated;

revoke execute on function public._nimm6_log(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public._nimm6_deal(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_take(uuid, smallint, integer, integer, text)
  from public, anon, authenticated;

revoke execute on function public._nimm6_cheapest_row(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_end_round(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_resolve(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_reveal_if_ready(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_on_member_removed() from public, anon, authenticated;

revoke execute on function public._nimm6_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_lock(uuid) from public, anon, authenticated;

revoke execute on function public._nimm6_is_host(uuid) from public, anon, authenticated;

-- ===========================================================================
-- Nimm 6: öffentliche Funktionen
-- ===========================================================================

-- Karte für diesen Zug wählen (verdeckt). Nimmt das waiting_since, das der Client gesehen
-- hat; veraltete Ansicht oder schon gewählt: nichts tun. Haben alle gewählt, wird
-- aufgedeckt und angelegt.
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

  if p_card is null or not (p_card::smallint = any (hand.cards)) then
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

-- Zu kleine Karte: Reihe p_row (0–3) nehmen, die Karte beginnt sie neu; dann weiter anlegen.
create or replace function public.nimm6_take_row(p_game_id uuid, p_waiting_since timestamptz, p_row integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
  my_seat smallint;
begin
  game := public._nimm6_lock(p_game_id);
  my_seat := public._nimm6_my_seat(p_game_id);

  if game.status <> 'playing' or game.phase <> 'take'
     or game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.take_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if p_row is null or p_row not between 0 and jsonb_array_length(game.card_rows) - 1 then
    raise exception 'Diese Reihe gibt es nicht.';
  end if;

  update public.nimm6_games set last_events = '[]' where id = p_game_id;
  perform public._nimm6_take(p_game_id, my_seat, p_row,
                             (game.revealed -> game.resolve_at ->> 'c')::integer, 'take');
  update public.nimm6_games set resolve_at = resolve_at + 1 where id = p_game_id;
  perform public._nimm6_resolve(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zeit abgelaufen: Wer noch nicht gewählt hat, legt eine zufällige Karte; bei der
-- Reihenwahl nimmt der Spieler die billigste Reihe. Jeder am Tisch (und der Host) darf das
-- auslösen, nur für die Lage, die er gesehen hat, und erst nach einer Weile (Client nach
-- 30 s, 25 s lassen Luft für Verzögerung).
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

  if game.waiting_since > now() - interval '25 seconds' then
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

-- Nächste Runde nach der Rundenübersicht. Jeder am Tisch darf das auslösen (Knopf oder
-- Uhr); p_round_no ist die Runde, die er gesehen hat (Doppeltipp tut nichts).
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

  update public.nimm6_games set last_events = '[]', round_no = round_no + 1 where id = p_game_id;
  perform public._nimm6_deal(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet das Spiel; gewertet wird der Stand bis hierher.
create or replace function public.nimm6_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
begin
  game := public._nimm6_lock(p_game_id);

  if not public._nimm6_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.nimm6_hands set chosen = null where game_id = p_game_id;
  update public.nimm6_players set ready = false where game_id = p_game_id;
  update public.nimm6_games
  set last_events = '[]', status = 'finished', take_seat = null, waiting_since = null
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie uno_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick.
create or replace function public.nimm6_return_to_lobby(p_lobby_id uuid)
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
  from public.nimm6_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.nimm6_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.nimm6_choose(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.nimm6_take_row(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.nimm6_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.nimm6_next_round(uuid, integer) from public, anon;

revoke execute on function public.nimm6_end_game(uuid) from public, anon;

revoke execute on function public.nimm6_return_to_lobby(uuid) from public, anon;

grant execute on function public.nimm6_choose(uuid, timestamptz, integer) to authenticated;

grant execute on function public.nimm6_take_row(uuid, timestamptz, integer) to authenticated;

grant execute on function public.nimm6_skip(uuid, timestamptz) to authenticated;

grant execute on function public.nimm6_next_round(uuid, integer) to authenticated;

grant execute on function public.nimm6_end_game(uuid) to authenticated;

grant execute on function public.nimm6_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Nimm 6: Statistik und Abend-Wertung
-- ===========================================================================

-- Ein Ergebnis je Spieler, Rang nach Hornochsen (wenigste zuerst). Am Ende allein oder ohne
-- eine abgeschlossene Runde zählt nichts. Ein Fehler hier darf den Zug nie abbrechen.
create or replace function public._nimm6_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (new.round_no <= 1 and new.phase <> 'round_over')
     or (select count(*) from public.nimm6_players
         where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'nimm-6', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.score
  from (
    select p.user_id, p.state, p.score,
           rank() over (order by p.state = 'left', p.score) as placement,
           count(*) over () as player_count
    from public.nimm6_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Nimm 6: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists nimm6_games_record_result on public.nimm6_games;
create trigger nimm6_games_record_result
after update of status on public.nimm6_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._nimm6_record_result();

revoke execute on function public._nimm6_record_result() from public, anon, authenticated;

-- ===========================================================================
-- Lobby: Nimm 6 wählen und starten
-- ===========================================================================

-- Wie in 20261010150000_blackjack.sql, plus Nimm 6 (ohne Einstellungen: {}).
-- Rechte bleiben bei create or replace.
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
  else
    raise exception 'Ungültige Einstellungen.';
  end if;

  update public.multiplayer_lobbies
  set game_key = p_game_key,
      game_settings = settings
  where id = p_lobby_id;
end;
$$;

-- Wie in 20261010150000_blackjack.sql, plus Nimm 6 (2–8 Spieler, Grenze der Lobby).
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
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;
