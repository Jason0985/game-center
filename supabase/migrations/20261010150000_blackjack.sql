-- ===========================================================================
-- Blackjack
-- ===========================================================================

-- Blackjack als fünftes Lobby-Spiel: 1–5 Spieler gegen einen Dealer, den der Server spielt.
-- Startgeld stellt der Host in der Lobby ein (game_settings {"startMoney": n}, ohne = 1000).
-- Wie Uno: alle Züge über die security-definer-Funktionen unten, Clients lesen nur Spiel,
-- Spieler und Hände; jede öffentliche Funktion erhöht game_ticks genau einmal am Ende.
--
-- Regeln: 6 Decks (neu gemischt unter 78 Karten), Blackjack zahlt 3:2 (abgerundet),
-- Dealer steht auf allen 17, Peek bei Ass/Zehn, Verdoppeln auf zwei Karten, einmal Teilen
-- (geteilte Asse bekommen je eine Karte). Einsatz 10–500. Keine Pause nach der Runde: Nach
-- der Abrechnung beginnt sofort das Setzen der nächsten Runde, die alten Karten bleiben bis
-- zum nächsten Austeilen liegen. Kann niemand mehr setzen (Guthaben < 10), endet das Spiel.
--
-- Karten: Rang + Farbe, z. B. 'AS', '10H', 'KD' (S/H/D/C). Die Hände sind öffentlich (alle
-- Karten liegen offen). Geheim sind nur der Schuh und die verdeckte Dealerkarte
-- (blackjack_shoes, ohne Policy und ohne Grants); round_log/last_events nennen die
-- verdeckte Karte erst beim Aufdecken.

-- ===========================================================================
-- Blackjack: schema
-- ===========================================================================

create table if not exists public.blackjack_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  -- betting: Einsätze für round_no; playing: Runde round_no läuft
  phase text not null default 'betting' check (phase in ('betting', 'playing')),
  seat_count smallint not null check (seat_count between 1 and 5),
  start_money integer not null check (start_money between 100 and 10000),
  -- +1 bei jeder Abrechnung
  round_no integer not null default 1,
  -- null beim Setzen
  turn_seat smallint,
  turn_hand smallint,
  -- Nur offene Dealerkarten; die verdeckte liegt in blackjack_shoes.hole
  dealer_cards text[] not null default '{}',
  -- Der Client zeichnet hinter dealer_cards einen Rücken
  dealer_hole boolean not null default false,
  shoe_count smallint not null default 0,
  -- Erster Einsatz der Runde: startet die 20 s bis zum Austeilen
  first_bet_at timestamptz,
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  round_log jsonb not null default '[]' check (jsonb_typeof(round_log) = 'array'),
  -- Neu bei jedem Zugwechsel und jeder gezogenen Karte; null beim Setzen
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie uno_players
create table if not exists public.blackjack_players (
  game_id uuid not null references public.blackjack_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 4),
  state text not null default 'active' check (state in ('active', 'left')),
  balance integer not null check (balance >= 0),
  -- Einsatz fürs nächste Austeilen (schon vom Guthaben abgezogen); 0 = noch keiner
  bet integer not null default 0 check (bet >= 0),
  -- „Nochmal · 50“
  last_bet integer not null default 0,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Hände der laufenden bzw. letzten Runde (öffentlich); hand_no 1 nur nach dem Teilen
create table if not exists public.blackjack_hands (
  game_id uuid not null,
  seat smallint not null,
  hand_no smallint not null check (hand_no in (0, 1)),
  cards text[] not null default '{}',
  bet integer not null check (bet > 0),
  doubled boolean not null default false,
  state text not null default 'playing' check (state in ('playing', 'stood', 'bust', 'blackjack')),
  -- null bis zur Abrechnung; payout inklusive Einsatz
  result text check (result in ('win', 'blackjack', 'push', 'lose')),
  payout integer,
  primary key (game_id, seat, hand_no),
  foreign key (game_id, seat) references public.blackjack_players(game_id, seat) on delete cascade
);

-- Geheim: keine Policy, keine Grants, nicht in der Realtime-Publikation.
create table if not exists public.blackjack_shoes (
  game_id uuid primary key references public.blackjack_games(id) on delete cascade,
  -- cards[1] ist die nächste Karte
  cards text[] not null,
  -- Verdeckte Dealerkarte bis zum Aufdecken
  hole text
);

