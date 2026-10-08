-- Skip-Bo, gespielt in einer gestarteten Lobby. Der Server ist die einzige
-- Instanz für die Regeln: alle Züge laufen über die security-definer-Funktionen
-- unten, Clients lesen nur Spiele, Spieler und ihre eigene Hand.
--
-- Karten: '1'..'12' je 12-mal und 18 Joker 'SB' = 162 Karten.
-- Invariante: Nachziehstapel + alle Spielstapel + alle Hände + alle Ablagen
-- + Aufbaustapel = immer genau 162. Volle Aufbaustapel (12) kommen sofort
-- gemischt unter den Nachziehstapel (kein eigener Abräumstapel).
--
-- Geheim: Hände (skipbo_hands, RLS nur eigene Zeile), Spielstapel unter der
-- Oberkarte (skipbo_stocks) und Nachziehstapel (skipbo_decks) – die beiden
-- letzten ohne Policy und ohne Grants. Öffentlich sind nur Zähler und offene
-- Karten (Stock-Oberkarte, Ablagen, Aufbaustapel).
--
-- Live: nur skipbo_games ist in der Realtime-Publikation. Eine Aktion macht
-- mehrere UPDATEs, der Client bündelt sie (watchTables mit Debounce).
-- ponytail: ganze Zeile inkl. round_log pro UPDATE; bei spürbarem Traffic auf
-- eine Tick-Tabelle wie flip7_game_ticks umstellen.

-- ===========================================================================
-- Schema
-- ===========================================================================

create table if not exists public.skipbo_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- Fest ab Start, Sitze 0..seat_count-1 (Host = 0)
  seat_count smallint not null check (seat_count between 2 and 6),
  -- = seat_count - 1, Sitz 0 beginnt
  dealer_seat smallint not null,
  -- null, wenn beendet
  turn_seat smallint,
  -- = r im round_log
  turn_no integer not null default 0,
  -- 4 Aufbaustapel, unten -> oben; Joker bleiben 'SB', ihr Wert ist die Position
  build_piles jsonb not null default '[[],[],[],[]]'
    check (jsonb_typeof(build_piles) = 'array' and jsonb_array_length(build_piles) = 4),
  draw_count smallint not null default 0,
  -- null bei beendetem Spiel: vorzeitig beendet
  winner_seat smallint,
  -- Ereignisse der letzten Aktion, nur für die Anzeige
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  -- Verlauf mit r = turn_no und at, letzte 60 Einträge
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jeder Aktion und jedem Zugwechsel
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie flip7_players: beim Löschen des Kontos muss
-- der Trigger die Zeile noch finden, um die Karten zurückzulegen.
create table if not exists public.skipbo_players (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 5),
  state text not null default 'active' check (state in ('active', 'left')),
  -- Bleibt beim Verlassen stehen (Endstand)
  stock_count smallint not null default 0,
  -- Offene Oberkarte des Spielstapels, null = leer
  stock_top text
    check (stock_top in ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'SB')),
  hand_count smallint not null default 0,
  -- 4 eigene Ablagen, unten -> oben, offen
  discards jsonb not null default '[[],[],[],[]]'
    check (jsonb_typeof(discards) = 'array' and jsonb_array_length(discards) = 4),
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Geheim: jeder sieht nur seine eigene Zeile.
create table if not exists public.skipbo_hands (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  seat smallint not null,
  user_id uuid not null,
  cards text[] not null default '{}'
    check (cardinality(cards) <= 5
           and cards <@ array['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'SB']::text[]),
  primary key (game_id, seat)
);

-- Geheim: keine Policy, keine Grants, nicht in der Realtime-Publikation.
create table if not exists public.skipbo_stocks (
  game_id uuid not null references public.skipbo_games(id) on delete cascade,
  seat smallint not null,
  -- cards[1] ist die offene Oberkarte (= skipbo_players.stock_top)
  cards text[] not null,
  primary key (game_id, seat)
);

create table if not exists public.skipbo_decks (
  game_id uuid primary key references public.skipbo_games(id) on delete cascade,
  -- draw_pile[1] ist die nächste Karte
  draw_pile text[] not null
);

-- ===========================================================================
-- Row level security and privileges
-- ===========================================================================

alter table public.skipbo_games enable row level security;
alter table public.skipbo_players enable row level security;
alter table public.skipbo_hands enable row level security;
alter table public.skipbo_stocks enable row level security;
alter table public.skipbo_decks enable row level security;

drop policy if exists "Multiplayer users can read skipbo games" on public.skipbo_games;
create policy "Multiplayer users can read skipbo games"
  on public.skipbo_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read skipbo players" on public.skipbo_players;
create policy "Multiplayer users can read skipbo players"
  on public.skipbo_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Players can read their own skipbo hand" on public.skipbo_hands;
create policy "Players can read their own skipbo hand"
  on public.skipbo_hands for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.skipbo_games, public.skipbo_players, public.skipbo_hands,
  public.skipbo_stocks, public.skipbo_decks from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.skipbo_games, public.skipbo_players, public.skipbo_hands from authenticated;
grant select on public.skipbo_games, public.skipbo_players, public.skipbo_hands to authenticated;
revoke all on public.skipbo_stocks, public.skipbo_decks from authenticated;

-- Nur das Spiel geht live raus. Hände, Stocks und Decks dürfen nie hinein.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'skipbo_games'
  ) then
    alter publication supabase_realtime add table public.skipbo_games;
  end if;
end;
$$;

-- ===========================================================================
-- Engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- 1..12 je 12-mal und 18 Joker, gemischt.
create or replace function public._skipbo_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select n::text as card from generate_series(1, 12) as n, generate_series(1, 12)
    union all
    select 'SB' from generate_series(1, 18)
  ) deck;
