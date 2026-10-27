-- Flip 7 „Weiterspielen“: Das Spiel kann nach 'finished' wieder laufen und erneut enden.
-- Der Endstand ersetzt dann das erste Ergebnis – Statistik und Abend-Sieg wandern zu dem,
-- der am Ende vorne liegt. Bisher blieb wegen „on conflict do nothing“ der erste Stand
-- stehen und die Abend-Wertung wurde nicht angefasst.

create or replace function public._flip7_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.flip7_players
      where game_id = new.id and state <> 'left') < 2 then
    return null;
  end if;

  -- Abend-Siege aus einem früheren Ende dieses Spiels zurücknehmen, unten neu zählen
  update public.multiplayer_lobbies l
  set wins = l.wins || coalesce((
    select jsonb_object_agg(r.user_id,
             greatest(coalesce((l.wins ->> r.user_id::text)::int, 0) - 1, 0))
    from public.game_results r
    where r.game_id = new.id and r.round_no = 0 and r.won
  ), '{}')
  where l.id = new.lobby_id;

  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'flip-7', r.placement, r.player_count,
         r.placement = 1 and r.state <> 'left', r.total_score
  from (
    select p.user_id, p.state, p.total_score,
           rank() over (order by p.state = 'left', p.total_score desc) as placement,
           count(*) over () as player_count
    from public.flip7_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict (game_id, round_no, user_id) do update
    set placement = excluded.placement,
        player_count = excluded.player_count,
        won = excluded.won,
        score = excluded.score,
        finished_at = now();

  perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  return null;
exception when others then
  raise warning 'Flip 7: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;
