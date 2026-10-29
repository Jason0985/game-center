-- Kniffel: Joker-Regel für eine bestehende Datenbank. Ist das Kniffel-Feld schon belegt (mit 50
-- oder gestrichen) und fällt noch ein Kniffel, darf er als Full House (25), kleine Straße (30)
-- oder große Straße (40) mit voller Punktzahl eingetragen werden. Steht inzwischen auch im
-- Core-Schema; diese Datei bringt eine schon aufgesetzte Datenbank auf denselben Stand.
-- Gespiegelt in kniffel.model.ts (pointsFor). Lässt sich gefahrlos erneut ausführen.

-- Punkte für p_category mit Blick auf den Block p_scores (Joker), sonst wie _kniffel_points
create or replace function public._kniffel_score(
  p_dice smallint[],
  p_category integer,
  p_scores smallint[]
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_category in (8, 9, 10)
         and public._kniffel_points(p_dice, 11) = 50
         and p_scores[12] is not null
      then (array[25, 30, 40])[p_category - 7]
    else public._kniffel_points(p_dice, p_category)
  end;
$$;

revoke execute on function public._kniffel_score(smallint[], integer, smallint[])
  from public, anon, authenticated;

-- Wurf p_category für p_seat eintragen (Punkte aus den aktuellen Würfeln, mit Joker)
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
  set scores[p_category + 1] = public._kniffel_score(v_dice, p_category, scores)
  where game_id = p_game_id and seat = p_seat;
  update public.kniffel_players set total = public._kniffel_total(scores)
  where game_id = p_game_id and seat = p_seat;
end;
$$;

revoke execute on function public._kniffel_enter(uuid, smallint, integer)
  from public, anon, authenticated;

-- Host überspringt nach 30 s Wartezeit (25 s lassen Luft): noch nicht gewürfelt, würfelt
-- der Tisch einmal; eingetragen wird ins freie Feld mit den meisten Punkten (mit Joker).
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
  order by public._kniffel_score(v_dice, c, p.scores) desc, c
  limit 1;

  if v_category is not null then
    perform public._kniffel_enter(p_game_id, game.turn_seat, v_category);
  end if;
  perform public._kniffel_next_turn(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;
