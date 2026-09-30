-- Game selection in the waiting lobby: the host picks the game (only Flip 7 so
-- far) and its settings. targetScore null = open game without a target score,
-- the host ends it himself.

alter table public.multiplayer_lobbies
  alter column game_key set default 'flip-7',
  add column if not exists game_settings jsonb not null default '{"targetScore": 200}'
    check (jsonb_typeof(game_settings) = 'object' and octet_length(game_settings::text) <= 1024);

-- Only the host of an open lobby. Ready flags stay as they are.
create or replace function public.set_lobby_game(p_lobby_id uuid, p_game_key text, p_settings jsonb)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  target jsonb;
  target_score integer;
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

  if p_game_key is distinct from 'flip-7'
     or p_settings is null
     or jsonb_typeof(p_settings) <> 'object'
     or not (p_settings ? 'targetScore') then
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

  update public.multiplayer_lobbies
  set game_key = p_game_key,
      game_settings = jsonb_build_object('targetScore', target_score)
  where id = p_lobby_id;
end;
$$;

revoke execute on function public.set_lobby_game(uuid, text, jsonb) from public, anon;
grant execute on function public.set_lobby_game(uuid, text, jsonb) to authenticated;
