-- ===========================================================================
-- Mensch ärgere dich nicht
-- ===========================================================================

-- Mensch ärgere dich nicht als neuntes Lobby-Spiel: 2–4 Spieler, je vier Figuren. Das Brett
-- hat 40 Felder im Kreis, jede Farbe startet zehn Felder nach der vorigen und hat vier
-- Zielfelder. Wer dran ist, würfelt einmal (ohne Figur auf der Laufbahn dreimal, bis eine 6
-- kommt) und zieht eine Figur um die Augenzahl. Mit einer 6 kommt man aus dem Haus und darf
-- nochmal würfeln. Wer auf einer fremden Figur landet, schickt sie ins Haus zurück. Wer
-- zuerst alle vier Figuren im Ziel hat, gewinnt.
--
-- Wie Kniffel: alle Züge über die security-definer-Funktionen unten, Clients lesen Spiel und
-- Spieler; jede öffentliche Funktion erhöht game_ticks genau einmal am Ende. Gewürfelt wird
-- nur hier (random()), geheim ist nichts.
--
-- Figuren zählen ab dem eigenen Startfeld: -1 = im Haus, 0–39 = Laufbahn (0 = Startfeld),
-- 40–43 = Ziel. Brettfeld einer Figur auf der Laufbahn: (color * 10 + Schritt) % 40.

-- ===========================================================================
-- Mensch: schema
-- ===========================================================================

create table if not exists public.mensch_games (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null unique references public.multiplayer_lobbies(id) on delete cascade,
  status text not null default 'playing' check (status in ('playing', 'finished')),
  seat_count smallint not null check (seat_count between 2 and 4),
  turn_seat smallint,
  -- roll: würfeln; move: mit die eine Figur ziehen
  phase text not null default 'roll' check (phase in ('roll', 'move')),
  -- Zuletzt gewürfelt und von wem (bleibt nach dem Zug zur Anzeige stehen)
  die smallint check (die between 1 and 6),
  rolled_seat smallint,
  -- Würfe ohne Zug in diesem Zug (ohne Figur auf der Laufbahn bis zu drei)
  tries smallint not null default 0 check (tries between 0 and 3),
  -- Zählt jeden Wurf; daran erkennen die Clients, dass sie den Würfel animieren müssen
  roll_seq integer not null default 0,
  winner_seat smallint,
  -- Neu bei jedem Wurf und jedem Zug
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);

-- user_id ohne Fremdschlüssel, wie kniffel_players
create table if not exists public.mensch_players (
  game_id uuid not null references public.mensch_games(id) on delete cascade,
  user_id uuid not null,
  seat smallint not null check (seat between 0 and 3),
  -- Farbe 0–3 (Rot, Blau, Grün, Gelb); zu zweit gegenüber
  color smallint not null check (color between 0 and 3),
  state text not null default 'active' check (state in ('active', 'left')),
  pieces smallint[] not null default array[-1, -1, -1, -1]::smallint[]
    check (cardinality(pieces) = 4),
  left_at timestamptz,
  primary key (game_id, user_id),
  unique (game_id, seat),
  unique (game_id, color)
);

-- ===========================================================================
-- Mensch: row level security and privileges
-- ===========================================================================

alter table public.mensch_games enable row level security;

alter table public.mensch_players enable row level security;

drop policy if exists "Multiplayer users can read mensch games" on public.mensch_games;
create policy "Multiplayer users can read mensch games"
  on public.mensch_games for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Multiplayer users can read mensch players" on public.mensch_players;
create policy "Multiplayer users can read mensch players"
  on public.mensch_players for select
  to authenticated
  using ((select public.can_use_multiplayer((select auth.uid()))));

drop policy if exists "Guests only see their mensch game" on public.mensch_games;
create policy "Guests only see their mensch game"
  on public.mensch_games as restrictive for select
  to authenticated
  using (not (select public.is_guest()) or lobby_id = (select public.my_lobby_id()));

