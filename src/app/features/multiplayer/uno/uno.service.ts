import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { callRpc, TableTurn, turnArgs, withNames } from '../table/table-data';
import { UnoCard, UnoColor, UnoGame, UnoPlayer } from './uno.model';

// Genau die Felder von UnoGame; die eigene Hand kommt per RLS nur für mich mit
const GAME_COLUMNS =
  'id, status, settings, seat_count, round_no, dealer_seat, turn_seat, turn_no, direction, color,' +
  ' discard_top, pending_draw, drew, uno_open_seat, winner_seat, last_events, round_log,' +
  ' waiting_since,' +
  ' uno_players(user_id, seat, state, hand_count, uno_called),' +
  ' uno_hands(cards, drawn)';

type GameRow = Omit<UnoGame, 'players' | 'hand' | 'drawn'> & {
  uno_players: Omit<UnoPlayer, 'name'>[];
  uno_hands: { cards: UnoCard[]; drawn: UnoCard | null }[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class UnoService {
  private readonly lobbyService = inject(MultiplayerLobbyService);

  // value null = zur Lobby gibt es (noch) kein Spiel
  async load(lobbyId: string): Promise<LobbyResult<UnoGame | null>> {
    const { data, error } = await supabase
      .from('uno_games')
      .select(GAME_COLUMNS)
      .eq('lobby_id', lobbyId)
      .order('seat', { referencedTable: 'uno_players' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Spiel konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const { uno_players: playerRows, uno_hands: hands, ...game } = data as unknown as GameRow;
    const players = await withNames(this.lobbyService, playerRows);
    return players.ok
      ? {
          ok: true,
          value: {
            ...game,
            players: players.value,
            hand: hands[0]?.cards ?? [],
            drawn: hands[0]?.drawn ?? null,
          },
        }
      : players;
  }

  // Eine Aktion = ein Tick in game_ticks
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `uno-${lobbyId}`,
      [{ table: 'game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  // Farbwahl: color; 7 unter „7 tauscht, 0 dreht“: target
  play(
    turn: TableTurn,
    card: UnoCard,
    color: UnoColor | null = null,
    target: number | null = null,
  ): Promise<ActionResult> {
    return callRpc(
      'uno_play',
      { ...turnArgs(turn), p_card: card, p_color: color, p_target_seat: target },
      'Karte konnte nicht gelegt werden.',
    );
  }

  draw(turn: TableTurn): Promise<ActionResult> {
    return callRpc('uno_draw', turnArgs(turn), 'Ziehen fehlgeschlagen.');
  }

  // Gezogene Karte behalten, Zug beenden
  pass(turn: TableTurn): Promise<ActionResult> {
    return callRpc('uno_pass', turnArgs(turn), 'Zug konnte nicht beendet werden.');
  }

  callUno(gameId: string): Promise<ActionResult> {
    return callRpc('uno_call', { p_game_id: gameId }, 'Uno rufen fehlgeschlagen.');
  }

  // Nur die Situation, die der Host gesehen hat, und erst nach der Wartezeit
  skip(turn: TableTurn): Promise<ActionResult> {
    return callRpc('uno_skip', turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  endGame(gameId: string): Promise<ActionResult> {
    return callRpc('uno_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  // roundNo: die Runde, die der Host gesehen hat (Doppeltipp tut nichts)
  nextRound(gameId: string, roundNo: number): Promise<ActionResult> {
    return callRpc(
      'uno_next_round',
      { p_game_id: gameId, p_round_no: roundNo },
      'Nächste Runde konnte nicht starten.',
    );
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return callRpc(
      'uno_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }
}
