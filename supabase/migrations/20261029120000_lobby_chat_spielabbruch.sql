-- Lobby-Chat und Spielabbruch ohne Wertung.
--
-- Spielabbruch: Beendet der Host ein Spiel mit eigenem Ende (Flip 7, Skip-Bo,
-- Nimm 6, Skyjo, Kniffel) vorzeitig, ist das ein Abbruch: kein Ergebnis, keine Abend-Siege, alle
-- kehren gleich in die Warte-Lobby zurück. Die Abbruch-Funktion setzt dafür game.aborted nur für
-- ihre Transaktion; die Ergebnis-Trigger springen dann nicht an. Blackjack und Uno haben kein
-- eigenes Ende, dort bleibt „Spiel beenden“ der normale Abschluss mit Wertung.
-- Lobby-Chat: siehe unten.
-- Beides steht auch im Core-Schema. Lässt sich gefahrlos erneut ausführen.

-- flip7: Abbruch ohne Wertung, danach zurück in die Warte-Lobby
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
    raise exception 'Nur der Host kann das Spiel abbrechen.';
  end if;

  if game.status = 'finished' then
    raise exception 'Das Spiel ist bereits vorbei.';
  end if;

  -- Abbruch: die Ergebnis-Trigger werten das nicht (gilt nur in dieser Transaktion)
  perform set_config('game.aborted', 'on', true);

  update public.flip7_games set last_events = '[]' where id = p_game_id;
  if game.status = 'playing' then
    perform public._flip7_end_round(p_game_id, false);
  end if;

  update public.flip7_games set status = 'finished' where id = p_game_id;
  perform public._flip7_tick(game.lobby_id);
  perform public.flip7_return_to_lobby(game.lobby_id);
end;
$$;

-- skipbo: Abbruch ohne Wertung, danach zurück in die Warte-Lobby
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
    raise exception 'Nur der Host kann das Spiel abbrechen.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits vorbei.';
  end if;

  -- Abbruch: die Ergebnis-Trigger werten das nicht (gilt nur in dieser Transaktion)
  perform set_config('game.aborted', 'on', true);

  update public.skipbo_games
  set last_events = '[]', status = 'finished', winner_seat = null,
      turn_seat = null, waiting_since = null
  where id = p_game_id;
  perform public._skipbo_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public.skipbo_return_to_lobby(game.lobby_id);
end;
$$;

-- nimm6: Abbruch ohne Wertung, danach zurück in die Warte-Lobby
create or replace function public.nimm6_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.nimm6_games;
begin
  game := public._nimm6_lock(p_game_id);

  if not public._nimm6_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel abbrechen.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits vorbei.';
  end if;

  -- Abbruch: die Ergebnis-Trigger werten das nicht (gilt nur in dieser Transaktion)
  perform set_config('game.aborted', 'on', true);

  update public.nimm6_hands set chosen = null where game_id = p_game_id;
  update public.nimm6_players set ready = false where game_id = p_game_id;
  update public.nimm6_games
  set last_events = '[]', status = 'finished', take_seat = null, waiting_since = null
  where id = p_game_id;
  perform public._nimm6_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
  perform public.nimm6_return_to_lobby(game.lobby_id);
end;
$$;

-- skyjo: Abbruch ohne Wertung, danach zurück in die Warte-Lobby
create or replace function public.skyjo_end_game(p_game_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.skyjo_games;
begin
  game := public._skyjo_lock(p_game_id);

  if not public._skyjo_is_host(p_game_id) then
    raise exception 'Nur der Host kann das Spiel abbrechen.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits vorbei.';
  end if;

  -- Abbruch: die Ergebnis-Trigger werten das nicht (gilt nur in dieser Transaktion)
  perform set_config('game.aborted', 'on', true);

  update public.skyjo_games
  set last_events = '[]', status = 'finished', step = null, turn_seat = null, drawn = null,
      drawn_from = null, waiting_since = null
  where id = p_game_id;
  perform public._skyjo_log(p_game_id, jsonb_build_object('t', 'end'));
  perform public._game_tick(game.lobby_id);
  perform public.skyjo_return_to_lobby(game.lobby_id);
end;
$$;

-- kniffel: Abbruch ohne Wertung, danach zurück in die Warte-Lobby
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
    raise exception 'Nur der Host kann das Spiel abbrechen.';
  end if;

  if game.status <> 'playing' then
    raise exception 'Das Spiel ist bereits vorbei.';
  end if;

  -- Abbruch: die Ergebnis-Trigger werten das nicht (gilt nur in dieser Transaktion)
  perform set_config('game.aborted', 'on', true);

  update public.kniffel_games
  set status = 'finished', turn_seat = null, dice = '{}', rolls = 0, waiting_since = null
  where id = p_game_id;
  perform public._game_tick(game.lobby_id);
  perform public.kniffel_return_to_lobby(game.lobby_id);
end;
$$;

drop trigger if exists flip7_games_record_result on public.flip7_games;
create trigger flip7_games_record_result
after update of status on public.flip7_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and current_setting('game.aborted', true) is distinct from 'on')
execute function public._flip7_record_result();

