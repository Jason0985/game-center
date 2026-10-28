// Skyjo: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20260918220000_core_schema.sql); hier wird nur gespiegelt, was für
// Anzeige, Hinweise und Animationen nötig ist.

export type SkPhase = 'reveal' | 'turn' | 'round_over';
export type SkStep = 'draw' | 'place' | 'flip';
export type SkSource = 'pile' | 'discard';

export type SkEventType =
  | 'deal'
  | 'flip'
  | 'start'
  | 'draw'
  | 'swap'
  | 'discard'
  | 'clear'
  | 'last'
  | 'shuffle'
  | 'skip'
  | 'round_end'
  | 'left'
  | 'end';

export interface SkEvent {
  t: SkEventType;
  seat?: number | null;
  // Zelle 0–11 (zeilenweise, Spalte = Zelle % 4)
  cell?: number;
  // Spalte 0–3 (clear)
  col?: number;
  card?: number;
  // swap: die alte Karte und ob sie verdeckt war
  old?: number;
  hidden?: boolean;
  from?: SkSource;
  // start: Summe der zwei offenen Karten; clear: abgeräumte Punkte; shuffle: Kartenzahl
  n?: number;
  round?: number;
  doubled?: boolean;
  // Nur im round_log: Runde und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface SkPlayer {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  // Offene Karten, Zelle 0–11; null = verdeckt bzw. abgeräumt (cleared)
  cards: (number | null)[];
  // Abgeräumte Spalten 0–3
  cleared: boolean[];
  // Beim Rundenstart schon aufgedeckt (bis 2)
  flips: number;
  // Punkte aus abgeschlossenen Runden; letzte Runde roh und gewertet
  score: number;
  round_raw: number | null;
  round_score: number | null;
  columns: number;
  doubled: number;
  best_round: number | null;
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (skyjo.service.ts lädt genau diese)
export interface SkGame {
  id: string;
  status: 'playing' | 'finished';
  phase: SkPhase;
  step: SkStep | null;
  seat_count: number;
  end_score: number;
  clear_columns: boolean;
  double_ender: boolean;
  round_no: number;
  turn_seat: number | null;
  drawn: number | null;
  drawn_from: SkSource | null;
  // Ablage, oberste zuletzt
  discard: number[];
  deck_count: number;
  ender_seat: number | null;
  last_turns: number[];
  last_events: SkEvent[];
  round_log: SkEvent[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: SkPlayer[];
}

export interface SkyjoSettings {
  endScore: number;
  clearColumns: boolean;
  doubleEnder: boolean;
}

export const SKYJO_DEFAULT_SETTINGS: SkyjoSettings = {
  endScore: 100,
  clearColumns: true,
  doubleEnder: true,
};
export const SKYJO_END_OPTIONS = [50, 100, 150] as const;
export const SKYJO_HOUSE_RULES: readonly {
  key: 'clearColumns' | 'doubleEnder';
  label: string;
  short: string;
}[] = [
  { key: 'clearColumns', label: 'Drei gleiche in einer Spalte abräumen', short: 'Spalten' },
  { key: 'doubleEnder', label: 'Rundenbeender verdoppeln, wenn nicht Bester', short: 'Verdoppeln' },
];

// Erst nach so langem Warten kann der Host überspringen (die Datenbank lässt 25 s zu)
export const SKYJO_SKIP_AFTER_S = 30;
// Nach dem letzten Zug der Runde (alles wird aufgedeckt) noch so lange den Tisch zeigen
export const SKYJO_RESULTS_PAUSE_MS = 2500;
// Rundenübersicht: so lange, dann startet die nächste Runde von selbst; der Knopf geht erst
// nach SKYJO_ROUND_MIN_S (die Datenbank lässt die Übersicht mindestens 5 s stehen)
export const SKYJO_NEXT_ROUND_S = 12;
export const SKYJO_ROUND_MIN_S = 3;
// Animationen: Karte fliegt, Spalte leuchtet vor dem Abräumen
export const SKYJO_FLY_MS = 450;
export const SKYJO_CLEAR_MS = 1700;

export function skyjoRules(settings: SkyjoSettings): string[] {
  return [
    'Ziel: möglichst wenige Punkte. Die Karten zählen −2 bis 12.',
    'Jeder hat 12 verdeckte Karten im Raster und deckt zu Beginn 2 auf. Wer die höchste Summe zeigt, beginnt.',
    'Am Zug: vom Stapel oder der Ablage ziehen und gegen eine eigene Karte tauschen – oder die Stapelkarte abwerfen und eine eigene aufdecken.',
    ...(settings.clearColumns ? ['Drei gleiche offene Karten in einer Spalte fliegen raus.'] : []),
    'Hat jemand alles aufgedeckt, hat jeder andere noch einen Zug. Dann wird alles aufgedeckt und gezählt.',
    ...(settings.doubleEnder
      ? ['Wer die Runde beendet und nicht allein am wenigsten hat, zählt doppelt (nur bei Plus).']
      : []),
    `Wer zuerst ${settings.endScore} Punkte hat, beendet das Spiel. Am wenigsten gewinnt.`,
  ];
}

export const SKYJO_RULES = skyjoRules(SKYJO_DEFAULT_SETTINGS);

// Kartenfarben nach Wert (Kartendesign): Fläche und Schrift
export function cardColors(value: number): { face: string; ink: string } {
  if (value < 0) return { face: '#3d44b0', ink: '#ffffff' };
  if (value === 0) return { face: '#4cc3ef', ink: '#06324a' };
  if (value <= 4) return { face: '#4fbf68', ink: '#0b3a16' };
  if (value <= 8) return { face: '#f5cf3a', ink: '#4a3800' };
  return { face: '#e5484d', ink: '#ffffff' };
}

// Mit echtem Minuszeichen
export const cardText = (value: number): string => (value < 0 ? `−${-value}` : String(value));
export const formatPoints = (value: number): string =>
  value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0';

export const columnOf = (cell: number): number => cell % 4;

// Summe der offenen Karten
export const openSum = (cards: readonly (number | null)[]): number =>
  cards.reduce<number>((sum, card) => sum + (card ?? 0), 0);

// Verdeckt und nicht abgeräumt
export const isHidden = (player: Pick<SkPlayer, 'cards' | 'cleared'>, cell: number): boolean =>
  player.cards[cell] === null && !player.cleared[columnOf(cell)];

export const hiddenCount = (player: Pick<SkPlayer, 'cards' | 'cleared'>): number =>
  player.cards.filter((_, cell) => isHidden(player, cell)).length;

export interface SkRankedPlayer {
  player: SkPlayer;
  // null: verlassen (ohne Platz)
  rank: number | null;
}

// Wenigste Punkte zuerst (gleich viele: gleicher Platz); Verlassene ans Ende
export function rankPlayers(
  players: readonly SkPlayer[],
  score: (player: SkPlayer) => number = (player) => player.score,
): SkRankedPlayer[] {
  const active = players.filter((player) => player.state !== 'left');
  const sorted = [...active].sort((a, b) => score(a) - score(b) || a.seat - b.seat);
  return [
    ...sorted.map((player) => ({
      player,
      rank: sorted.findIndex((other) => score(other) === score(player)) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}

export function describeEvent(
  event: SkEvent,
  players: readonly Pick<SkPlayer, 'seat' | 'name'>[],
  mySeat: number | null,
): string {
  const nameOf = (seat: number | null | undefined, du: string) =>
    seat !== undefined && seat !== null && seat === mySeat
      ? du
      : (players.find((player) => player.seat === seat)?.name ?? 'Jemand');
  const me = event.seat !== undefined && event.seat === mySeat;
  const verb = (du: string, er: string) => `${nameOf(event.seat, 'Du')} ${me ? du : er}`;
  const card = cardText(event.card ?? 0);

  switch (event.t) {
    case 'deal':
      return `Runde ${event.round ?? 1} – je 12 Karten ausgeteilt`;
    case 'flip':
      return `${verb('deckst', 'deckt')} eine ${card} auf`;
    case 'start':
      return `${verb('beginnst', 'beginnt')} (${event.n ?? 0} offen)`;
    case 'draw':
      return event.from === 'discard'
        ? `${verb('nimmst', 'nimmt')} die ${card} von der Ablage`
        : `${verb('ziehst', 'zieht')} eine ${card}`;
    case 'swap':
      return event.hidden
        ? `${verb('tauschst', 'tauscht')} eine verdeckte ${cardText(event.old ?? 0)} gegen die ${card}`
        : `${verb('tauschst', 'tauscht')} eine ${cardText(event.old ?? 0)} gegen die ${card}`;
    case 'discard':
      return `${verb('wirfst', 'wirft')} die ${card} ab`;
    case 'clear':
      return `${verb('räumst', 'räumt')} Spalte ${(event.col ?? 0) + 1} ab (drei ${card}er)`;
    case 'last':
      return `${verb('hast', 'hat')} alles aufgedeckt – letzte Runde`;
    case 'shuffle':
      return 'Die Ablage wird zum neuen Stapel gemischt';
    case 'skip':
      return me ? 'Deine Zeit ist abgelaufen' : `${nameOf(event.seat, 'Du')}: Zeit abgelaufen`;
    case 'round_end':
      return event.doubled
        ? `Runde ${event.round ?? ''} beendet – ${nameOf(event.seat, 'du')} ${me ? 'zählst' : 'zählt'} doppelt`
        : `Runde ${event.round ?? ''} beendet`;
    case 'left':
      return `${nameOf(event.seat, 'Du')} hat das Spiel verlassen`;
    case 'end':
      return 'Der Host hat das Spiel beendet';
    default:
      return '';
  }
}

const MUTED = 'var(--color-text-muted)';

export function eventIcon(event: SkEvent): { icon: string; color: string } {
  switch (event.t) {
    case 'deal':
      return { icon: 'style', color: 'var(--color-primary-light)' };
    case 'flip':
    case 'start':
      return { icon: 'flip', color: MUTED };
    case 'draw':
    case 'swap':
      return { icon: 'swap_horiz', color: 'var(--color-primary-light)' };
    case 'discard':
      return { icon: 'delete_sweep', color: MUTED };
    case 'clear':
      return { icon: 'auto_awesome', color: 'var(--table-gold)' };
    case 'last':
    case 'round_end':
      return { icon: 'flag', color: 'var(--color-warning)' };
    case 'shuffle':
      return { icon: 'shuffle', color: MUTED };
    case 'skip':
      return { icon: 'timer_off', color: MUTED };
    default:
      return { icon: 'logout', color: MUTED };
  }
}
