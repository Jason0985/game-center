// Blackjack: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20261010150000_blackjack.sql); hier wird nur gespiegelt, was für
// Anzeige und Knöpfe nötig ist.

import { TableLayout } from '../table/table.model';

// Rang + Farbe: 'AS', '10H', 'KD' (S Pik, H Herz, D Karo, C Kreuz)
export type BjCard = string;
export type BjSuit = 'S' | 'H' | 'D' | 'C';
export type BjResult = 'win' | 'blackjack' | 'push' | 'lose';
export type BjAction = 'hit' | 'stand' | 'double' | 'split';

export interface BjHand {
  // 1 nur nach dem Teilen
  hand_no: number;
  cards: BjCard[];
  bet: number;
  doubled: boolean;
  state: 'playing' | 'stood' | 'bust' | 'blackjack';
  // null bis zur Abrechnung; payout inklusive Einsatz
  result: BjResult | null;
  payout: number | null;
}

export type BjEventType =
  | 'bet'
  | 'shuffle'
  | 'deal'
  | 'hit'
  | 'stand'
  | 'skip'
  | 'double'
  | 'split'
  | 'reveal'
  | 'dealer'
  | 'result'
  | 'left'
  | 'end'
  | 'broke';

// Die verdeckte Dealerkarte steht erst beim Aufdecken (reveal) im Verlauf
export interface BjEvent {
  t: BjEventType;
  seat?: number;
  hand?: number;
  card?: BjCard;
  // split: je Hand die neue Karte
  cards?: BjCard[];
  // bet: Einsatz; hit/stand/double/dealer: Wert danach; result: Gewinn (negativ = verloren)
  n?: number;
  k?: BjResult;
  // dealer: Blackjack
  bj?: boolean;
  round?: number;
  // Nur im round_log: Runde und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface BjPlayer {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  balance: number;
  // Einsatz fürs nächste Austeilen (schon abgezogen); 0 = noch keiner
  bet: number;
  last_bet: number;
  name: string;
  // Hände der laufenden bzw. letzten Runde, nach hand_no
  hands: BjHand[];
}