-- ===========================================================================
-- Blackjack: row level security and privileges
-- ===========================================================================

alter table public.blackjack_games enable row level security;

alter table public.blackjack_players enable row level security;

alter table public.blackjack_hands enable row level security;

alter table public.blackjack_shoes enable row level security;

drop policy if exists "Multiplayer users can read blackjack games" on public.blackjack_games;
create policy "Multiplayer users can read blackjack games"
  on public.blackjack_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read blackjack players" on public.blackjack_players;
create policy "Multiplayer users can read blackjack players"
  on public.blackjack_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read blackjack hands" on public.blackjack_hands;
create policy "Multiplayer users can read blackjack hands"
  on public.blackjack_hands for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Guests only see their blackjack game" on public.blackjack_games;
create policy "Guests only see their blackjack game"
  on public.blackjack_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their blackjack players" on public.blackjack_players;
create policy "Guests only see their blackjack players"
  on public.blackjack_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.blackjack_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

drop policy if exists "Guests only see their blackjack hands" on public.blackjack_hands;
create policy "Guests only see their blackjack hands"
  on public.blackjack_hands as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.blackjack_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

revoke all on public.blackjack_games, public.blackjack_players, public.blackjack_hands,
  public.blackjack_shoes from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.blackjack_games, public.blackjack_players, public.blackjack_hands from authenticated;

grant select on public.blackjack_games, public.blackjack_players, public.blackjack_hands
  to authenticated;

revoke all on public.blackjack_shoes from authenticated;

