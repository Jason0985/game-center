-- Spielergebnisse für Statistiken (Profil, Statistik-Seite, Home).
--
-- Spiele hängen an der Lobby und verschwinden mit „Zurück zur Lobby“ und dem Lobby-Cleanup,
-- die Ergebnisse bleiben. Ein Trigger je Spiel schreibt beim Wechsel auf 'finished' eine Zeile
-- je Spieler. Vorzeitig beendete Spiele (ohne Sieger bzw. mit weniger als 2 Spielern) zählen
-- nicht. Uno hat kein Punkteziel: jede Runde ist ein Ergebnis.

create table if not exists public.game_results (
  game_id uuid not null,
  -- Uno: Rundennummer, sonst 0
  round_no integer not null default 0,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key in ('flip-7', 'skip-bo', 'uno')),
  placement smallint not null check (placement >= 1),
  player_count smallint not null check (player_count >= 2),
  won boolean not null,
  -- Flip 7: Gesamtpunkte; Uno: Rundenpunkte (Sieger: Summe der anderen, sonst Restkarten);
  -- Skip-Bo: Karten, die noch im Spielstapel lagen
  score integer,
  finished_at timestamptz not null default now(),
  primary key (game_id, round_no, user_id)
);

create index if not exists game_results_user_finished_idx
  on public.game_results (user_id, finished_at desc);

alter table public.game_results enable row level security;

drop policy if exists "Users can read their own game results" on public.game_results;
create policy "Users can read their own game results"
  on public.game_results for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Schreiben nur über die Trigger
revoke all on public.game_results from anon, authenticated;
grant select on public.game_results to authenticated;

-- Platzierung über alle Spieler, gespeichert nur für noch vorhandene Konten. Ein Fehler hier
-- darf den Spielzug nie abbrechen, daher nur eine Warnung.

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
  select new.id, new.round_no, r.user_id, 'uno', r.placement, r.player_count, r.won, r.round_points
  from (
    select p.user_id, p.round_points, p.seat = new.winner_seat as won,
           rank() over (
             order by p.seat = new.winner_seat desc, p.state = 'left', p.round_points nulls last
           ) as placement,
           count(*) over () as player_count
    from public.uno_players p
    where p.game_id = new.id
  ) r
  where exists (select 1 from auth.users u where u.id = r.user_id)
  on conflict do nothing;
  return null;
exception when others then
  raise warning 'Uno: Ergebnis von Spiel % nicht gespeichert: %', new.id, sqlerrm;
  return null;
end;
$$;

drop trigger if exists flip7_games_record_result on public.flip7_games;
create trigger flip7_games_record_result
after update of status on public.flip7_games
for each row when (new.status = 'finished' and old.status <> 'finished')
execute function public._flip7_record_result();

drop trigger if exists skipbo_games_record_result on public.skipbo_games;
create trigger skipbo_games_record_result
after update of status on public.skipbo_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and new.winner_seat is not null)
execute function public._skipbo_record_result();

drop trigger if exists uno_games_record_result on public.uno_games;
create trigger uno_games_record_result
after update of status on public.uno_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and new.winner_seat is not null)
execute function public._uno_record_result();

revoke execute on function public._flip7_record_result() from public, anon, authenticated;
revoke execute on function public._skipbo_record_result() from public, anon, authenticated;
revoke execute on function public._uno_record_result() from public, anon, authenticated;

-- Härtung: Profile legt nur handle_new_user an, gelöscht wird über das Konto. Ohne Policy
-- blockiert RLS das schon, die Rechte braucht der Client aber nie.
revoke insert, delete on public.profiles from authenticated;
