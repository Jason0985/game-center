-- Siege je Lobby („Abend-Wertung“): solange die Lobby offen ist, zählt jeder Sieg
-- (Uno: jede gewonnene Runde) für den Spieler. Schlüssel = user_id, bleibt beim Verlassen
-- und erneuten Beitreten erhalten und verschwindet mit der Lobby. Gezählt wird in den
-- Ergebnis-Triggern, nur wenn dort wirklich neue Ergebnisse geschrieben wurden.

alter table public.multiplayer_lobbies
  add column if not exists wins jsonb not null default '{}'
    check (jsonb_typeof(wins) = 'object');

create or replace function public._lobby_count_wins(p_lobby_id uuid, p_game_id uuid,
                                                    p_round_no integer)
returns void
language sql
security definer set search_path = ''
as $$
  update public.multiplayer_lobbies l
  set wins = l.wins || coalesce((
    select jsonb_object_agg(r.user_id, coalesce((l.wins ->> r.user_id::text)::int, 0) + 1)
    from public.game_results r
    where r.game_id = p_game_id and r.round_no = p_round_no and r.won
  ), '{}')
  where l.id = p_lobby_id;
$$;

revoke execute on function public._lobby_count_wins(uuid, uuid, integer)
  from public, anon, authenticated;

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
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Flip 7: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

create or replace function public._skipbo_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.game_results (game_id, user_id, game_key, placement, player_count, won, score)
  select new.id, r.user_id, 'skip-bo', r.placement, r.player_count, r.won, r.stock_count
  from (
    select p.user_id, p.stock_count, p.seat = new.winner_seat as won,
           rank() over (order by p.seat = new.winner_seat desc, p.state = 'left', p.stock_count)
             as placement,
           count(*) over () as player_count
    from public.skipbo_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, 0);
  end if;
  return null;
exception when others then
  raise warning 'Skip-Bo: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

create or replace function public._uno_record_result()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.game_results
    (game_id, round_no, user_id, game_key, placement, player_count, won, score)
  select new.id, new.round_no, r.user_id, 'uno', r.placement, r.player_count, r.won, r.hand_count
  from (
    select p.user_id, p.hand_count, p.seat = new.winner_seat as won,
           rank() over (
             order by p.seat = new.winner_seat desc, p.state = 'left', p.hand_count
           ) as placement,
           count(*) over () as player_count
    from public.uno_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  if found then
    perform public._lobby_count_wins(new.lobby_id, new.id, new.round_no);
  end if;
  return null;
exception when others then
  raise warning 'Uno: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;