-- Blackjack in Lobby und Statistik zulassen (die Checks stehen unbenannt im Core-Schema,
-- Postgres hat sie so benannt)
alter table public.multiplayer_lobbies
  drop constraint if exists multiplayer_lobbies_game_key_check,
  add constraint multiplayer_lobbies_game_key_check
    check (game_key is null or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack'));

alter table public.game_results
  drop constraint if exists game_results_game_key_check,
  add constraint game_results_game_key_check
    check (game_key in ('flip-7', 'skip-bo', 'uno', 'blackjack'));

-- ===========================================================================
-- Blackjack: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- 6 Decks = 312 Karten, gemischt.
create or replace function public._blackjack_new_shoe()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(r || s order by gen_random_uuid())
  from unnest(array['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) as r,
       unnest(array['S', 'H', 'D', 'C']) as s,
       generate_series(1, 6);
$$;

-- Bester Wert einer Hand: Ass 1, einmal 11, wenn es nicht überkauft. Eine Karte allein
-- ergibt ihren Teilen-Wert (Ass 11, Bilder 10).
create or replace function public._blackjack_total(p_cards text[])
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (case when bool_or(r = 'A') and sum(v) + 10 <= 21 then sum(v) + 10
               else coalesce(sum(v), 0) end)::smallint
  from (
    select left(c, -1) as r,
           case when left(c, -1) = 'A' then 1
                when left(c, -1) in ('J', 'Q', 'K') then 10
                else left(c, -1)::integer end as v
    from unnest(p_cards) as c
  ) cards;
$$;

-- Event-Form: {t, seat?, hand?, ...}. Zusätzlich ins round_log mit Runde und Zeit.
create or replace function public._blackjack_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.blackjack_games
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

-- Nächste Karte aus dem Schuh. Leer mitten in der Runde: neuer Schuh (Sicherheitsnetz,
-- normal wird vor dem Austeilen gemischt).
create or replace function public._blackjack_draw(p_game_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_cards text[];
begin
  select cards into v_cards from public.blackjack_shoes where game_id = p_game_id for update;
  if cardinality(v_cards) = 0 then
    v_cards := public._blackjack_new_shoe();
  end if;

  update public.blackjack_shoes set cards = v_cards[2:] where game_id = p_game_id;
  update public.blackjack_games set shoe_count = cardinality(v_cards) - 1 where id = p_game_id;
  return v_cards[1];
end;
$$;

-- Aufdecken, Dealer zieht bis 17, jede Hand abrechnen. Danach direkt Setzen für die nächste
-- Runde; kann niemand mehr setzen, ist das Spiel vorbei.
create or replace function public._blackjack_settle(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_hole text;
  dealer text[];
  dealer_total smallint;
  dealer_bj boolean;
  hand record;
begin
  select g.dealer_cards || array_remove(array[s.hole], null), s.hole into dealer, v_hole
  from public.blackjack_games g join public.blackjack_shoes s on s.game_id = g.id
  where g.id = p_game_id;
  update public.blackjack_shoes set hole = null where game_id = p_game_id;
  if v_hole is not null then
    perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'reveal', 'card', v_hole));
  end if;

  -- Gegen überkaufte Hände und Blackjacks muss der Dealer nicht ziehen
  if exists (select 1 from public.blackjack_hands
             where game_id = p_game_id and state in ('playing', 'stood')) then
    while public._blackjack_total(dealer) < 17 loop
      dealer := dealer || public._blackjack_draw(p_game_id);
    end loop;
  end if;
  dealer_total := public._blackjack_total(dealer);
  dealer_bj := cardinality(dealer) = 2 and dealer_total = 21;
  perform public._blackjack_log(p_game_id, jsonb_build_object(
    't', 'dealer', 'n', dealer_total, 'bj', dealer_bj));

  update public.blackjack_hands h
  set result = r.result,
      payout = case r.result when 'blackjack' then h.bet + h.bet * 3 / 2
                             when 'win' then h.bet * 2
                             when 'push' then h.bet
                             else 0 end
  from (
    select seat, hand_no,
           case when state = 'bust' then 'lose'
                when state = 'blackjack' and dealer_bj then 'push'
                when state = 'blackjack' then 'blackjack'
                when dealer_bj then 'lose'
                when dealer_total > 21 or public._blackjack_total(cards) > dealer_total then 'win'
                when public._blackjack_total(cards) = dealer_total then 'push'
                else 'lose' end as result
    from public.blackjack_hands where game_id = p_game_id
  ) r
  where h.game_id = p_game_id and h.seat = r.seat and h.hand_no = r.hand_no;

  update public.blackjack_players p
  set balance = p.balance + h.total
  from (select seat, sum(payout)::integer as total from public.blackjack_hands
        where game_id = p_game_id group by seat) h
  where p.game_id = p_game_id and p.seat = h.seat;

  for hand in
    select seat, hand_no, result, payout - bet as delta from public.blackjack_hands
    where game_id = p_game_id order by seat, hand_no
  loop
    perform public._blackjack_log(p_game_id, jsonb_build_object(
      't', 'result', 'seat', hand.seat, 'hand', hand.hand_no, 'k', hand.result, 'n', hand.delta));
  end loop;

  update public.blackjack_games
  set dealer_cards = dealer, dealer_hole = false, round_no = round_no + 1, phase = 'betting',
      turn_seat = null, turn_hand = null, waiting_since = null, first_bet_at = null
  where id = p_game_id;

  if not exists (select 1 from public.blackjack_players
                 where game_id = p_game_id and state = 'active' and balance >= 10) then
    update public.blackjack_games set status = 'finished' where id = p_game_id;
    perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'broke'));
  end if;
end;
$$;

-- Nächste offene Hand in Sitzreihenfolge; keine mehr: abrechnen.
create or replace function public._blackjack_next_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_seat smallint;
  v_hand smallint;
begin
  select h.seat, h.hand_no into v_seat, v_hand
  from public.blackjack_hands h
  join public.blackjack_players p on p.game_id = h.game_id and p.seat = h.seat
  where h.game_id = p_game_id and h.state = 'playing' and p.state = 'active'
  order by h.seat, h.hand_no
  limit 1;

  if v_seat is null then
    perform public._blackjack_settle(p_game_id);
  else
    update public.blackjack_games
    set phase = 'playing', turn_seat = v_seat, turn_hand = v_hand, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- Austeilen wie am echten Tisch: je Hand eine Karte, Dealer offen, je Hand die zweite,
-- Dealer verdeckt. Hat der Dealer Blackjack (Peek), wird sofort abgerechnet.
create or replace function public._blackjack_deal(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  dealer text[];
  v_hole text;
  v_seat smallint;
begin
  select * into game from public.blackjack_games where id = p_game_id;

  if game.shoe_count < 78 then
    update public.blackjack_shoes set cards = public._blackjack_new_shoe() where game_id = p_game_id;
    update public.blackjack_games set shoe_count = 312 where id = p_game_id;
    perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'shuffle'));
  end if;

  delete from public.blackjack_hands where game_id = p_game_id;
  insert into public.blackjack_hands (game_id, seat, hand_no, bet)
  select p_game_id, seat, 0, bet from public.blackjack_players
  where game_id = p_game_id and state = 'active' and bet > 0;
  update public.blackjack_players set bet = 0 where game_id = p_game_id;

  for v_seat in select seat from public.blackjack_hands where game_id = p_game_id order by seat loop
    update public.blackjack_hands set cards = cards || public._blackjack_draw(p_game_id)
    where game_id = p_game_id and seat = v_seat;
  end loop;
  dealer := array[public._blackjack_draw(p_game_id)];
  for v_seat in select seat from public.blackjack_hands where game_id = p_game_id order by seat loop
    update public.blackjack_hands set cards = cards || public._blackjack_draw(p_game_id)
    where game_id = p_game_id and seat = v_seat;
  end loop;
  v_hole := public._blackjack_draw(p_game_id);
  update public.blackjack_shoes set hole = v_hole where game_id = p_game_id;

  update public.blackjack_hands set state = 'blackjack'
  where game_id = p_game_id and public._blackjack_total(cards) = 21;
  update public.blackjack_games
  set dealer_cards = dealer, dealer_hole = true, first_bet_at = null
  where id = p_game_id;
  perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'deal', 'round', game.round_no));

  if public._blackjack_total(dealer || v_hole) = 21 then
    perform public._blackjack_settle(p_game_id);
  else
    perform public._blackjack_next_turn(p_game_id);
  end if;
