import { supabase } from '../../../supabase.client';
import { ActionResult, describeSupabaseError } from '../../../services/supabase-errors';
import { displayNameOf } from '../lobby.model';
import { LobbyResult, lobbyFailure, MultiplayerLobbyService } from '../multiplayer-lobby.service';

// Gemeinsame Datenzugriffe der Kartenspiele (Flip 7, Skip-Bo, Uno)

// Stand, auf den sich ein Zug bezieht (waiting_since): Hat sich das Spiel
// inzwischen weiterbewegt, ignoriert die Datenbank den Zug
export interface TableTurn {
  id: string;
  waiting_since: string | null;
}

// waiting_since unverändert als String weitergeben (Mikrosekunden, kein Date)
export function turnArgs(turn: TableTurn): Record<string, unknown> {
  return { p_game_id: turn.id, p_waiting_since: turn.waiting_since };
}

// Abgebrochen statt gespeichert: Sperrkonflikt, Deadlock, Zeitüberschreitung
const NOT_SAVED = ['40001', '40P01', '55P03', '57014'];
const RETRY_MS = 800;

// Kurze Aussetzer einmal wiederholen statt gleich zu melden. Sicher, weil abgebrochene Aufrufe
// nichts gespeichert haben; ohne Antwort (Netz, Server) nur bei Zügen mit waiting_since, denn
// einen schon gespeicherten Zug ignoriert die Datenbank beim zweiten Mal.
export async function callRpc(
  fn: string,
  args: Record<string, unknown>,
  context: string,
): Promise<ActionResult> {
  let { error } = await supabase.rpc(fn, args);
  const code = error?.code ?? '';
  if (error && (NOT_SAVED.includes(code) || (!code && 'p_waiting_since' in args))) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    ({ error } = await supabase.rpc(fn, args));
  }
  return error ? lobbyFailure(context, error) : { ok: true };
}

// Namen ändern sich während eines Spiels praktisch nie
const names = new Map<string, string>();

// Spielerzeilen mit Anzeigenamen; fehlende Profile werden einmal nachgeladen
export async function withNames<T extends { user_id: string }>(
  lobbyService: MultiplayerLobbyService,
  rows: T[],
): Promise<LobbyResult<(T & { name: string })[]>> {
  const missing = rows.map((row) => row.user_id).filter((id) => !names.has(id));
  if (missing.length) {
    const profiles = await lobbyService.loadProfiles(missing);
    if (!profiles) {
      return { ok: false, message: describeSupabaseError(null) };
    }
    for (const id of missing) {
      names.set(id, displayNameOf(profiles.get(id)));
    }
  }
  return { ok: true, value: rows.map((row) => ({ ...row, name: names.get(row.user_id) ?? '' })) };
}
