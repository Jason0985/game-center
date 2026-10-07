import { Profile } from '../profile/profile.model';
import { UNO_HOUSE_RULES } from './uno/uno.model';

export type LobbyStatus = 'open' | 'started';

// Rahmenbedingungen des Spiels (set_lobby_game). Flip 7: targetScore null = offen ohne
// Punkteziel; Uno: die drei Hausregeln; Skip-Bo hat keine Einstellungen ({})
export interface LobbyGameSettings {
  targetScore?: number | null;
  stacking?: boolean;
  sevenZero?: boolean;
  drawUntilPlayable?: boolean;
}

// Gleiche Grenzen wie in der DB (_add_lobby_member / start_lobby)
export const LOBBY_MAX_MEMBERS = 8;
export const LOBBY_MIN_MEMBERS = 2;

// Nur die Profilfelder, die die Lobby anzeigt
export type LobbyProfile = Pick<Profile, 'id' | 'username' | 'display_name' | 'is_guest'>;

export interface LobbySummary {
  id: string;
  host_user_id: string;
  hostName: string;
  status: LobbyStatus;
  game_key: string | null;
  game_settings: LobbyGameSettings | null;
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
  game_settings: LobbyGameSettings | null;
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

// Wählbare Spiele; Grenzen wie in der DB (start_lobby)
export const GAMES = [
  {
    key: 'flip-7',
    name: 'Flip 7',
    icon: 'style',
    blurb: 'Karten ziehen, Punkte sammeln – aber keine Zahl doppelt!',
    maxPlayers: LOBBY_MAX_MEMBERS,
    url: null,
  },
  {
    key: 'skip-bo',
    name: 'Skip-Bo',
    icon: 'layers',
    blurb: 'Spielstapel leer spielen – Karten von 1 bis 12 in die Mitte legen.',
    maxPlayers: 6,
    url: null,
  },
  {
    key: 'uno',
    name: 'Uno',
    icon: 'view_carousel',
    blurb: 'Farbe oder Zahl bedienen – wer zuerst alle Karten los ist, gewinnt.',
    maxPlayers: LOBBY_MAX_MEMBERS,
    url: null,
  },
  // Läuft extern; die Lobby zeigt nur den Link
  {
    key: 'monopoly',
    name: 'Monopoly',
    icon: 'apartment',
    blurb: 'Straßen kaufen, Häuser bauen, Miete kassieren – gespielt auf richup.io.',
    maxPlayers: LOBBY_MAX_MEMBERS,
    url: 'https://richup.io',
  },
] as const;

export const gameOf = (gameKey: string | null | undefined) =>
  GAMES.find((game) => game.key === gameKey) ?? null;

export const gameName = (gameKey: string | null | undefined): string | null =>
  gameOf(gameKey)?.name ?? null;

// Warum der Host (noch) nicht starten kann, unabhängig von der Bereitschaft; null = Spiel passt
export function startBlocker(
  gameKey: string | null | undefined,
  memberCount: number,
): string | null {
  const game = gameOf(gameKey);
  if (!game) return 'Der Host muss noch ein Spiel auswählen.';
  if (game.url) return `${game.name} spielt ihr direkt über den Link oben.`;
  return memberCount > game.maxPlayers
    ? `${game.name} geht mit höchstens ${game.maxPlayers} Spielern.`
    : null;
}

// z. B. "Flip 7 · bis 200 Punkte", "Flip 7 · Offen" oder "Uno · Stapeln, 7-0"
export function gameLabel(
  gameKey: string | null | undefined,
  settings: LobbyGameSettings | null | undefined,
): string {
  const name = gameName(gameKey);
  if (!name) {
    return 'Noch kein Spiel gewählt';
  }

  if (gameKey === 'uno') {
    const rules = UNO_HOUSE_RULES.filter((rule) => settings?.[rule.key]).map((rule) => rule.short);
    return rules.length ? `${name} · ${rules.join(', ')}` : name;
  }
  if (gameKey !== 'flip-7') return name;

  const target = settings?.targetScore;
  return typeof target === 'number' ? `${name} · bis ${target} Punkte` : `${name} · Offen`;
}
