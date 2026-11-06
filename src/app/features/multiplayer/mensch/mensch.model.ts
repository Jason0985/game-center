// Mensch ärgere dich nicht: Anzeige-Logik und Brett. Die Spielregeln selbst laufen nur in
// der Datenbank (supabase/migrations/20261029120000_mensch.sql); hier wird nur gespiegelt,
// welche Figuren ziehen können, damit das Brett sie anbieten kann.

export interface MePlayer {
  user_id: string;
  seat: number;
  // Farbe 0–3 (MENSCH_COLORS); zu zweit gegenüber
  color: number;
  state: 'active' | 'left';
  // Je Figur: -1 = im Haus, 0–39 = Laufbahn ab dem eigenen Startfeld, 40–43 = Ziel
  pieces: number[];
  name: string;
}

// Nur die Spalten, die die Anzeige braucht (mensch.service.ts lädt genau diese)
export interface MeGame {
  id: string;
  status: 'playing' | 'finished';
  seat_count: number;
  turn_seat: number | null;
  // roll: würfeln; move: mit die eine Figur ziehen
  phase: 'roll' | 'move';
  // Zuletzt gewürfelt und von wem
  die: number | null;
  rolled_seat: number | null;
  // Würfe ohne Zug in diesem Zug
  tries: number;
  // Zählt jeden Wurf; ändert er sich, rollt der Würfel
  roll_seq: number;
  winner_seat: number | null;
  waiting_since: string | null;
  // Nach Sitzplatz sortiert
  players: MePlayer[];
}

export const HOME = -1;
export const TRACK_LENGTH = 40;
export const GOAL_START = 40;
export const LAST_FIELD = 43;
// Ohne Figur auf der Laufbahn so viele Versuche für eine 6
export const MENSCH_TRIES = 3;
// Erst nach so langem Warten kann der Host überspringen (die Datenbank lässt 25 s zu)
export const MENSCH_SKIP_AFTER_S = 30;

// Je Farbe Name und Töne (Figur, dunkler Rand, helles Feld)
export const MENSCH_COLORS = [
  { name: 'Rot', piece: '#e0393e', dark: '#8f1519', field: '#f6c5c3' },
  { name: 'Blau', piece: '#2f6fdf', dark: '#163c85', field: '#c4d6f6' },
  { name: 'Grün', piece: '#25a25a', dark: '#0f5c30', field: '#bfe6cc' },
  { name: 'Gelb', piece: '#f2bd1d', dark: '#8a6500', field: '#fbe7a6' },
] as const;

export const MENSCH_RULES = [
  'Jeder hat vier Figuren im Haus. Wer zuerst alle vier ins Ziel bringt, gewinnt.',
  'Wer dran ist, tippt auf den Würfel und zieht danach eine Figur um die Augenzahl im Uhrzeigersinn.',
  'Mit einer 6 kommt eine Figur aus dem Haus aufs Startfeld – das ist Pflicht, solange das Startfeld frei ist. Wer eine 6 würfelt, darf nochmal.',
  'Steht eine eigene Figur auf dem Startfeld und sind noch Figuren im Haus, muss sie zuerst weiter.',
  'Wer keine Figur auf der Laufbahn hat, darf bis zu dreimal würfeln, bis eine 6 kommt.',
  'Landest du auf einer fremden Figur, fliegt sie zurück in ihr Haus. Auf eigene Figuren darfst du nicht ziehen.',
  'Ins Ziel geht es nur mit passender Augenzahl; im Ziel wird nicht übersprungen.',
];

// Brett: 11 × 11 Felder, Spalte / Zeile 0–10. Laufbahn ab dem Startfeld von Rot (links) im
// Uhrzeigersinn; Blau startet bei 10, Grün bei 20, Gelb bei 30.
export const BOARD_SIZE = 11;
export type Cell = readonly [col: number, row: number];

// prettier-ignore
export const TRACK: readonly Cell[] = [
  [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [5, 0],
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [10, 5],
  [10, 6], [9, 6], [8, 6], [7, 6], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [5, 10],
  [4, 10], [4, 9], [4, 8], [4, 7], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 5],
];

