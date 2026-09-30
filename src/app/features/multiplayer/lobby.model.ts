import { Profile } from '../profile/profile.model';

export type LobbyStatus = 'open' | 'started';

// Gleiche Grenzen wie in der DB (_add_lobby_member / start_lobby)
export const LOBBY_MAX_MEMBERS = 8;
export const LOBBY_MIN_MEMBERS = 2;

// Nur die Profilfelder, die die Lobby anzeigt
export type LobbyProfile = Pick<Profile, 'id' | 'username' | 'display_name'>;

export interface LobbySummary {
  id: string;
  host_user_id: string;
  hostName: string;
  status: LobbyStatus;
  created_at: string;
  memberCount: number;
}

export interface LobbyMember {
  user_id: string;
  ready: boolean;
  joined_at: string;
  name: string;
  profile: LobbyProfile | null;
}

export interface LobbyDetail {
  id: string;
  host_user_id: string;
  status: LobbyStatus;
  game_key: string | null;
  created_at: string;
  started_at: string | null;
  // Nur für den Host lesbar (RLS), sonst null
  code: string | null;
  members: LobbyMember[];
}

export const displayNameOf = (profile: LobbyProfile | null | undefined): string =>
  profile ? profile.display_name || profile.username : 'Unbekannt';

// Entspricht ready * 2 >= Mitglieder in start_lobby
export const requiredReadyCount = (memberCount: number): number => Math.ceil(memberCount / 2);

export const canStartLobby = (members: LobbyMember[]): boolean =>
  members.length >= LOBBY_MIN_MEMBERS &&
  members.filter((member) => member.ready).length >= requiredReadyCount(members.length);
