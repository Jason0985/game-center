-- Uno als viertes Lobby-Spiel (2–8 Spieler), Runde für Runde am gemeinsamen Tisch.
-- Der Server ist die einzige Instanz für die Regeln: alle Züge laufen über die
-- security-definer-Funktionen unten, Clients lesen nur Spiele, Spieler und ihre
-- eigene Hand.
--
-- Karten: je Farbe R/Y/G/B eine 0, je zwei 1–9, Aussetzen (S), Richtungswechsel (R)
-- und +2; dazu 4 'W' (Farbwahl) und 4 'W+4' = 108 Karten. Codes 'R0', 'YS', 'GR',
-- 'B+2', 'W', 'W+4'. Hausregeln (game_settings): stacking, sevenZero, drawUntilPlayable.
--
-- Geheim: Hände (uno_hands, RLS nur eigene Zeile, inkl. der gerade gezogenen Karte)
-- und Stapel (uno_decks, ohne Policy und ohne Grants). Öffentlich sind nur Zähler
-- und gespielte Karten. round_log/last_events nennen nie gezogene, getauschte oder
-- übrige Handkarten (draw/penalty nur mit n, swap nur mit Sitzen).
--
-- Live: nur game_ticks ist in der Realtime-Publikation (eine Zeile pro Lobby,
-- allgemein für alle Spiele). Jede öffentliche Uno-Funktion und der Trigger beim
-- Verlassen erhöhen den Tick genau einmal am Ende; uno_return_to_lobby ändert nur
-- die Lobby, die Clients ohnehin beobachten. Flip 7 und Skip-Bo können später in
-- eigenen Migrationen auf game_ticks umziehen.

-- ===========================================================================
-- Lobby
-- ===========================================================================

