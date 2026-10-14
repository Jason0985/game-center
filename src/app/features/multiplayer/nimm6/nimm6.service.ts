import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { N6Game, N6Player } from './nimm6.model';

// Genau die Felder von N6Game; die eigene Hand kommt per RLS nur für mich mit
const GAME_COLUMNS =
  'id, status, phase, seat_count, end_score, round_no, turn_no, card_rows, revealed, resolve_at,' +
  ' take_seat, last_events, round_log, waiting_since,' +
  ' nimm6_players(user_id, seat, state, score, round_bulls, ready, rows_taken, sixths),' +
  ' nimm6_hands(cards, chosen)';

type GameRow = Omit<N6Game, 'players' | 'hand' | 'chosen' | 'turn_seat'> & {
  nimm6_players: Omit<N6Player, 'name'>[];
  nimm6_hands: { cards: number[]; chosen: number | null }[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class Nimm6Service {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<N6Game | null>> {
    const { data, error } = await supabase
      .from('nimm6_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'nimm6_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { nimm6_players: playerRows, nimm6_hands: hands, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok
      ? {
          ok: true,
          value: {
            ...game,
            turn_seat: game.phase === 'take' ? game.take_seat : null,
            players: players.value,
            hand: hands[0]?.cards ?? [],
            chosen: hands[0]?.chosen ?? null,
          },
        }
      : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `nimm6-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  // Karte verdeckt wählen; turn: der Zug, den der Spieler gesehen hat
  choose(turn: TableTurn, card: number): Promise<ActionResult> {
    return callRpc(
      'nimm6_choose',
      { ...turnArgs(turn), p_card: card },
      'Karte konnte nicht gelegt werden.',
    );
  }

  // Zu kleine Karte: Reihe 0–3 nehmen
  takeRow(turn: TableTurn, row: number): Promise<ActionResult> {
    return callRpc(
      'nimm6_take_row',
      { ...turnArgs(turn), p_row: row },
      'Reihe konnte nicht genommen werden.',
    );
  }

  // Zeit abgelaufen: zufällige Karte bzw. billigste Reihe (die Datenbank prüft die Zeit)
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('nimm6_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  // roundNo: die Runde, die der Spieler gesehen hat (Doppeltipp tut nichts)
  nextRound(gameId: string, roundNo: number): Promise<ActionResult> {
    return callRpc(
      'nimm6_next_round',
      { p_game_id: gameId, p_round_no: roundNo },
      'Nächste Runde konnte nicht starten.',
    );
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('nimm6_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'nimm6_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
