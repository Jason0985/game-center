-- Skyjo: keine Zugzeit mehr, nur der Host kann nach 30 s Wartezeit überspringen.
-- Sonst wie in 20261014200000_skyjo.sql.

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
    raise exception 'Nur der Host kann überspringen.';
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