$$;

-- Event-Form: {t, seat?, ...}. Zusätzlich ins round_log mit Zug und Zeit.
create or replace function public._skipbo_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.skipbo_games
  set last_events = last_events || jsonb_build_array(p_event),
      -- ponytail: Verlauf auf 60 Einträge begrenzt
      round_log = (
        select coalesce(jsonb_agg(l.e order by l.i), '[]'::jsonb)
        from jsonb_array_elements(
               round_log || jsonb_build_array(p_event || jsonb_build_object('r', turn_no, 'at', now()))
             ) with ordinality as l(e, i)
        where l.i > jsonb_array_length(round_log) - 59
      )
  where id = p_game_id;
$$;

-- Karten gemischt unter den Nachziehstapel.
create or replace function public._skipbo_bury(p_game_id uuid, p_cards text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  draw_size integer;
begin
  if coalesce(cardinality(p_cards), 0) = 0 then
    return;
  end if;

  update public.skipbo_decks
  set draw_pile = draw_pile || array(select c from unnest(p_cards) as c order by gen_random_uuid())
  where game_id = p_game_id
  returning cardinality(draw_pile) into draw_size;

  update public.skipbo_games set draw_count = draw_size where id = p_game_id;
end;
$$;

-- Hand auf 5 auffüllen, soweit der Nachziehstapel reicht.
create or replace function public._skipbo_refill(p_game_id uuid, p_seat smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  need integer;
  drawn text[];
  draw_size integer;
begin
  select 5 - cardinality(cards) into need
  from public.skipbo_hands where game_id = p_game_id and seat = p_seat;

  if coalesce(need, 0) <= 0 then
    return;
  end if;

  select draw_pile[1:need] into drawn
  from public.skipbo_decks where game_id = p_game_id
  for update;

  if coalesce(cardinality(drawn), 0) = 0 then
    return;
  end if;

  update public.skipbo_decks
  set draw_pile = draw_pile[cardinality(drawn) + 1:]
  where game_id = p_game_id
  returning cardinality(draw_pile) into draw_size;

  update public.skipbo_hands set cards = cards || drawn
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_players set hand_count = hand_count + cardinality(drawn)
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_games set draw_count = draw_size where id = p_game_id;

  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'draw', 'seat', p_seat, 'n', cardinality(drawn)));
end;
$$;

-- Hand leer und weder Stock-Oberkarte noch eine Ablage-Oberkarte passt
-- irgendwo: der Spieler kann nichts tun. (Mit Handkarten kann man immer ablegen.)
-- Joker per case abfangen, bevor ::integer castet (and/or haben keine feste Reihenfolge).
create or replace function public._skipbo_stuck(p_game_id uuid, p_seat smallint)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select cardinality(h.cards) = 0 and not exists (
    select 1
    from (
      select p.stock_top as card
      union all
      select d ->> -1 from jsonb_array_elements(p.discards) as d
    ) c,
    jsonb_array_elements(g.build_piles) as b
    where c.card is not null
      and jsonb_array_length(b) < 12
      and case when c.card = 'SB' then true else c.card::integer = jsonb_array_length(b) + 1 end
  )
  from public.skipbo_hands h
  join public.skipbo_players p on p.game_id = h.game_id and p.seat = h.seat
  join public.skipbo_games g on g.id = h.game_id
  where h.game_id = p_game_id and h.seat = p_seat;
