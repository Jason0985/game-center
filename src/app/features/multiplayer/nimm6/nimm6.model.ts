// Nimm 6: Anzeige-Logik. Die Spielregeln selbst laufen nur in der Datenbank
// (supabase/migrations/20260918220000_core_schema.sql); hier wird nur gespiegelt, was für
// Anzeige, Hinweise und die Animation des Anlegens nötig ist.

export type N6Phase = 'choose' | 'take' | 'round_over';

export type N6EventType =
  'deal' | 'ready' | 'reveal' | 'place' | 'six' | 'take' | 'skip' | 'round_end' | 'left' | 'end';

// Aufgedeckte Karte: Sitz und Karte
export interface N6Played {
  s: number;
  c: number;
}

export interface N6Event {
  t: N6EventType;
  seat?: number;
  card?: number;
  // 0–3
  row?: number;
  // six/take: Hornochsen der genommenen Reihe
  n?: number;
  // six/take: die genommenen Karten
  cards?: number[];
  // reveal: alle aufgedeckten Karten, aufsteigend
  played?: N6Played[];
  round?: number;
  // Nur im round_log: Runde und Zeitpunkt (Serverzeit)
  r?: number;
  at?: string;
}

export interface N6Player {
  user_id: string;
  seat: number;
  state: 'active' | 'left';
  // Hornochsen gesamt (inklusive laufender Runde) und in dieser Runde
  score: number;
  round_bulls: number;
  // Hat in diesem Zug schon gewählt
  ready: boolean;
  rows_taken: number;
  sixths: number;
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (nimm6.service.ts lädt genau diese)
export interface N6Game {
  id: string;
  status: 'playing' | 'finished';
  phase: N6Phase;
  seat_count: number;
  end_score: number;
  round_no: number;
  turn_no: number;
  card_rows: number[][];
  revealed: N6Played[];
  resolve_at: number;
  take_seat: number | null;
  // Wer gerade dran ist: nur bei der Reihenwahl (= take_seat), sonst null (alle wählen
  // gleichzeitig); vom Service gesetzt, für den gemeinsamen Spielrahmen
  turn_seat: number | null;
  last_events: N6Event[];
  round_log: N6Event[];
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: N6Player[];
  // Eigene Hand (per RLS nur meine) und die verdeckt gewählte Karte
  hand: number[];
  chosen: number | null;
}

export const NIMM6_HAND = 10;
// Keine Zugzeit; erst nach so langer Wartezeit kann der Host überspringen (der Tisch legt
// dann eine zufällige Karte bzw. nimmt die billigste Reihe)
export const NIMM6_TURN_S = 30;
// Nach dem letzten Anlegen der Runde noch so lange den Tisch zeigen
export const NIMM6_RESULTS_PAUSE_MS = 2000;
// Rundenübersicht: so lange, dann startet die nächste Runde von selbst; der Knopf geht erst
// nach NIMM6_ROUND_MIN_S (die Datenbank lässt die Übersicht mindestens 4 s nach dem
// Nachspielen stehen)
export const NIMM6_NEXT_ROUND_S = 12;
export const NIMM6_ROUND_MIN_S = 3;

export const NIMM6_RULES = [
  'Ziel: möglichst wenige Hornochsen. Jede Karte trägt 1 bis 7 (endet auf 5: 2, endet auf 0: 3, Schnapszahl: 5, die 55: 7).',
  'Alle wählen gleichzeitig verdeckt eine Karte. Dann wird aufgedeckt und der Reihe nach angelegt, die kleinste Karte zuerst.',
  'Eine Karte kommt an die Reihe, deren letzte Karte kleiner ist und am nächsten an ihr liegt.',
  'Wäre sie dort die 6. Karte, nimmst du die 5 Karten der Reihe als Hornochsen; deine Karte beginnt die Reihe neu.',
  'Ist deine Karte kleiner als jedes Reihenende, wählst du eine Reihe, nimmst sie und beginnst sie mit deiner Karte neu.',
  'Nach 10 Karten endet die Runde. Hat dann jemand 66 Hornochsen oder mehr, endet das Spiel – es gewinnt, wer die wenigsten hat.',
  'Es gibt keine Zugzeit. Wartet der Tisch lange auf dich, kann der Host dich überspringen: Dann wird eine zufällige Karte gelegt bzw. die billigste Reihe genommen.',
];

// Hornochse (Kopf mit Hörnern), viewBox 0 0 24 24
export const BULL_PATH =
  'M1.5 3.5C2 7 4.3 8.8 7.2 9.1L8 9.6h8l.8-.5c2.9-.3 5.2-2.1 5.7-5.6-1.4 1.8-3.4 2.9-5.6 3H7.1C4.9 6.4 2.9 5.3 1.5 3.5ZM7.6 10.2 3.8 10.9c.9 1.6 2.4 2.4 4.1 2.5ZM16.4 10.2l3.8.7c-.9 1.6-2.4 2.4-4.1 2.5ZM7.6 9.8h8.8l-.5 6.4c0 .6.1 1.2.2 1.8.3 2-1.6 3.6-4.1 3.6s-4.4-1.6-4.1-3.6c.1-.6.2-1.2.2-1.8Z';

export function bullsOf(card: number): number {
  if (card === 55) return 7;
  if (card % 11 === 0) return 5;
  if (card % 10 === 0) return 3;
  if (card % 5 === 0) return 2;
  return 1;
}

export const rowBulls = (row: readonly number[]): number =>
  row.reduce((sum, card) => sum + bullsOf(card), 0);

export const bullsLabel = (n: number): string => (n === 1 ? '1 Hornochse' : `${n} Hornochsen`);

// Kartenfarben nach Hornochsen (Kartendesign): Fläche, dunkler Ochse, Schrift der Ochsen
export const CARD_COLORS: Record<number, { face: string; deep: string; ink: string }> = {
  1: { face: '#b7a3ec', deep: '#8d74d8', ink: '#3b2577' },
  2: { face: '#68c3ef', deep: '#2f95cc', ink: '#0b3a57' },
  3: { face: '#f5c242', deep: '#d99412', ink: '#5a3500' },
  5: { face: '#ef5b60', deep: '#c4333a', ink: '#5c0d12' },
  7: { face: '#a6276a', deep: '#6e1645', ink: '#ffd34d' },
};

// Wohin eine Karte käme: Reihe mit dem höchsten Ende darunter. row null: kleiner als jedes
// Reihenende (Reihe wählen); sixth: sie wäre dort die 6. Karte
export function placementOf(
  rows: readonly (readonly number[])[],
  card: number,
): { row: number | null; after: number | null; sixth: boolean } {
  let row: number | null = null;
  let after = -1;
  rows.forEach((cards, i) => {
    const last = cards.at(-1) ?? 0;
    if (last < card && last > after) {
      after = last;
      row = i;
    }
  });
  return {
    row,
    after: row === null ? null : after,
    sixth: row !== null && rows[row].length >= 5,
  };
}

// Ein Schritt beim Anlegen (Animation)
export interface N6Step {
  seat: number;
  card: number;
  row: number;
  kind: 'place' | 'six' | 'take';
  // six/take: genommene Karten und ihre Hornochsen
  taken: number[];
  bulls: number;
}

// Was die letzte Aktion angelegt hat, und wie die Reihen davor aussahen: rückwärts aus den
// Reihen danach (place nimmt die Karte wieder weg, six/take legt die genommene Reihe zurück)
export function replaySteps(game: Pick<N6Game, 'card_rows' | 'last_events'>): {
  before: number[][];
  steps: N6Step[];
} {
  const steps: N6Step[] = game.last_events
    .filter(
      (event) =>
        (event.t === 'place' || event.t === 'six' || event.t === 'take') &&
        event.row !== undefined &&
        event.card !== undefined &&
        event.seat !== undefined,
    )
    .map((event) => ({
      seat: event.seat!,
      card: event.card!,
      row: event.row!,
      kind: event.t as N6Step['kind'],
      taken: event.cards ?? [],
      bulls: event.n ?? 0,
    }));
  const before = game.card_rows.map((row) => [...row]);
  for (const step of [...steps].reverse()) {
    before[step.row] = step.kind === 'place' ? before[step.row].slice(0, -1) : [...step.taken];
  }
  return { before, steps };
}

// Animation des Anlegens. Dieselben Dauern rechnet die Datenbank in _nimm6_replay_ms
// (Core-Schema) auf die Zugzeit drauf – beide Stellen zusammen ändern.
// Aufdecken: die verdeckten Karten an den Plätzen drehen sich um (FLIP_MS je Hälfte), dann
// kurz lesen
export const REVEAL_MS = 1800;
export const FLIP_MS = 250;
// Anlegen: die Karte fliegt vom Platz in die Reihe, dann kurz stehen lassen
export const PLACE_MS = 1000;
export const FLY_MS = 550;
// Reihe nehmen (ab Beginn des Schritts): Karte fliegt hin und liegt kurz, die Reihe schiebt
// sich zum Haufen (GATHER_AT_MS), der Haufen fliegt zum Spieler (PILE_AT_MS, PILE_FLY_MS),
// dort zählen die Hornochsen dazu (COUNT_AT_MS) und bleiben bis TAKE_MS stehen
export const GATHER_AT_MS = 1200;
export const PILE_AT_MS = 2300;
export const PILE_FLY_MS = 700;
export const COUNT_AT_MS = PILE_AT_MS + PILE_FLY_MS;
export const TAKE_MS = 4300;
// Hornochsen am Platz hochzählen
export const COUNT_UP_MS = 600;
export const stepMs = (step: N6Step): number => (step.kind === 'place' ? PLACE_MS : TAKE_MS);

export function replayMs(game: Pick<N6Game, 'card_rows' | 'last_events'>): number {
  const { steps } = replaySteps(game);
  if (!steps.length) return 0;
  const reveal = game.last_events.some((event) => event.t === 'reveal') ? REVEAL_MS : 0;
  return reveal + steps.reduce((sum, step) => sum + stepMs(step), 0);
}

export interface N6RankedPlayer {
  player: N6Player;
  // null: verlassen (ohne Platz)
  rank: number | null;
}

// Wenigste Hornochsen zuerst (gleich viele: gleicher Platz); Verlassene ans Ende
export function rankPlayers(players: readonly N6Player[]): N6RankedPlayer[] {
  const active = players.filter((player) => player.state !== 'left');
  const sorted = [...active].sort((a, b) => a.score - b.score || a.seat - b.seat);
  return [
    ...sorted.map((player) => ({
      player,
      rank: sorted.findIndex((other) => other.score === player.score) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}

export function describeEvent(
  event: N6Event,
  players: readonly Pick<N6Player, 'seat' | 'name'>[],
  mySeat: number | null,
): string {
  const nameOf = (seat: number | undefined, du: string) =>
    seat !== undefined && seat === mySeat
      ? du
      : (players.find((player) => player.seat === seat)?.name ?? 'Jemand');
  const me = event.seat !== undefined && event.seat === mySeat;
  const verb = (du: string, er: string) => `${nameOf(event.seat, 'Du')} ${me ? du : er}`;
  const row = (event.row ?? 0) + 1;

  switch (event.t) {
    case 'deal':
      return `Runde ${event.round ?? 1} – je 10 Karten ausgeteilt`;
    case 'reveal':
      return `Aufgedeckt: ${(event.played ?? []).map((played) => played.c).join(', ')}`;
    case 'place':
      return `${verb('legst', 'legt')} ${event.card} an Reihe ${row}`;
    case 'six':
      return `${verb('legst', 'legt')} ${event.card} als 6. Karte und ${me ? 'nimmst' : 'nimmt'} Reihe ${row} (+${event.n ?? 0})`;
    case 'take':
      return `${verb('nimmst', 'nimmt')} Reihe ${row} mit der ${event.card} (+${event.n ?? 0})`;
    case 'skip':
      return me ? 'Deine Zeit ist abgelaufen' : `${nameOf(event.seat, 'Du')}: Zeit abgelaufen`;
    case 'round_end':
      return `Runde ${event.round ?? ''} beendet`;
    case 'left':
      return `${nameOf(event.seat, 'Du')} hat das Spiel verlassen`;
    case 'end':
      return 'Der Host hat das Spiel beendet';
    default:
      return '';
  }
}

const MUTED = 'var(--color-text-muted)';

export function eventIcon(event: N6Event): { icon: string; color: string } {
  switch (event.t) {
    case 'deal':
      return { icon: 'style', color: 'var(--color-primary-light)' };
    case 'reveal':
      return { icon: 'visibility', color: 'var(--color-primary-light)' };
    case 'place':
      return { icon: 'south', color: MUTED };
    case 'six':
      return { icon: 'error', color: 'var(--table-danger)' };
    case 'take':
      return { icon: 'move_down', color: 'var(--color-warning)' };
    case 'skip':
      return { icon: 'timer_off', color: MUTED };
    case 'round_end':
      return { icon: 'flag', color: 'var(--table-gold)' };
    default:
      return { icon: 'logout', color: MUTED };
  }
}