alter table public.multiplayer_lobbies drop constraint if exists multiplayer_lobbies_game_key_check;
alter table public.multiplayer_lobbies
  add constraint multiplayer_lobbies_game_key_check
  check (game_key is null or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno'));

-- Wie in 20261002120000_monopoly_lobby.sql, plus Uno (drei Hausregeln, je true/false).
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
  elsif p_game_key in ('skip-bo', 'monopoly') then
    -- Skip-Bo: Stapelgröße ergibt sich aus der Spielerzahl; Monopoly läuft extern
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

-- ===========================================================================
-- Schema
-- ===========================================================================

-- Eine Zeile pro Lobby mit Spiel, pro Aktion genau einmal erhöht. Clients hören nur
-- hierauf und laden das Spiel dann mit einer Abfrage neu.
create table if not exists public.game_ticks (
  lobby_id uuid primary key references public.multiplayer_lobbies(id) on delete cascade,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.uno_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  -- finished = Runde vorbei (mit Sieger) oder vorzeitig beendet (ohne)
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- Hausregeln, beim Start aus lobby.game_settings kopiert
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  -- Fest ab Start, Sitze 0..seat_count-1 (Host = 0)
  seat_count smallint not null check (seat_count between 2 and 8),
  round_no integer not null default 1,
  -- Runde 1: seat_count - 1, damit Sitz 0 beginnt; danach reihum
  dealer_seat smallint not null,
  -- null, wenn beendet
  turn_seat smallint,
  -- = r im round_log
  turn_no integer not null default 0,
  -- 1 = in Sitzreihenfolge (im Uhrzeigersinn), -1 = umgekehrt
  direction smallint not null default 1 check (direction in (1, -1)),
  -- Aktuelle Farbe (eine Farbwahl setzt sie)
  color text check (color in ('R', 'Y', 'G', 'B')),
  -- Die letzten bis zu 3 gespielten Karten, oberste zuletzt (öffentlich)
  discard_top text[] not null default '{}',
  draw_count smallint not null default 0,
  -- Offene Zieh-Strafe aus +2/+4 für den Spieler am Zug
  pending_draw smallint not null default 0,
  -- Der Spieler am Zug hat eine passende Karte gezogen (spielen oder behalten)
  drew boolean not null default false,
  -- Wer mit einer Karte ohne Uno-Ruf dasteht: die nächste Aktion kostet ihn 2 Karten
  uno_open_seat smallint,
  -- null bei beendetem Spiel: vorzeitig beendet
  winner_seat smallint,
  -- Ereignisse der letzten Aktion, nur für die Anzeige
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  -- Verlauf mit r = turn_no und at, letzte 60 Einträge
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jedem Zugwechsel und nach dem Ziehen einer passenden Karte
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie skipbo_players: beim Löschen des Kontos muss
-- der Trigger die Zeile noch finden, um die Karten zurückzulegen.
create table if not exists public.uno_players (
  game_id uuid not null references public.uno_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active' check (state in ('active', 'left')),
  hand_count smallint not null default 0,
  uno_called boolean not null default false,
  -- Wert der Restkarten (Sieger: Summe der anderen); null während der Runde
  round_points integer,
  -- Über alle Runden
  score integer not null default 0,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: jeder sieht nur seine eigene Zeile.
create table if not exists public.uno_hands (
  game_id uuid not null references public.uno_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  -- Immer sortiert (_uno_sort)
  cards text[] not null default '{}',
  -- Gerade gezogene Karte, die noch gespielt werden darf
  drawn text,
  primary key (game_id, seat)
);

-- Geheim: keine Policy, keine Grants, nicht in der Realtime-Publikation.
create table if not exists public.uno_decks (
  game_id uuid primary key references public.uno_games(id) on delete cascade,
  -- draw_pile[1] ist die nächste Karte
  draw_pile text[] not null default '{}',
  -- Alle gespielten Karten, oberste zuletzt
  discard_pile text[] not null default '{}'
);

-- ===========================================================================
-- Row level security and privileges
-- ===========================================================================

alter table public.game_ticks enable row level security;
alter table public.uno_games enable row level security;
alter table public.uno_players enable row level security;
alter table public.uno_hands enable row level security;
alter table public.uno_decks enable row level security;

drop policy if exists "Multiplayer users can read game ticks" on public.game_ticks;
create policy "Multiplayer users can read game ticks"
  on public.game_ticks for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read uno games" on public.uno_games;
create policy "Multiplayer users can read uno games"
  on public.uno_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read uno players" on public.uno_players;
create policy "Multiplayer users can read uno players"
  on public.uno_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Players can read their own uno hand" on public.uno_hands;
create policy "Players can read their own uno hand"
  on public.uno_hands for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands,
  public.uno_decks from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands from authenticated;
grant select on public.game_ticks, public.uno_games, public.uno_players, public.uno_hands
  to authenticated;
revoke all on public.uno_decks from authenticated;

-- Nur die Ticks gehen live raus. Spiele, Spieler, Hände und Stapel bleiben draußen.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_ticks'
  ) then
    alter publication supabase_realtime add table public.game_ticks;
  end if;
end;
$$;

-- ===========================================================================
-- Engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Das eine Realtime-Event einer Aktion. Immer zuletzt aufrufen.
create or replace function public._game_tick(p_lobby_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.game_ticks as t (lobby_id) values (p_lobby_id)
  on conflict (lobby_id) do update set version = t.version + 1, updated_at = now();
$$;

-- 108 Karten, gemischt.
create or replace function public._uno_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select c || v as card
    from unnest(array['R', 'Y', 'G', 'B']) as c,
         unnest(array['1', '2', '3', '4', '5', '6', '7', '8', '9', 'S', 'R', '+2']) as v,
         generate_series(1, 2)
    union all
    select c || '0' from unnest(array['R', 'Y', 'G', 'B']) as c
    union all
    select w from unnest(array['W', 'W+4']) as w, generate_series(1, 4)
  ) deck;
$$;

-- Feste Handreihenfolge: R, Y, G, B, dann Farbwahl; je Farbe 0–9, S, R, +2.
create or replace function public._uno_sort(p_cards text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(c order by
           array_position(array['R', 'Y', 'G', 'B', 'W'], left(c, 1)),
           array_position(array['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'S', 'R', '+2', '', '+4'],
                          substr(c, 2))), '{}')
  from unnest(p_cards) as c;
$$;

-- Zahlen zählen ihren Wert, Aktionen 20, Farbwahl 50.
create or replace function public._uno_points(p_cards text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(case
           when left(c, 1) = 'W' then 50
           when substr(c, 2) ~ '^[0-9]$' then substr(c, 2)::integer
           else 20
         end), 0)::integer
  from unnest(p_cards) as c;
$$;

-- Passt die Karte? Farbe, Wert/Symbol oder Farbwahl (+4 immer, ohne Prüfung). Mit
-- offener Zieh-Strafe nur Stapeln (Hausregel): auf +2 ein +2 oder +4, auf +4 nur +4.
create or replace function public._uno_fits(p_game public.uno_games, p_card text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_game.pending_draw > 0 then
      coalesce((p_game.settings ->> 'stacking')::boolean, false)
      and (p_card = 'W+4'
           or (substr((p_game.discard_top)[cardinality(p_game.discard_top)], 2) = '+2'
               and left((p_game.discard_top)[cardinality(p_game.discard_top)], 1) <> 'W'
               and substr(p_card, 2) = '+2' and left(p_card, 1) <> 'W'))
    else
      left(p_card, 1) = 'W'
      or left(p_card, 1) = p_game.color
      or substr(p_card, 2) = substr((p_game.discard_top)[cardinality(p_game.discard_top)], 2)
  end;
$$;

-- Event-Form: {t, seat?, ...}. Zusätzlich ins round_log mit Zug und Zeit; ohne
-- p_animate nur dorthin (last_events der letzten Aktion bleibt stehen).
create or replace function public._uno_log(p_game_id uuid, p_event jsonb, p_animate boolean default true)
returns void
language sql
security definer set search_path = ''
as $$
  update public.uno_games
  set last_events = case when p_animate then last_events || jsonb_build_array(p_event) else last_events end,
      -- ponytail: Verlauf auf 60 Einträge begrenzt und bei jeder Aktion mitgeladen;
      -- bei spürbarem Traffic erst beim Öffnen des Verlaufs laden
      round_log = (
        select coalesce(jsonb_agg(l.e order by l.i), '[]'::jsonb)
        from jsonb_array_elements(
               round_log || jsonb_build_array(p_event || jsonb_build_object('r', turn_no, 'at', now()))
             ) with ordinality as l(e, i)
        where l.i > jsonb_array_length(round_log) - 59
      )
  where id = p_game_id;
$$;

-- p_n Karten für einen Sitz. Reicht der Nachziehstapel nicht, kommt die Ablage ohne
-- oberste Karte gemischt darunter. Gibt die gezogenen Karten zurück (weniger, wenn
-- beide Stapel leer sind). Nie loggen, welche Karten es waren.
create or replace function public._uno_draw(p_game_id uuid, p_seat smallint, p_n integer)
returns text[]
language plpgsql
security definer set search_path = ''
as $$
declare
  deck public.uno_decks;
  taken text[];
begin
  select * into deck from public.uno_decks where game_id = p_game_id for update;

  if cardinality(deck.draw_pile) < p_n and cardinality(deck.discard_pile) > 1 then
    deck.draw_pile := deck.draw_pile || array(
      select c from unnest(deck.discard_pile[:cardinality(deck.discard_pile) - 1]) as c
      order by gen_random_uuid());
    deck.discard_pile := deck.discard_pile[cardinality(deck.discard_pile):];
  end if;

  taken := deck.draw_pile[:p_n];
  update public.uno_decks
  set draw_pile = deck.draw_pile[p_n + 1:], discard_pile = deck.discard_pile
  where game_id = p_game_id;

  update public.uno_games
  set draw_count = greatest(cardinality(deck.draw_pile) - p_n, 0)
  where id = p_game_id;

  if cardinality(taken) > 0 then
    update public.uno_hands set cards = public._uno_sort(cards || taken)
    where game_id = p_game_id and seat = p_seat;
    update public.uno_players
    set hand_count = hand_count + cardinality(taken),
        uno_called = uno_called and hand_count + cardinality(taken) <= 1
    where game_id = p_game_id and seat = p_seat;
  end if;
  return taken;
end;
$$;

-- Nächster aktiver Sitz in Spielrichtung, p_steps-mal.
create or replace function public._uno_next_seat(p_game_id uuid, p_from smallint, p_steps integer)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  v_seat smallint := p_from;
begin
  select * into game from public.uno_games where id = p_game_id;
  for i in 1..p_steps loop
    select p.seat into v_seat
    from public.uno_players p
    where p.game_id = p_game_id and p.state = 'active'
    order by ((p.seat - v_seat) * game.direction - 1 + 2 * game.seat_count) % game.seat_count
    limit 1;
  end loop;
  return v_seat;
end;
$$;

-- Zugwechsel um p_steps Plätze; die gezogene Karte darf danach nicht mehr gespielt werden.
create or replace function public._uno_advance(p_game_id uuid, p_steps integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  select * into game from public.uno_games where id = p_game_id;
  update public.uno_games
  set turn_seat = public._uno_next_seat(p_game_id, game.turn_seat, p_steps),
      turn_no = turn_no + 1, waiting_since = now(), drew = false
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id and drawn is not null;
end;
$$;

-- Uno-Fenster schließen: Wer mit einer Karte nicht gerufen hat, zieht 2. Läuft vor
-- jeder Spielaktion (spielen, ziehen, behalten, überspringen), nicht vor uno_call.
create or replace function public._uno_close_window(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_seat smallint;
  taken text[];
begin
  select uno_open_seat into v_seat from public.uno_games where id = p_game_id;
  if v_seat is null then
    return;
  end if;

  update public.uno_games set uno_open_seat = null where id = p_game_id;
  if exists (select 1 from public.uno_players
             where game_id = p_game_id and seat = v_seat and state = 'active' and not uno_called) then
    taken := public._uno_draw(p_game_id, v_seat, 2);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'penalty', 'seat', v_seat, 'n', cardinality(taken)));
  end if;
end;
$$;

-- Neue Runde im selben Spiel: frische 108 Karten, je 7 an alle Aktiven (wer gegangen
-- ist, bekommt nichts), erste Zahlenkarte offen. Geber steht schon in dealer_seat.
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
  set hand_count = 0, uno_called = false, round_points = null
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

-- Runde vorbei: Der Nächste zieht noch eine offene Strafe (zählt mit), dann Wertung.
create or replace function public._uno_end_round(p_game_id uuid, p_winner smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  v_seat smallint;
  taken text[];
  total integer;
begin
  select * into game from public.uno_games where id = p_game_id;

  if game.pending_draw > 0 then
    v_seat := public._uno_next_seat(p_game_id, p_winner, 1);
    taken := public._uno_draw(p_game_id, v_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', v_seat, 'n', cardinality(taken)));
  end if;

  update public.uno_players p
  set round_points = public._uno_points(h.cards)
  from public.uno_hands h
  where p.game_id = p_game_id and h.game_id = p.game_id and h.seat = p.seat
    and p.state = 'active' and p.seat <> p_winner;

  select coalesce(sum(round_points), 0) into total
  from public.uno_players
  where game_id = p_game_id and state = 'active' and seat <> p_winner;

  update public.uno_players
  set round_points = total, score = score + total
  where game_id = p_game_id and seat = p_winner;

  update public.uno_games
  set status = 'finished', winner_seat = p_winner, turn_seat = null, waiting_since = null,
      pending_draw = 0, drew = false, uno_open_seat = null
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'win', 'seat', p_winner, 'points', total));
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._uno_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  player_count integer;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.uno_games where lobby_id = p_lobby_id;

  select count(*) into player_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  -- Geber ist der letzte Sitz, so beginnt der Host (Sitz 0)
  insert into public.uno_games (lobby_id, settings, seat_count, dealer_seat)
  values (p_lobby_id, coalesce(lobby.game_settings, '{}'::jsonb), player_count, player_count - 1)
  returning id into new_game_id;

  insert into public.uno_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.uno_hands (game_id, seat, user_id)
  select game_id, seat, user_id from public.uno_players where game_id = new_game_id;

  perform public._uno_start_round(new_game_id);
  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist: später würde ihr
  -- Fremdschlüssel die Lobby nach dem Spiel sperren (umgekehrt zu uno_return_to_lobby)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie,
-- damit Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück.
create or replace function public._uno_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  player public.uno_players;
  draw_size integer;
begin
  begin
    select * into game from public.uno_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.uno_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.uno_games set last_events = '[]' where id = p_game_id;

    -- Handkarten gemischt unter den Nachziehstapel
    update public.uno_decks
    set draw_pile = draw_pile || array(
      select c from unnest((select cards from public.uno_hands
                            where game_id = p_game_id and seat = player.seat)) as c
      order by gen_random_uuid())
    where game_id = p_game_id
    returning cardinality(draw_pile) into draw_size;

    update public.uno_hands set cards = '{}', drawn = null
    where game_id = p_game_id and seat = player.seat;
    update public.uno_players
    set state = 'left', left_at = now(), hand_count = 0, uno_called = false
    where game_id = p_game_id and seat = player.seat;
    update public.uno_games
    set draw_count = coalesce(draw_size, draw_count),
        uno_open_seat = case when uno_open_seat = player.seat then null else uno_open_seat end
    where id = p_game_id;

    perform public._uno_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status = 'playing' then
      if (select count(*) from public.uno_players
          where game_id = p_game_id and state = 'active') < 2 then
        update public.uno_games
        set status = 'finished', turn_seat = null, waiting_since = null, pending_draw = 0, drew = false
        where id = p_game_id;
      elsif game.turn_seat = player.seat then
        -- Eine offene Strafe verfällt mit dem Spieler
        update public.uno_games set pending_draw = 0 where id = p_game_id;
        perform public._uno_advance(p_game_id, 1);
      end if;
    end if;
  exception when others then
    raise warning 'Uno: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._uno_on_member_removed()
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
  from public.uno_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._uno_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Flip-7- und Skip-Bo-Triggern; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_uno_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_uno_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._uno_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._uno_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.uno_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._uno_lock(p_game_id uuid)
returns public.uno_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.uno_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._uno_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.uno_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Gemeinsame Prüfung der Zug-Aktionen: Stand wie gesehen (sonst null = still
-- ignorieren), ich bin am Zug. Setzt last_events zurück und schließt das Uno-Fenster.
create or replace function public._uno_begin_turn(p_game_id uuid, p_waiting_since timestamptz)
returns public.uno_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
begin
  game := public._uno_lock(p_game_id);
  my_seat := public._uno_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return null;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  update public.uno_games set last_events = '[]' where id = p_game_id;
  perform public._uno_close_window(p_game_id);
  select * into game from public.uno_games where id = p_game_id;
  return game;
end;
$$;

revoke execute on function public._game_tick(uuid) from public, anon, authenticated;
revoke execute on function public._uno_new_deck() from public, anon, authenticated;
revoke execute on function public._uno_sort(text[]) from public, anon, authenticated;
revoke execute on function public._uno_points(text[]) from public, anon, authenticated;
revoke execute on function public._uno_fits(public.uno_games, text) from public, anon, authenticated;
revoke execute on function public._uno_log(uuid, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public._uno_draw(uuid, smallint, integer) from public, anon, authenticated;
revoke execute on function public._uno_next_seat(uuid, smallint, integer) from public, anon, authenticated;
revoke execute on function public._uno_advance(uuid, integer) from public, anon, authenticated;
revoke execute on function public._uno_close_window(uuid) from public, anon, authenticated;
revoke execute on function public._uno_start_round(uuid) from public, anon, authenticated;
revoke execute on function public._uno_end_round(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._uno_create_game(uuid) from public, anon, authenticated;
revoke execute on function public._uno_remove_player(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._uno_on_member_removed() from public, anon, authenticated;
revoke execute on function public._uno_my_seat(uuid) from public, anon, authenticated;
revoke execute on function public._uno_lock(uuid) from public, anon, authenticated;
revoke execute on function public._uno_is_host(uuid) from public, anon, authenticated;
revoke execute on function public._uno_begin_turn(uuid, timestamptz) from public, anon, authenticated;

-- ===========================================================================
-- Spielfunktionen
-- ===========================================================================

-- Wie in 20261002120000_monopoly_lobby.sql, plus Uno (bis 8 = Lobby-Maximum).
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

  if lobby.game_key = 'monopoly' then
    raise exception 'Monopoly spielt ihr direkt auf richup.io.';
  end if;

  if lobby.game_key = 'skip-bo' and member_count > 6 then
    raise exception 'Skip-Bo geht mit höchstens 6 Spielern.';
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
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;

-- Zug-Aktionen nehmen das waiting_since, das der Client gesehen hat. Es ändert sich
-- bei jedem Zugwechsel, so tut ein Doppeltipp oder ein Klick auf eine veraltete
-- Ansicht nichts. Karten werden per Code genannt, nicht per Index.

-- Eine Karte spielen. Farbwahl braucht p_color, eine 7 unter „7 tauscht, 0 dreht“
-- (nicht als letzte Karte) braucht p_target_seat.
create or replace function public.uno_play(
  p_game_id uuid, p_card text, p_color text, p_target_seat smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
  hand public.uno_hands;
  pos integer;
  wild boolean;
  v_value text;
  seven_zero boolean;
  top text[];
  steps integer := 1;
  active_count integer;
  target_cards text[];
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;
  my_seat := game.turn_seat;

  select * into hand from public.uno_hands where game_id = p_game_id and seat = my_seat;
  pos := array_position(hand.cards, p_card);
  if pos is null then
    raise exception 'Diese Karte hast du nicht.';
  end if;

  if game.drew and p_card is distinct from hand.drawn then
    raise exception 'Nach dem Ziehen darfst du nur die gezogene Karte spielen.';
  end if;

  if not public._uno_fits(game, p_card) then
    raise exception 'Diese Karte passt nicht.';
  end if;

  wild := left(p_card, 1) = 'W';
  v_value := substr(p_card, 2);
  if wild and (p_color is null or p_color not in ('R', 'Y', 'G', 'B')) then
    raise exception 'Bitte wähle eine Farbe.';
  end if;

  -- Als letzte Karte wirken 7 und 0 nicht
  seven_zero := coalesce((game.settings ->> 'sevenZero')::boolean, false)
                and cardinality(hand.cards) > 1 and not wild;
  if seven_zero and v_value = '7'
     and (p_target_seat is null or p_target_seat = my_seat
          or not exists (select 1 from public.uno_players
                         where game_id = p_game_id and seat = p_target_seat and state = 'active')) then
    raise exception 'Bitte wähle, mit wem du tauschst.';
  end if;

  update public.uno_hands set cards = cards[:pos - 1] || cards[pos + 1:], drawn = null
  where game_id = p_game_id and seat = my_seat;
  update public.uno_players set hand_count = hand_count - 1
  where game_id = p_game_id and seat = my_seat;
  update public.uno_decks set discard_pile = discard_pile || p_card where game_id = p_game_id;

  top := game.discard_top || p_card;
  update public.uno_games
  set discard_top = top[greatest(cardinality(top) - 2, 1):],
      color = case when wild then p_color else left(p_card, 1) end,
      drew = false,
      pending_draw = pending_draw + case v_value when '+2' then 2 when '+4' then 4 else 0 end
  where id = p_game_id;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'play', 'seat', my_seat, 'card', p_card));
  if wild then
    perform public._uno_log(p_game_id, jsonb_build_object('t', 'color', 'seat', my_seat, 'color', p_color));
  end if;

  -- Letzte Karte: Runde vorbei (eine offene +2/+4 zieht der Nächste noch)
  if cardinality(hand.cards) = 1 then
    perform public._uno_end_round(p_game_id, my_seat);
    perform public._game_tick(game.lobby_id);
    return;
  end if;

  if seven_zero and v_value = '7' then
    -- Hände tauschen; welche Karten, bleibt geheim
    select cards into target_cards from public.uno_hands where game_id = p_game_id and seat = p_target_seat;
    update public.uno_hands h
    set cards = case when h.seat = my_seat then target_cards else mine.cards end
    from (select cards from public.uno_hands where game_id = p_game_id and seat = my_seat) as mine
    where h.game_id = p_game_id and h.seat in (my_seat, p_target_seat);
    update public.uno_players p
    set hand_count = cardinality(h.cards), uno_called = false
    from public.uno_hands h
    where p.game_id = p_game_id and h.game_id = p.game_id and h.seat = p.seat
      and p.seat in (my_seat, p_target_seat);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'swap', 'seat', my_seat, 'target', p_target_seat));
  elsif seven_zero and v_value = '0' then
    -- Alle Hände wandern einen Platz in Spielrichtung (Unterabfrage liest den alten Stand)
    update public.uno_hands h
    set cards = src.cards
    from (
      select public._uno_next_seat(p_game_id, x.seat, 1) as dest, x.cards
      from public.uno_hands x
      join public.uno_players p on p.game_id = x.game_id and p.seat = x.seat
      where x.game_id = p_game_id and p.state = 'active'
    ) as src
    where h.game_id = p_game_id and h.seat = src.dest;
    update public.uno_players p
    set hand_count = cardinality(h.cards), uno_called = false
    from public.uno_hands h
    where p.game_id = p_game_id and h.game_id = p.game_id and h.seat = p.seat and p.state = 'active';
    perform public._uno_log(p_game_id, jsonb_build_object('t', 'rotate', 'dir', game.direction));
  end if;

  -- Eine Karte ohne Uno-Ruf: Die nächste Aktion (egal von wem) kostet mich 2 Karten
  update public.uno_games
  set uno_open_seat = my_seat
  where id = p_game_id
    and exists (select 1 from public.uno_players
                where game_id = p_game_id and seat = my_seat and hand_count = 1 and not uno_called);

  if v_value = 'S' then
    steps := 2;
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'skipped', 'seat', public._uno_next_seat(p_game_id, my_seat, 1), 'by', my_seat));
  elsif v_value = 'R' then
    update public.uno_games set direction = -direction where id = p_game_id
    returning direction into game.direction;
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'reverse', 'seat', my_seat, 'dir', game.direction));
    -- Zu zweit wirkt der Richtungswechsel wie Aussetzen
    select count(*) into active_count
    from public.uno_players where game_id = p_game_id and state = 'active';
    if active_count = 2 then
      steps := 2;
    end if;
  end if;

  perform public._uno_advance(p_game_id, steps);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Ziehen: mit offener Strafe alles ziehen (Zug endet); sonst 1 Karte (Hausregel: bis
-- eine passt). Passt die letzte gezogene, darf nur sie gespielt oder behalten werden.
create or replace function public.uno_draw(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  my_seat smallint;
  taken text[];
  n integer := 0;
  fits boolean := false;
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;
  my_seat := game.turn_seat;

  if game.pending_draw > 0 then
    taken := public._uno_draw(p_game_id, my_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', my_seat, 'n', cardinality(taken)));
    update public.uno_games set pending_draw = 0 where id = p_game_id;
    perform public._uno_advance(p_game_id, 1);
    perform public._game_tick(game.lobby_id);
    return;
  end if;

  if game.drew then
    raise exception 'Du hast schon gezogen.';
  end if;

  loop
    taken := public._uno_draw(p_game_id, my_seat, 1);
    exit when cardinality(taken) = 0;
    n := n + 1;
    fits := public._uno_fits(game, taken[1]);
    exit when fits or not coalesce((game.settings ->> 'drawUntilPlayable')::boolean, false);
  end loop;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'draw', 'seat', my_seat, 'n', n));

  if fits then
    update public.uno_games set drew = true, waiting_since = now() where id = p_game_id;
    update public.uno_hands set drawn = taken[1] where game_id = p_game_id and seat = my_seat;
  else
    perform public._uno_advance(p_game_id, 1);
  end if;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Gezogene Karte behalten: Zug endet.