end;
$$;

-- Alle, die setzen können (Guthaben ab 10), haben gesetzt: austeilen. Gibt true zurück,
-- wenn ausgeteilt wurde.
create or replace function public._blackjack_deal_if_ready(p_game_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.blackjack_players
             where game_id = p_game_id and state = 'active' and bet > 0)
     and not exists (select 1 from public.blackjack_players
                     where game_id = p_game_id and state = 'active' and bet = 0 and balance >= 10) then
    perform public._blackjack_deal(p_game_id);
    return true;
  end if;
  return false;
end;
$$;

-- Ein Zug auf der Hand am Zug (Prüfung, wer dran ist, macht der Aufrufer).
-- skip: wie stand, nur anders geloggt (Zeit abgelaufen).
create or replace function public._blackjack_apply(p_game_id uuid, p_action text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  hand public.blackjack_hands;
  v_balance integer;
  card text;
  card2 text;
  v_total smallint;
begin
  select * into game from public.blackjack_games where id = p_game_id;
  select * into hand from public.blackjack_hands
  where game_id = p_game_id and seat = game.turn_seat and hand_no = game.turn_hand;
  select balance into v_balance from public.blackjack_players
  where game_id = p_game_id and seat = game.turn_seat;

  if p_action = 'hit' then
    card := public._blackjack_draw(p_game_id);
    v_total := public._blackjack_total(hand.cards || card);
    update public.blackjack_hands
    set cards = cards || card,
        state = case when v_total > 21 then 'bust' when v_total = 21 then 'stood' else 'playing' end
    where game_id = p_game_id and seat = hand.seat and hand_no = hand.hand_no;
    perform public._blackjack_log(p_game_id, jsonb_build_object(
      't', 'hit', 'seat', hand.seat, 'hand', hand.hand_no, 'card', card, 'n', v_total));
    if v_total >= 21 then
      perform public._blackjack_next_turn(p_game_id);
    else
      update public.blackjack_games set waiting_since = now() where id = p_game_id;
    end if;

  elsif p_action in ('stand', 'skip') then
    update public.blackjack_hands set state = 'stood'
    where game_id = p_game_id and seat = hand.seat and hand_no = hand.hand_no;
    perform public._blackjack_log(p_game_id, jsonb_build_object(
      't', p_action, 'seat', hand.seat, 'hand', hand.hand_no,
      'n', public._blackjack_total(hand.cards)));
    perform public._blackjack_next_turn(p_game_id);

  elsif p_action = 'double' then
    if cardinality(hand.cards) <> 2 then
      raise exception 'Verdoppeln geht nur mit zwei Karten.';
    end if;
    if v_balance < hand.bet then
      raise exception 'Dafür reicht dein Guthaben nicht.';
    end if;
    card := public._blackjack_draw(p_game_id);
    v_total := public._blackjack_total(hand.cards || card);
    update public.blackjack_players set balance = balance - hand.bet
    where game_id = p_game_id and seat = hand.seat;
    update public.blackjack_hands
    set cards = cards || card, bet = bet * 2, doubled = true,
        state = case when v_total > 21 then 'bust' else 'stood' end
    where game_id = p_game_id and seat = hand.seat and hand_no = hand.hand_no;
    perform public._blackjack_log(p_game_id, jsonb_build_object(
      't', 'double', 'seat', hand.seat, 'hand', hand.hand_no, 'card', card, 'n', v_total));
    perform public._blackjack_next_turn(p_game_id);

  elsif p_action = 'split' then
    if cardinality(hand.cards) <> 2
       or public._blackjack_total(hand.cards[1:1]) <> public._blackjack_total(hand.cards[2:2]) then
      raise exception 'Teilen geht nur mit zwei gleichwertigen Karten.';
    end if;
    if exists (select 1 from public.blackjack_hands
               where game_id = p_game_id and seat = hand.seat and hand_no = 1) then
      raise exception 'Du hast schon geteilt.';
    end if;
    if v_balance < hand.bet then
      raise exception 'Dafür reicht dein Guthaben nicht.';
    end if;
    update public.blackjack_players set balance = balance - hand.bet
    where game_id = p_game_id and seat = hand.seat;
    card := public._blackjack_draw(p_game_id);
    card2 := public._blackjack_draw(p_game_id);
    -- Je Hand eine neue Karte; 21 nach dem Teilen ist kein Blackjack. Geteilte Asse
    -- bekommen nur diese eine Karte.
    insert into public.blackjack_hands (game_id, seat, hand_no, cards, bet, state)
    values (p_game_id, hand.seat, 1, array[hand.cards[2], card2], hand.bet,
            case when left(hand.cards[2], -1) = 'A'
                      or public._blackjack_total(array[hand.cards[2], card2]) = 21
                 then 'stood' else 'playing' end);
    update public.blackjack_hands
    set cards = array[hand.cards[1], card],
        state = case when left(hand.cards[1], -1) = 'A'
                          or public._blackjack_total(array[hand.cards[1], card]) = 21
                     then 'stood' else 'playing' end
    where game_id = p_game_id and seat = hand.seat and hand_no = 0;
    perform public._blackjack_log(p_game_id, jsonb_build_object(
      't', 'split', 'seat', hand.seat, 'cards', jsonb_build_array(card, card2)));
    perform public._blackjack_next_turn(p_game_id);

  else
    raise exception 'Unbekannter Zug.';
  end if;
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._blackjack_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  money integer;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.blackjack_games where lobby_id = p_lobby_id;
  money := coalesce((lobby.game_settings ->> 'startMoney')::integer, 1000);

  insert into public.blackjack_games (lobby_id, seat_count, start_money, shoe_count)
  values (p_lobby_id,
          (select count(*) from public.multiplayer_lobby_members where lobby_id = p_lobby_id),
          money, 312)
  returning id into new_game_id;

  insert into public.blackjack_players (game_id, user_id, seat, balance)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1),
         money
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.blackjack_shoes (game_id, cards) values (new_game_id, public._blackjack_new_shoe());

  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist (wie _uno_create_game)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie, damit
-- Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück.
-- Einsätze auf dem Tisch verfallen.
create or replace function public._blackjack_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  player public.blackjack_players;
begin
  begin
    select * into game from public.blackjack_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.blackjack_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.blackjack_games set last_events = '[]' where id = p_game_id;
    delete from public.blackjack_hands where game_id = p_game_id and seat = player.seat;
    update public.blackjack_players set state = 'left', left_at = now(), bet = 0
    where game_id = p_game_id and seat = player.seat;
    perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'left', 'seat', player.seat));

    if game.status = 'playing' then
      if not exists (select 1 from public.blackjack_players
                     where game_id = p_game_id and state = 'active'
                       and (bet > 0 or balance >= 10 or game.phase = 'playing')) then
        update public.blackjack_games
        set status = 'finished', phase = 'betting', turn_seat = null, turn_hand = null,
            waiting_since = null
        where id = p_game_id;
      elsif game.phase = 'playing' and game.turn_seat = player.seat then
        perform public._blackjack_next_turn(p_game_id);
      elsif game.phase = 'betting' then
        perform public._blackjack_deal_if_ready(p_game_id);
      end if;
    end if;
  exception when others then
    raise warning 'Blackjack: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._blackjack_on_member_removed()
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
  from public.blackjack_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._blackjack_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Triggern der anderen Spiele; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_blackjack_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_blackjack_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._blackjack_on_member_removed();

