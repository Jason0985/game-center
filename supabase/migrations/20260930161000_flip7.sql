-- Flip 7 card game, played inside a started lobby. The server is the only
-- authority: all rules run in the security definer functions below, clients
-- may only read games and players. The order of the draw pile is hidden in
-- flip7_decks, which clients cannot read at all.
--
-- Card codes: '0'..'12', '+2' '+4' '+6' '+8' '+10', 'x2',
-- 'FREEZE', 'FLIP3' (Flip Three), 'SC' (Second Chance). 94 cards in total.
--
-- Invariant: draw pile + discard pile + all hands + action_queue + pending_card
-- always hold exactly the 94 cards of the deck.
--
-- Live updates: only flip7_game_ticks is in the Realtime publication. Every
-- public function that changes a game (and the member-delete trigger) bumps its
-- lobby's tick exactly once at the end, so one action = one Realtime event per
-- client, no matter how many engine steps it took. flip7_return_to_lobby only
-- changes the lobby, which clients already watch.

-- ===========================================================================
-- Schema
-- ===========================================================================

create table if not exists public.flip7_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  -- null = open game, the host ends it
  target_score integer check (target_score is null or target_score between 50 and 1000),
  status text not null default 'playing' check (status in ('playing', 'round_over', 'finished')),
  -- Fixed at start, seats 0..seat_count-1 (host = 0)
  seat_count smallint not null check (seat_count between 2 and 8),
  round_no integer not null default 0,
  dealer_seat smallint not null,
  -- null outside a round
  phase text check (phase in ('deal', 'turn', 'resolve')),
  -- Next seat to deal, null = dealing is done
  deal_seat smallint,
  turn_seat smallint,
  -- Action card that waits for pending_seat to choose a target
  pending_card text check (pending_card in ('FREEZE', 'FLIP3', 'SC')),
  pending_seat smallint,
  flip3_seat smallint,
  flip3_left smallint check (flip3_left between 0 and 3),
  -- Freeze/Flip Three drawn during a Flip Three: [{card, seat}], resolved afterwards
  action_queue jsonb not null default '[]' check (jsonb_typeof(action_queue) = 'array'),
  draw_count smallint not null default 0,
  discard_count smallint not null default 0,
  -- Events of the last action, for display only
  last_events jsonb not null default '[]' check (jsonb_typeof(last_events) = 'array'),
  waiting_since timestamptz,
  round_ended_at timestamptz,
  created_at timestamptz not null default now(),
  check ((pending_card is null) = (pending_seat is null))
);

