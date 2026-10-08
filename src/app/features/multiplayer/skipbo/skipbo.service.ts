import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { SkipboCard, SkipboGame, SkipboPlayer, SkipboSource } from './skipbo.model';

// Genau die Felder von SkipboGame; die eigene Hand kommt per RLS nur für mich mit
const GAME_COLUMNS =
  'id, status, seat_count, dealer_seat, turn_seat, turn_no, build_piles, winner_seat,' +
  ' last_events, round_log, waiting_since,' +
  ' skipbo_players(user_id, seat, state, stock_count, stock_top, hand_count, discards),' +
  ' skipbo_hands(cards)';

type GameRow = Omit<SkipboGame, 'players' | 'hand'> & {
  skipbo_players: Omit<SkipboPlayer, 'name'>[];
  skipbo_hands: { cards: SkipboCard[] }[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class SkipboService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<SkipboGame | null>> {
    const { data, error } = await supabase
      .from('skipbo_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'skipbo_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { skipbo_players: playerRows, skipbo_hands: hands, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok
      ? { ok: true, value: { ...game, players: players.value, hand: hands[0]?.cards ?? [] } }
      : players;
  }

  // Eine Aktion macht mehrere UPDATEs auf skipbo_games; watchTables bündelt sie
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `skipbo-${lobbyId}`,
      [{ table: 'skipbo_games', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  play(turn: TableTurn, source: SkipboSource, pile: number): Promise<ActionResult> {
    return callRpc(
      'skipbo_play',
      { ...turnArgs(turn), p_source: source.kind, p_index: source.index, p_pile: pile },
      'Karte konnte nicht gelegt werden.',
    );
  }

  // Beendet den Zug
  discard(turn: TableTurn, handIndex: number, pile: number): Promise<ActionResult> {
    return callRpc(
      'skipbo_discard',
      { ...turnArgs(turn), p_hand_index: handIndex, p_pile: pile },
      'Karte konnte nicht abgelegt werden.',
    );
  }

  // Nur die Situation, die der Host gesehen hat, und erst nach der Wartezeit
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('skipbo_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('skipbo_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'skipbo_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