-- Sitz des Aufrufers, wenn er noch mitspielt.
create or replace function public._blackjack_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.blackjack_players
  where game_id = p_game_id and user_id = auth.uid() and state = 'active';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._blackjack_lock(p_game_id uuid)
returns public.blackjack_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.blackjack_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._blackjack_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blackjack_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Gemeinsame Prüfung der Zug-Aktionen: Stand wie gesehen (sonst null = still ignorieren),
-- ich bin am Zug. Setzt last_events zurück.
create or replace function public._blackjack_begin_turn(p_game_id uuid, p_waiting_since timestamptz)
returns public.blackjack_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  my_seat smallint;
begin
  game := public._blackjack_lock(p_game_id);
  my_seat := public._blackjack_my_seat(p_game_id);

  if game.waiting_since is distinct from p_waiting_since then
    return null;
  end if;

  if game.status <> 'playing' or game.phase <> 'playing' or game.turn_seat is distinct from my_seat then
    raise exception 'Du bist nicht am Zug.';
  end if;

  update public.blackjack_games set last_events = '[]' where id = p_game_id returning * into game;
  return game;
end;
$$;

revoke execute on function public._blackjack_new_shoe() from public, anon, authenticated;

revoke execute on function public._blackjack_total(text[]) from public, anon, authenticated;

