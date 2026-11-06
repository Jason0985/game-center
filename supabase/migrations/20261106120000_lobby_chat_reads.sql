-- Lobby-Chat: Lesebestätigungen wie in der PS-App.
--
-- Je Person und Lobby die zuletzt gelesene Nachricht (last_read_id) und wann. Gelesen heißt:
-- der Chat war offen, als die Nachricht da war (lobby_mark_read aus dem Chat). Lesen dürfen
-- nur die Mitglieder der Lobby, schreiben nur über lobby_mark_read. Verschwindet mit der Lobby.
-- Lässt sich gefahrlos erneut ausführen.

create table if not exists public.lobby_chat_reads (
  lobby_id uuid not null references public.multiplayer_lobbies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_id bigint not null default 0,
  read_at timestamptz not null default now(),
  primary key (lobby_id, user_id)
);

alter table public.lobby_chat_reads enable row level security;

drop policy if exists "Lobby members can read the chat reads" on public.lobby_chat_reads;
create policy "Lobby members can read the chat reads"
  on public.lobby_chat_reads for select
  to authenticated
  using (
    exists (
      select 1 from public.multiplayer_lobby_members m
      where m.lobby_id = lobby_chat_reads.lobby_id and m.user_id = (select auth.uid())
    )
  );

revoke all on public.lobby_chat_reads from anon, authenticated;
grant select on public.lobby_chat_reads to authenticated;

-- Bis p_message_id gelesen (höchstens bis zur neuesten Nachricht der Lobby; zurück geht es nie).
-- Ändert nur etwas, wenn es weiter ist als bisher, damit kein unnötiges Realtime-Event entsteht.
create or replace function public.lobby_mark_read(p_lobby_id uuid, p_message_id bigint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = auth.uid()
  ) then
    raise exception 'Du bist nicht in dieser Lobby.';
  end if;

  select max(id) into v_id
  from public.lobby_messages
  where lobby_id = p_lobby_id and id <= p_message_id;

  if v_id is null then
    return;
  end if;

  insert into public.lobby_chat_reads (lobby_id, user_id, last_read_id, read_at)
  values (p_lobby_id, auth.uid(), v_id, now())
  on conflict (lobby_id, user_id) do update
    set last_read_id = excluded.last_read_id, read_at = excluded.read_at
    where public.lobby_chat_reads.last_read_id < excluded.last_read_id;
end;
$$;

revoke execute on function public.lobby_mark_read(uuid, bigint) from public, anon;
grant execute on function public.lobby_mark_read(uuid, bigint) to authenticated;

-- Lesebestätigungen live (weiterhin durch RLS gefiltert)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lobby_chat_reads'
  ) then
    alter publication supabase_realtime add table public.lobby_chat_reads;
  end if;
end;
$$;
