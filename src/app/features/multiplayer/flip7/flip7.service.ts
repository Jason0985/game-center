import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { Flip7Game, Flip7Player } from './flip7.model';

// Genau die Felder von Flip7Game; wird bei jeder Aktion von jedem Client geladen
const GAME_COLUMNS =
  'id, target_score, status, seat_count, round_no, dealer_seat, phase, turn_seat,' +
  ' pending_card, pending_seat, flip3_seat, flip3_left, draw_count, discard_count, discard_top,' +
  ' last_events, round_log, waiting_since,' +
  ' flip7_players(user_id, seat, state, cards, total_score, round_score)';

type GameRow = Omit<Flip7Game, 'players'> & {
  flip7_players: Omit<Flip7Player, 'name'>[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class Flip7Service {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<Flip7Game | null>> {
    const { data, error } = await supabase
      .from('flip7_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'flip7_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { flip7_players: playerRows, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok ? { ok: true, value: { ...game, players: players.value } } : players;
  }

  // Nur flip7_game_ticks ist in der Realtime-Publikation: genau ein Event pro Aktion
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `flip7-${lobbyId}`,
      [{ table: 'flip7_game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  hit(turn: TableTurn): Promise<ActionResult> {
    return callRpc('flip7_hit', turnArgs(turn), 'Karte konnte nicht gezogen werden.');
  }

  stay(turn: TableTurn): Promise<ActionResult> {
    return callRpc('flip7_stay', turnArgs(turn), 'Sichern fehlgeschlagen.');
  }

  chooseTarget(turn: TableTurn, seat: number): Promise<ActionResult> {
    return callRpc(
      'flip7_choose_target',
      { ...turnArgs(turn), p_target_seat: seat },
      'Ziel konnte nicht gewählt werden.',
    );
  }

  // Nur die Situation, die der Host gesehen hat, und erst nach der Wartezeit
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('flip7_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  // Idempotent: ruft jeder Client nach Ablauf der Rundenübersicht auf
  nextRound(gameId: string, roundNo: number): Promise<ActionResult> {
    return callRpc(
      'flip7_next_round',
      { p_game_id: gameId, p_round_no: roundNo },
      'Nächste Runde konnte nicht gestartet werden.',
    );
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('flip7_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  continueOpen(gameId: string): Promise<ActionResult> {
    return callRpc('flip7_continue_open', { p_game_id: gameId }, 'Weiterspielen fehlgeschlagen.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'flip7_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
