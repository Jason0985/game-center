// Uno: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20261002140000_uno.sql); hier wird nur gespiegelt, was für
// Anzeige und Hervorheben nötig ist.

import { cardCount, TableLayout } from '../table/table.model';

export type UnoColor = 'R' | 'Y' | 'G' | 'B';
type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'S' | 'R' | '+2';

// 'R5', 'YS' (Aussetzen), 'GR' (Richtungswechsel), 'B+2', 'W' (Farbwahl), 'W+4'
export type UnoCard = `${UnoColor}${UnoValue}` | 'W' | 'W+4';

export interface UnoSettings {
  stacking: boolean;
  sevenZero: boolean;
  drawUntilPlayable: boolean;
}

export type UnoEventType =
  | 'start'
  | 'play'
  | 'color'
  | 'draw'
  | 'penalty'
  | 'skipped'
  | 'reverse'
  | 'swap'
  | 'rotate'
  | 'uno'
  | 'pass'
  | 'skip'
  | 'left'
  | 'win'
  | 'end';

// Gezogene, getauschte oder übrige Karten stehen nie im Verlauf (nur n bzw. Sitze)
export interface UnoEvent {
  t: UnoEventType;
  seat?: number;
  card?: UnoCard;
  color?: UnoColor;
  // draw/penalty: Anzahl
  n?: number;
  // skipped: wer aussetzen lässt; swap: mit wem getauscht wird
  by?: number;
  target?: number;
  // reverse/rotate: Spielrichtung danach
  dir?: 1 | -1;
  round?: number;
  // Nur im round_log: Zugnummer und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface UnoPlayer {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  hand_count: number;
  uno_called: boolean;
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (uno.service.ts lädt genau diese)
export interface UnoGame {
  id: string;
  status: 'playing' | 'finished';
  settings: Partial<UnoSettings>;
  seat_count: number;
  round_no: number;
  dealer_seat: number;
  turn_seat: number | null;
  turn_no: number;
  direction: 1 | -1;
  color: UnoColor | null;
  // Die letzten bis zu 3 gespielten Karten, oberste zuletzt
  discard_top: UnoCard[];
  pending_draw: number;
  // Der Spieler am Zug hat eine passende Karte gezogen
  drew: boolean;
  uno_open_seat: number | null;
  winner_seat: number | null;
  // Nur die letzte Aktion (für Animationen)
  last_events: UnoEvent[];
  // Die letzten Ereignisse mit Zeit (Verlauf)
  round_log: UnoEvent[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: UnoPlayer[];
  // Eigene Hand, sortiert, und die gerade gezogene Karte (RLS liefert nur die eigene)
  hand: UnoCard[];
  drawn: UnoCard | null;
}

export interface UnoRankedPlayer {
  player: UnoPlayer;
  // null für Spieler, die das Spiel verlassen haben
  rank: number | null;
}

export const UNO_SKIP_AFTER_S = 30;

export const UNO_DEFAULT_SETTINGS: UnoSettings = {
  stacking: false,
  sevenZero: false,
  drawUntilPlayable: false,
};

// Kurzregeln für das ⋮-Menü im Spiel und die Lobby
export const UNO_RULES = [
  'Wer zuerst alle Handkarten los ist, gewinnt die Runde.',
  'Lege eine Karte in derselben Farbe oder mit derselben Zahl bzw. demselben Symbol. Farbwahl und +4 passen immer; du bestimmst dann die Farbe.',
  'Aussetzen: der Nächste ist übersprungen. Richtungswechsel: die Spielrichtung dreht sich (zu zweit wie Aussetzen). +2/+4: der Nächste zieht so viele Karten und ist dann fertig.',
  'Du darfst immer 1 Karte ziehen. Passt sie, spielst du nur diese oder behältst sie (Stapel nochmal antippen).',
  'Bei 2 Karten oder direkt nach dem Ausspielen bis auf 1: Uno rufen. Wer es vergisst, zieht bei der nächsten Aktion 2 Karten.',
];

// Hausregeln in der Lobby; aktive kommen ins Regel-Menü im Spiel
export const UNO_HOUSE_RULES: {
  key: keyof UnoSettings;
  label: string;
  short: string;
  rule: string;
}[] = [
  {
    key: 'stacking',
    label: '+2/+4 stapeln',
    short: 'Stapeln',
    rule: 'Stapeln: Auf eine +2 darfst du eine +2 oder +4 legen, auf eine +4 nur eine +4. Wer nicht stapelt, zieht alles.',
  },
  {
    key: 'sevenZero',
    label: '7 tauscht, 0 dreht',
    short: '7-0',
    rule: '7 tauscht, 0 dreht: Mit einer 7 tauschst du die Hand mit einem Mitspieler, bei einer 0 geben alle ihre Hand in Spielrichtung weiter.',
  },
  {
    key: 'drawUntilPlayable',
    label: 'Ziehen, bis es passt',
    short: 'Ziehen bis passt',
    rule: 'Ziehen, bis es passt: Du ziehst so lange, bis eine Karte passt.',
  },
];

export const COLOR_NAMES: Record<UnoColor, string> = {
  R: 'Rot',
  Y: 'Gelb',
  G: 'Grün',
  B: 'Blau',
};

const VALUE_NAMES: Partial<Record<string, string>> = {
  S: 'Aussetzen',
  R: 'Richtungswechsel',
  '+2': 'Zieh zwei',
};

export const isWild = (card: UnoCard): boolean => card[0] === 'W';

// null bei Farbwahl
export const cardColor = (card: UnoCard): UnoColor | null =>
  isWild(card) ? null : (card[0] as UnoColor);

// '5', 'S', 'R', '+2'; Farbwahl '' bzw. '+4'
export const cardValue = (card: UnoCard): string => card.slice(1);

// "Rot 5", "Blau Aussetzen", "Farbwahl +4"
export function cardName(card: UnoCard): string {
  if (card === 'W') return 'Farbwahl';
  if (card === 'W+4') return 'Farbwahl +4';
  const value = cardValue(card);
  return `${COLOR_NAMES[card[0] as UnoColor]} ${VALUE_NAMES[value] ?? value}`;
}

// Wie _uno_fits in der DB, plus: nach dem Ziehen nur die gezogene Karte
export function canPlay(
  card: UnoCard,
  game: Pick<UnoGame, 'pending_draw' | 'settings' | 'color' | 'discard_top' | 'drew'>,
  drawn: UnoCard | null,
): boolean {
  if (game.drew && card !== drawn) return false;
  const top = game.discard_top.at(-1);
  if (game.pending_draw > 0) {
    const plusTwo = (c: UnoCard | undefined) => !!c && !isWild(c) && cardValue(c) === '+2';
    return !!game.settings.stacking && (card === 'W+4' || (plusTwo(top) && plusTwo(card)));
  }
  return isWild(card) || card[0] === game.color || (!!top && cardValue(card) === cardValue(top));
}

// Uno-Knopf leuchtet: am Zug mit 2 Karten, von denen eine passt (vorab rufen), oder mit
// 1 Karte ohne Ruf (direkt nach dem Ausspielen). Rufen geht laut DB bei ≤ 2 Karten.
export function unoButtonLit(game: UnoGame, me: UnoPlayer | null, myTurn: boolean): boolean {
  if (!me || me.state !== 'active' || me.uno_called || game.status !== 'playing') return false;
  if (game.hand.length === 1) return true;
  return (
    myTurn && game.hand.length === 2 && game.hand.some((card) => canPlay(card, game, game.drawn))
  );
}

// Handbogen je Layout aus der Spezifikation: Kartengröße, max. Breite, Grad je Karte,
// Absinken am Rand, Anheben spielbarer Karten
export const HAND_SPEC: Record<
  TableLayout,
  { w: number; h: number; max: number; deg: number; sag: number; lift: number }
> = {
  phone: { w: 54, h: 78, max: 296, deg: 6, sag: 16, lift: 8 },
  hoch: { w: 72, h: 104, max: 620, deg: 6, sag: 20, lift: 10 },
  quer: { w: 66, h: 96, max: 900, deg: 5, sag: 18, lift: 10 },
  laptop: { w: 80, h: 116, max: 900, deg: 5, sag: 22, lift: 12 },
};
// Bogen höchstens ±22°, Karten höchstens bis 36 % sichtbar überlappt, sonst wischen
const MAX_ARC_DEG = 44;
const MIN_VISIBLE = 0.36;
const CARD_GAP = 6;

export interface HandLayout {
  // Abstand der Kartenanfänge
  step: number;
  deg: number;
  // Hand breiter als der Platz: seitlich wischen
  scroll: boolean;
  width: number;
}

export function handLayout(count: number, layout: TableLayout): HandLayout {
  const { w, max, deg } = HAND_SPEC[layout];
  if (count <= 1) return { step: w, deg: 0, scroll: false, width: w };
  const fit = (max - w) / (count - 1);
  const step = Math.max(Math.min(w + CARD_GAP, fit), w * MIN_VISIBLE);
  return {
    step,
    deg: Math.min(deg, MAX_ARC_DEG / (count - 1)),
    scroll: fit < w * MIN_VISIBLE,
    width: w + step * (count - 1),
  };
}

// Sieger zuerst, dann wenigste Karten. Gleich viele = gleicher Rang (1, 2, 2, 4);
// wer das Spiel verlassen hat, steht am Ende
export function rankPlayers(
  players: readonly UnoPlayer[],
  winnerSeat: number | null,
): UnoRankedPlayer[] {
  const key = (player: UnoPlayer) => (player.seat === winnerSeat ? -1 : player.hand_count);
  const active = players
    .filter((player) => player.state !== 'left')
    .sort((a, b) => key(a) - key(b) || a.seat - b.seat);
  return [
    ...active.map((player) => ({
      player,
      rank: active.findIndex((other) => key(other) === key(player)) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}

// Text für Kopfzeile und Verlauf, in Du-Form, wenn es um mich geht
export function describeEvent(
  event: UnoEvent,
  players: readonly Pick<UnoPlayer, 'seat' | 'name'>[],
  mySeat: number | null,
): string {
  const nameOf = (seat: number | undefined, du: string) =>
    seat !== undefined && seat === mySeat
      ? du
      : (players.find((player) => player.seat === seat)?.name ?? 'Jemand');
  const me = event.seat !== undefined && event.seat === mySeat;
  const verb = (du: string, er: string) => `${nameOf(event.seat, 'Du')} ${me ? du : er}`;

  switch (event.t) {
    case 'start':
      return `Runde ${event.round ?? 1} beginnt – Geber: ${nameOf(event.seat, 'du')}`;
    case 'play':
      return `${verb('legst', 'legt')} ${event.card ? cardName(event.card) : 'eine Karte'}`;
    case 'color':
      return `${verb('wählst', 'wählt')} ${event.color ? COLOR_NAMES[event.color] : 'eine Farbe'}`;
    case 'draw':
      if (!event.n) return `${verb('kannst', 'kann')} nicht ziehen – Stapel leer`;
      return `${verb('ziehst', 'zieht')} ${event.n === 1 ? 'eine Karte' : cardCount(event.n)}`;
    case 'penalty':
      return `${verb('ziehst', 'zieht')} ${cardCount(event.n ?? 0)} – Uno vergessen`;
    case 'skipped':
      // "lässt" ist in Du- und Er-Form gleich
      return `${nameOf(event.by, 'Du')} lässt ${nameOf(event.seat, 'dich')} aussetzen`;
    case 'reverse':
      return `${verb('wechselst', 'wechselt')} die Richtung`;
    case 'swap':
      return `${verb('tauschst', 'tauscht')} die Karten mit ${nameOf(event.target, 'dir')}`;
    case 'rotate':
      return 'Alle geben ihre Karten weiter';
    case 'uno':
      return `${verb('rufst', 'ruft')} Uno!`;
    case 'pass':
      return `${verb('behältst', 'behält')} die gezogene Karte`;
    case 'skip':
      return me ? 'Du wurdest übersprungen' : `${nameOf(event.seat, 'Du')} wurde übersprungen`;
    case 'left':
      return `${nameOf(event.seat, 'Du')} hat das Spiel verlassen`;
    case 'win':
      return `${verb('gewinnst', 'gewinnt')} die Runde`;
    case 'end':
      return 'Das Spiel wurde beendet';
  }
}

// Kartenflächen (Karten.dc): in allen Themes gleich
export const FACE_COLORS: Record<UnoColor, string> = {
  R: '#d1373b',
  Y: '#f2c230',
  G: '#43b77a',
  B: '#2a4fc1',
};

const MUTED = 'var(--color-text-muted)';

// Symbol und Farbe für Kopfzeile und Verlauf
export function eventIcon(event: UnoEvent): { icon: string; color: string } {
  switch (event.t) {
    case 'play': {
      const color = event.card && cardColor(event.card);
      return { icon: 'style', color: color ? FACE_COLORS[color] : 'var(--table-gold)' };
    }
    case 'color':
      return { icon: 'palette', color: event.color ? FACE_COLORS[event.color] : MUTED };
    case 'draw':
      return { icon: 'style', color: 'var(--color-primary-light)' };
    case 'penalty':
      return { icon: 'warning', color: 'var(--table-danger)' };
    case 'uno':
      return { icon: 'campaign', color: 'var(--table-gold)' };
    case 'win':
      return { icon: 'emoji_events', color: 'var(--table-gold)' };
    case 'skipped':
      return { icon: 'block', color: MUTED };
    case 'reverse':
      return { icon: 'sync_alt', color: MUTED };
    case 'swap':
      return { icon: 'swap_horiz', color: 'var(--table-violet)' };
    case 'rotate':
      return { icon: 'autorenew', color: 'var(--table-violet)' };
    case 'pass':
      return { icon: 'pan_tool', color: MUTED };
    case 'start':
      return { icon: 'play_arrow', color: MUTED };
    case 'skip':
      return { icon: 'skip_next', color: MUTED };
    case 'left':
      return { icon: 'logout', color: MUTED };
    case 'end':
      return { icon: 'stop_circle', color: MUTED };
  }
}

// Wer seine Hand wem gibt (7 tauscht, 0 dreht), als [von, an]. Bei der 0 wie
// _uno_next_seat in der DB: an den nächsten aktiven Platz in Spielrichtung
export function handTransfers(
  event: UnoEvent,
  players: readonly Pick<UnoPlayer, 'seat' | 'state'>[],
  seatCount: number,
): [number, number][] {
  if (event.t === 'swap' && event.seat !== undefined && event.target !== undefined) {
    return [
      [event.seat, event.target],
      [event.target, event.seat],
    ];
  }
  if (event.t !== 'rotate') return [];

  const dir = event.dir ?? 1;
  const active = players.filter((player) => player.state === 'active').map(({ seat }) => seat);
  return active.map((from) => {
    const distance = (seat: number) =>
      ((((seat - from) * dir) % seatCount) + seatCount) % seatCount || seatCount;
    return [from, active.reduce((best, seat) => (distance(seat) < distance(best) ? seat : best))];
  });
}

// Tischmitte (Ring des Zug-Zeigers) in Design-Pixeln von ARC_TABLES und wohin der Zeiger
// zeigt, wenn ich dran bin (auf meine Hand); before: Abstand vor einem Mitspieler-Schild
export const UNO_POINTER: Record<
  TableLayout,
  { x: number; y: number; r: number; meX: number; meY: number; before: number }
> = {
  phone: { x: 189, y: 440, r: 64, meX: 164, meY: 567, before: 30 },
  hoch: { x: 394, y: 587, r: 94, meX: 394, meY: 826, before: 80 },
  quer: { x: 570, y: 283, r: 94, meX: 570, meY: 528, before: 60 },
  laptop: { x: 610, y: 310, r: 94, meX: 610, meY: 562, before: 70 },
};
