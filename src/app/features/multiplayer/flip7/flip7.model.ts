// Flip 7: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20260930161000_flip7.sql); hier wird nur gespiegelt,
// was für die Anzeige nötig ist.

import { arcSpots, TableGeometry, TableLayout } from '../table/table.model';

export type Flip7NumberCard =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
export type Flip7ModifierCard = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2';
export type Flip7ActionCard = 'FREEZE' | 'FLIP3' | 'SC';
export type Flip7Card = Flip7NumberCard | Flip7ModifierCard | Flip7ActionCard;

export type Flip7PlayerState = 'active' | 'stayed' | 'frozen' | 'busted' | 'flip7' | 'left';
export type Flip7Status = 'playing' | 'round_over' | 'finished';

export type Flip7EventType =
  | 'draw'
  | 'bust'
  | 'second_chance'
  | 'sc_given'
  | 'sc_discarded'
  | 'freeze'
  | 'flip3'
  | 'set_aside'
  | 'flip7'
  | 'stay'
  | 'reshuffle'
  | 'left'
  | 'skip';

export interface Flip7Event {
  t: Flip7EventType;
  seat?: number;
  card?: Flip7Card;
  target?: number;
  // Nur im round_log: Rundennummer und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface Flip7Player {
  user_id: string;
  seat: number;
  state: Flip7PlayerState;
  cards: Flip7Card[];
  total_score: number;
  round_score: number | null;
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (flip7.service.ts lädt genau diese)
export interface Flip7Game {
  id: string;
  target_score: number | null;
  status: Flip7Status;
  seat_count: number;
  round_no: number;
  dealer_seat: number;
  phase: 'deal' | 'turn' | 'resolve' | null;
  turn_seat: number | null;
  pending_card: Flip7ActionCard | null;
  pending_seat: number | null;
  // Wer gerade Flip 3 abarbeitet und wie viele Karten noch fehlen
  flip3_seat: number | null;
  flip3_left: number | null;
  draw_count: number;
  discard_count: number;
  // Die obersten zwei Ablagekarten (oberste zuletzt); gilt nur bei discard_count > 0
  discard_top: Flip7Card[];
  // Nur die letzte Aktion (für Animationen)
  last_events: Flip7Event[];
  // Alle Ereignisse der laufenden Runde mit Zeit (Verlauf)
  round_log: Flip7Event[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: Flip7Player[];
}

export interface Flip7RankedPlayer {
  player: Flip7Player;
  // null für Spieler, die das Spiel verlassen haben
  rank: number | null;
}

// Punkteziele zur Auswahl; null = offen ohne Ziel
export const FLIP7_TARGET_OPTIONS = [100, 150, 200, 300] as const;
export const FLIP7_DEFAULT_TARGET = 200;
// Die Datenbank lässt Nicht-Hosts schon nach 8 s weiterschalten (Toleranz)
export const FLIP7_NEXT_ROUND_DELAY_S = 10;
export const FLIP7_SKIP_AFTER_S = 30;
export const FLIP7_BONUS = 15;

// Kurzregeln für das ⋮-Menü im Spiel
export const FLIP7_RULES = [
  'Wer am Zug ist, zieht eine Karte oder bleibt stehen. Stehen bleiben sichert die Punkte dieser Runde.',
  'Zieht jemand eine Zahl, die er schon hat, ist das ein Bust: 0 Punkte in dieser Runde.',
  `Sieben verschiedene Zahlen sind Flip 7: +${FLIP7_BONUS} Punkte, und die Runde endet sofort.`,
  'Modifikatoren: ×2 verdoppelt die Zahlen, +2 bis +10 kommen danach dazu.',
  'Freeze: Das Ziel muss sofort stehen bleiben. Flip 3: Das Ziel zieht drei Karten. Second Chance: fängt einen Bust einmal ab.',
  'Erreicht jemand am Rundenende das Punkteziel, ist das Spiel vorbei: Die meisten Punkte gewinnen, bei Gleichstand wird geteilt.',
];

export const isNumberCard = (card: Flip7Card): card is Flip7NumberCard => /^\d+$/.test(card);
export const isModifierCard = (card: Flip7Card): card is Flip7ModifierCard =>
  card === 'x2' || card.startsWith('+');
export const isActionCard = (card: Flip7Card): card is Flip7ActionCard =>
  card === 'FREEZE' || card === 'FLIP3' || card === 'SC';

export const ACTION_NAMES: Record<Flip7ActionCard, string> = {
  FREEZE: 'Freeze',
  FLIP3: 'Flip 3',
  SC: 'Second Chance',
};

// Kurzer Name, z. B. für Ereignisse: "7", "+4", "×2", "Freeze"
export function cardName(card: Flip7Card): string {
  if (card === 'x2') return '×2';
  return isActionCard(card) ? ACTION_NAMES[card] : card;
}

export function cardAriaLabel(card: Flip7Card): string {
  if (isNumberCard(card)) return `Zahl ${card}`;
  if (isModifierCard(card)) return `Modifikator ${cardName(card)}`;
  return `Aktionskarte ${ACTION_NAMES[card]}`;
}

// Kartenfarben: Zahlen reihum nach Wert, Aktionskarten fest (in allen Farbschemas gleich)
export const NUMBER_COLORS = [
  '#38c6de',
  '#5b8cff',
  '#4cc38a',
  '#f2c94c',
  '#ff9150',
  '#a78bfa',
  '#f472b6',
] as const;
export const ACTION_COLORS: Record<Flip7ActionCard, { bg: string; fg: string }> = {
  FREEZE: { bg: '#7dd3fc', fg: '#0b2533' },
  FLIP3: { bg: '#ff9150', fg: '#2a1204' },
  SC: { bg: '#c8386d', fg: '#ffffff' },
};

// Modifikatoren als Kurztext, z. B. "×2 +6"; "" ohne Modifikatoren
export function modifierText(cards: readonly Flip7Card[]): string {
  const bonus = cards
    .filter((card) => card.startsWith('+'))
    .reduce((sum, card) => sum + Number(card.slice(1)), 0);
  return [cards.includes('x2') ? '×2' : '', bonus ? `+${bonus}` : ''].filter(Boolean).join(' ');
}

export function distinctNumbers(cards: readonly Flip7Card[]): number {
  return new Set(cards.filter(isNumberCard)).size;
}

// Spiegel von _flip7_score: Zahlen (×2 verdoppelt nur sie) + Plus-Karten + 15 für Flip 7
export function flip7Score(cards: readonly Flip7Card[], state: Flip7PlayerState): number {
  if (state === 'busted' || state === 'left') return 0;

  const numbers = cards.filter(isNumberCard).reduce((sum, card) => sum + Number(card), 0);
  const bonus = cards
    .filter((card) => card.startsWith('+'))
    .reduce((sum, card) => sum + Number(card.slice(1)), 0);
  return (
    numbers * (cards.includes('x2') ? 2 : 1) +
    bonus +
    (distinctNumbers(cards) >= 7 ? FLIP7_BONUS : 0)
  );
}

// Spiegel von _flip7_candidates: Freeze/Flip 3 jeder Aktive inkl. Ziehendem,
// Second Chance nur andere Aktive ohne eigene. Reihenfolge ab dem Ziehenden.
export function targetCandidates(
  game: Pick<Flip7Game, 'players' | 'seat_count'>,
  card: Flip7ActionCard,
  chooserSeat: number,
): number[] {
  const count = game.seat_count;
  return game.players
    .filter(
      (player) =>
        player.state === 'active' &&
        (card !== 'SC' || (player.seat !== chooserSeat && !player.cards.includes('SC'))),
    )
    .map((player) => player.seat)
    .sort((a, b) => ((a - chooserSeat + count) % count) - ((b - chooserSeat + count) % count));
}

// Nach Gesamtpunkten. Gleiche Punkte = gleicher Rang (1, 1, 3); wer das Spiel
// verlassen hat, steht am Ende
export function rankPlayers(players: readonly Flip7Player[]): Flip7RankedPlayer[] {
  const active = players
    .filter((player) => player.state !== 'left')
    .sort((a, b) => b.total_score - a.total_score || a.seat - b.seat);
  const left = players.filter((player) => player.state === 'left');

  return [
    ...active.map((player) => ({
      player,
      rank: active.findIndex((other) => other.total_score === player.total_score) + 1,
    })),
    ...left.map((player) => ({ player, rank: null })),
  ];
}

// Höchste Gesamtpunktzahl unter den Verbliebenen; mehrere = geteilter Sieg
export function winners(game: Pick<Flip7Game, 'players'>): Flip7Player[] {
  const remaining = game.players.filter((player) => player.state !== 'left');
  if (!remaining.length) return [];

  const best = Math.max(...remaining.map((player) => player.total_score));
  return remaining.filter((player) => player.total_score === best);
}

// Wer gerade etwas tun muss (Ziehen oder Ziel wählen); null außerhalb eines Zugs
export function activeSeatOf(
  game: Pick<Flip7Game, 'status' | 'pending_card' | 'pending_seat' | 'phase' | 'turn_seat'>,
): number | null {
  if (game.status !== 'playing') return null;
  return game.pending_card ? game.pending_seat : game.phase === 'turn' ? game.turn_seat : null;
}

type EventContext = Pick<Flip7Game, 'players' | 'flip3_seat' | 'flip3_left'>;

// Text für Ereignis-Chip und Verlauf, in Du-Form, wenn es um mich geht
export function describeEvent(
  event: Flip7Event,
  game: EventContext,
  mySeat: number | null,
): string {
  const player = (seat?: number) => game.players.find((candidate) => candidate.seat === seat);
  const name = (seat?: number) => player(seat)?.name ?? 'Jemand';
  const me = event.seat !== undefined && event.seat === mySeat;
  const verb = (du: string, er: string) => `${me ? 'Du' : name(event.seat)} ${me ? du : er}`;
  // Ziel im Akkusativ ("friert dich ein") bzw. Dativ ("gibt dir")
  const targetMe = event.target !== undefined && event.target === mySeat;
  const self = event.seat === event.target;
  const card = event.card ? cardName(event.card) : '';

  switch (event.t) {
    case 'draw':
      return `${verb('ziehst', 'zieht')} ${event.card && isNumberCard(event.card) ? 'eine ' : ''}${card}`;
    case 'bust':
      return `${verb('hast', 'hat')} Bust – doppelte ${card}`;
    case 'second_chance':
      return `${verb('rettest dich', 'rettet sich')} mit Second Chance`;
    case 'sc_given':
      return `${verb('gibst', 'gibt')} ${targetMe ? 'dir' : name(event.target)} Second Chance`;
    case 'sc_discarded':
      return me
        ? 'Deine Second Chance wird abgelegt'
        : `Second Chance von ${name(event.seat)} wird abgelegt`;
    case 'freeze':
      return self
        ? `${verb('frierst dich', 'friert sich')} selbst ein`
        : `${verb('frierst', 'friert')} ${targetMe ? 'dich' : name(event.target)} ein`;
    case 'flip3': {
      const left = game.flip3_seat === event.target ? (game.flip3_left ?? 0) : 0;
      const rest = left ? ` – noch ${left} ${left === 1 ? 'Karte' : 'Karten'}` : '';
      return self
        ? `${verb('nimmst', 'nimmt')} Flip 3 selbst${rest}`
        : `${verb('gibst', 'gibt')} ${targetMe ? 'dir' : name(event.target)} Flip 3${rest}`;
    }
    case 'set_aside':
      return `${verb('legst', 'legt')} ${card} zur Seite`;
    case 'flip7':
      return `${verb('schaffst', 'schafft')} Flip 7! +${FLIP7_BONUS}`;
    case 'stay': {
      const stayed = player(event.seat);
      const points = stayed ? ` (+${flip7Score(stayed.cards, stayed.state)})` : '';
      return `${verb('bleibst', 'bleibt')} stehen${points}`;
    }
    case 'reshuffle':
      return 'Die Ablage wird neu gemischt';
    case 'left':
      return `${name(event.seat)} hat das Spiel verlassen`;
    case 'skip':
      return me ? 'Du wurdest übersprungen' : `${name(event.seat)} wurde übersprungen`;
  }
}

export interface Flip7Icon {
  icon: string;
  color: string;
}

const MUTED = 'var(--color-text-muted)';
export const ACTION_ICONS: Record<Flip7ActionCard, Flip7Icon> = {
  FREEZE: { icon: 'ac_unit', color: '#7dd3fc' },
  FLIP3: { icon: 'filter_3', color: '#ff9150' },
  SC: { icon: 'favorite', color: '#c8386d' },
};

function cardIcon(card?: Flip7Card): Flip7Icon {
  if (!card || isNumberCard(card)) return { icon: 'style', color: 'var(--color-primary-light)' };
  return isModifierCard(card) ? { icon: 'add', color: 'var(--table-violet)' } : ACTION_ICONS[card];
}

// Symbol und Farbe für Ereignis-Chip und Verlauf
export function eventIcon(event: Flip7Event): Flip7Icon {
  switch (event.t) {
    case 'draw':
    case 'set_aside':
      return cardIcon(event.card);
    case 'bust':
      return { icon: 'close', color: 'var(--table-danger)' };
    case 'second_chance':
    case 'sc_given':
    case 'sc_discarded':
      return ACTION_ICONS.SC;
    case 'freeze':
      return ACTION_ICONS.FREEZE;
    case 'flip3':
      return ACTION_ICONS.FLIP3;
    case 'flip7':
      return { icon: 'auto_awesome', color: 'var(--table-gold)' };
    case 'stay':
      return { icon: 'pan_tool', color: 'var(--table-violet)' };
    case 'reshuffle':
      return { icon: 'shuffle', color: MUTED };
    case 'left':
      return { icon: 'logout', color: MUTED };
    case 'skip':
      return { icon: 'skip_next', color: MUTED };
  }
}

// Tischgeometrie je Layout (Design-Pixel der Platte); Kartenfächer liegen zwischen
// Platz und Ellipsenmitte (fan: Anteil des Wegs in x/y)
export const FLIP7_TABLES: Record<TableLayout, TableGeometry & { fan: readonly [number, number] }> =
  {
    phone: {
      w: 378,
      h: 560,
      cx: 189,
      cy: 509.4,
      a: 151,
      b: 443.4,
      from: 158,
      to: 22,
      fan: [0.61, 0.69],
    },
    hoch: {
      w: 788,
      h: 800,
      cx: 394,
      cy: 794.5,
      a: 338.6,
      b: 747.3,
      from: 172,
      to: 8,
      fan: [0.62, 0.71],
    },
    quer: {
      w: 1140,
      h: 520,
      cx: 570,
      cy: 260,
      a: 504.6,
      b: 236,
      from: 212,
      to: -32,
      fan: [0.59, 0.58],
    },
    // Ganzer Tischrand, ich sitze unten (270°)
    laptop: {
      w: 1220,
      h: 720,
      cx: 610,
      cy: 360,
      a: 610,
      b: 360,
      from: 270,
      to: -90,
      fan: [0.65, 0.62],
    },
  };

// Plätze der Mitspieler auf dem Bogen, dazu je Platz die Lage des Kartenfächers.
// Laptop: neben mir mindestens ein Stück frei (Platz für meine Karten).
export function seatSpots(
  layout: TableLayout,
  count: number,
): { x: number; y: number; fanX: number; fanY: number }[] {
  const table = FLIP7_TABLES[layout];
  const gap = layout === 'laptop' ? (count + 1 >= 7 ? 0.2 : 0.17) : null;
  return arcSpots(table, count, gap).map(({ x, y }) => ({
    x,
    y,
    fanX: table.cx + table.fan[0] * (x - table.cx),
    fanY: table.cy + table.fan[1] * (y - table.cy),
  }));
}

export const PLAYER_STATE_LABELS: Record<Flip7PlayerState, string> = {
  active: 'Im Spiel',
  stayed: 'Gestoppt',
  frozen: 'Eingefroren',
  busted: 'Raus',
  flip7: 'Flip 7',
  left: 'Verlassen',
};
