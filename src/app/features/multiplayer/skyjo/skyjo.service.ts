import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { SkGame, SkPlayer, SkSource } from './skyjo.model';

// Genau die Felder von SkGame; verdeckte Werte und der Stapel bleiben in der Datenbank
const GAME_COLUMNS =
  'id, status, phase, step, seat_count, end_score, clear_columns, double_ender, round_no,' +
  ' turn_seat, drawn, drawn_from, discard, deck_count, ender_seat, last_turns, last_events,' +
  ' round_log, waiting_since,' +
  ' skyjo_players(user_id, seat, state, cards, cleared, flips, score, round_raw, round_score,' +
  ' columns, doubled, best_round)';

type GameRow = Omit<SkGame, 'players'> & {
  skyjo_players: Omit<SkPlayer, 'name'>[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class SkyjoService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<SkGame | null>> {
    const { data, error } = await supabase
      .from('skyjo_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'skyjo_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { skyjo_players: playerRows, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok ? { ok: true, value: { ...game, players: players.value } } : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `skyjo-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  // Eigene verdeckte Karte aufdecken (Rundenstart bzw. nach dem Abwerfen);
  // turn: der Stand, den der Spieler gesehen hat
  flip(turn: TableTurn, cell: number): Promise<ActionResult> {
    return callRpc(
      'skyjo_flip',
      { ...turnArgs(turn), p_cell: cell },
      'Karte konnte nicht aufgedeckt werden.',
    );
  }

  draw(turn: TableTurn, source: SkSource): Promise<ActionResult> {
    return callRpc(
      'skyjo_draw',
      { ...turnArgs(turn), p_source: source },
      'Karte konnte nicht gezogen werden.',
    );
  }

  // Gezogene Karte gegen eigene Zelle 0–11 tauschen
  swap(turn: TableTurn, cell: number): Promise<ActionResult> {
    return callRpc(
      'skyjo_swap',
      { ...turnArgs(turn), p_cell: cell },
      'Karte konnte nicht getauscht werden.',
    );
  }

  // Gezogene Stapelkarte abwerfen (danach eine Karte aufdecken)
  discard(turn: TableTurn): Promise<ActionResult> {
    return callRpc('skyjo_discard', turnArgs(turn), 'Karte konnte nicht abgeworfen werden.');
  }

  // Zeit abgelaufen: zufällig aufdecken (die Datenbank prüft die Zeit)
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('skyjo_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  // roundNo: die Runde, die der Spieler gesehen hat (Doppeltipp tut nichts)
  nextRound(gameId: string, roundNo: number): Promise<ActionResult> {
    return callRpc(
      'skyjo_next_round',
      { p_game_id: gameId, p_round_no: roundNo },
      'Nächste Runde konnte nicht starten.',
    );
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('skyjo_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'skyjo_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