// Nur die Spalten, die die Anzeige braucht (blackjack.service.ts lädt genau diese)
export interface BjGame {
  id: string;
  status: 'playing' | 'finished';
  phase: 'betting' | 'playing';
  seat_count: number;
  start_money: number;
  round_no: number;
  turn_seat: number | null;
  turn_hand: number | null;
  // Offene Dealerkarten; dealer_hole: dahinter liegt noch eine verdeckte
  dealer_cards: BjCard[];
  dealer_hole: boolean;
  shoe_count: number;
  first_bet_at: string | null;
  last_events: BjEvent[];
  round_log: BjEvent[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: BjPlayer[];
}

export const BET_MIN = 10;
export const BET_MAX = 500;
export const START_MONEY_OPTIONS = [500, 1000, 2500, 5000, 10000] as const;
export const START_MONEY_DEFAULT = 1000;
// Setzzeit ab dem ersten Einsatz, Zugzeit (nur mit Mitspielern); danach handelt der Tisch
export const BET_WINDOW_S = 20;
export const TURN_S = 30;

// Chips (Karten.dc): Wert und Farbe, kleinster zuerst
export const CHIPS = [
  { value: 10, color: 'var(--tile-pink)' },
  { value: 25, color: 'var(--tile-green)' },
  { value: 100, color: 'var(--tile-blue)' },
  { value: 500, color: 'var(--tile-purple)' },
] as const;
const MAX_STACK = 6;

// Kurzregeln für das ⋮-Menü im Spiel und die Lobby
export const BLACKJACK_RULES = [
  'Komm näher an 21 als der Dealer, ohne darüber zu gehen. Bilder zählen 10, das Ass 1 oder 11.',
  'Ass und Zehn als erste zwei Karten sind Blackjack und zahlen 3 zu 2 (abgerundet, 25 bringt 37).',
  'Der Dealer zieht bis 16 und steht auf allen 17. Unentschieden: Einsatz zurück.',
  'Verdoppeln: doppelter Einsatz, genau eine Karte. Teilen: zwei gleichwertige Karten werden zwei Hände (einmal pro Runde; geteilte Asse bekommen je nur eine Karte).',
  'Einsatz 10 bis 500. Mit Mitspielern wird 20 s nach dem ersten Einsatz ausgeteilt; wer dann nicht gesetzt hat, setzt aus. Nach 30 s ohne Zug hält deine Hand.',
  'Wer unter 10 hat, ist pleite. Kann niemand mehr setzen, endet das Spiel; sonst beendet es der Host. Es gewinnt, wer am meisten hat.',
];

const SUITS: Record<BjSuit, { name: string; red: boolean; path: string }> = {
  S: {
    name: 'Pik',
    red: false,
    path: 'M12 2C9.2 5.8 3 9.3 3 14a4.6 4.6 0 0 0 7.7 3.4C10.4 19.3 9.6 20.8 8 22h8c-1.6-1.2-2.4-2.7-2.7-4.6A4.6 4.6 0 0 0 21 14c0-4.7-6.2-8.2-9-12z',
  },
  H: {
    name: 'Herz',
    red: true,
    path: 'M12 21.4l-1.5-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.5 11.5L12 21.4z',
  },
  D: { name: 'Karo', red: true, path: 'M12 1.5 20.5 12 12 22.5 3.5 12z' },
  C: {
    name: 'Kreuz',
    red: false,
    path: 'M12 2a4.3 4.3 0 0 0-3.9 6.1A4.3 4.3 0 1 0 10.7 16c-.3 2.5-1.1 4.4-2.7 6h8c-1.6-1.6-2.4-3.5-2.7-6a4.3 4.3 0 1 0 2.6-7.9A4.3 4.3 0 0 0 12 2z',
  },
};
const RANK_NAMES: Partial<Record<string, string>> = { A: 'Ass', J: 'Bube', Q: 'Dame', K: 'König' };

export const rankOf = (card: BjCard): string => card.slice(0, -1);
export const suitOf = (card: BjCard) => SUITS[card.slice(-1) as BjSuit];
export const isPicture = (card: BjCard): boolean => ['J', 'Q', 'K'].includes(rankOf(card));

// "Pik Ass", "Herz 10"
export const cardName = (card: BjCard): string =>
  `${suitOf(card).name} ${RANK_NAMES[rankOf(card)] ?? rankOf(card)}`;

const points = (card: BjCard): number => {
  const rank = rankOf(card);
  return rank === 'A' ? 1 : isPicture(card) ? 10 : Number(rank);
};

// Wie _blackjack_total in der DB; soft: ein Ass zählt gerade 11 ("7 / 17")
export function handValue(cards: readonly BjCard[]): { total: number; soft: boolean } {
  const hard = cards.reduce((sum, card) => sum + points(card), 0);
  const soft = cards.some((card) => rankOf(card) === 'A') && hard + 10 <= 21;
  return { total: soft ? hard + 10 : hard, soft };
}

// "18", "7 / 17"; über 21 nur die Zahl
export function valueLabel(cards: readonly BjCard[]): string {
  const { total, soft } = handValue(cards);
  return soft && total < 21 ? `${total - 10} / ${total}` : String(total);
}

// Zwei Karten mit 21, nicht nach dem Teilen
export const isBlackjack = (cards: readonly BjCard[], split: boolean): boolean =>
  !split && cards.length === 2 && handValue(cards).total === 21;

export const canDouble = (hand: BjHand, balance: number): boolean =>
  hand.state === 'playing' && hand.cards.length === 2 && balance >= hand.bet;

// Einmal pro Runde, zwei gleichwertige Karten (Bilder und 10 gleich)
export function canSplit(hands: readonly BjHand[], balance: number): boolean {
  const [hand] = hands;
  if (hands.length !== 1 || hand.state !== 'playing' || hand.cards.length !== 2) return false;
  const [a, b] = hand.cards.map((card) => (rankOf(card) === 'A' ? 11 : points(card)));
  return a === b && balance >= hand.bet;
}

// Chips eines Betrags, gierig von groß nach klein, höchstens 6; unterster zuerst
export function chipStack(amount: number): (typeof CHIPS)[number][] {
  const chips: (typeof CHIPS)[number][] = [];
  let rest = amount;
  for (const chip of [...CHIPS].reverse()) {
    while (rest >= chip.value && chips.length < MAX_STACK) {
      chips.push(chip);
      rest -= chip.value;
    }
  }
  return chips.reverse();
}

// Farbe des größten Chips im Betrag (Punkt neben "✓ 50")
export const chipColor = (amount: number): string =>
  [...CHIPS].reverse().find((chip) => chip.value <= amount)?.color ?? CHIPS[0].color;

const moneyFormat = new Intl.NumberFormat('de-DE');
export const formatMoney = (amount: number): string => moneyFormat.format(amount);

// "+50", "−25" (echtes Minus), "±0"
export const formatDelta = (delta: number): string =>
  delta > 0 ? `+${formatMoney(delta)}` : delta < 0 ? `−${formatMoney(-delta)}` : '±0';

export const handDelta = (hand: BjHand): number => (hand.payout ?? 0) - hand.bet;
export const roundDelta = (hands: readonly BjHand[]): number =>
  hands.reduce((sum, hand) => sum + handDelta(hand), 0);

// Einsatz auf dem Tisch: offene Hände bzw. schon gesetzt fürs nächste Austeilen
export const stakeOf = (player: BjPlayer): number =>
  player.bet || player.hands.reduce((sum, hand) => sum + hand.bet, 0);

// Nur diese Ereignisse starten eine neue Zeitleiste am Brett; ein Einsatz o. Ä. eines
// Mitspielers während der Abrechnung darf sie nicht abbrechen
export const resetsTimeline = (events: readonly BjEvent[]): boolean =>
  events.some((event) => event.t === 'deal' || event.t === 'reveal' || event.t === 'result');

// Plätze der Mitspieler (Prozent der Platte), reihum ab dem Platz links von mir.
// Handy/iPad hoch: feste Spalten links und rechts (oben sitzt der Dealer);
// quer/Laptop: untere Hälfte der Ellipse, Winkel in Bildschirm-Grad (ich bei 90°).
// ponytail: feste Tabellen für 1–4 Mitspieler statt berechnet, reicht bis 5 Spieler
const SIDE_SPOTS = {
  lLow: { x: 13.2, y: 56 },
  lHigh: { x: 13.2, y: 29.7 },
  rHigh: { x: 86.8, y: 29.7 },
  rLow: { x: 86.8, y: 56 },
  lMid: { x: 13.2, y: 42.4 },
  rMid: { x: 86.8, y: 42.4 },
};
const SIDE_LAYOUTS = [
  [],
  [SIDE_SPOTS.lMid],
  [SIDE_SPOTS.lMid, SIDE_SPOTS.rMid],
  [SIDE_SPOTS.lLow, SIDE_SPOTS.lHigh, SIDE_SPOTS.rMid],
  [SIDE_SPOTS.lLow, SIDE_SPOTS.lHigh, SIDE_SPOTS.rHigh, SIDE_SPOTS.rLow],
];
const ARC_ANGLES = [[], [150], [140, 40], [125, 165, 30], [120, 160, 20, 60]];

export function blackjackSeats(layout: TableLayout, count: number): { x: number; y: number }[] {
  if (layout === 'phone' || layout === 'hoch') return SIDE_LAYOUTS[count] ?? [];
  return (ARC_ANGLES[count] ?? []).map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: 50 + 39 * Math.cos(rad), y: 50 + 34.7 * Math.sin(rad) };
  });
}

