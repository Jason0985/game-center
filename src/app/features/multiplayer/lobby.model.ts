import { Profile } from '../profile/profile.model';
import { UNO_DEFAULT_SETTINGS, UNO_HOUSE_RULES, UNO_RULES, UnoSettings } from './uno/uno.model';
import { FLIP7_DEFAULT_TARGET, FLIP7_RULES } from './flip7/flip7.model';
import { SKIPBO_RULES } from './skipbo/skipbo.model';

export type LobbyStatus = 'open' | 'started';

// Rahmenbedingungen des Spiels (set_lobby_game). Flip 7: targetScore null = offen ohne
// Punkteziel; Uno: die drei Hausregeln; Skip-Bo: stockSize 5–50, ohne = Standard
export interface LobbyGameSettings {
  targetScore?: number | null;
  stockSize?: number;
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
  // Siege seit Eröffnen der Lobby je user_id (Uno: je Runde), zählen die Ergebnis-Trigger
  wins: Record<string, number>;
  members: LobbyMember[];
}

export const displayNameOf = (profile: LobbyProfile | null | undefined): string =>
  profile ? profile.display_name || profile.username : 'Unbekannt';

// Abend-Gewinner: die Mitglieder mit den meisten Siegen (Gleichstand = mehrere); null ohne Siege
export function eveningWinners(
  lobby: Pick<LobbyDetail, 'wins' | 'members'>,
): { names: string[]; wins: number } | null {
  const wins = Math.max(0, ...lobby.members.map((member) => lobby.wins[member.user_id] ?? 0));
  if (!wins) return null;
  const names = lobby.members
    .filter((member) => lobby.wins[member.user_id] === wins)
    .map((member) => member.name);
  return { names, wins };
}

// Wie start_lobby: mindestens 2 Spieler und alle bereit
export const canStartLobby = (members: LobbyMember[]): boolean =>
  members.length >= LOBBY_MIN_MEMBERS && members.every((member) => member.ready);

// Wählbare Spiele; Grenzen wie in der DB (start_lobby)
export const GAMES = [
  {
    key: 'flip-7',
    tile: 'var(--tile-pink)',
    tagline: 'Karten ziehen, nicht doppeln',
    name: 'Flip 7',
    icon: 'style',
    blurb: 'Karten ziehen, Punkte sammeln – aber keine Zahl doppelt!',
    maxPlayers: LOBBY_MAX_MEMBERS,
    url: null,
  },
  {
    key: 'skip-bo',
    tile: 'var(--tile-blue)',
    tagline: 'Stapel leer spielen',
    name: 'Skip-Bo',
    icon: 'layers',
    blurb: 'Spielstapel leer spielen – Karten von 1 bis 12 in die Mitte legen.',
    maxPlayers: 6,
    url: null,
  },
  {
    key: 'uno',
    tile: 'var(--tile-orange)',
    tagline: 'Farbe oder Zahl bedienen',
    name: 'Uno',
    icon: 'view_carousel',
    blurb: 'Farbe oder Zahl bedienen – wer zuerst alle Karten los ist, gewinnt.',
    maxPlayers: LOBBY_MAX_MEMBERS,
    url: null,
  },
  // Läuft extern; die Lobby zeigt nur den Link
  {
    key: 'monopoly',
    tile: 'var(--tile-green)',
    tagline: 'Extern auf richup.io',
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

// Einstellungen kurz, z. B. "bis 200 Punkte", "Offen", "15 Karten" oder "Stapeln, 7-0"; null ohne
export function settingsLabel(
  gameKey: string | null | undefined,
  settings: LobbyGameSettings | null | undefined,
): string | null {
  if (gameKey === 'uno') {
    const rules = UNO_HOUSE_RULES.filter((rule) => settings?.[rule.key]).map((rule) => rule.short);
    return rules.length ? rules.join(', ') : null;
  }
  if (gameKey === 'skip-bo') {
    return settings?.stockSize ? `${settings.stockSize} Karten` : null;
  }
  if (gameKey !== 'flip-7') return null;

  const target = settings?.targetScore;
  return typeof target === 'number' ? `bis ${target} Punkte` : 'Offen';
}

// z. B. "Flip 7 · bis 200 Punkte", "Flip 7 · Offen", "Skip-Bo · 15 Karten" oder "Uno · Stapeln, 7-0"
export function gameLabel(
  gameKey: string | null | undefined,
  settings: LobbyGameSettings | null | undefined,
): string {
  const name = gameName(gameKey);
  if (!name) {
    return 'Noch kein Spiel gewählt';
  }
  const detail = settingsLabel(gameKey, settings);
  return detail ? `${name} · ${detail}` : name;
}

// Punkteziel einer Flip-7-Lobby: ohne Eintrag der Standard, null = offen
export const flip7TargetOf = (settings: LobbyGameSettings | null | undefined): number | null =>
  settings?.targetScore === undefined ? FLIP7_DEFAULT_TARGET : settings.targetScore;

export const unoRulesOf = (settings: LobbyGameSettings | null | undefined): UnoSettings => ({
  stacking: settings?.stacking ?? UNO_DEFAULT_SETTINGS.stacking,
  sevenZero: settings?.sevenZero ?? UNO_DEFAULT_SETTINGS.sevenZero,
  drawUntilPlayable: settings?.drawUntilPlayable ?? UNO_DEFAULT_SETTINGS.drawUntilPlayable,
});

// Kurzregeln je Spiel (Uno mit den aktiven Hausregeln); leer für externe Spiele
export function rulesOf(
  gameKey: string | null | undefined,
  settings: LobbyGameSettings | null | undefined,
): readonly string[] {
  if (gameKey === 'flip-7') return FLIP7_RULES;
  if (gameKey === 'skip-bo') return SKIPBO_RULES;
  if (gameKey !== 'uno') return [];
  const active = unoRulesOf(settings);
  return [...UNO_RULES, ...UNO_HOUSE_RULES.filter((rule) => active[rule.key]).map((r) => r.rule)];
}
