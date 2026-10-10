-- Spiel-Pushes („Du bist dran“, Spielstart) wieder entfernt: zu viele Nachrichten.
-- Pushes für Mitteilungen (Freunde, Einladungen, System) bleiben, ebenso die Anwesenheit
-- (kein Push, solange man in der App ist).

drop trigger if exists flip7_games_push_turn on public.flip7_games;
drop trigger if exists skipbo_games_push_turn on public.skipbo_games;
drop trigger if exists uno_games_push_turn on public.uno_games;
drop trigger if exists multiplayer_lobbies_push_started on public.multiplayer_lobbies;

drop function if exists public._flip7_push_turn();
drop function if exists public._skipbo_push_turn();
drop function if exists public._uno_push_turn();
drop function if exists public._push_turn(uuid, uuid, text);
drop function if exists public._push_game_started();

-- Alte Stummschaltungen der entfernten Arten aufräumen
update public.push_preferences
set muted_types = array_remove(array_remove(muted_types, 'your_turn'), 'game_started')
where muted_types && array['your_turn', 'game_started'];