drop policy if exists "Guests only see their mensch players" on public.mensch_players;
create policy "Guests only see their mensch players"
  on public.mensch_players as restrictive for select
  to authenticated
  using (
    not (select public.is_guest())
    or game_id = (
      select g.id from public.mensch_games g where g.lobby_id = (select public.my_lobby_id())
    )
  );

revoke all on public.mensch_games, public.mensch_players from anon;

revoke insert, update, delete, truncate, references, trigger
  on public.mensch_games, public.mensch_players from authenticated;

grant select on public.mensch_games, public.mensch_players to authenticated;

-- Mensch ärgere dich nicht in Lobby und Statistik zulassen
alter table public.multiplayer_lobbies
  drop constraint if exists multiplayer_lobbies_game_key_check,
  add constraint multiplayer_lobbies_game_key_check
    check (game_key is null
           or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack', 'nimm-6', 'skyjo',
                           'kniffel', 'mensch'));

alter table public.game_results
  drop constraint if exists game_results_game_key_check,
  add constraint game_results_game_key_check
    check (game_key in ('flip-7', 'skip-bo', 'uno', 'blackjack', 'nimm-6', 'skyjo', 'kniffel',
                        'mensch'));

-- ===========================================================================
-- Mensch: engine (intern, nicht über /rest/v1/rpc aufrufbar)
-- ===========================================================================

