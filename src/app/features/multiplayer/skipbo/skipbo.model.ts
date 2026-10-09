// Skip-Bo: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20261001130000_skipbo.sql); hier wird nur gespiegelt,
// was für Anzeige und Zielwahl nötig ist.

import { cardCount, TableLayout } from '../table/table.model';

// 1–12 und 'SB' (Joker)
export type SkipboCard =
  '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'SB';

export type SkipboSourceKind = 'hand' | 'stock' | 'discard';

// Gewählte Karte: Handkarte i, Spielstapel-Oberkarte oder Oberkarte von Ablage i
export interface SkipboSource {
  kind: SkipboSourceKind;
  index: number;
}

export type SkipboEventType =
  'start' | 'draw' | 'play' | 'clear' | 'discard' | 'pass' | 'skip' | 'left' | 'win' | 'end';

// Indizes (i, pile) 0-basiert
export interface SkipboEvent {
  t: SkipboEventType;
  seat?: number;
  // draw: Anzahl gezogener Karten
  n?: number;
  src?: SkipboSourceKind;
  i?: number;
  card?: SkipboCard;
  pile?: number;
  // play: Wert, den die Karte auf dem Aufbaustapel hat (Joker!)
  value?: number;
  // play vom Spielstapel: so viele Karten bleiben
  left?: number;
  // Nur im round_log: Zugnummer und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface SkipboPlayer {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  stock_count: number;
  // Offene Oberkarte des Spielstapels; null = leer
  stock_top: SkipboCard | null;
  hand_count: number;
  // 4 Ablagen, je unten → oben
  discards: SkipboCard[][];
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (skipbo.service.ts lädt genau diese)
export interface SkipboGame {
  id: string;
  status: 'playing' | 'finished';
  seat_count: number;
  dealer_seat: number;
  turn_seat: number | null;
  turn_no: number;
  build_piles: SkipboCard[][];
  winner_seat: number | null;
  // Nur die letzte Aktion (für Animationen)
  last_events: SkipboEvent[];
  // Die letzten Ereignisse mit Zeit (Verlauf)
  round_log: SkipboEvent[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: SkipboPlayer[];
  // Eigene Handkarten (RLS liefert nur die eigene Hand)
  hand: SkipboCard[];
}

export interface SkipboRankedPlayer {
  player: SkipboPlayer;
  // null für Spieler, die das Spiel verlassen haben
  rank: number | null;
}

export const SKIPBO_SKIP_AFTER_S = 30;

// Karten im Spielstapel (Lobby-Einstellung stockSize); ohne Einstellung wie in der DB:
// 30, ab 5 Spielern 20
export const SKIPBO_STOCK_MIN = 5;
export const SKIPBO_STOCK_MAX = 50;
export const SKIPBO_STOCK_DEFAULT = 30;

// Kurzregeln für das ⋮-Menü im Spiel
export const SKIPBO_RULES = [
  'Wer zuerst den eigenen Spielstapel leer spielt, gewinnt.',
  'In der Mitte liegen vier Aufbaustapel. Jeder beginnt mit einer 1 und wird aufsteigend bis 12 belegt; ein voller Stapel wird abgeräumt.',
  'Der Joker passt auf jeden Stapel und zählt als die nächste Zahl.',
  'Spielbar sind deine Handkarten, die oberste Karte deines Spielstapels und die oberste Karte jeder Ablage.',
  'Zu Beginn deines Zugs füllst du die Hand auf 5 Karten auf. Spielst du alle 5 aus, ziehst du sofort 5 neue.',
  'Dein Zug endet, wenn du eine Handkarte auf eine deiner vier Ablagen legst.',
  'Antippen: erst eine Karte wählen, dann einen Stapel. Nochmal antippen hebt die Wahl auf.',
];

export const isJoker = (card: SkipboCard): boolean => card === 'SB';

// Auswahl nach neuem Stand: bleibt, solange man dran ist und die Quelle noch eine Karte hat
// (Spielstapel/Ablage nach dem Ausspielen also weiter gewählt). Eine Handkarte nur, wenn
// die Hand unverändert ist, sonst könnte der Index auf eine andere Karte zeigen.
export function keepSelection(
  selected: SkipboSource | null,
  before: SkipboGame,
  after: SkipboGame,
  userId: string,
): SkipboSource | null {
  const me = after.players.find((player) => player.user_id === userId);
  if (!selected || !me || me.state !== 'active') return null;
  if (after.status !== 'playing' || after.turn_seat !== me.seat) return null;
  switch (selected.kind) {
    case 'hand':
      return before.hand.length === after.hand.length &&
        before.hand.every((card, i) => card === after.hand[i])
        ? selected
        : null;
    case 'stock':
      return me.stock_top ? selected : null;
    case 'discard':
      return me.discards[selected.index]?.length ? selected : null;
  }
}

// Passt die Karte auf den Aufbaustapel? Der Joker nimmt den nächsten Wert an (Länge + 1)
export function canPlay(card: SkipboCard, pile: readonly SkipboCard[]): boolean {
  return pile.length < 12 && (isJoker(card) || Number(card) === pile.length + 1);
}

export function validPiles(card: SkipboCard, piles: readonly SkipboCard[][]): number[] {
  return piles.flatMap((pile, i) => (canPlay(card, pile) ? [i] : []));
}

// Farbgruppe (1–4, 5–8, 9–12) = Anzahl Punkte unten auf der Karte; Joker 'J'
export function cardGroup(card: SkipboCard): 1 | 2 | 3 | 'J' {
  if (isJoker(card)) return 'J';
  return Math.ceil(Number(card) / 4) as 1 | 2 | 3;
}

// "7" bzw. "Joker"
export const cardName = (card: SkipboCard): string => (isJoker(card) ? 'Joker' : card);

export function cardLabel(card: SkipboCard): string {
  return isJoker(card) ? 'Joker' : `Zahl ${card}`;
}

// Gefächerte Ablage: nur die obersten max Karten, darüber eine Kappe „+N“
export function fanView<T>(cards: readonly T[], max: number): { cap: number; cards: T[] } {
  return { cap: Math.max(0, cards.length - max), cards: cards.slice(-max) };
}

// Nach verbleibenden Spielstapel-Karten (weniger ist besser). Gleich viele = gleicher
// Rang (1, 1, 3); wer das Spiel verlassen hat, steht am Ende
export function rankPlayers(players: readonly SkipboPlayer[]): SkipboRankedPlayer[] {
  const active = players
    .filter((player) => player.state !== 'left')
    .sort((a, b) => a.stock_count - b.stock_count || a.seat - b.seat);
  return [
    ...active.map((player) => ({
      player,
      rank: active.findIndex((other) => other.stock_count === player.stock_count) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}

// Text für Kopfzeile und Verlauf, in Du-Form, wenn es um mich geht
export function describeEvent(
  event: SkipboEvent,
  players: readonly Pick<SkipboPlayer, 'seat' | 'name'>[],
  mySeat: number | null,
): string {
  const me = event.seat !== undefined && event.seat === mySeat;
  const name = players.find((player) => player.seat === event.seat)?.name ?? 'Jemand';
  const verb = (du: string, er: string) => `${me ? 'Du' : name} ${me ? du : er}`;
  const card = event.card && isJoker(event.card) ? 'einen Joker' : `eine ${event.card}`;

  switch (event.t) {
    case 'start':
      return `Spiel beginnt – Geber: ${me ? 'du' : name}`;
    case 'draw': {
      return `${verb('ziehst', 'zieht')} ${cardCount(event.n ?? 0)} nach`;
    }
    case 'play':
      if (event.src === 'stock') {
        return `${verb('spielst', 'spielt')} vom Spielstapel – ${event.left ? `noch ${event.left}` : 'leer'}`;
      }
      return event.card && isJoker(event.card)
        ? `${verb('legst', 'legt')} einen Joker als ${event.value}`
        : `${verb('legst', 'legt')} ${card} auf Stapel ${(event.pile ?? 0) + 1}`;
    case 'clear':
      return `Stapel ${(event.pile ?? 0) + 1} ist voll und wird abgeräumt`;
    case 'discard':
      return `${verb('legst', 'legt')} ${card} ab`;
    case 'pass':
      return `${verb('kannst', 'kann')} nicht mehr spielen – Zug endet`;
    case 'skip':
      return me ? 'Du wurdest übersprungen' : `${name} wurde übersprungen`;
    case 'left':
      return `${name} hat das Spiel verlassen`;
    case 'win':
      return `${verb('gewinnst', 'gewinnt')} – Spielstapel leer`;
    case 'end':
      return 'Das Spiel wurde beendet';
  }
}

export interface SkipboIcon {
  icon: string;
  color: string;
}

const MUTED = 'var(--color-text-muted)';

// Symbol und Farbe für Kopfzeile und Verlauf
export function eventIcon(event: SkipboEvent): SkipboIcon {
  switch (event.t) {
    case 'play':
      if (event.src === 'stock') return { icon: 'layers', color: 'var(--table-chip-text)' };
      return event.card && isJoker(event.card)
        ? { icon: 'auto_awesome', color: 'var(--table-gold)' }
        : { icon: 'style', color: 'var(--color-primary-light)' };
    case 'draw':
      return { icon: 'style', color: 'var(--color-primary-light)' };
    case 'clear':
      return { icon: 'delete_sweep', color: '#7dd3fc' };
    case 'discard':
      return { icon: 'move_to_inbox', color: 'var(--table-violet)' };
    case 'win':
      return { icon: 'emoji_events', color: 'var(--table-gold)' };
    case 'start':
      return { icon: 'play_arrow', color: MUTED };
    case 'pass':
      return { icon: 'block', color: MUTED };
    case 'skip':
      return { icon: 'skip_next', color: MUTED };
    case 'left':
      return { icon: 'logout', color: MUTED };
    case 'end':
      return { icon: 'stop_circle', color: MUTED };
  }
}

// Nachziehstapel (Ring des Zug-Zeigers) und wohin der Zeiger zeigt, wenn ich dran bin
export const POINTER: Record<
  TableLayout,
  { x: number; y: number; r: number; meX: number; meY: number }
> = {
  phone: { x: 99, y: 426, r: 24, meX: 228, meY: 534 },
  hoch: { x: 394, y: 582, r: 42, meX: 567, meY: 865 },
  quer: { x: 433, y: 247, r: 42, meX: 737, meY: 556 },
  laptop: { x: 450, y: 294, r: 42, meX: 759, meY: 533 },
};
// Laptop ab 5 Spielern: Mitte rückt hoch
export const LAPTOP_SMALL_POINTER_Y = 262;

// Mitte der Auslage unter dem Schild (Abstand zur Schildmitte); dorthin zeigt der Zeiger
export const SPREAD_DY: Record<TableLayout, Record<'l' | 'm' | 's', number>> = {
  phone: { l: 68, m: 64, s: 61 },
  hoch: { l: 96, m: 91, s: 88 },
  quer: { l: 69, m: 65, s: 62 },
  laptop: { l: 75, m: 75, s: 72 },
};

// Handbogen: Grad je Karte, Absinken k·o² am Rand, Anheben der gewählten Karte
// (Handy: gerade Reihe in der eigenen Leiste)
export const HAND_ARC: Record<TableLayout, { deg: number; k: number; lift: number }> = {
  phone: { deg: 0, k: 0, lift: 12 },
  hoch: { deg: 5, k: 4, lift: 20 },
  quer: { deg: 5, k: 4, lift: 17 },
  laptop: { deg: 5, k: 5, lift: 22 },
};
