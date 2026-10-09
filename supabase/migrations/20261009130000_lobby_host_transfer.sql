-- Host-Wechsel: Der Host gibt die Rolle in der Warte-Lobby an einen anderen Spieler ab.
-- Gäste können keine Lobby eröffnen und darum auch nicht Host werden. Den Lobby-Code
-- sieht danach automatisch der neue Host ("Hosts can read their lobby code" hängt an
-- host_user_id); alle Clients bekommen den Wechsel über Realtime auf multiplayer_lobbies.

create or replace function public.transfer_lobby_host(p_lobby_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  lobby public.multiplayer_lobbies;
begin
  if not public.can_use_multiplayer(auth.uid()) then
    raise exception 'Multiplayer ist für dich noch nicht freigeschaltet.' using errcode = '42501';
  end if;

  select * into lobby
  from public.multiplayer_lobbies where id = p_lobby_id
  for update;

  if lobby.id is null or lobby.host_user_id <> auth.uid() then
    raise exception 'Nur der Host kann die Host-Rolle abgeben.';
  end if;

  if lobby.status <> 'open' then
    raise exception 'Während eines Spiels kann der Host nicht wechseln.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Du bist schon Host.';
  end if;

  if not exists (
    select 1 from public.multiplayer_lobby_members
    where lobby_id = p_lobby_id and user_id = p_user_id
  ) then
    raise exception 'Dieser Spieler ist nicht mehr in der Lobby.';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id and is_guest) then
    raise exception 'Gäste können nicht Host werden.';
  end if;

  update public.multiplayer_lobbies set host_user_id = p_user_id where id = p_lobby_id;
end;
$$;

revoke execute on function public.transfer_lobby_host(uuid, uuid) from public, anon;
grant execute on function public.transfer_lobby_host(uuid, uuid) to authenticated;