revoke execute on function public._blackjack_log(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public._blackjack_draw(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_settle(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_next_turn(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_deal(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_deal_if_ready(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_apply(uuid, text) from public, anon, authenticated;

revoke execute on function public._blackjack_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_on_member_removed() from public, anon, authenticated;

revoke execute on function public._blackjack_my_seat(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_lock(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_is_host(uuid) from public, anon, authenticated;

revoke execute on function public._blackjack_begin_turn(uuid, timestamptz) from public, anon, authenticated;

-- ===========================================================================
-- Blackjack: öffentliche Funktionen
-- ===========================================================================

-- Einsatz für die Runde p_round_no (wie gesehen; Doppeltipp und veraltete Ansicht tun
-- nichts). Haben alle gesetzt, die setzen können, wird sofort ausgeteilt.
create or replace function public.blackjack_bet(p_game_id uuid, p_round_no integer, p_amount integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  my_seat smallint;
  me public.blackjack_players;
begin
  game := public._blackjack_lock(p_game_id);
  my_seat := public._blackjack_my_seat(p_game_id);
  select * into me from public.blackjack_players where game_id = p_game_id and seat = my_seat;

  if game.status <> 'playing' or game.phase <> 'betting'
     or game.round_no is distinct from p_round_no or me.bet > 0 then
    return;
  end if;

  if p_amount is null or p_amount not between 10 and 500 then
    raise exception 'Der Einsatz muss zwischen 10 und 500 liegen.';
  end if;

  if p_amount > me.balance then
    raise exception 'So viel Guthaben hast du nicht.';
  end if;

  update public.blackjack_players
  set balance = balance - p_amount, bet = p_amount, last_bet = p_amount
  where game_id = p_game_id and seat = me.seat;
  update public.blackjack_games
  set last_events = '[]', first_bet_at = coalesce(first_bet_at, now())
  where id = p_game_id;
  perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'bet', 'seat', me.seat, 'n', p_amount));

  perform public._blackjack_deal_if_ready(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Setzzeit abgelaufen: Jeder am Tisch darf austeilen lassen (Client wartet 20 s, 15 s
-- lassen Luft für Verzögerung). Wer nicht gesetzt hat, setzt diese Runde aus.
create or replace function public.blackjack_deal(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
begin
  game := public._blackjack_lock(p_game_id);
  perform public._blackjack_my_seat(p_game_id);

  if game.status <> 'playing' or game.phase <> 'betting'
     or game.round_no is distinct from p_round_no
     or game.first_bet_at is null or game.first_bet_at > now() - interval '15 seconds'
     or not exists (select 1 from public.blackjack_players
                    where game_id = p_game_id and state = 'active' and bet > 0) then
    return;
  end if;

  update public.blackjack_games set last_events = '[]' where id = p_game_id;
  perform public._blackjack_deal(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Ein Zug auf der Hand am Zug: hit (Ziehen), stand (Halten), double (Verdoppeln), split
-- (Teilen). Nimmt das waiting_since, das der Client gesehen hat.
create or replace function public.blackjack_play(p_game_id uuid, p_waiting_since timestamptz, p_action text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
begin
  if p_action is null or p_action not in ('hit', 'stand', 'double', 'split') then
    raise exception 'Unbekannter Zug.';
  end if;

  game := public._blackjack_begin_turn(p_game_id, p_waiting_since);
  if game.id is null then
    return;
  end if;

  perform public._blackjack_apply(p_game_id, p_action);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zeit abgelaufen: Die Hand am Zug hält. Jeder am Tisch (und der Host) darf das auslösen,
-- nur für die Lage, die er gesehen hat, und erst nach einer Weile (Client nach 30 s,
-- 25 s lassen Luft für Verzögerung).
create or replace function public.blackjack_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
begin
  game := public._blackjack_lock(p_game_id);

  if not public._blackjack_is_host(p_game_id) then
    perform public._blackjack_my_seat(p_game_id);
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since
     or game.status <> 'playing' or game.phase <> 'playing' then
    return;
  end if;

  if game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.blackjack_games set last_events = '[]' where id = p_game_id;
  perform public._blackjack_apply(p_game_id, 'skip');
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet das Spiel. Offene Einsätze gehen zurück; Sieger ist, wer am meisten hat.
create or replace function public.blackjack_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
begin
  game := public._blackjack_lock(p_game_id);

  if not public._blackjack_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.blackjack_players p
  set balance = p.balance + p.bet + coalesce((
        select sum(h.bet) from public.blackjack_hands h
        where h.game_id = p_game_id and h.seat = p.seat and h.result is null), 0),
      bet = 0
  where p.game_id = p_game_id;
  delete from public.blackjack_hands where game_id = p_game_id and result is null;
  update public.blackjack_shoes set hole = null where game_id = p_game_id;

  update public.blackjack_games
  set last_events = '[]', status = 'finished', phase = 'betting', turn_seat = null,
      turn_hand = null, waiting_since = null, first_bet_at = null,
      dealer_cards = case when dealer_hole then '{}' else dealer_cards end, dealer_hole = false
  where id = p_game_id;
  perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie uno_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick.
create or replace function public.blackjack_return_to_lobby(p_lobby_id uuid)
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
  from public.blackjack_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.blackjack_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.blackjack_bet(uuid, integer, integer) from public, anon;

revoke execute on function public.blackjack_deal(uuid, integer) from public, anon;

revoke execute on function public.blackjack_play(uuid, timestamptz, text) from public, anon;

revoke execute on function public.blackjack_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.blackjack_end_game(uuid) from public, anon;

revoke execute on function public.blackjack_return_to_lobby(uuid) from public, anon;

grant execute on function public.blackjack_bet(uuid, integer, integer) to authenticated;

grant execute on function public.blackjack_deal(uuid, integer) to authenticated;

grant execute on function public.blackjack_play(uuid, timestamptz, text) to authenticated;

grant execute on function public.blackjack_skip(uuid, timestamptz) to authenticated;

grant execute on function public.blackjack_end_game(uuid) to authenticated;

grant execute on function public.blackjack_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Blackjack: Statistik und Abend-Wertung
-- ===========================================================================

-- Ein Ergebnis je Spieler, Rang nach Guthaben. Allein (am Ende unter 2 Spielern, wie
-- Flip 7) oder ohne eine abgerechnete Runde zählt nichts. Ein Fehler hier darf den Zug nie
-- abbrechen.
create or replace function public._blackjack_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.round_no <= 1
     or (select count(*) from public.blackjack_players
         where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'blackjack', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.balance
  from (
    select p.user_id, p.state, p.balance,
           rank() over (order by p.state = 'left', p.balance desc) as placement,
           count(*) over () as player_count
    from public.blackjack_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Blackjack: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists blackjack_games_record_result on public.blackjack_games;
create trigger blackjack_games_record_result
after update of status on public.blackjack_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._blackjack_record_result();

revoke execute on function public._blackjack_record_result() from public, anon, authenticated;

-- ===========================================================================
-- Lobby: Blackjack wählen und starten
-- ===========================================================================

-- Wie im Core-Schema, plus Blackjack: {} = 1000 Startgeld, sonst genau {"startMoney": n}
-- mit n von 100 bis 10.000 in Zehnerschritten. Rechte bleiben bei create or replace.
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

-- Wie in 20261009200000_lobby_all_ready.sql, plus Blackjack: schon allein startbar,
-- höchstens 5 Spieler. Die Spielwahl wird jetzt vor der Spielerzahl geprüft (die
-- Mindestzahl hängt vom Spiel ab).
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
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;
