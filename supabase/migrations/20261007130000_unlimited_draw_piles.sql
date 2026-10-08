-- Unbegrenzte Nachziehstapel für Skip-Bo und Uno: Reicht der Stapel nicht, kommt ein
-- frisch gemischtes Deck darunter. Vorher konnte der Stapel leerlaufen (Karten stecken
-- in Händen und Ablagen), dann konnte niemand mehr ziehen und das Spiel hing.
-- draw_count wird weiter gepflegt, die App zeigt ihn aber nicht mehr an.

-- Hand auf 5 auffüllen; fehlt etwas, kommt ein neues Deck unter den Nachziehstapel.
create or replace function public._skipbo_refill(p_game_id uuid, p_seat smallint)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  need integer;
  drawn text[];
  draw_size integer;
begin
  select 5 - cardinality(cards) into need
  from public.skipbo_hands where game_id = p_game_id and seat = p_seat;

  if coalesce(need, 0) <= 0 then
    return;
  end if;

  -- Ein Deck (162 Karten) reicht immer für höchstens 5 fehlende Karten
  update public.skipbo_decks
  set draw_pile = draw_pile || public._skipbo_new_deck()
  where game_id = p_game_id and cardinality(draw_pile) < need;

  select draw_pile[1:need] into drawn
  from public.skipbo_decks where game_id = p_game_id
  for update;

  if coalesce(cardinality(drawn), 0) = 0 then
    return;
  end if;

  update public.skipbo_decks
  set draw_pile = draw_pile[cardinality(drawn) + 1:]
  where game_id = p_game_id
  returning cardinality(draw_pile) into draw_size;

  update public.skipbo_hands set cards = cards || drawn
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_players set hand_count = hand_count + cardinality(drawn)
  where game_id = p_game_id and seat = p_seat;
  update public.skipbo_games set draw_count = draw_size where id = p_game_id;

  perform public._skipbo_log(p_game_id,
    jsonb_build_object('t', 'draw', 'seat', p_seat, 'n', cardinality(drawn)));
end;
$$;

-- p_n Karten für einen Sitz. Reicht der Nachziehstapel nicht, kommt erst die Ablage ohne
-- oberste Karte gemischt darunter, dann so viele neue Decks wie nötig. Gibt die gezogenen
-- Karten zurück. Nie loggen, welche Karten es waren.
create or replace function public._uno_draw(p_game_id uuid, p_seat smallint, p_n integer)
returns text[]
language plpgsql
security definer set search_path = ''
as $$
declare
  deck public.uno_decks;
  taken text[];
begin
  select * into deck from public.uno_decks where game_id = p_game_id for update;

  if cardinality(deck.draw_pile) < p_n and cardinality(deck.discard_pile) > 1 then
    deck.draw_pile := deck.draw_pile || array(
      select c from unnest(deck.discard_pile[:cardinality(deck.discard_pile) - 1]) as c
      order by gen_random_uuid());
    deck.discard_pile := deck.discard_pile[cardinality(deck.discard_pile):];
  end if;

  while cardinality(deck.draw_pile) < p_n loop
    deck.draw_pile := deck.draw_pile || public._uno_new_deck();
  end loop;

  taken := deck.draw_pile[:p_n];
  update public.uno_decks
  set draw_pile = deck.draw_pile[p_n + 1:], discard_pile = deck.discard_pile
  where game_id = p_game_id;

  update public.uno_games
  set draw_count = greatest(cardinality(deck.draw_pile) - p_n, 0)
  where id = p_game_id;

  if cardinality(taken) > 0 then
    update public.uno_hands set cards = public._uno_sort(cards || taken)
    where game_id = p_game_id and seat = p_seat;
    update public.uno_players
    set hand_count = hand_count + cardinality(taken),
        uno_called = uno_called and hand_count + cardinality(taken) <= 1
    where game_id = p_game_id and seat = p_seat;
  end if;
  return taken;
end;
$$;

revoke execute on function public._skipbo_refill(uuid, smallint) from public, anon, authenticated;
revoke execute on function public._uno_draw(uuid, smallint, integer) from public, anon, authenticated;
