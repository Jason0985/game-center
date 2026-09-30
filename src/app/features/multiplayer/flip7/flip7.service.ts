import { inject, Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { ActionResult, describeSupabaseError } from '../../../services/supabase-errors';
import { displayNameOf } from '../lobby.model';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { watchTables } from '../realtime-watch';
import { Flip7Game, Flip7Player } from './flip7.model';

// Stand, auf den sich ein Zug bezieht (waiting_since): Hat sich das Spiel
// inzwischen weiterbewegt, ignoriert die Datenbank den Zug
type Flip7Turn = Pick<Flip7Game, 'id' | 'waiting_since'>;

// Genau die Felder von Flip7Game; wird bei jeder Aktion von jedem Client geladen
const GAME_COLUMNS =
  'id, target_score, status, seat_count, round_no, dealer_seat, phase, turn_seat,' +
  ' pending_card, pending_seat, draw_count, discard_count, last_events, waiting_since,' +
  ' flip7_players(user_id, seat, state, cards, total_score, round_score)';

type GameRow = Omit<Flip7Game, 'players'> & {
  flip7_players: Omit<Flip7Player, 'name'>[];
};

// Alle Züge laufen über RPCs; die Regeln prüft ausschließlich die Datenbank
@Injectable({ providedIn: 'root' })
export class Flip7Service {
  private readonly lobbyService = inject(MultiplayerLobbyService);
  // Namen ändern sich während eines Spiels praktisch nie
  private readonly names = new Map<string, string>();

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
    const missing = playerRows.map((row) => row.user_id).filter((id) => !this.names.has(id));
    if (missing.length) {
      const profiles = await this.lobbyService.loadProfiles(missing);
      if (!profiles) {
        return { ok: false, message: describeSupabaseError(null) };
      }
      for (const id of missing) {
        this.names.set(id, displayNameOf(profiles.get(id)));
      }
    }

    return {
      ok: true,
      value: {
        ...game,
        players: playerRows.map((row) => ({ ...row, name: this.names.get(row.user_id) ?? '' })),
      },
    };
  }

  // Nur flip7_game_ticks ist in der Realtime-Publikation: genau ein Event pro Aktion
  subscribe(lobbyId: string, onChange: () => void): () => void {
    return watchTables(
      `flip7-${lobbyId}`,
      [{ table: 'flip7_game_ticks', filter: `lobby_id=eq.${lobbyId}` }],
      onChange,
    );
  }

  hit(turn: Flip7Turn): Promise<ActionResult> {
    return this.call('flip7_hit', this.turnArgs(turn), 'Karte konnte nicht gezogen werden.');
  }

  stay(turn: Flip7Turn): Promise<ActionResult> {
    return this.call('flip7_stay', this.turnArgs(turn), 'Stehenbleiben fehlgeschlagen.');
  }

  chooseTarget(turn: Flip7Turn, seat: number): Promise<ActionResult> {
    return this.call(
      'flip7_choose_target',
      { ...this.turnArgs(turn), p_target_seat: seat },
      'Ziel konnte nicht gewählt werden.',
    );
  }

  // Nur die Situation, die der Host gesehen hat, und erst nach der Wartezeit
  skip(turn: Flip7Turn): Promise<ActionResult> {
    return this.call('flip7_skip', this.turnArgs(turn), 'Überspringen fehlgeschlagen.');
  }

  // Idempotent: ruft jeder Client nach Ablauf der Rundenübersicht auf
  nextRound(gameId: string, roundNo: number): Promise<ActionResult> {
    return this.call(
      'flip7_next_round',
      { p_game_id: gameId, p_round_no: roundNo },
      'Nächste Runde konnte nicht gestartet werden.',
    );
  }

  endGame(gameId: string): Promise<ActionResult> {
    return this.call('flip7_end_game', { p_game_id: gameId }, 'Spiel konnte nicht beendet werden.');
  }

  continueOpen(gameId: string): Promise<ActionResult> {
    return this.call('flip7_continue_open', { p_game_id: gameId }, 'Weiterspielen fehlgeschlagen.');
  }

  returnToLobby(lobbyId: string): Promise<ActionResult> {
    return this.call(
      'flip7_return_to_lobby',
      { p_lobby_id: lobbyId },
      'Zurück zur Warte-Lobby fehlgeschlagen.',
    );
  }

  // waiting_since unverändert als String weitergeben (Mikrosekunden, kein Date)
  private turnArgs(turn: Flip7Turn): Record<string, unknown> {
    return { p_game_id: turn.id, p_waiting_since: turn.waiting_since };
  }

  private async call(
    fn: string,
    args: Record<string, unknown>,
    context: string,
  ): Promise<ActionResult> {
    const { error } = await supabase.rpc(fn, args);
    return error ? lobbyFailure(context, error) : { ok: true };
  }
}
