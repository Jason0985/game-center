import { Injectable } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../../supabase.client';
import { ActionResult, describeSupabaseError } from '../../services/supabase-errors';
import { logClientError } from '../../services/app-error.service';
import {
  displayNameOf,
  LobbyDetail,
  LobbyGameSettings,
  LobbyMember,
  LobbyProfile,
  LobbyStatus,
  LobbySummary,
} from './lobby.model';
import { watchTables } from './realtime-watch';

export type LobbyResult<T> = { ok: true; value: T } | { ok: false; message: string };

interface LobbySummaryRow {
  id: string;
  host_user_id: string;
  status: LobbyStatus;
  game_key: string | null;
  game_settings: LobbyGameSettings | null;
  created_at: string;
  multiplayer_lobby_members: { count: number }[];
}

type MemberRow = Omit<LobbyMember, 'name' | 'profile'>;

interface LobbyDetailRow extends Omit<LobbyDetail, 'code' | 'members'> {
  multiplayer_lobby_members: MemberRow[];
  // 1:1-Beziehung (je nach PostgREST-Version Objekt oder Liste); für Nicht-Hosts per RLS leer
  multiplayer_lobby_codes: { code: string } | { code: string }[] | null;
}

// Fachliche Fehler aus den Lobby- und Spielfunktionen (P0001) sind schon deutsche Meldungen
export function lobbyFailure(
  context: string,
  error: PostgrestError,
): { ok: false; message: string } {
  console.error(context, error);
  // Eigene Meldungen der Datenbank (P0001, z. B. „Du bist nicht am Zug.“) sind kein Fehler der App
  if (error.code !== 'P0001') {
    logClientError(`${context} [${error.code || 'ohne Code'}] ${error.message}`);
  }
  return {
    ok: false,
    message: error.code === 'P0001' ? error.message : describeSupabaseError(error),
  };
}

// Alle Schreibzugriffe laufen über RPCs, die Tabellen sind für Clients nur lesbar
@Injectable({ providedIn: 'root' })
export class MultiplayerLobbyService {
  // null = Laden fehlgeschlagen
  async listOpenLobbies(): Promise<LobbySummary[] | null> {
    const { data, error } = await supabase
      .from('multiplayer_lobbies')
      .select(
        'id, host_user_id, status, game_key, game_settings, created_at,' +
          ' multiplayer_lobby_members(count)',
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Offene Lobbys konnten nicht geladen werden.', error);
      return null;
    }

    const rows = (data ?? []) as unknown as LobbySummaryRow[];
    const profiles = await this.loadProfiles(rows.map((row) => row.host_user_id));
    if (!profiles) {
      return null;
    }

    return rows.map((row) => ({
      id: row.id,
      host_user_id: row.host_user_id,
      hostName: displayNameOf(profiles.get(row.host_user_id)),
      status: row.status,
      game_key: row.game_key,
      game_settings: row.game_settings,
      created_at: row.created_at,
      memberCount: row.multiplayer_lobby_members[0]?.count ?? 0,
    }));
  }