// Text für Kopfzeile und Verlauf, in Du-Form, wenn es um mich geht
export function describeEvent(
  event: BjEvent,
  players: readonly Pick<BjPlayer, 'seat' | 'name' | 'hands'>[],
  mySeat: number | null,
): string {
  const me = event.seat !== undefined && event.seat === mySeat;
  const name = me ? 'Du' : (players.find((p) => p.seat === event.seat)?.name ?? 'Jemand');
  const verb = (du: string, er: string) => `${name} ${me ? du : er}`;
  const n = event.n ?? 0;
  const card = event.card ? cardName(event.card) : 'eine Karte';
  const value = n > 21 ? `überkauft (${n})` : String(n);

  switch (event.t) {
    case 'bet':
      return `${verb('setzt', 'setzt')} ${formatMoney(n)}`;
    case 'shuffle':
      return 'Neuer Schuh – frisch gemischt';
    case 'deal':
      return `Runde ${event.round ?? 1} – es wird ausgeteilt`;
    case 'hit':
      return `${verb('ziehst', 'zieht')} ${card} – ${value}`;
    case 'stand':
      return `${verb('hältst', 'hält')} bei ${n}`;
    case 'skip':
      return `Zeit abgelaufen – ${verb('hältst', 'hält')} bei ${n}`;
    case 'double':
      return `${verb('verdoppelst', 'verdoppelt')}: ${card} – ${value}`;
    case 'split':
      return `${verb('teilst', 'teilt')}`;
    case 'reveal':
      return `Dealer deckt ${card} auf`;
    case 'dealer':
      return event.bj
        ? 'Dealer hat Blackjack'
        : n > 21
          ? `Dealer überkauft (${n})`
          : `Dealer hat ${n}`;
    case 'result': {
      const split = (players.find((p) => p.seat === event.seat)?.hands.length ?? 1) > 1;
      const hand = split ? ` (Hand ${(event.hand ?? 0) + 1})` : '';
      if (event.k === 'blackjack') return `${name}: Blackjack${hand} ${formatDelta(n)}`;
      if (event.k === 'win') return `${verb('gewinnst', 'gewinnt')}${hand} ${formatDelta(n)}`;
      if (event.k === 'push') return `${name}: Unentschieden${hand}`;
      return `${verb('verlierst', 'verliert')}${hand} ${formatMoney(-n)}`;
    }
    case 'left':
      return `${name} hat das Spiel verlassen`;
    case 'end':
      return 'Das Spiel wurde beendet';
    case 'broke':
      return 'Niemand kann mehr setzen – Spielende';
  }
}