-- user_id without foreign key to auth.users on purpose: on account deletion
-- the member-delete trigger must still find the row to take the player out of
-- the game properly (turn, pending choice, cards back to the discard pile).
-- The row goes with the game, at the latest when the lobby is closed.
create table if not exists public.flip7_players (
  game_id uuid not null references public.flip7_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active'
    check (state in ('active', 'stayed', 'frozen', 'busted', 'flip7', 'left')),
  cards text[] not null default '{}'
    check (cards <@ array['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
                          '+2', '+4', '+6', '+8', '+10', 'x2', 'FREEZE', 'FLIP3', 'SC']::text[]),
  total_score integer not null default 0,
  -- Points of the last finished round
  round_score integer,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- Hidden: no policy, no grants, not in the Realtime publication.
create table if not exists public.flip7_decks (
  game_id uuid primary key references public.flip7_games(id) on delete cascade,
  -- draw_pile[1] is the next card
  draw_pile text[] not null,
  discard_pile text[] not null default '{}'
);

-- One row per lobby with a game (so far), bumped once per action. Clients
-- listen to this table only and then reload the game with one query.
create table if not exists public.flip7_game_ticks (
  lobby_id uuid primary key references public.multiplayer_lobbies(id) on delete cascade,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Row level security and privileges
-- ===========================================================================

alter table public.flip7_games enable row level security;
alter table public.flip7_players enable row level security;
alter table public.flip7_decks enable row level security;
alter table public.flip7_game_ticks enable row level security;

drop policy if exists "Multiplayer users can read flip7 games" on public.flip7_games;
create policy "Multiplayer users can read flip7 games"
  on public.flip7_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read flip7 players" on public.flip7_players;
create policy "Multiplayer users can read flip7 players"
  on public.flip7_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read flip7 ticks" on public.flip7_game_ticks;
create policy "Multiplayer users can read flip7 ticks"
  on public.flip7_game_ticks for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

revoke all on public.flip7_games, public.flip7_players, public.flip7_decks,
  public.flip7_game_ticks from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.flip7_games, public.flip7_players, public.flip7_game_ticks from authenticated;
grant select on public.flip7_games, public.flip7_players, public.flip7_game_ticks to authenticated;
revoke all on public.flip7_decks from authenticated;

-- Only the ticks go out live (see top). Games, players and decks stay out of
-- the publication; the decks must never be in it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'flip7_game_ticks'
  ) then
    alter publication supabase_realtime add table public.flip7_game_ticks;
  end if;
end;
$$;

-- ===========================================================================
-- Engine (internal, not callable over /rest/v1/rpc)
-- ===========================================================================

-- One 0, n copies of every n from 1 to 12, one of each modifier, 3 of each action.
create or replace function public._flip7_new_deck()
returns text[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(card order by gen_random_uuid())
  from (
    select '0' as card
    union all
    select n::text from generate_series(1, 12) as n, generate_series(1, n)
    union all
    select unnest(array['+2', '+4', '+6', '+8', '+10', 'x2'])
    union all
    select action from unnest(array['FREEZE', 'FLIP3', 'SC']) as action, generate_series(1, 3)
  ) deck;
$$;

-- Numbers (doubled by x2), plus modifiers, plus 15 for 7 different numbers.
-- A busted hand is 0; the callers handle that.
create or replace function public._flip7_score(p_cards text[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select (
    coalesce(sum(card::integer) filter (where card ~ '^[0-9]+$'), 0)
      * (case when 'x2' = any(p_cards) then 2 else 1 end)
    + coalesce(sum(substr(card, 2)::integer) filter (where card ~ '^\+[0-9]+$'), 0)
    + (case when count(distinct card) filter (where card ~ '^[0-9]+$') >= 7 then 15 else 0 end)
  )::integer
  from unnest(p_cards) as card;
$$;

-- Event shape: {t, seat?, card?, target?}
create or replace function public._flip7_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.flip7_games
  set last_events = last_events || jsonb_build_array(p_event)
  where id = p_game_id;
$$;

-- The one Realtime event of an action (see top). Called last.
create or replace function public._flip7_tick(p_lobby_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.flip7_game_ticks as t (lobby_id) values (p_lobby_id)
  on conflict (lobby_id) do update set version = t.version + 1, updated_at = now();
$$;

-- Next card. An empty draw pile is refilled from the shuffled discard pile
-- (cards on the table stay out). null only if both piles are empty.
create or replace function public._flip7_draw(p_game_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  deck public.flip7_decks;
  card text;
begin
  select * into deck from public.flip7_decks where game_id = p_game_id;

  if cardinality(deck.draw_pile) = 0 then
    if cardinality(deck.discard_pile) = 0 then
      return null;
    end if;
    deck.draw_pile := array(select c from unnest(deck.discard_pile) as c order by gen_random_uuid());
    deck.discard_pile := '{}';
    perform public._flip7_log(p_game_id, jsonb_build_object('t', 'reshuffle'));
  end if;

  card := deck.draw_pile[1];
  deck.draw_pile := deck.draw_pile[2:];

  update public.flip7_decks
  set draw_pile = deck.draw_pile, discard_pile = deck.discard_pile
  where game_id = p_game_id;

  update public.flip7_games
  set draw_count = cardinality(deck.draw_pile), discard_count = cardinality(deck.discard_pile)
  where id = p_game_id;

  return card;
end;
$$;

create or replace function public._flip7_discard(p_game_id uuid, p_cards text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  discard_size integer;
begin
  if coalesce(cardinality(p_cards), 0) = 0 then
    return;
  end if;

  update public.flip7_decks
  set discard_pile = discard_pile || p_cards
  where game_id = p_game_id
  returning cardinality(discard_pile) into discard_size;

  update public.flip7_games set discard_count = discard_size where id = p_game_id;
end;
$$;

-- First seat after p_after (in turn order, wrapping) that is still active
-- (p_only_active) or at least still in the game. null if there is none.
create or replace function public._flip7_next_seat(p_game_id uuid, p_after smallint, p_only_active boolean)
returns smallint
language sql
stable
security definer set search_path = ''
as $$
  select p.seat
  from public.flip7_players p
  join public.flip7_games g on g.id = p.game_id
  where p.game_id = p_game_id
    and (case when p_only_active then p.state = 'active' else p.state <> 'left' end)
  order by (p.seat - coalesce(p_after, -1) - 1 + 2 * g.seat_count) % g.seat_count
  limit 1;
$$;

-- Who may receive an action card drawn by p_seat: Freeze/Flip Three any active
-- player incl. the drawer; Second Chance only other active players without
-- one. Ordered in turn order starting at the drawer.
create or replace function public._flip7_candidates(p_game_id uuid, p_seat smallint, p_card text)
returns smallint[]
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(array_agg(p.seat order by (p.seat - p_seat + g.seat_count) % g.seat_count), '{}')
  from public.flip7_players p
  join public.flip7_games g on g.id = p.game_id
  where p.game_id = p_game_id
    and p.state = 'active'
    and (p_card <> 'SC' or (p.seat <> p_seat and not ('SC' = any(p.cards))));
$$;

create or replace function public._flip7_resolve_action(
  p_game_id uuid, p_seat smallint, p_card text, p_target smallint
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_card = 'FREEZE' then
    update public.flip7_players
    set cards = cards || p_card, state = 'frozen'
    where game_id = p_game_id and seat = p_target;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'freeze', 'seat', p_seat, 'target', p_target));
  elsif p_card = 'FLIP3' then
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_target;
    update public.flip7_games set flip3_seat = p_target, flip3_left = 3 where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'flip3', 'seat', p_seat, 'target', p_target));
  else
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_target;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'sc_given', 'seat', p_seat, 'target', p_target));
  end if;
end;
$$;

-- No candidate: discard. One: resolve right away. Several: p_seat chooses.
create or replace function public._flip7_offer_action(p_game_id uuid, p_seat smallint, p_card text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  candidates smallint[];
begin
  candidates := public._flip7_candidates(p_game_id, p_seat, p_card);

  if cardinality(candidates) = 0 then
    perform public._flip7_discard(p_game_id, array[p_card]);
    if p_card = 'SC' then
      perform public._flip7_log(p_game_id, jsonb_build_object('t', 'sc_discarded', 'seat', p_seat));
    end if;
  elsif cardinality(candidates) = 1 then
    perform public._flip7_resolve_action(p_game_id, p_seat, p_card, candidates[1]);
  else
    update public.flip7_games
    set pending_card = p_card, pending_seat = p_seat, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- A drawn card lands in front of p_seat (all cards are face up).
create or replace function public._flip7_receive(
  p_game_id uuid, p_seat smallint, p_card text, p_in_flip3 boolean
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  hand text[];
begin
  perform public._flip7_log(p_game_id,
    jsonb_build_object('t', 'draw', 'seat', p_seat, 'card', p_card));

  select cards into hand
  from public.flip7_players where game_id = p_game_id and seat = p_seat;

  if p_card ~ '^[0-9]+$' then
    if p_card = any(hand) then
      if 'SC' = any(hand) then
        update public.flip7_players
        set cards = array_remove(cards, 'SC')
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_discard(p_game_id, array[p_card, 'SC']);
        perform public._flip7_log(p_game_id,
          jsonb_build_object('t', 'second_chance', 'seat', p_seat, 'card', p_card));
      else
        -- Die doppelte Karte bleibt sichtbar liegen
        update public.flip7_players
        set cards = cards || p_card, state = 'busted'
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_log(p_game_id,
          jsonb_build_object('t', 'bust', 'seat', p_seat, 'card', p_card));
      end if;
    else
      update public.flip7_players
      set cards = cards || p_card
      where game_id = p_game_id and seat = p_seat
      returning cards into hand;

      if (select count(*) from unnest(hand) as c where c ~ '^[0-9]+$') >= 7 then
        update public.flip7_players set state = 'flip7'
        where game_id = p_game_id and seat = p_seat;
        perform public._flip7_log(p_game_id, jsonb_build_object('t', 'flip7', 'seat', p_seat));
      end if;
    end if;
  elsif p_card = 'x2' or p_card like '+%' then
    update public.flip7_players
    set cards = cards || p_card
    where game_id = p_game_id and seat = p_seat;
  elsif p_card = 'SC' then
    if 'SC' = any(hand) then
      -- Nur eine Zweite Chance pro Spieler: die zweite wird verschenkt
      perform public._flip7_offer_action(p_game_id, p_seat, p_card);
    else
      update public.flip7_players
      set cards = cards || p_card
      where game_id = p_game_id and seat = p_seat;
    end if;
  elsif p_in_flip3 then
    -- Freeze/Flip Three während Drei ziehen: erst danach auflösen
    update public.flip7_games
    set action_queue = action_queue || jsonb_build_array(
      jsonb_build_object('card', p_card, 'seat', p_seat))
    where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'set_aside', 'seat', p_seat, 'card', p_card));
  else
    perform public._flip7_offer_action(p_game_id, p_seat, p_card);
  end if;
end;
$$;

-- Scores the round (unless p_score is false) and decides whether the game is over.
-- Hands stay on the table for the round summary.
create or replace function public._flip7_end_round(p_game_id uuid, p_score boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  leftover text[];
begin
  select * into game from public.flip7_games where id = p_game_id;

  if p_score then
    update public.flip7_players
    set round_score = case when state = 'busted' then 0 else public._flip7_score(cards) end,
        total_score = total_score
          + case when state = 'busted' then 0 else public._flip7_score(cards) end
    where game_id = p_game_id and state <> 'left';
  end if;

  update public.flip7_players set round_score = null
  where game_id = p_game_id and state = 'left';

  leftover := array(select item ->> 'card' from jsonb_array_elements(game.action_queue) as item);
  if game.pending_card is not null then
    leftover := leftover || game.pending_card;
  end if;
  perform public._flip7_discard(p_game_id, leftover);

  update public.flip7_games g
  set pending_card = null, pending_seat = null, flip3_seat = null, flip3_left = null,
      action_queue = '[]', phase = null, deal_seat = null, turn_seat = null,
      waiting_since = null, round_ended_at = now(),
      status = case
        when (select count(*) from public.flip7_players
              where game_id = p_game_id and state <> 'left') < 2 then 'finished'
        when p_score and g.target_score is not null and exists (
              select 1 from public.flip7_players
              where game_id = p_game_id and state <> 'left' and total_score >= g.target_score
            ) then 'finished'
        else 'round_over'
      end
  where id = p_game_id;
end;
$$;

-- The loop that moves the game on until a player has to act or the round ends.
create or replace function public._flip7_run(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  iterations integer := 0;
  card text;
  item jsonb;
  v_seat smallint;
begin
  loop
    iterations := iterations + 1;
    if iterations > 300 then
      raise exception 'Flip 7: Die Spiellogik hängt fest.';
    end if;

    select * into game from public.flip7_games where id = p_game_id;
    if game.status <> 'playing' then
      exit;
    end if;

    -- 1. Flip 7 oder niemand mehr aktiv: Runde vorbei
    if exists (select 1 from public.flip7_players where game_id = p_game_id and state = 'flip7')
       or not exists (select 1 from public.flip7_players
                      where game_id = p_game_id and state = 'active') then
      perform public._flip7_end_round(p_game_id, true);
      exit;
    end if;

    -- 2. Jemand muss ein Ziel wählen (waiting_since setzt _flip7_offer_action)
    if game.pending_card is not null then
      exit;
    end if;

    -- 3. Laufendes Drei ziehen
    if game.flip3_seat is not null then
      if game.flip3_left = 0 or not exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = game.flip3_seat and state = 'active'
      ) then
        update public.flip7_games set flip3_seat = null, flip3_left = null where id = p_game_id;
      else
        update public.flip7_games set flip3_left = flip3_left - 1 where id = p_game_id;
        card := public._flip7_draw(p_game_id);
        if card is null then
          perform public._flip7_end_round(p_game_id, true);
          exit;
        end if;
        perform public._flip7_receive(p_game_id, game.flip3_seat, card, true);
      end if;
      continue;
    end if;

    -- 4. Zurückgelegte Aktionskarten, nur wenn der Spieler noch aktiv ist
    if jsonb_array_length(game.action_queue) > 0 then
      item := game.action_queue -> 0;
      update public.flip7_games set action_queue = action_queue - 0 where id = p_game_id;
      v_seat := (item ->> 'seat')::smallint;
      if exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = v_seat and state = 'active'
      ) then
        perform public._flip7_offer_action(p_game_id, v_seat, item ->> 'card');
      else
        perform public._flip7_discard(p_game_id, array[item ->> 'card']);
      end if;
      continue;
    end if;

    -- 5. Austeilen / nächster Zug
    if game.phase = 'deal' then
      if game.deal_seat is null then
        update public.flip7_games
        set phase = 'turn',
            turn_seat = public._flip7_next_seat(p_game_id, game.dealer_seat, true),
            waiting_since = now()
        where id = p_game_id;
        exit;
      end if;

      v_seat := game.deal_seat;
      update public.flip7_games
      set deal_seat = case when v_seat = game.dealer_seat then null else (v_seat + 1) % seat_count end
      where id = p_game_id;

      if exists (
        select 1 from public.flip7_players
        where game_id = p_game_id and flip7_players.seat = v_seat and state = 'active'
      ) then
        card := public._flip7_draw(p_game_id);
        if card is null then
          perform public._flip7_end_round(p_game_id, true);
          exit;
        end if;
        perform public._flip7_receive(p_game_id, v_seat, card, false);
      end if;
      continue;
    elsif game.phase = 'resolve' then
      update public.flip7_games
      set phase = 'turn',
          turn_seat = public._flip7_next_seat(p_game_id, game.turn_seat, true),
          waiting_since = now()
      where id = p_game_id;
    end if;

    exit;
  end loop;
end;
$$;

-- Cards of the last round go to the discard pile; the draw pile carries over
-- between rounds. The dealer moves one seat on (round 1: host is dealt first).
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
      phase = 'deal', deal_seat = (dealer + 1) % seat_count, turn_seat = null,
      pending_card = null, pending_seat = null, flip3_seat = null, flip3_left = null,
      action_queue = '[]', waiting_since = null, round_ended_at = null
  where id = p_game_id;

  perform public._flip7_run(p_game_id);
end;
$$;

-- Replaces an old game of the lobby. Seats in join order, host first.
-- The caller (start_lobby) holds the locks on the lobby and its members.
create or replace function public._flip7_create_game(p_lobby_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  player_count integer;
  deck text[];
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.flip7_games where lobby_id = p_lobby_id;

  select count(*) into player_count
  from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  deck := public._flip7_new_deck();

  insert into public.flip7_games (lobby_id, target_score, seat_count, dealer_seat, draw_count)
  values (
    p_lobby_id,
    (lobby.game_settings ->> 'targetScore')::integer,
    player_count,
    0,
    cardinality(deck)
  )
  returning id into new_game_id;

  insert into public.flip7_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  insert into public.flip7_decks (game_id, draw_pile) values (new_game_id, deck);

  perform public._flip7_start_round(new_game_id);
  perform public._flip7_tick(p_lobby_id);
  return new_game_id;
end;
$$;

-- A player leaves the game (kick, leave, deleted account). Never raises, so
-- leaving the lobby always works; a failure only rolls back the game part.
create or replace function public._flip7_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  player public.flip7_players;
  queued jsonb;
begin
  begin
    select * into game from public.flip7_games where id = p_game_id;
    if not found then
      return;
    end if;

    update public.flip7_games set last_events = '[]' where id = p_game_id;

    select * into player
    from public.flip7_players where game_id = p_game_id and user_id = p_user_id;

    if found and player.state <> 'left' then
      perform public._flip7_discard(p_game_id, player.cards);
      update public.flip7_players
      set state = 'left', left_at = now(), cards = '{}', round_score = null
      where game_id = p_game_id and user_id = p_user_id;

      -- Offene Auswahl, laufendes Drei ziehen und zurückgelegte Karten des Spielers
      if game.pending_seat = player.seat then
        perform public._flip7_discard(p_game_id, array[game.pending_card]);
        update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
      end if;

      if game.flip3_seat = player.seat then
        update public.flip7_games set flip3_seat = null, flip3_left = null where id = p_game_id;
      end if;

      select coalesce(jsonb_agg(item order by ord), '[]') into queued
      from jsonb_array_elements(game.action_queue) with ordinality as q(item, ord)
      where (item ->> 'seat')::smallint <> player.seat;
      perform public._flip7_discard(p_game_id,
        array(select item ->> 'card' from jsonb_array_elements(game.action_queue) as item
              where (item ->> 'seat')::smallint = player.seat));
      update public.flip7_games set action_queue = queued where id = p_game_id;

      if game.status = 'playing' and game.phase = 'turn' and game.turn_seat = player.seat then
        update public.flip7_games set phase = 'resolve' where id = p_game_id;
      end if;

      perform public._flip7_log(p_game_id,
        jsonb_build_object('t', 'left', 'seat', player.seat));
    end if;

    select * into game from public.flip7_games where id = p_game_id;

    -- Wählt jemand anderes gerade ein Ziel, gibt es evtl. nicht mehr genug Ziele
    if game.pending_card is not null
       and cardinality(public._flip7_candidates(p_game_id, game.pending_seat, game.pending_card)) < 2 then
      update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
      perform public._flip7_offer_action(p_game_id, game.pending_seat, game.pending_card);
    end if;

    if (select count(*) from public.flip7_players
        where game_id = p_game_id and state <> 'left') < 2 then
      if game.status <> 'finished' then
        perform public._flip7_end_round(p_game_id, false);
      end if;
      update public.flip7_games set status = 'finished' where id = p_game_id;
    elsif game.status = 'playing' then
      perform public._flip7_run(p_game_id);
    end if;

    perform public._flip7_tick(game.lobby_id);
  exception when others then
    raise warning 'Flip 7: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._flip7_on_member_removed()
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
  from public.flip7_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._flip7_remove_player(v_game_id, old.user_id);
  end if;
  return null;
end;
$$;

drop trigger if exists multiplayer_lobby_members_flip7_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_flip7_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._flip7_on_member_removed();

-- Seat of the caller, if they still play in this game.
create or replace function public._flip7_my_seat(p_game_id uuid)
returns smallint
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  my_seat smallint;
begin
  select seat into my_seat
  from public.flip7_players
  where game_id = p_game_id and user_id = auth.uid() and state <> 'left';

  if my_seat is null then
    raise exception 'Du spielst in diesem Spiel nicht mit.';
  end if;
  return my_seat;
end;
$$;

-- Locks the game for a public function and clears the events of the last action.
create or replace function public._flip7_lock(p_game_id uuid)
returns public.flip7_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.flip7_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._flip7_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.flip7_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

revoke execute on function public._flip7_new_deck() from public, anon, authenticated;
revoke execute on function public._flip7_score(text[]) from public, anon, authenticated;
revoke execute on function public._flip7_log(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public._flip7_tick(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_draw(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_discard(uuid, text[]) from public, anon, authenticated;
revoke execute on function public._flip7_next_seat(uuid, smallint, boolean) from public, anon, authenticated;
revoke execute on function public._flip7_candidates(uuid, smallint, text) from public, anon, authenticated;
revoke execute on function public._flip7_resolve_action(uuid, smallint, text, smallint) from public, anon, authenticated;
revoke execute on function public._flip7_offer_action(uuid, smallint, text) from public, anon, authenticated;
revoke execute on function public._flip7_receive(uuid, smallint, text, boolean) from public, anon, authenticated;
revoke execute on function public._flip7_end_round(uuid, boolean) from public, anon, authenticated;
revoke execute on function public._flip7_run(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_start_round(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_create_game(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_remove_player(uuid, uuid) from public, anon, authenticated;
revoke execute on function public._flip7_on_member_removed() from public, anon, authenticated;
revoke execute on function public._flip7_my_seat(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_lock(uuid) from public, anon, authenticated;
revoke execute on function public._flip7_is_host(uuid) from public, anon, authenticated;

-- ===========================================================================
-- Game functions
-- ===========================================================================

-- Same as in 20260930140000_lobby_system.sql, plus: the members are locked,
-- a game must be chosen, and starting creates the game.
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

  update public.multiplayer_lobbies
  set status = 'started', started_at = now()
  where id = p_lobby_id;

  delete from public.notifications
  where type = 'game_invite' and related_id = p_lobby_id::text;

  perform public._flip7_create_game(p_lobby_id);
end;
$$;

-- Hit, Stay, choosing a target and skipping take the waiting_since the client
-- saw. It changes with every new turn or choice, so a double tap or a click on
-- an outdated view does nothing instead of making a second, unintended move.

create or replace function public.flip7_hit(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  my_seat smallint;
  card text;
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

  update public.flip7_games set last_events = '[]', phase = 'resolve' where id = p_game_id;

  card := public._flip7_draw(p_game_id);
  if card is null then
    perform public._flip7_end_round(p_game_id, true);
  else
    perform public._flip7_receive(p_game_id, my_seat, card, false);
    perform public._flip7_run(p_game_id);
  end if;

  perform public._flip7_tick(game.lobby_id);
end;
$$;

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

  update public.flip7_games set last_events = '[]', phase = 'resolve' where id = p_game_id;
  update public.flip7_players set state = 'stayed'
  where game_id = p_game_id and seat = my_seat;
  perform public._flip7_log(p_game_id, jsonb_build_object('t', 'stay', 'seat', my_seat));
  perform public._flip7_run(p_game_id);

  perform public._flip7_tick(game.lobby_id);
end;
$$;

create or replace function public.flip7_choose_target(
  p_game_id uuid, p_target_seat smallint, p_waiting_since timestamptz
)
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

  if game.status <> 'playing' or game.pending_card is null or game.pending_seat <> my_seat then
    raise exception 'Du musst gerade nichts auswählen.';
  end if;

  if p_target_seat is null
     or not (p_target_seat = any(public._flip7_candidates(p_game_id, my_seat, game.pending_card))) then
    raise exception 'Dieses Ziel ist nicht erlaubt.';
  end if;

  update public.flip7_games
  set last_events = '[]', pending_card = null, pending_seat = null
  where id = p_game_id;
  perform public._flip7_resolve_action(p_game_id, my_seat, game.pending_card, p_target_seat);
  perform public._flip7_run(p_game_id);

  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Host moves an AFK player on: a pending Freeze/Flip Three hits the chooser,
-- a Second Chance goes to the next possible player, otherwise the turn counts
-- as Stay. Only for the situation the host saw (p_waiting_since), and only
-- after it has been waiting for a while (the client shows the button after
-- 30 s of local time; 25 s here leave room for delays).
create or replace function public.flip7_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
  candidates smallint[];
  target smallint;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann Spieler überspringen.';
  end if;

  -- Inzwischen hat der Spieler selbst gehandelt: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since then
    return;
  end if;

  if game.status <> 'playing' then
    raise exception 'Gerade läuft keine Runde.';
  end if;

  if game.waiting_since is null or game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;

  if game.pending_card is not null then
    update public.flip7_games set pending_card = null, pending_seat = null where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'skip', 'seat', game.pending_seat));

    candidates := public._flip7_candidates(p_game_id, game.pending_seat, game.pending_card);
    if game.pending_card <> 'SC' and game.pending_seat = any(candidates) then
      target := game.pending_seat;
    else
      target := candidates[1];
    end if;

    if target is null then
      perform public._flip7_discard(p_game_id, array[game.pending_card]);
    else
      perform public._flip7_resolve_action(p_game_id, game.pending_seat, game.pending_card, target);
    end if;
  elsif game.phase = 'turn' and game.turn_seat is not null then
    update public.flip7_players set state = 'stayed'
    where game_id = p_game_id and seat = game.turn_seat and state = 'active';
    update public.flip7_games set phase = 'resolve' where id = p_game_id;
    perform public._flip7_log(p_game_id,
      jsonb_build_object('t', 'skip', 'seat', game.turn_seat));
  else
    raise exception 'Gerade gibt es nichts zu überspringen.';
  end if;

  perform public._flip7_run(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Idempotent: called by every client when the round summary times out. The
-- host may go on at once, the others only 8 s after the round ended.
create or replace function public.flip7_next_round(p_game_id uuid, p_round_no integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if game.status <> 'round_over' or game.round_no is distinct from p_round_no then
    return;
  end if;

  perform public._flip7_my_seat(p_game_id);

  if not public._flip7_is_host(p_game_id)
     and now() < game.round_ended_at + interval '8 seconds' then
    return;
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;
  perform public._flip7_start_round(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Host ends the game; a running round is not scored.
create or replace function public.flip7_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status = 'finished' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.flip7_games set last_events = '[]' where id = p_game_id;
  if game.status = 'playing' then
    perform public._flip7_end_round(p_game_id, false);
  end if;

  update public.flip7_games set status = 'finished' where id = p_game_id;
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- "Weiterspielen": the finished game goes on without a target score.
create or replace function public.flip7_continue_open(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.flip7_games;
begin
  game := public._flip7_lock(p_game_id);

  if not public._flip7_is_host(p_game_id) then
    raise exception 'Nur der Host kann weiterspielen.';
  end if;

  if game.status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  if (select count(*) from public.flip7_players
      where game_id = p_game_id and state <> 'left') < 2 then
    raise exception 'Zum Weiterspielen braucht es mindestens 2 Spieler.';
  end if;

  update public.flip7_games set last_events = '[]', target_score = null where id = p_game_id;
  perform public._flip7_start_round(p_game_id);
  perform public._flip7_tick(game.lobby_id);
end;
$$;

-- Back to the waiting room with the same people: game gone, lobby open again,
-- everyone has to get ready again. Lock order lobby -> members -> game, like
-- leave/kick (member -> game via the trigger), so the two cannot deadlock.
create or replace function public.flip7_return_to_lobby(p_lobby_id uuid)
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
  from public.flip7_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.flip7_games where lobby_id = p_lobby_id;

  -- Kein Tick: die Lobby-Änderung schaltet alle Clients zurück in die Warte-Lobby,
  -- ein Tick würde das Spiel vorher noch als "kein Spiel" neu laden lassen
  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.start_lobby(uuid) from public, anon;
revoke execute on function public.flip7_hit(uuid, timestamptz) from public, anon;
revoke execute on function public.flip7_stay(uuid, timestamptz) from public, anon;
revoke execute on function public.flip7_choose_target(uuid, smallint, timestamptz) from public, anon;
revoke execute on function public.flip7_skip(uuid, timestamptz) from public, anon;
revoke execute on function public.flip7_next_round(uuid, integer) from public, anon;
revoke execute on function public.flip7_end_game(uuid) from public, anon;
revoke execute on function public.flip7_continue_open(uuid) from public, anon;
revoke execute on function public.flip7_return_to_lobby(uuid) from public, anon;

grant execute on function public.start_lobby(uuid) to authenticated;
grant execute on function public.flip7_hit(uuid, timestamptz) to authenticated;
grant execute on function public.flip7_stay(uuid, timestamptz) to authenticated;
grant execute on function public.flip7_choose_target(uuid, smallint, timestamptz) to authenticated;
grant execute on function public.flip7_skip(uuid, timestamptz) to authenticated;
grant execute on function public.flip7_next_round(uuid, integer) to authenticated;
grant execute on function public.flip7_end_game(uuid) to authenticated;
grant execute on function public.flip7_continue_open(uuid) to authenticated;
grant execute on function public.flip7_return_to_lobby(uuid) to authenticated;