$$;

-- Erster aktiver Sitz nach p_after (reihum). null, wenn es keinen gibt.
create or replace function public._skipbo_next_seat(p_game_id uuid, p_after smallint)
returns smallint
language sql
stable
security definer set search_path = ''
as $$
  select p.seat
  from public.skipbo_players p
  join public.skipbo_games g on g.id = p.game_id
  where p.game_id = p_game_id and p.state = 'active'
  order by (p.seat - coalesce(p_after, -1) - 1 + 2 * g.seat_count) % g.seat_count
  limit 1;
$$;

-- Nächster Zug: auf 5 auffüllen; wer dann nichts tun kann, passt.
create or replace function public._skipbo_next_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  v_seat smallint;
  passes integer := 0;
begin
  loop
    select * into game from public.skipbo_games where id = p_game_id;
    exit when game.status <> 'playing';

    v_seat := public._skipbo_next_seat(p_game_id, game.turn_seat);
    -- Passen ändert nichts am Spiel: nach seat_count Pässen in Folge hängen alle fest
    if v_seat is null or passes >= game.seat_count then
      -- ponytail: alle ohne Karten und ohne Zug – Spiel endet ohne Sieger
      update public.skipbo_games
      set status = 'finished', turn_seat = null, waiting_since = null
      where id = p_game_id;
      perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'end'));
      exit;
    end if;

    update public.skipbo_games
    set turn_seat = v_seat, turn_no = turn_no + 1, waiting_since = now()
    where id = p_game_id;

    -- Zugbeginn: auf 5 auffüllen
    perform public._skipbo_refill(p_game_id, v_seat);
    exit when not public._skipbo_stuck(p_game_id, v_seat);

    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', v_seat));
    passes := passes + 1;
  end loop;
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
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

  stock_size := case when player_count >= 5 then 20 else 30 end;
  deck := public._skipbo_new_deck();

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

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie,
-- damit Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück.
create or replace function public._skipbo_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  player public.skipbo_players;
begin
  begin
    select * into game from public.skipbo_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.skipbo_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.skipbo_games set last_events = '[]' where id = p_game_id;

    -- Alle Karten des Spielers gemischt unter den Nachziehstapel (162 bleiben vollständig)
    perform public._skipbo_bury(p_game_id,
      (select cards from public.skipbo_stocks where game_id = p_game_id and seat = player.seat)
      || (select cards from public.skipbo_hands where game_id = p_game_id and seat = player.seat)
      || array(select c from jsonb_array_elements(player.discards) as d,
                             jsonb_array_elements_text(d) as c));

    update public.skipbo_stocks set cards = '{}'
    where game_id = p_game_id and seat = player.seat;
    update public.skipbo_hands set cards = '{}'
    where game_id = p_game_id and seat = player.seat;
    update public.skipbo_players
    set state = 'left', left_at = now(), stock_top = null, hand_count = 0,
        discards = '[[],[],[],[]]'
    where game_id = p_game_id and seat = player.seat;

    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status = 'playing' then
      if (select count(*) from public.skipbo_players
          where game_id = p_game_id and state = 'active') < 2 then
        update public.skipbo_games
        set status = 'finished', turn_seat = null, waiting_since = null
        where id = p_game_id;
      elsif game.turn_seat = player.seat then
        perform public._skipbo_next_turn(p_game_id);
      end if;
    end if;
  exception when others then
    raise warning 'Skip-Bo: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._skipbo_on_member_removed()
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
  from public.skipbo_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._skipbo_remove_player(v_game_id, old.user_id);
  end if;
  return null;
end;
$$;

-- Läuft neben dem Flip-7-Trigger; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_skipbo_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_skipbo_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._skipbo_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._skipbo_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.skipbo_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._skipbo_lock(p_game_id uuid)
returns public.skipbo_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.skipbo_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._skipbo_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.skipbo_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

