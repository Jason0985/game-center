import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { MeGame, MePlayer } from './mensch.model';

// Genau die Felder von MeGame
const GAME_COLUMNS =
  'id, status, seat_count, turn_seat, phase, die, rolled_seat, tries, roll_seq, winner_seat,' +
  ' waiting_since, mensch_players(user_id, seat, color, state, pieces)';

type GameRow = Omit<MeGame, 'players'> & {
  mensch_players: Omit<MePlayer, 'name'>[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class MenschService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<MeGame | null>> {
    const { data, error } = await supabase
      .from('mensch_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'mensch_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { mensch_players: playerRows, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok ? { ok: true, value: { ...game, players: players.value } } : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `mensch-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  roll(turn: TableTurn): Promise<ActionResult> {
    return callRpc('mensch_roll', turnArgs(turn), 'Würfeln fehlgeschlagen.');
  }

  // piece: Figur 0–3 des Spielers am Zug
  move(turn: TableTurn, piece: number): Promise<ActionResult> {
    return callRpc('mensch_move', { ...turnArgs(turn), p_piece: piece }, 'Ziehen fehlgeschlagen.');
  }

  // Host: nach Wartezeit spielt der Tisch den Zug
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('mensch_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('mensch_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'mensch_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