drop trigger if exists skipbo_games_record_result on public.skipbo_games;
create trigger skipbo_games_record_result
after update of status on public.skipbo_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and new.winner_seat is not null
                   and current_setting('game.aborted', true) is distinct from 'on')
execute function public._skipbo_record_result();

drop trigger if exists nimm6_games_record_result on public.nimm6_games;
create trigger nimm6_games_record_result
after update of status on public.nimm6_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and current_setting('game.aborted', true) is distinct from 'on')
execute function public._nimm6_record_result();

drop trigger if exists skyjo_games_record_result on public.skyjo_games;
create trigger skyjo_games_record_result
after update of status on public.skyjo_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and current_setting('game.aborted', true) is distinct from 'on')
execute function public._skyjo_record_result();

drop trigger if exists kniffel_games_record_result on public.kniffel_games;
create trigger kniffel_games_record_result
after update of status on public.kniffel_games
for each row when (new.status = 'finished' and old.status <> 'finished'
                   and current_setting('game.aborted', true) is distinct from 'on')
execute function public._kniffel_record_result();
-- ===========================================================================
-- Lobby-Chat: Fragen zum Spiel und Spielvorschläge
-- ===========================================================================
-- Nachrichten gehören zur Lobby und verschwinden mit ihr. Lesen dürfen nur die Mitglieder
-- (auch im laufenden Spiel), schreiben nur über lobby_send_message. game_key: Vorschlag eines
-- Spiels aus der Übersicht; der Host kann ihn mit einem Tipp übernehmen. Je Lobby bleiben die
-- letzten 200 Nachrichten.

create table if not exists public.lobby_messages (
  id bigint generated always as identity primary key,
  lobby_id uuid not null references public.multiplayer_lobbies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  game_key text
    check (game_key is null
           or game_key in ('flip-7', 'skip-bo', 'monopoly', 'uno', 'blackjack', 'nimm-6', 'skyjo',
                           'kniffel')),
  created_at timestamptz not null default now()
);

create index if not exists lobby_messages_lobby_idx on public.lobby_messages (lobby_id, id desc);

alter table public.lobby_messages enable row level security;

drop policy if exists "Lobby members can read the lobby chat" on public.lobby_messages;
create policy "Lobby members can read the lobby chat"
  on public.lobby_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.multiplayer_lobby_members m
      where m.lobby_id = lobby_messages.lobby_id and m.user_id = (select auth.uid())
    )
  );

revoke all on public.lobby_messages from anon, authenticated;
grant select on public.lobby_messages to authenticated;

-- Nachricht senden (Mitglieder der Lobby). Höchstens 8 Nachrichten in 20 Sekunden je Person.
create or replace function public.lobby_send_message(
  p_lobby_id uuid,
  p_body text,
  p_game_key text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = auth.uid()
  ) then
    raise exception 'Du bist nicht in dieser Lobby.';
  end if;

  if v_body = '' then
    raise exception 'Die Nachricht ist leer.';
  end if;

  if char_length(v_body) > 300 then
    raise exception 'Die Nachricht ist zu lang (höchstens 300 Zeichen).';
  end if;

  if (select count(*) from public.lobby_messages
      where lobby_id = p_lobby_id and user_id = auth.uid()
        and created_at > now() - interval '20 seconds') >= 8 then
    raise exception 'Nicht so schnell – warte kurz mit der nächsten Nachricht.';
  end if;

  insert into public.lobby_messages (lobby_id, user_id, body, game_key)
  values (p_lobby_id, auth.uid(), v_body, nullif(p_game_key, ''));

  delete from public.lobby_messages
  where lobby_id = p_lobby_id
    and id < (select id from public.lobby_messages
              where lobby_id = p_lobby_id order by id desc offset 199 limit 1);
end;
$$;

revoke execute on function public.lobby_send_message(uuid, text, text) from public, anon;
grant execute on function public.lobby_send_message(uuid, text, text) to authenticated;

-- Neue Nachrichten live (weiterhin durch RLS gefiltert)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lobby_messages'
  ) then
    alter publication supabase_realtime add table public.lobby_messages;
  end if;
end;
$$;