// Je Farbe die vier Zielfelder (von außen nach innen) und die vier Hausfelder
// prettier-ignore
export const GOALS: readonly (readonly Cell[])[] = [
  [[1, 5], [2, 5], [3, 5], [4, 5]],
  [[5, 1], [5, 2], [5, 3], [5, 4]],
  [[9, 5], [8, 5], [7, 5], [6, 5]],
  [[5, 9], [5, 8], [5, 7], [5, 6]],
];
// prettier-ignore
export const HOUSES: readonly (readonly Cell[])[] = [
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[9, 0], [10, 0], [9, 1], [10, 1]],
  [[9, 9], [10, 9], [9, 10], [10, 10]],
  [[0, 9], [1, 9], [0, 10], [1, 10]],
];

// Brettfeld (0–39) einer Figur auf der Laufbahn
export const fieldOf = (color: number, step: number): number => (color * 10 + step) % TRACK_LENGTH;

// Wo Figur `index` mit Stand `step` liegt
export function cellOf(color: number, index: number, step: number): Cell {
  if (step < 0) return HOUSES[color][index];
  if (step >= GOAL_START) return GOALS[color][step - GOAL_START];
  return TRACK[fieldOf(color, step)];
}

// Brett drehen, sodass die eigene Farbe unten links sitzt (dort ist Gelb): `turns`
// Vierteldrehungen im Uhrzeigersinn
export const turnsFor = (color: number): number => (3 - color + 4) % 4;

export function rotate([col, row]: Cell, turns: number): Cell {
  let cell: Cell = [col, row];
  for (let i = 0; i < turns; i++) cell = [BOARD_SIZE - 1 - cell[1], cell[0]];
  return cell;
}

// Wohin jede Figur mit `die` ziehen kann (null = gar nicht); gespiegelt aus _mensch_moves
export function moves(pieces: readonly number[], die: number): (number | null)[] {
  const targets = pieces.map((from) => {
    const to = from < 0 ? (die === 6 ? 0 : null) : from + die;
    if (to === null || to > LAST_FIELD) return null;
    const blocked = pieces.some((q) => q === to || (q >= GOAL_START && q > from && q < to));
    return blocked ? null : to;
  });

  const home = pieces.includes(HOME);
  const start = pieces.indexOf(0);
  if (home && die === 6 && start < 0) {
    // Rauskommen
    return targets.map((to, i) => (pieces[i] < 0 ? to : null));
  }
  if (home && start >= 0 && targets[start] !== null) {
    // Startfeld räumen
    return targets.map((to, i) => (i === start ? to : null));
  }
  return targets;
}

export const inGoal = (pieces: readonly number[]): number =>
  pieces.filter((step) => step >= GOAL_START).length;

// Wie weit die Figuren insgesamt gekommen sind (Haus = 0)
export const progress = (pieces: readonly number[]): number =>
  pieces.reduce((sum, step) => sum + Math.max(step, HOME) + 1, 0);

// Wie _mensch_record_result: Figuren im Ziel, dann Fortschritt; Verlassene ans Ende ohne Platz
export function rankPlayers(
  players: readonly MePlayer[],
): { player: MePlayer; rank: number | null }[] {
  const score = (player: MePlayer) => [inGoal(player.pieces), progress(player.pieces)] as const;
  const active = players.filter((player) => player.state !== 'left');
  const sorted = [...active].sort((a, b) => {
    const [goalA, stepsA] = score(a);
    const [goalB, stepsB] = score(b);
    return goalB - goalA || stepsB - stepsA || a.seat - b.seat;
  });
  return [
    ...sorted.map((player) => ({
      player,
      rank:
        sorted.findIndex(
          (other) =>
            inGoal(other.pieces) === inGoal(player.pieces) &&
            progress(other.pieces) === progress(player.pieces),
        ) + 1,
    })),
    ...players
      .filter((player) => player.state === 'left')
      .map((player) => ({ player, rank: null })),
  ];
}
