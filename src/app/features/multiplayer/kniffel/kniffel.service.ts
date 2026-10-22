import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { KnGame, KnPlayer } from './kniffel.model';

// Genau die Felder von KnGame
const GAME_COLUMNS =
  'id, status, seat_count, turn_seat, dice, held, rolls, roll_seq, waiting_since,' +
  ' kniffel_players(user_id, seat, state, scores, total)';

type GameRow = Omit<KnGame, 'players'> & {
  kniffel_players: Omit<KnPlayer, 'name'>[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class KniffelService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<KnGame | null>> {
    const { data, error } = await supabase
      .from('kniffel_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'kniffel_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { kniffel_players: playerRows, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok ? { ok: true, value: { ...game, players: players.value } } : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `kniffel-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  // held: welche Würfel liegen bleiben (beim ersten Wurf egal)
  roll(turn: TableTurn, held: boolean[]): Promise<ActionResult> {
    return callRpc('kniffel_roll', { ...turnArgs(turn), p_held: held }, 'Würfeln fehlgeschlagen.');
  }

  // Nur damit alle am Tisch sehen, was gehalten wird
  hold(turn: TableTurn, held: boolean[]): Promise<ActionResult> {
    return callRpc('kniffel_hold', { ...turnArgs(turn), p_held: held }, 'Halten fehlgeschlagen.');
  }

  score(turn: TableTurn, category: number): Promise<ActionResult> {
    return callRpc(
      'kniffel_score',
      { ...turnArgs(turn), p_category: category },
      'Eintragen fehlgeschlagen.',
    );
  }

  // Host: nach Wartezeit würfelt bzw. trägt der Tisch ein
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('kniffel_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('kniffel_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'kniffel_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
