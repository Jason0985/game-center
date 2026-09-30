-- Flip 7: Verlauf der laufenden Runde (mit Zeit) und die obersten Ablagekarten,
-- beides nur für die Anzeige am Spieltisch. last_events bleibt wie bisher
-- (nur die letzte Aktion, für Animationen).

alter table public.flip7_games
  add column if not exists round_log jsonb not null default '[]'
    check (jsonb_typeof(round_log) = 'array'),
  add column if not exists discard_top text[] not null default '{}';

-- Wie bisher, zusätzlich ins round_log mit Rundennummer und Zeit.
-- Beginnt eine neue Runde, fängt das Log von vorn an.
create or replace function public._flip7_log(p_game_id uuid, p_event jsonb)
returns void
language sql
security definer set search_path = ''
as $$
  update public.flip7_games
  set last_events = last_events || jsonb_build_array(p_event),
      round_log = case when (round_log -> -1 ->> 'r')::integer = round_no
                       then round_log else '[]'::jsonb end
        || jsonb_build_array(p_event || jsonb_build_object('r', round_no, 'at', now()))
  where id = p_game_id;
$$;

-- Wie bisher, zusätzlich die obersten zwei Ablagekarten (Ablagestapel lag schon
-- immer offen). Nach dem Neumischen bleibt discard_top stehen; die Anzeige
-- zeigt die Ablage nur bei discard_count > 0.
create or replace function public._flip7_discard(p_game_id uuid, p_cards text[])
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  discard_size integer;
  top text[];
begin
  if coalesce(cardinality(p_cards), 0) = 0 then
    return;
  end if;

  update public.flip7_decks
  set discard_pile = discard_pile || p_cards
  where game_id = p_game_id
  returning cardinality(discard_pile),
            discard_pile[greatest(cardinality(discard_pile) - 1, 1):]
  into discard_size, top;

  update public.flip7_games
  set discard_count = discard_size, discard_top = top
  where id = p_game_id;
end;
$$;

revoke execute on function public._flip7_log(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public._flip7_discard(uuid, text[]) from public, anon, authenticated;