create or replace function public.uno_pass(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;

  if not game.drew then
    raise exception 'Du musst zuerst ziehen.';
  end if;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', game.turn_seat));
  perform public._uno_advance(p_game_id, 1);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Uno rufen, sobald man höchstens 2 Karten hat (auch vorab, mitten im eigenen Zug).
-- Ohne waiting_since und ohne es zu ändern: die anderen Tipps bleiben gültig.
create or replace function public.uno_call(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  me public.uno_players;
begin
  game := public._uno_lock(p_game_id);

  select * into me
  from public.uno_players where game_id = p_game_id and seat = public._uno_my_seat(p_game_id);

  if game.status <> 'playing' then
    raise exception 'Die Runde ist schon vorbei.';
  end if;

  -- Doppeltipp: schon gerufen, nichts zu tun
  if me.uno_called then
    return;
  end if;

  if me.hand_count > 2 then
    raise exception 'Uno rufen geht erst bei zwei Karten.';
  end if;

  update public.uno_players set uno_called = true where game_id = p_game_id and seat = me.seat;
  update public.uno_games
  set uno_open_seat = case when uno_open_seat = me.seat then null else uno_open_seat end
  where id = p_game_id;
  -- Nur in den Verlauf: wer die letzte Aktion noch nicht geladen hat, sieht sie sonst nie
  perform public._uno_log(p_game_id, jsonb_build_object('t', 'uno', 'seat', me.seat), false);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host schiebt einen abwesenden Spieler weiter (eine offene Strafe zieht er noch).
-- Nur für die Lage, die der Host gesehen hat, und erst nach einer Weile (Client zeigt
-- den Knopf nach 30 s, 25 s lassen Luft für Verzögerung).
create or replace function public.uno_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
  taken text[];
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann Spieler überspringen.';
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is null then
    raise exception 'Gerade gibt es nichts zu überspringen.';
  end if;

  if game.waiting_since is null or game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.uno_games set last_events = '[]' where id = p_game_id;
  perform public._uno_close_window(p_game_id);
  select * into game from public.uno_games where id = p_game_id;

  if game.pending_draw > 0 then
    taken := public._uno_draw(p_game_id, game.turn_seat, game.pending_draw);
    perform public._uno_log(p_game_id,
      jsonb_build_object('t', 'draw', 'seat', game.turn_seat, 'n', cardinality(taken)));
    update public.uno_games set pending_draw = 0 where id = p_game_id;
  end if;

  perform public._uno_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  perform public._uno_advance(p_game_id, 1);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet die laufende Runde vorzeitig, ohne Sieger und ohne Wertung.
create or replace function public.uno_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.uno_games
  set last_events = '[]', status = 'finished', winner_seat = null, turn_seat = null,
      waiting_since = null, pending_draw = 0, drew = false, uno_open_seat = null
  where id = p_game_id;
  update public.uno_hands set drawn = null where game_id = p_game_id;
  perform public._uno_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host startet die nächste Runde im selben Spiel; der Geber rückt weiter.
-- p_round_no: Runde, die der Host gesehen hat (Doppeltipp tut nichts).
create or replace function public.uno_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.uno_games;
begin
  game := public._uno_lock(p_game_id);

  if not public._uno_is_host(p_game_id) then
    raise exception 'Nur der Host kann die nächste Runde starten.';
  end if;

  if game.status <> 'finished' or game.round_no is distinct from p_round_no then
    return;
  end if;

  if (select count(*) from public.uno_players
      where game_id = p_game_id and state = 'active') < 2 then
    raise exception 'Für eine neue Runde braucht es mindestens 2 Spieler.';
  end if;

  -- Erst die Richtung zurück, dann den nächsten Geber in Sitzreihenfolge
  update public.uno_games set round_no = round_no + 1, direction = 1 where id = p_game_id;
  update public.uno_games
  set dealer_seat = public._uno_next_seat(p_game_id, dealer_seat, 1)
  where id = p_game_id;

  perform public._uno_start_round(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie skipbo_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick (Mitglied ->
-- Spiel über den Trigger), damit sich beide nicht gegenseitig blockieren.
create or replace function public.uno_return_to_lobby(p_lobby_id uuid)
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
  from public.uno_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.uno_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.set_lobby_game(uuid, text, jsonb) from public, anon;
revoke execute on function public.start_lobby(uuid) from public, anon;
revoke execute on function public.uno_play(uuid, text, text, smallint, timestamptz) from public, anon;
revoke execute on function public.uno_draw(uuid, timestamptz) from public, anon;
revoke execute on function public.uno_pass(uuid, timestamptz) from public, anon;
revoke execute on function public.uno_call(uuid) from public, anon;
revoke execute on function public.uno_skip(uuid, timestamptz) from public, anon;
revoke execute on function public.uno_end_game(uuid) from public, anon;
revoke execute on function public.uno_next_round(uuid, integer) from public, anon;
revoke execute on function public.uno_return_to_lobby(uuid) from public, anon;

grant execute on function public.set_lobby_game(uuid, text, jsonb) to authenticated;
grant execute on function public.start_lobby(uuid) to authenticated;
grant execute on function public.uno_play(uuid, text, text, smallint, timestamptz) to authenticated;
grant execute on function public.uno_draw(uuid, timestamptz) to authenticated;
grant execute on function public.uno_pass(uuid, timestamptz) to authenticated;
grant execute on function public.uno_call(uuid) to authenticated;
grant execute on function public.uno_skip(uuid, timestamptz) to authenticated;
grant execute on function public.uno_end_game(uuid) to authenticated;
grant execute on function public.uno_next_round(uuid, integer) to authenticated;
grant execute on function public.uno_return_to_lobby(uuid) to authenticated;