const MUTED = 'var(--color-text-muted)';

// Symbol und Farbe für Kopfzeile und Verlauf
export function eventIcon(event: BjEvent): { icon: string; color: string } {
  switch (event.t) {
    case 'bet':
      return { icon: 'paid', color: 'var(--table-target)' };
    case 'shuffle':
      return { icon: 'shuffle', color: MUTED };
    case 'deal':
    case 'reveal':
      return { icon: 'style', color: MUTED };
    case 'hit':
      return { icon: 'add', color: (event.n ?? 0) > 21 ? 'var(--table-danger)' : MUTED };
    case 'stand':
      return { icon: 'front_hand', color: MUTED };
    case 'skip':
      return { icon: 'skip_next', color: MUTED };
    case 'double':
      return { icon: 'exposure_plus_2', color: 'var(--table-violet)' };
    case 'split':
      return { icon: 'call_split', color: 'var(--table-violet)' };
    case 'dealer':
      return { icon: 'person', color: event.bj ? 'var(--table-gold)' : MUTED };
    case 'result':
      return event.k === 'win' || event.k === 'blackjack'
        ? { icon: 'emoji_events', color: 'var(--table-gold)' }
        : event.k === 'push'
          ? { icon: 'sync_alt', color: MUTED }
          : { icon: 'block', color: 'var(--table-danger)' };
    case 'left':
      return { icon: 'logout', color: MUTED };
    case 'end':
    case 'broke':
      return { icon: 'stop_circle', color: MUTED };
  }
}

export type BjTone = 'muted' | 'ready' | 'value' | 'turn' | 'bust' | 'bj' | 'win' | 'lose';

export interface SeatStatus {
  // Token am Handy-Platz ("✓ 50", "18", "17·20", "BJ", "+75", "Pleite")
  short: string;
  // Tag am Laptop-Platz und in der Übersicht ("Hält · 18", "Überkauft", "Gewonnen +50")
  long: string;
  tone: BjTone;
  // Chipfarbe neben "✓ 50"
  dot: string | null;
}

const RESULT_WORDS: Record<BjResult, string> = {
  blackjack: 'Blackjack',
  win: 'Gewonnen',
  push: 'Unentschieden',
  lose: 'Verloren',
};

// Rundenstand eines Platzes in einem Wort. hidden: Abrechnung läuft noch (Animation),
// Ergebnisse noch nicht verraten
export function seatStatus(
  player: BjPlayer,
  game: Pick<BjGame, 'phase' | 'turn_seat'>,
  hidden: boolean,
): SeatStatus {
  const status = (short: string, long: string, tone: BjTone, dot: string | null = null) => ({
    short,
    long,
    tone,
    dot,
  });
  if (player.state === 'left') return status('Weg', 'Verlassen', 'muted');

  const hands = player.hands;
  // Beim Setzen liegen nur abgerechnete Hände der letzten Runde (oder keine)
  if (game.phase === 'betting') {
    if (player.bet > 0) {
      return status(`✓ ${formatMoney(player.bet)}`, 'Gesetzt', 'ready', chipColor(player.bet));
    }
    if (hands.length && !hidden) {
      const delta = roundDelta(hands);
      const word =
        hands.length === 1
          ? RESULT_WORDS[hands[0].result ?? 'push']
          : delta > 0
            ? 'Gewonnen'
            : 'Verloren';
      return status(
        formatDelta(delta),
        delta === 0 ? 'Unentschieden' : `${word} ${formatDelta(delta)}`,
        delta > 0 ? 'win' : delta < 0 ? 'lose' : 'muted',
      );
    }
    if (!hands.length) {
      return player.balance < BET_MIN
        ? status('Pleite', 'Pleite', 'muted')
        : status('…', 'Wählt Einsatz', 'muted');
    }
  } else if (!hands.length) {
    return status('–', 'Setzt aus', 'muted');
  }

  const values = hands.map((hand) =>
    hand.state === 'blackjack' ? 'BJ' : String(handValue(hand.cards).total),
  );
  const tone: BjTone = hands.every((hand) => hand.state === 'bust')
    ? 'bust'
    : hands.some((hand) => hand.state === 'blackjack')
      ? 'bj'
      : game.turn_seat === player.seat && game.phase === 'playing'
        ? 'turn'
        : 'value';
  const [first] = hands;
  const long =
    tone === 'bust'
      ? 'Überkauft'
      : tone === 'bj'
        ? 'Blackjack'
        : tone === 'turn'
          ? `Am Zug · ${values.join(' · ')}`
          : first.state === 'playing'
            ? `Wartet · ${values.join(' · ')}`
            : `Hält · ${values.join(' · ')}`;
  return status(values.join('·'), long, tone);
}
