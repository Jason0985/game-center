-- ===========================================================================
-- Kniffel
-- ===========================================================================

-- Kniffel als achtes Lobby-Spiel: 2–8 Spieler, je 13 Felder auf dem Block. Wer dran ist,
-- würfelt bis zu dreimal (gehaltene Würfel bleiben liegen) und trägt den Wurf in ein freies
-- Feld ein, notfalls mit 0. Oben zählen nur die Augen der Zahl (Bonus 35 ab 63), unten:
-- Dreier-/Viererpasch = alle Augen, Full House 25, Kleine Straße 30, Große Straße 40,
-- Kniffel 50, Chance = alle Augen. Sind alle Felder voll, gewinnt die höchste Summe.
--
-- Wie Skyjo: alle Züge über die security-definer-Funktionen unten, Clients lesen Spiel und
-- Spieler; jede öffentliche Funktion erhöht game_ticks genau einmal am Ende. Gewürfelt wird
-- nur hier (random()), geheim ist nichts.

-- ===========================================================================
-- Kniffel: schema
-- ===========================================================================

create table if not exists public.kniffel_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  seat_count smallint not null check (seat_count between 2 and 8),
  turn_seat smallint,
  -- Würfel des laufenden Zugs (leer vor dem ersten Wurf), gehaltene Würfel, Würfe 0–3
  dice smallint[] not null default '{}',
  held boolean[] not null default array[false, false, false, false, false],
  rolls smallint not null default 0 check (rolls between 0 and 3),
  -- Zählt jeden Wurf; daran erkennen die Clients, dass sie die Würfel animieren müssen
  roll_seq integer not null default 0,
  -- Neu bei jedem Wurf und jedem Zug (Halten ändert ihn nicht)
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie skyjo_players
create table if not exists public.kniffel_players (
  game_id uuid not null references public.kniffel_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 7),
  state text not null default 'active' check (state in ('active', 'left')),
  -- Felder 0–12 an Index 1–13 (Einser … Sechser, Dreierpasch, Viererpasch, Full House,
  -- Kleine Straße, Große Straße, Kniffel, Chance); null = frei
  scores smallint[] not null default array_fill(null::smallint, array[13]),
  -- Summe mit Bonus
  total integer not null default 0,
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat)
);

-- ===========================================================================
-- Kniffel: row level security and privileges
-- ===========================================================================

alter table public.kniffel_games enable row level security;

alter table public.kniffel_players enable row level security;

drop policy if exists "Multiplayer users can read kniffel games" on public.kniffel_games;
create policy "Multiplayer users can read kniffel games"
  on public.kniffel_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read kniffel players" on public.kniffel_players;
create policy "Multiplayer users can read kniffel players"
  on public.kniffel_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Guests only see their kniffel game" on public.kniffel_games;
create policy "Guests only see their kniffel game"
  on public.kniffel_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their kniffel players" on public.kniffel_players;
create policy "Guests only see their kniffel players"
  on public.kniffel_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.kniffel_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

revoke all on public.kniffel_games, public.kniffel_players from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.kniffel_games, public.kniffel_players from authenticated;

grant select on public.kniffel_games, public.kniffel_players to authenticated;

-- Kniffel in Lobby und Statistik zulassen
alter table public.multiplayer_lobbies
  drop constraint if exists multiplayer_lobbies_game_key_check,
  add constraint multiplayer_lobbies_game_key_check
    check (game_key is null
           or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack', 'nimm-6', 'skyjo',
                           'kniffel'));

alter table public.game_results
  drop constraint if exists game_results_game_key_check,
  add constraint game_results_game_key_check
    check (game_key in ('flip-7', 'skip-bo', 'uno', 'blackjack', 'nimm-6', 'skyjo', 'kniffel'));