revoke execute on function public._skipbo_new_deck() from public, anon, authenticated;
revoke execute on function public._skipbo_log(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public._skipbo_bury(uuid, text[]) from public, anon, authenticated;
revoke execute on function public._skipbo_refill(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._skipbo_stuck(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._skipbo_next_seat(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._skipbo_next_turn(uuid) from public, anon, authenticated;
revoke execute on function public._skipbo_create_game(uuid) from public, anon, authenticated;
revoke execute on function public._skipbo_remove_player(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._skipbo_on_member_removed() from public, anon, authenticated;
revoke execute on function public._skipbo_my_seat(uuid) from public, anon, authenticated;
revoke execute on function public._skipbo_lock(uuid) from public, anon, authenticated;
revoke execute on function public._skipbo_is_host(uuid) from public, anon, authenticated;

-- ===========================================================================
-- Spielfunktionen
-- ===========================================================================

-- Wie in 20261001120000_skipbo_lobby.sql, nur legt Skip-Bo jetzt das Spiel an.
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
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;

-- Spielen, Ablegen und Überspringen nehmen das waiting_since, das der Client
-- gesehen hat. Es ändert sich bei jeder Aktion, so tut ein Doppeltipp oder ein
-- Klick auf eine veraltete Ansicht nichts. Indizes sind 0-basiert.

-- Eine Karte (Hand, Spielstapel-Oberkarte oder Ablage-Oberkarte) auf einen
-- Aufbaustapel. Der Zug geht weiter.
create or replace function public.skipbo_play(
  p_game_id uuid, p_source text, p_index smallint, p_pile smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  me public.skipbo_players;
  my_seat smallint;
  card text;
  pile jsonb;
  value integer;
  top text;
  stock_left integer;
begin
  game := public._skipbo_lock(p_game_id);
  my_seat := public._skipbo_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if p_pile is null or p_pile not between 0 and 3 then
    raise exception 'Diesen Aufbaustapel gibt es nicht.';
  end if;

  select * into me from public.skipbo_players where game_id = p_game_id and seat = my_seat;

  if p_source = 'hand' and p_index between 0 and 4 then
    select cards[p_index + 1] into card
    from public.skipbo_hands where game_id = p_game_id and seat = my_seat;
  elsif p_source = 'stock' then
    card := me.stock_top;
  elsif p_source = 'discard' and p_index between 0 and 3 then
    card := (me.discards -> p_index::integer) ->> (-1);
  end if;

  if card is null then
    raise exception 'Diese Karte kannst du nicht spielen.';
  end if;

  pile := game.build_piles -> p_pile::integer;
  value := jsonb_array_length(pile) + 1;

  -- Der Joker nimmt den nächsten Wert an. case in Klammern: plpgsql liest die
  -- if-Bedingung sonst nur bis zum ersten then.
  if value > 12 or (case when card = 'SB' then false else card::integer <> value end) then
    raise exception 'Die % passt nicht auf diesen Stapel.', card;
  end if;

  if p_source = 'hand' then
    update public.skipbo_hands set cards = cards[:p_index] || cards[p_index + 2:]
    where game_id = p_game_id and seat = my_seat;
    update public.skipbo_players set hand_count = hand_count - 1
    where game_id = p_game_id and seat = my_seat;
  elsif p_source = 'stock' then
    update public.skipbo_stocks set cards = cards[2:]
    where game_id = p_game_id and seat = my_seat
    returning cards[1], cardinality(cards) into top, stock_left;
    update public.skipbo_players set stock_top = top, stock_count = stock_left
    where game_id = p_game_id and seat = my_seat;
  else
    update public.skipbo_players
    set discards = jsonb_set(discards, array[p_index::text], (discards -> p_index::integer) - (-1))
    where game_id = p_game_id and seat = my_seat;
  end if;

  -- Bei 12 ist der Stapel voll: gar nicht erst ablegen, sondern gleich abräumen
  pile := pile || to_jsonb(card);
  update public.skipbo_games
  set last_events = '[]', waiting_since = now(),
      build_piles = jsonb_set(build_piles, array[p_pile::text],
                              case when value = 12 then '[]'::jsonb else pile end)
  where id = p_game_id;

  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'play', 'seat', my_seat, 'src', p_source,
                       -- Beim Spielstapel ist p_index ungeprüft: nicht loggen
                       'i', case when p_source = 'stock' then null else p_index end,
                       'card', card, 'pile', p_pile, 'value', value)
    || case when p_source = 'stock' then jsonb_build_object('left', stock_left) else '{}'::jsonb end);

  if value = 12 then
    perform public._skipbo_bury(p_game_id, array(select jsonb_array_elements_text(pile)));
    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'clear', 'pile', p_pile));
  end if;

  if stock_left = 0 then
    update public.skipbo_games
    set status = 'finished', winner_seat = my_seat, turn_seat = null, waiting_since = null
    where id = p_game_id;
    perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'win', 'seat', my_seat));
    return;
  end if;

  -- Hand leer (alle 5 ausgespielt): sofort 5 neue. Geht dann gar nichts mehr, endet der Zug.
  if (select cardinality(cards) from public.skipbo_hands
      where game_id = p_game_id and seat = my_seat) = 0 then
    perform public._skipbo_refill(p_game_id, my_seat);
    if public._skipbo_stuck(p_game_id, my_seat) then
      perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'pass', 'seat', my_seat));
      perform public._skipbo_next_turn(p_game_id);
    end if;
  end if;
