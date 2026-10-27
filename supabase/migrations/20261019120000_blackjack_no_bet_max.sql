-- Blackjack: kein Höchsteinsatz mehr, man darf alles setzen, was man hat (All-in).
-- Sonst wie in 20261010150000_blackjack.sql.

create or replace function public.blackjack_bet(p_game_id uuid, p_round_no integer, p_amount integer)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  game public.blackjack_games;
  my_seat smallint;
  me public.blackjack_players;
begin
  game := public._blackjack_lock(p_game_id);
  my_seat := public._blackjack_my_seat(p_game_id);
  select * into me from public.blackjack_players where game_id = p_game_id and seat = my_seat;

  if game.status <> 'playing' or game.phase <> 'betting'
     or game.round_no is distinct from p_round_no or me.bet > 0 then
    return;
  end if;

  if p_amount is null or p_amount < 10 then
    raise exception 'Der Einsatz muss mindestens 10 sein.';
  end if;

  if p_amount > me.balance then
    raise exception 'So viel Guthaben hast du nicht.';
  end if;

  update public.blackjack_players
  set balance = balance - p_amount, bet = p_amount, last_bet = p_amount
  where game_id = p_game_id and seat = me.seat;
  update public.blackjack_games
  set last_events = '[]', first_bet_at = coalesce(first_bet_at, now())
  where id = p_game_id;
  perform public._blackjack_log(p_game_id, jsonb_build_object('t', 'bet', 'seat', me.seat, 'n', p_amount));

  perform public._blackjack_deal_if_ready(p_game_id);
  perform public._game_tick(game.lobby_id);
end;
$$;