-- ===========================================================================
-- Kniffel: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Punkte von fünf Würfeln im Feld p_category (0–12); gespiegelt in kniffel.model.ts
create or replace function public._kniffel_points(p_dice smallint[], p_category integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  with counts as (
    select f, (select count(*) from unnest(p_dice) as d where d = f)::integer as n
    from generate_series(1, 6) as f
  ),
  s as (
    select (select coalesce(sum(d), 0) from unnest(p_dice) as d)::integer as total,
           (select max(n) from counts) as most,
           (select array_agg(f order by f) from counts where n > 0) as faces,
           (select array_agg(n order by n) from counts where n > 0) as shape
  )
  select case
    when p_category between 0 and 5 then
      (p_category + 1) * (select n from counts where f = p_category + 1)
    when p_category = 6 then case when most >= 3 then total else 0 end
    when p_category = 7 then case when most >= 4 then total else 0 end
    when p_category = 8 then case when shape = array[2, 3] then 25 else 0 end
    when p_category = 9 then
      case when faces @> array[1, 2, 3, 4] or faces @> array[2, 3, 4, 5]
                or faces @> array[3, 4, 5, 6] then 30 else 0 end
    when p_category = 10 then
      case when faces = array[1, 2, 3, 4, 5] or faces = array[2, 3, 4, 5, 6] then 40 else 0 end
    when p_category = 11 then case when most = 5 then 50 else 0 end
    when p_category = 12 then total
  end
  from s;
$$;

-- Summe eines Blocks mit Bonus (35, wenn oben mindestens 63)
create or replace function public._kniffel_total(p_scores smallint[])
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(sum(v), 0)::integer
         + case when coalesce(sum(v) filter (where i <= 6), 0) >= 63 then 35 else 0 end
  from unnest(p_scores) with ordinality as s(v, i);
$$;

-- Fünf neue Würfel; gehaltene (p_held) bleiben liegen
create or replace function public._kniffel_throw(p_dice smallint[], p_held boolean[])
returns smallint[]
language sql
volatile
set search_path = ''
as $$
  select array_agg(case when coalesce(p_held[i], false) and p_dice[i] is not null then p_dice[i]
                        else (1 + floor(random() * 6))::smallint end
                   order by i)
  from generate_series(1, 5) as i;
$$;

-- Wurf p_category für p_seat eintragen (Punkte aus den aktuellen Würfeln)
create or replace function public._kniffel_enter(p_game_id uuid, p_seat smallint, p_category integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_dice smallint[];
begin
  select dice into v_dice from public.kniffel_games where id = p_game_id;
  update public.kniffel_players
  set scores[p_category + 1] = public._kniffel_points(v_dice, p_category)
  where game_id = p_game_id and seat = p_seat;
  update public.kniffel_players set total = public._kniffel_total(scores)
  where game_id = p_game_id and seat = p_seat;
end;
$$;

-- Nächster aktiver Spieler reihum, der noch freie Felder hat; keiner mehr: Spiel vorbei
create or replace function public._kniffel_next_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
  v_next smallint;
begin
  select * into game from public.kniffel_games where id = p_game_id;

  select p.seat into v_next
  from public.kniffel_players p
  where p.game_id = p_game_id and p.state = 'active' and array_position(p.scores, null) is not null
  order by (p.seat - coalesce(game.turn_seat, -1) - 1 + 2 * game.seat_count) % game.seat_count
  limit 1;

  if v_next is null then
    update public.kniffel_games
    set status = 'finished', turn_seat = null, dice = '{}',
        held = array[false, false, false, false, false], rolls = 0, waiting_since = null
    where id = p_game_id;
  else
    update public.kniffel_games
    set turn_seat = v_next, dice = '{}', held = array[false, false, false, false, false],
        rolls = 0, waiting_since = now()
    where id = p_game_id;
  end if;
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst und beginnt.
-- Der Aufrufer (start_lobby) hält die Sperren auf Lobby und Mitglieder.
create or replace function public._kniffel_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.kniffel_games where lobby_id = p_lobby_id;

  insert into public.kniffel_games (lobby_id, seat_count, turn_seat, waiting_since)
  values (p_lobby_id,
          (select count(*) from public.multiplayer_lobby_members where lobby_id = p_lobby_id),
          0, now())
  returning id into new_game_id;

  insert into public.kniffel_players (game_id, user_id, seat)
  select new_game_id, m.user_id,
         (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
  from public.multiplayer_lobby_members m
  where m.lobby_id = p_lobby_id;

  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist (wie _skyjo_create_game)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht). Wirft nie, damit
-- Verlassen der Lobby immer klappt; ein Fehler rollt nur den Spielteil zurück. Ist er
-- dran, ist der Nächste dran.
create or replace function public._kniffel_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
  player public.kniffel_players;
begin
  begin
    select * into game from public.kniffel_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.kniffel_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.kniffel_players set state = 'left', left_at = now()
    where game_id = p_game_id and seat = player.seat;

    if game.status <> 'playing' then
      return;
    end if;

    if (select count(*) from public.kniffel_players
        where game_id = p_game_id and state = 'active') < 2 then
      update public.kniffel_games
      set status = 'finished', turn_seat = null, dice = '{}', rolls = 0, waiting_since = null
      where id = p_game_id;
    elsif game.turn_seat = player.seat then
      perform public._kniffel_next_turn(p_game_id);
    end if;
  exception when others then
    raise warning 'Kniffel: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._kniffel_on_member_removed()
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
  from public.kniffel_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._kniffel_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Triggern der anderen Spiele; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_kniffel_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_kniffel_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._kniffel_on_member_removed();

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._kniffel_lock(p_game_id uuid)
returns public.kniffel_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.kniffel_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._kniffel_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.kniffel_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Der Aufrufer ist dran und die Ansicht aktuell. false = veraltete Ansicht (nichts tun);
-- nicht dran bzw. nicht dabei wirft.
create or replace function public._kniffel_my_turn(p_game public.kniffel_games, p_waiting_since timestamptz)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if p_game.status <> 'playing' or p_game.waiting_since is distinct from p_waiting_since then
    return false;
  end if;
  if not exists (select 1 from public.kniffel_players
                 where game_id = p_game.id and seat = p_game.turn_seat
                   and user_id = auth.uid() and state = 'active') then
    raise exception 'Du bist nicht am Zug.';
  end if;
  return true;
end;
$$;

revoke execute on function public._kniffel_points(smallint[], integer) from public, anon, authenticated;

revoke execute on function public._kniffel_total(smallint[]) from public, anon, authenticated;

revoke execute on function public._kniffel_throw(smallint[], boolean[]) from public, anon, authenticated;

revoke execute on function public._kniffel_enter(uuid, smallint, integer) from public, anon, authenticated;

revoke execute on function public._kniffel_next_turn(uuid) from public, anon, authenticated;

revoke execute on function public._kniffel_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._kniffel_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._kniffel_on_member_removed() from public, anon, authenticated;

revoke execute on function public._kniffel_lock(uuid) from public, anon, authenticated;

revoke execute on function public._kniffel_is_host(uuid) from public, anon, authenticated;

revoke execute on function public._kniffel_my_turn(public.kniffel_games, timestamptz)
  from public, anon, authenticated;

-- ===========================================================================
-- Kniffel: öffentliche Funktionen
-- ===========================================================================

-- Würfeln (höchstens dreimal je Zug). p_held: welche Würfel liegen bleiben; beim ersten
-- Wurf werden alle geworfen.
create or replace function public.kniffel_roll(p_game_id uuid, p_waiting_since timestamptz, p_held boolean[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
  v_held boolean[];
begin
  game := public._kniffel_lock(p_game_id);

  if not public._kniffel_my_turn(game, p_waiting_since) then
    return;
  end if;

  if game.rolls >= 3 then
    raise exception 'Du hast schon dreimal gewürfelt.';
  end if;

  if game.rolls = 0 then
    v_held := array[false, false, false, false, false];
  elsif cardinality(p_held) is distinct from 5 or array_position(p_held, null) is not null then
    raise exception 'Ungültige Würfel.';
  elsif array_position(p_held, false) is null then
    raise exception 'Alle Würfel werden gehalten.';
  else
    v_held := p_held;
  end if;

  update public.kniffel_games
  set dice = public._kniffel_throw(dice, v_held), held = v_held, rolls = rolls + 1,
      roll_seq = roll_seq + 1, waiting_since = now()
  where id = p_game_id;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Würfel halten bzw. freigeben, damit alle am Tisch es sehen. Ändert waiting_since nicht;
-- der Wurf bringt die gehaltenen Würfel ohnehin mit.
create or replace function public.kniffel_hold(p_game_id uuid, p_waiting_since timestamptz, p_held boolean[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
begin
  game := public._kniffel_lock(p_game_id);

  if not public._kniffel_my_turn(game, p_waiting_since) or game.rolls = 0 then
    return;
  end if;

  if cardinality(p_held) is distinct from 5 or array_position(p_held, null) is not null then
    raise exception 'Ungültige Würfel.';
  end if;

  update public.kniffel_games set held = p_held where id = p_game_id;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Wurf in ein freies Feld p_category (0–12) eintragen; danach ist der Nächste dran.
create or replace function public.kniffel_score(p_game_id uuid, p_waiting_since timestamptz, p_category integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
begin
  game := public._kniffel_lock(p_game_id);

  if not public._kniffel_my_turn(game, p_waiting_since) then
    return;
  end if;

  if game.rolls = 0 then
    raise exception 'Erst würfeln, dann eintragen.';
  end if;

  if p_category is null or p_category not between 0 and 12 then
    raise exception 'Dieses Feld gibt es nicht.';
  end if;

  if (select scores[p_category + 1] from public.kniffel_players
      where game_id = p_game_id and seat = game.turn_seat) is not null then
    raise exception 'Das Feld ist schon ausgefüllt.';
  end if;

  perform public._kniffel_enter(p_game_id, game.turn_seat, p_category);
  perform public._kniffel_next_turn(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host überspringt nach 30 s Wartezeit (25 s lassen Luft): noch nicht gewürfelt, würfelt
-- der Tisch einmal; eingetragen wird ins freie Feld mit den meisten Punkten.
create or replace function public.kniffel_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
  v_dice smallint[];
  v_category integer;
begin
  game := public._kniffel_lock(p_game_id);

  if not public._kniffel_is_host(p_game_id) then
    raise exception 'Nur der Host kann überspringen.';
  end if;

  -- Inzwischen ist es weitergegangen: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since or game.status <> 'playing' then
    return;
  end if;

  if game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  v_dice := game.dice;
  if game.rolls = 0 then
    v_dice := public._kniffel_throw('{}', '{}');
    update public.kniffel_games
    set dice = v_dice, rolls = 1, roll_seq = roll_seq + 1
    where id = p_game_id;
  end if;

  select c into v_category
  from public.kniffel_players p, generate_series(0, 12) as c
  where p.game_id = p_game_id and p.seat = game.turn_seat and p.scores[c + 1] is null
  order by public._kniffel_points(v_dice, c) desc, c
  limit 1;

  if v_category is not null then
    perform public._kniffel_enter(p_game_id, game.turn_seat, v_category);
  end if;
  perform public._kniffel_next_turn(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet das Spiel; gewertet wird der Stand bis dahin.
create or replace function public.kniffel_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.kniffel_games;
begin
  game := public._kniffel_lock(p_game_id);

  if not public._kniffel_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.kniffel_games
  set status = 'finished', turn_seat = null, dice = '{}', rolls = 0, waiting_since = null
  where id = p_game_id;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie skyjo_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick.
create or replace function public.kniffel_return_to_lobby(p_lobby_id uuid)
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
  from public.kniffel_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.kniffel_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.kniffel_roll(uuid, timestamptz, boolean[]) from public, anon;

revoke execute on function public.kniffel_hold(uuid, timestamptz, boolean[]) from public, anon;

revoke execute on function public.kniffel_score(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.kniffel_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.kniffel_end_game(uuid) from public, anon;

revoke execute on function public.kniffel_return_to_lobby(uuid) from public, anon;

grant execute on function public.kniffel_roll(uuid, timestamptz, boolean[]) to authenticated;

grant execute on function public.kniffel_hold(uuid, timestamptz, boolean[]) to authenticated;

grant execute on function public.kniffel_score(uuid, timestamptz, integer) to authenticated;

grant execute on function public.kniffel_skip(uuid, timestamptz) to authenticated;

grant execute on function public.kniffel_end_game(uuid) to authenticated;

grant execute on function public.kniffel_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Kniffel: Statistik und Abend-Wertung
-- ===========================================================================

-- Ein Ergebnis je Spieler, Rang nach Summe (höchste zuerst). Am Ende allein oder bevor
-- jeder etwas eingetragen hat, zählt nichts. Ein Fehler hier darf den Zug nie abbrechen.
create or replace function public._kniffel_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.kniffel_players
      where game_id = new.id and state <> 'left') < 2
     or exists (select 1 from public.kniffel_players
                where game_id = new.id and state <> 'left' and array_remove(scores, null) = '{}') then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'kniffel', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.total
  from (
    select p.user_id, p.state, p.total,
           rank() over (order by p.state = 'left', p.total desc) as placement,
           count(*) over () as player_count
    from public.kniffel_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Kniffel: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists kniffel_games_record_result on public.kniffel_games;
create trigger kniffel_games_record_result
after update of status on public.kniffel_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._kniffel_record_result();

revoke execute on function public._kniffel_record_result() from public, anon, authenticated;

-- ===========================================================================
-- Lobby: Kniffel wählen und starten
-- ===========================================================================

-- Wie in 20261014200000_skyjo.sql, plus Kniffel (ohne Einstellungen, nur {}).
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
  elsif p_game_key in ('monopoly', 'nimm-6', 'kniffel') then
    -- Monopoly läuft extern, Nimm 6 und Kniffel haben keine Einstellungen
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

-- Wie in 20261014200000_skyjo.sql, plus Kniffel (2–8 Spieler, Grenze der Lobby).
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
  elsif lobby.game_key = 'kniffel' then
    perform public._kniffel_create_game(p_lobby_id);
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;