  // Lobby, in der der User gerade ist (höchstens eine)
  async findMyLobbyId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('multiplayer_lobby_members')
      .select('lobby_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Eigene Lobby konnte nicht geladen werden.', error);
      return null;
    }

    return (data as { lobby_id: string } | null)?.lobby_id ?? null;
  }

  // value null = Lobby gibt es nicht (mehr). Lobby, Mitglieder und Code in einer Abfrage.
  async getLobby(lobbyId: string): Promise<LobbyResult<LobbyDetail | null>> {
    const { data, error } = await supabase
      .from('multiplayer_lobbies')
      .select(
        'id, host_user_id, status, game_key, game_settings, created_at, started_at, wins,' +
          ' multiplayer_lobby_members(user_id, ready, joined_at), multiplayer_lobby_codes(code)',
      )
      .eq('id', lobbyId)
      .order('joined_at', { referencedTable: 'multiplayer_lobby_members' })
      .maybeSingle();

    if (error) {
      return lobbyFailure('Lobby konnte nicht geladen werden.', error);
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const {
      multiplayer_lobby_members: memberRows,
      multiplayer_lobby_codes: codeRow,
      ...lobby
    } = data as unknown as LobbyDetailRow;
    const profiles = await this.loadProfiles(memberRows.map((member) => member.user_id));
    if (!profiles) {
      return { ok: false, message: describeSupabaseError(null) };
    }

    return {
      ok: true,
      value: {
        ...lobby,
        code: [codeRow].flat()[0]?.code ?? null,
        members: memberRows.map((member) => {
          const profile = profiles.get(member.user_id) ?? null;
          return { ...member, name: displayNameOf(profile), profile };
        }),
      },
    };
  }

  async createLobby(): Promise<LobbyResult<string>> {
    const { data, error } = await supabase.rpc('create_lobby');
    return error
      ? lobbyFailure('Lobby konnte nicht eröffnet werden.', error)
      : { ok: true, value: data as string };
  }

  async joinLobby(lobbyId: string, code: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('join_lobby', { p_lobby_id: lobbyId, p_code: code });
    return error ? lobbyFailure('Lobby-Beitritt fehlgeschlagen.', error) : { ok: true };
  }

  // Nur mit dem Code, ohne die Lobby vorher auszuwählen (auch für Gäste); value = Lobby-ID
  async joinLobbyByCode(code: string): Promise<LobbyResult<string>> {
    const { data, error } = await supabase.rpc('join_lobby_by_code', { p_code: code });
    return error
      ? lobbyFailure('Lobby-Beitritt fehlgeschlagen.', error)
      : { ok: true, value: data as string };
  }

  async inviteFriend(lobbyId: string, userId: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('invite_to_lobby', {
      p_lobby_id: lobbyId,
      p_user_id: userId,
    });
    return error ? lobbyFailure('Einladung konnte nicht gesendet werden.', error) : { ok: true };
  }

  // value null = Lobby gibt es nicht mehr (Einladung wurde entfernt)
  async acceptInvite(notificationId: string): Promise<LobbyResult<string | null>> {
    const { data, error } = await supabase.rpc('accept_lobby_invite', {
      p_notification_id: notificationId,
    });
    return error
      ? lobbyFailure('Einladung konnte nicht angenommen werden.', error)
      : { ok: true, value: (data as string | null) ?? null };
  }

  async setReady(lobbyId: string, ready: boolean): Promise<ActionResult> {
    const { error } = await supabase.rpc('set_lobby_ready', {
      p_lobby_id: lobbyId,
      p_ready: ready,
    });
    return error ? lobbyFailure('Bereit-Status konnte nicht gesetzt werden.', error) : { ok: true };
  }

  async kick(lobbyId: string, userId: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('kick_lobby_member', {
      p_lobby_id: lobbyId,
      p_user_id: userId,
    });
    return error ? lobbyFailure('Spieler konnte nicht entfernt werden.', error) : { ok: true };
  }

  // Nur in der Warte-Lobby und nur an Spieler mit Konto (Gäste können nicht hosten)
  async transferHost(lobbyId: string, userId: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('transfer_lobby_host', {
      p_lobby_id: lobbyId,
      p_user_id: userId,
    });
    return error ? lobbyFailure('Host konnte nicht gewechselt werden.', error) : { ok: true };
  }

  // Verlässt der Host die Lobby, wird sie geschlossen
  async leave(lobbyId: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('leave_lobby', { p_lobby_id: lobbyId });
    return error ? lobbyFailure('Lobby konnte nicht verlassen werden.', error) : { ok: true };
  }

  async start(lobbyId: string): Promise<ActionResult> {
    const { error } = await supabase.rpc('start_lobby', { p_lobby_id: lobbyId });
    return error ? lobbyFailure('Lobby konnte nicht gestartet werden.', error) : { ok: true };
  }

  // Nur der Host einer offenen Lobby; Bereit-Status bleibt erhalten
  async setGame(
    lobbyId: string,
    gameKey: string,
    settings: LobbyGameSettings,
  ): Promise<ActionResult> {
    const { error } = await supabase.rpc('set_lobby_game', {
      p_lobby_id: lobbyId,
      p_game_key: gameKey,
      p_settings: settings,
    });
    return error ? lobbyFailure('Spiel konnte nicht eingestellt werden.', error) : { ok: true };
  }

  // Ungefiltert, weil DELETE-Events sich nicht filtern lassen. Gibt die Abmeldung zurück.
  subscribeToChanges(name: string, onChange: () => void): () => void {
    return watchTables(
      name,
      [{ table: 'multiplayer_lobbies' }, { table: 'multiplayer_lobby_members' }],
      onChange,
    );
  }

  // null = Laden fehlgeschlagen
  async loadProfiles(ids: string[]): Promise<Map<string, LobbyProfile> | null> {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_guest')
      .in('id', uniqueIds);
    if (error) {
      console.error('Profile konnten nicht geladen werden.', error);
      return null;
    }

    return new Map((data as LobbyProfile[]).map((profile) => [profile.id, profile]));
  }
}