-- Wohin jede der vier Figuren von p_pieces mit p_die ziehen kann (null = gar nicht);
-- gespiegelt in mensch.model.ts. Auf ein Feld mit eigener Figur geht es nicht, im Ziel wird
-- nicht übersprungen. Pflichten: mit einer 6 raus aus dem Haus, solange das Startfeld frei
-- ist; steht eine eigene Figur auf dem Startfeld und sind noch Figuren im Haus, muss sie
-- weg (wenn sie kann).
create or replace function public._mensch_moves(p_pieces smallint[], p_die integer)
returns smallint[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_targets smallint[] := array[null, null, null, null]::smallint[];
  v_from smallint;
  v_to integer;
  v_home boolean := -1 = any(p_pieces);
  v_start integer := array_position(p_pieces, 0::smallint);
begin
  for i in 1..4 loop
    v_from := p_pieces[i];
    if v_from < 0 then
      v_to := case when p_die = 6 then 0 end;
    else
      v_to := v_from + p_die;
    end if;
    if v_to is not null and v_to <= 43
       and not exists (select 1 from unnest(p_pieces) as q
                       where q = v_to or (q >= 40 and q > v_from and q < v_to)) then
      v_targets[i] := v_to;
    end if;
  end loop;

  if v_home and p_die = 6 and v_start is null then
    -- Rauskommen
    for i in 1..4 loop
      if p_pieces[i] >= 0 then
        v_targets[i] := null;
      end if;
    end loop;
  elsif v_home and v_start is not null and v_targets[v_start] is not null then
    -- Startfeld räumen
    for i in 1..4 loop
      if i <> v_start then
        v_targets[i] := null;
      end if;
    end loop;
  end if;
  return v_targets;
end;
$$;

-- Nächster aktiver Spieler reihum, er würfelt
create or replace function public._mensch_next_turn(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  v_next smallint;
begin
  select * into game from public.mensch_games where id = p_game_id;

  select p.seat into v_next
  from public.mensch_players p
  where p.game_id = p_game_id and p.state = 'active'
  order by (p.seat - coalesce(game.turn_seat, -1) - 1 + 2 * game.seat_count) % game.seat_count
  limit 1;

  update public.mensch_games
  set turn_seat = v_next, phase = 'roll', tries = 0, waiting_since = now()
  where id = p_game_id;
end;
$$;

-- Würfelt für den Spieler am Zug. Kann er nicht ziehen: mit einer 6 nochmal, ohne Figur auf
-- der Laufbahn bis zu dreimal, sonst ist der Nächste dran.
create or replace function public._mensch_do_roll(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  v_pieces smallint[];
  v_die smallint := (1 + floor(random() * 6))::smallint;
begin
  update public.mensch_games
  set die = v_die, rolled_seat = turn_seat, tries = tries + 1, roll_seq = roll_seq + 1,
      waiting_since = now()
  where id = p_game_id
  returning * into game;

  select pieces into v_pieces
  from public.mensch_players where game_id = p_game_id and seat = game.turn_seat;

  if exists (select 1 from unnest(public._mensch_moves(v_pieces, v_die)) as t where t is not null) then
    update public.mensch_games set phase = 'move' where id = p_game_id;
  elsif v_die = 6 then
    update public.mensch_games set tries = 0 where id = p_game_id;
  elsif game.tries >= 3
        or exists (select 1 from unnest(v_pieces) as q where q between 0 and 39) then
    perform public._mensch_next_turn(p_game_id);
  end if;
end;
$$;

-- Zieht Figur p_piece (0–3) des Spielers am Zug mit dem liegenden Würfel. Schlägt eine
-- fremde Figur auf dem Zielfeld, sind alle vier im Ziel, gewinnt er; nach einer 6 würfelt er
-- nochmal, sonst ist der Nächste dran. Der Aufrufer hat geprüft, dass der Zug geht.
create or replace function public._mensch_do_move(p_game_id uuid, p_piece integer, p_to smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  me public.mensch_players;
  v_field integer;
begin
  select * into game from public.mensch_games where id = p_game_id;

  update public.mensch_players
  set pieces[p_piece + 1] = p_to
  where game_id = p_game_id and seat = game.turn_seat
  returning * into me;

  if p_to < 40 then
    v_field := (me.color * 10 + p_to) % 40;
    update public.mensch_players p
    set pieces = (
      select array_agg(case when q between 0 and 39 and (p.color * 10 + q) % 40 = v_field
                            then -1 else q end order by k)::smallint[]
      from unnest(p.pieces) with ordinality as u(q, k)
    )
    where p.game_id = p_game_id and p.seat <> me.seat and p.state = 'active'
      and exists (select 1 from unnest(p.pieces) as q
                  where q between 0 and 39 and (p.color * 10 + q) % 40 = v_field);
  end if;

  if (select bool_and(q >= 40) from unnest(me.pieces) as q) then
    update public.mensch_games
    set status = 'finished', winner_seat = me.seat, turn_seat = null, phase = 'roll',
        tries = 0, waiting_since = null
    where id = p_game_id;
  elsif game.die = 6 then
    update public.mensch_games
    set phase = 'roll', tries = 0, waiting_since = now()
    where id = p_game_id;
  else
    perform public._mensch_next_turn(p_game_id);
  end if;
end;
$$;

-- Ersetzt ein altes Spiel der Lobby. Sitze in Beitrittsreihenfolge, Host zuerst und beginnt;
-- zu zweit sitzen sich die Farben gegenüber. Der Aufrufer (start_lobby) hält die Sperren auf
-- Lobby und Mitglieder.
create or replace function public._mensch_create_game(p_lobby_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
  new_game_id uuid;
  v_count integer;
begin
  select * into lobby from public.multiplayer_lobbies where id = p_lobby_id;
  delete from public.mensch_games where lobby_id = p_lobby_id;

  select count(*) into v_count from public.multiplayer_lobby_members where lobby_id = p_lobby_id;

  insert into public.mensch_games (lobby_id, seat_count, turn_seat, waiting_since)
  values (p_lobby_id, v_count, 0, now())
  returning id into new_game_id;

  insert into public.mensch_players (game_id, user_id, seat, color)
  select new_game_id, s.user_id, s.seat, case when v_count = 2 then s.seat * 2 else s.seat end
  from (
    select m.user_id,
           (row_number() over (order by (m.user_id = lobby.host_user_id) desc, m.joined_at, m.user_id) - 1)
             as seat
    from public.multiplayer_lobby_members m
    where m.lobby_id = p_lobby_id
  ) s;

  -- Erste Tick-Zeile jetzt, solange die Lobby gesperrt ist (wie _kniffel_create_game)
  perform public._game_tick(p_lobby_id);
end;
$$;

-- Ein Spieler verlässt das Spiel (Kick, Verlassen, Konto gelöscht); seine Figuren verlassen
-- das Brett. Wirft nie, damit Verlassen der Lobby immer klappt; ein Fehler rollt nur den
-- Spielteil zurück. Ist er dran, ist der Nächste dran.
create or replace function public._mensch_remove_player(p_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  player public.mensch_players;
begin
  begin
    select * into game from public.mensch_games where id = p_game_id;
    if not found then
      return;
    end if;

    select * into player
    from public.mensch_players where game_id = p_game_id and user_id = p_user_id;
    if not found or player.state = 'left' then
      return;
    end if;

    update public.mensch_players set state = 'left', left_at = now()
    where game_id = p_game_id and seat = player.seat;

    if game.status <> 'playing' then
      return;
    end if;

    if (select count(*) from public.mensch_players
        where game_id = p_game_id and state = 'active') < 2 then
      update public.mensch_games
      set status = 'finished', turn_seat = null, phase = 'roll', tries = 0, waiting_since = null
      where id = p_game_id;
    elsif game.turn_seat = player.seat then
      perform public._mensch_next_turn(p_game_id);
    end if;
  exception when others then
    raise warning 'Mensch: Spieler % konnte nicht aus Spiel % entfernt werden: %',
      p_user_id, p_game_id, sqlerrm;
  end;
end;
$$;

create or replace function public._mensch_on_member_removed()
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
  from public.mensch_games where lobby_id = old.lobby_id
  for update;

  if v_game_id is not null then
    perform public._mensch_remove_player(v_game_id, old.user_id);
    perform public._game_tick(old.lobby_id);
  end if;
  return null;
end;
$$;

-- Läuft neben den Triggern der anderen Spiele; jeder findet nur sein eigenes Spiel.
drop trigger if exists multiplayer_lobby_members_mensch_leave on public.multiplayer_lobby_members;
create trigger multiplayer_lobby_members_mensch_leave
after delete on public.multiplayer_lobby_members
for each row execute function public._mensch_on_member_removed();

-- Sperrt das Spiel für eine öffentliche Funktion (immer zuerst, vor allen Schreibzugriffen).
create or replace function public._mensch_lock(p_game_id uuid)
returns public.mensch_games
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into game from public.mensch_games where id = p_game_id for update;
  if game.id is null then
    raise exception 'Dieses Spiel gibt es nicht mehr.';
  end if;
  return game;
end;
$$;

create or replace function public._mensch_is_host(p_game_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.mensch_games g
    join public.multiplayer_lobbies l on l.id = g.lobby_id
    where g.id = p_game_id and l.host_user_id = auth.uid()
  );
$$;

-- Der Aufrufer ist dran und die Ansicht aktuell. false = veraltete Ansicht (nichts tun);
-- nicht dran bzw. nicht dabei wirft.
create or replace function public._mensch_my_turn(p_game public.mensch_games, p_waiting_since timestamptz)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if p_game.status <> 'playing' or p_game.waiting_since is distinct from p_waiting_since then
    return false;
  end if;
  if not exists (select 1 from public.mensch_players
                 where game_id = p_game.id and seat = p_game.turn_seat
                   and user_id = auth.uid() and state = 'active') then
    raise exception 'Du bist nicht am Zug.';
  end if;
  return true;
end;
$$;

revoke execute on function public._mensch_moves(smallint[], integer) from public, anon, authenticated;

revoke execute on function public._mensch_next_turn(uuid) from public, anon, authenticated;

revoke execute on function public._mensch_do_roll(uuid) from public, anon, authenticated;

revoke execute on function public._mensch_do_move(uuid, integer, smallint) from public, anon, authenticated;

revoke execute on function public._mensch_create_game(uuid) from public, anon, authenticated;

revoke execute on function public._mensch_remove_player(uuid, uuid) from public, anon, authenticated;

revoke execute on function public._mensch_on_member_removed() from public, anon, authenticated;

revoke execute on function public._mensch_lock(uuid) from public, anon, authenticated;

revoke execute on function public._mensch_is_host(uuid) from public, anon, authenticated;

revoke execute on function public._mensch_my_turn(public.mensch_games, timestamptz)
  from public, anon, authenticated;

-- ===========================================================================
-- Mensch: öffentliche Funktionen
-- ===========================================================================

create or replace function public.mensch_roll(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
begin
  game := public._mensch_lock(p_game_id);

  if not public._mensch_my_turn(game, p_waiting_since) then
    return;
  end if;

  if game.phase <> 'roll' then
    raise exception 'Erst ziehen, dann würfeln.';
  end if;

  perform public._mensch_do_roll(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Figur p_piece (0–3) mit dem liegenden Würfel ziehen
create or replace function public.mensch_move(p_game_id uuid, p_waiting_since timestamptz, p_piece integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  v_to smallint;
begin
  game := public._mensch_lock(p_game_id);

  if not public._mensch_my_turn(game, p_waiting_since) then
    return;
  end if;

  if game.phase <> 'move' then
    raise exception 'Erst würfeln, dann ziehen.';
  end if;

  if p_piece is null or p_piece not between 0 and 3 then
    raise exception 'Diese Figur gibt es nicht.';
  end if;

  select (public._mensch_moves(p.pieces, game.die))[p_piece + 1] into v_to
  from public.mensch_players p
  where p.game_id = p_game_id and p.seat = game.turn_seat;

  if v_to is null then
    raise exception 'Diese Figur kann nicht ziehen.';
  end if;

  perform public._mensch_do_move(p_game_id, p_piece, v_to);
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host überspringt nach 30 s Wartezeit (25 s lassen Luft): der Tisch spielt den ganzen Zug,
-- bis der Nächste dran ist – würfeln und jeweils die Figur ziehen, die am weitesten kommt.
create or replace function public.mensch_skip(p_game_id uuid, p_waiting_since timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
  v_seat smallint;
  v_piece integer;
  v_to smallint;
begin
  game := public._mensch_lock(p_game_id);

  if not public._mensch_is_host(p_game_id) then
    raise exception 'Nur der Host kann überspringen.';
  end if;

  -- Inzwischen ist es weitergegangen: nichts zu tun
  if game.waiting_since is distinct from p_waiting_since or game.status <> 'playing' then
    return;
  end if;

  if game.waiting_since > now() - interval '25 seconds' then
    raise exception 'Überspringen geht erst nach 30 Sekunden Wartezeit.';
  end if;

  -- Höchstens 30 Schritte, falls jemand ewig Sechsen würfelt
  v_seat := game.turn_seat;
  for i in 1..30 loop
    exit when game.status <> 'playing' or game.turn_seat is distinct from v_seat;
    if game.phase = 'roll' then
      perform public._mensch_do_roll(p_game_id);
    else
      select t.k - 1, t.target into v_piece, v_to
      from public.mensch_players p,
           unnest(public._mensch_moves(p.pieces, game.die)) with ordinality as t(target, k)
      where p.game_id = p_game_id and p.seat = game.turn_seat and t.target is not null
      order by t.target desc, t.k
      limit 1;

      perform public._mensch_do_move(p_game_id, v_piece, v_to);
    end if;
    select * into game from public.mensch_games where id = p_game_id;
  end loop;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Host beendet das Spiel; gewertet wird der Stand bis dahin.
create or replace function public.mensch_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.mensch_games;
begin
  game := public._mensch_lock(p_game_id);

  if not public._mensch_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel beenden.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits beendet.';
  end if;

  update public.mensch_games
  set status = 'finished', turn_seat = null, phase = 'roll', tries = 0, waiting_since = null
  where id = p_game_id;
  perform public._game_tick(game.lobby_id);
end;
$$;

-- Zurück in die Warte-Lobby mit denselben Leuten (wie kniffel_return_to_lobby).
-- Sperrreihenfolge Lobby -> Mitglieder -> Spiel wie Verlassen/Kick.
create or replace function public.mensch_return_to_lobby(p_lobby_id uuid)
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
  from public.mensch_games where lobby_id = p_lobby_id
  for update;

  if game_status is not null and game_status <> 'finished' then
    raise exception 'Das Spiel läuft noch.';
  end if;

  delete from public.mensch_games where lobby_id = p_lobby_id;

  update public.multiplayer_lobbies
  set status = 'open', started_at = null
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.mensch_roll(uuid, timestamptz) from public, anon;

revoke execute on function public.mensch_move(uuid, timestamptz, integer) from public, anon;

revoke execute on function public.mensch_skip(uuid, timestamptz) from public, anon;

revoke execute on function public.mensch_end_game(uuid) from public, anon;

revoke execute on function public.mensch_return_to_lobby(uuid) from public, anon;

grant execute on function public.mensch_roll(uuid, timestamptz) to authenticated;

grant execute on function public.mensch_move(uuid, timestamptz, integer) to authenticated;

grant execute on function public.mensch_skip(uuid, timestamptz) to authenticated;

grant execute on function public.mensch_end_game(uuid) to authenticated;

grant execute on function public.mensch_return_to_lobby(uuid) to authenticated;

-- ===========================================================================
-- Mensch: Statistik und Abend-Wertung
-- ===========================================================================

-- Ein Ergebnis je Spieler: Rang nach Figuren im Ziel, dann wie weit die Figuren gekommen
-- sind; score = Figuren im Ziel. Am Ende allein zählt nichts. Ein Fehler hier darf den Zug
-- nie abbrechen.
create or replace function public._mensch_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.mensch_players
      where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'mensch', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.goal
  from (
    select p.user_id, p.state, s.goal,
           rank() over (order by p.state = 'left', s.goal desc, s.steps desc) as placement,
           count(*) over () as player_count
    from public.mensch_players p
    cross join lateral (
      select count(*) filter (where q >= 40)::integer as goal,
             sum(greatest(q, -1) + 1)::integer as steps
      from unnest(p.pieces) as q
    ) s
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Mensch: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists mensch_games_record_result on public.mensch_games;
create trigger mensch_games_record_result
after update of status on public.mensch_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._mensch_record_result();

revoke execute on function public._mensch_record_result() from public, anon, authenticated;

-- ===========================================================================
-- Lobby: Mensch ärgere dich nicht wählen und starten
-- ===========================================================================

-- Wie in 20261022120000_kniffel.sql, plus Mensch (ohne Einstellungen, nur {}).
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
  elsif p_game_key in ('monopoly', 'nimm-6', 'kniffel', 'mensch') then
    -- Monopoly läuft extern, Nimm 6, Kniffel und Mensch haben keine Einstellungen
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

-- Wie in 20261022120000_kniffel.sql, plus Mensch (2–4 Spieler).
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

  if lobby.game_key = 'mensch' and member_count > 4 then
    raise exception 'Mensch ärgere dich nicht geht mit höchstens 4 Spielern.';
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
  elsif lobby.game_key = 'mensch' then
    perform public._mensch_create_game(p_lobby_id);
  else
    perform public._flip7_create_game(p_lobby_id);
  end if;
end;
$$;
