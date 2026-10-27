import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { BjAction, BjGame, BjHand, BjPlayer } from './blackjack.model';

// Genau die Felder von BjGame; Hände hängen am Spieler (Fremdschlüssel game_id + seat)
const GAME_COLUMNS =
  'id, status, phase, seat_count, start_money, round_no, turn_seat, turn_hand, dealer_cards,' +
  ' dealer_hole, shoe_count, first_bet_at, last_events, round_log, waiting_since,' +
  ' blackjack_players(user_id, seat, state, balance, bet, last_bet,' +
  ' blackjack_hands(hand_no, cards, bet, doubled, state, result, payout))';

type PlayerRow = Omit<BjPlayer, 'name' | 'hands'> & { blackjack_hands: BjHand[] };
type GameRow = Omit<BjGame, 'players'> & { blackjack_players: PlayerRow[] };

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class BlackjackService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<BjGame | null>> {
    const { data, error } = await supabase
      .from('blackjack_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'blackjack_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { blackjack_players: rows, ...game } = data as unknown as GameRow;
    const players = await withNames(
      this.lobbyService,
      rows.map(({ blackjack_hands: hands, ...player }) => ({
        ...player,
        hands: [...hands].sort((a, b) => a.hand_no - b.hand_no),
      })),
    );
    return players.ok ? { ok: true, value: { ...game, players: players.value } } : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `blackjack-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  // roundNo: die Runde, die der Spieler gesehen hat (Doppeltipp tut nichts)
  bet(gameId: string, roundNo: number, amount: number): Promise<ActionResult> {
    return callRpc(
      'blackjack_bet',
      { p_game_id: gameId, p_round_no: roundNo, p_amount: amount },
      'Einsatz konnte nicht gesetzt werden.',
    );
  }

  // Setzzeit abgelaufen: austeilen (die Datenbank prüft die Zeit)
  deal(gameId: string, roundNo: number): Promise<ActionResult> {
    return callRpc(
      'blackjack_deal',
      { p_game_id: gameId, p_round_no: roundNo },
      'Austeilen fehlgeschlagen.',
    );
  }

  play(turn: TableTurn, action: BjAction): Promise<ActionResult> {
    return callRpc(
      'blackjack_play',
      { ...turnArgs(turn), p_action: action },
      'Zug fehlgeschlagen.',
    );
  }

  // Zugzeit abgelaufen: die Hand am Zug hält
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('blackjack_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc(
      'blackjack_end_game',
      { p_game_id: gameId },
      'Spiel konnte nicht beendet werden.',
    );
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'blackjack_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
