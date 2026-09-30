// Flip 7: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20260930161000_flip7.sql); hier wird nur gespiegelt,
// was für die Anzeige nötig ist.

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
  draw_count: number;
  discard_count: number;
  last_events: Flip7Event[];
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

export const isNumberCard = (card: Flip7Card): card is Flip7NumberCard => /^\d+$/.test(card);
export const isModifierCard = (card: Flip7Card): card is Flip7ModifierCard =>
  card === 'x2' || card.startsWith('+');
export const isActionCard = (card: Flip7Card): card is Flip7ActionCard =>
  card === 'FREEZE' || card === 'FLIP3' || card === 'SC';

export const ACTION_NAMES: Record<Flip7ActionCard, string> = {
  FREEZE: 'Einfrieren',
  FLIP3: 'Drei ziehen',
  SC: 'Zweite Chance',
};

// Kurzer Name, z. B. für Ereignisse: "7", "+4", "×2", "Einfrieren"
export function cardName(card: Flip7Card): string {
  if (card === 'x2') return '×2';
  return isActionCard(card) ? ACTION_NAMES[card] : card;
}

export function cardAriaLabel(card: Flip7Card): string {
  if (isNumberCard(card)) return `Zahl ${card}`;
  if (card === 'x2') return 'Mal 2';
  if (isModifierCard(card)) return `Plus ${card.slice(1)}`;
  return `Aktion ${ACTION_NAMES[card]}`;
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

// Spiegel von _flip7_candidates: Einfrieren/Drei ziehen jeder Aktive inkl. Ziehendem,
// Zweite Chance nur andere Aktive ohne eigene. Reihenfolge ab dem Ziehenden.
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

const ACTION_ORDER: Flip7ActionCard[] = ['FREEZE', 'FLIP3', 'SC'];

function displayOrder(card: Flip7Card): number {
  if (isNumberCard(card)) return Number(card);
  if (card === 'x2') return 100;
  if (isModifierCard(card)) return 100 + Number(card.slice(1));
  return 200 + ACTION_ORDER.indexOf(card);
}

// Zahlen aufsteigend, dann Modifikatoren, dann Aktionen
export function sortedForDisplay(cards: readonly Flip7Card[]): Flip7Card[] {
  return [...cards].sort((a, b) => displayOrder(a) - displayOrder(b));
}

export function describeEvent(event: Flip7Event, nameOf: (seat: number) => string): string {
  const name = event.seat === undefined ? '' : nameOf(event.seat);
  const target = event.target === undefined ? '' : nameOf(event.target);
  const card = event.card ? cardName(event.card) : '';

  switch (event.t) {
    case 'draw':
      return `${name} zieht ${card}.`;
    case 'bust':
      return `${name} hat die ${card} doppelt – raus!`;
    case 'second_chance':
      return `${name} rettet sich mit der Zweiten Chance.`;
    case 'sc_given':
      return `${name} schenkt ${target} eine Zweite Chance.`;
    case 'sc_discarded':
      return `Niemand kann die Zweite Chance von ${name} nehmen – abgelegt.`;
    case 'freeze':
      return event.seat === event.target
        ? `${name} friert sich selbst ein.`
        : `${name} friert ${target} ein.`;
    case 'flip3':
      return event.seat === event.target
        ? `${name} zieht selbst drei Karten.`
        : `${name} lässt ${target} drei Karten ziehen.`;
    case 'set_aside':
      return `${name} legt ${card} zur Seite.`;
    case 'flip7':
      return `${name} hat Flip 7!`;
    case 'stay':
      return `${name} bleibt stehen.`;
    case 'reshuffle':
      return 'Der Ablagestapel wird neu gemischt.';
    case 'left':
      return `${name} hat das Spiel verlassen.`;
    case 'skip':
      return `${name} wurde übersprungen.`;
  }
}

export const PLAYER_STATE_LABELS: Record<Flip7PlayerState, string> = {
  active: 'Im Spiel',
  stayed: 'Gestoppt',
  frozen: 'Eingefroren',
  busted: 'Raus',
  flip7: 'Flip 7',
  left: 'Verlassen',
};