end;
$$;

-- Eine Handkarte auf eine eigene Ablage: beendet den Zug.
create or replace function public.skipbo_discard(
  p_game_id uuid, p_hand_index smallint, p_pile smallint, p_waiting_since timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
  my_seat smallint;
  card text;
begin
  game := public._skipbo_lock(p_game_id);
  my_seat := public._skipbo_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  if p_pile is null or p_pile not between 0 and 3 then
    raise exception 'Diese Ablage gibt es nicht.';
  end if;

  if p_hand_index between 0 and 4 then
    select cards[p_hand_index + 1] into card
    from public.skipbo_hands where game_id = p_game_id and seat = my_seat;
  end if;

  if card is null then
    raise exception 'Diese Karte kannst du nicht ablegen.';
  end if;

  update public.skipbo_hands set cards = cards[:p_hand_index] || cards[p_hand_index + 2:]
  where game_id = p_game_id and seat = my_seat;
  update public.skipbo_players
  set hand_count = hand_count - 1,
      discards = jsonb_set(discards, array[p_pile::text], (discards -> p_pile::integer) || to_jsonb(card))
  where game_id = p_game_id and seat = my_seat;

  update public.skipbo_games set last_events = '[]' where id = p_game_id;
  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'discard', 'seat', my_seat, 'i', p_hand_index, 'card', card, 'pile', p_pile));
  perform public._skipbo_next_turn(p_game_id);
end;
$$;

-- Host schiebt einen abwesenden Spieler weiter: der Zug endet ohne Ablegen,
-- die Handkarten bleiben. Nur für die Lage, die der Host gesehen hat, und erst
-- nach einer Weile (Client zeigt den Knopf nach 30 s, 25 s lassen Luft für Verzögerung).
create or replace function public.skipbo_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  game := public._skipbo_lock(p_game_id);

  if not public._skipbo_is_host(p_game_id) then
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

  update public.skipbo_games set last_events = '[]' where id = p_game_id;
  perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  perform public._skipbo_next_turn(p_game_id);
end;
$$;

-- Host beendet das Spiel vorzeitig, ohne Sieger.
create or replace function public.skipbo_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skipbo_games;
begin
  game := public._skipbo_lock(p_game_id);

  if not public._skipbo_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.skipbo_games
  set last_events = '[]', status = 'finished', winner_seat = null,
      turn_seat = null, waiting_since = null
  where id = p_game_id;
  perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'end'));
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie flip7_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick (Mitglied ->
-- Spiel über den Trigger), damit sich beide nicht gegenseitig blockieren.
create or replace function public.skipbo_return_to_lobby(p_lobby_id uuid)
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
  from public.skipbo_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.skipbo_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.start_lobby(uuid) from public, anon;
revoke execute on function public.skipbo_play(uuid, text, smallint, smallint, timestamptz) from public, anon;
revoke execute on function public.skipbo_discard(uuid, smallint, smallint, timestamptz) from public, anon;
revoke execute on function public.skipbo_skip(uuid, timestamptz) from public, anon;
revoke execute on function public.skipbo_end_game(uuid) from public, anon;
revoke execute on function public.skipbo_return_to_lobby(uuid) from public, anon;

grant execute on function public.start_lobby(uuid) to authenticated;
grant execute on function public.skipbo_play(uuid, text, smallint, smallint, timestamptz) to authenticated;
grant execute on function public.skipbo_discard(uuid, smallint, smallint, timestamptz) to authenticated;
grant execute on function public.skipbo_skip(uuid, timestamptz) to authenticated;
grant execute on function public.skipbo_end_game(uuid) to authenticated;
grant execute on function public.skipbo_return_to_lobby(uuid) to authenticated;
