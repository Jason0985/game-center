// Tischtennis: Zähler (ein Match) und Turnier (K.-o.-Baum). Reine Logik, gespeichert wird lokal.

export type Side = 0 | 1;
export type SetScore = [number, number];

export const BEST_OF_OPTIONS = [1, 3, 5, 7] as const;
export const TOURNAMENT_MIN_PLAYERS = 2;
export const TOURNAMENT_MAX_PLAYERS = 32;

export const setsToWin = (bestOf: number): number => Math.ceil(bestOf / 2);

// Satz gewonnen: 11 Punkte mit 2 Punkten Vorsprung (ab 10:10 bis einer 2 vorn ist)
const setWon = ([a, b]: SetScore): boolean => Math.max(a, b) >= 11 && Math.abs(a - b) >= 2;

// ---------------------------------------------------------------------------
// Zähler: gespeichert wird nur, wer welchen Ballwechsel gewann; alles andere folgt daraus
// ---------------------------------------------------------------------------

export interface CounterMatch {
  names: [string, string];
  bestOf: number;
  // Wer im ersten Satz aufschlägt; danach wechselt das je Satz
  firstServer: Side;
  rallies: Side[];
}

export interface CounterState {
  sets: SetScore[];
  current: SetScore;
  setsWon: SetScore;
  server: Side;
  winner: Side | null;
}

export function counterState(match: CounterMatch): CounterState {
  const need = setsToWin(match.bestOf);
  const sets: SetScore[] = [];
  let current: SetScore = [0, 0];
  const setsWon: SetScore = [0, 0];
  let winner: Side | null = null;

  for (const side of match.rallies) {
    if (winner !== null) break;
    current = side ? [current[0], current[1] + 1] : [current[0] + 1, current[1]];
    if (setWon(current)) {
      sets.push(current);
      setsWon[side]++;
      current = [0, 0];
      if (setsWon[side] >= need) winner = side;
    }
  }

  // Alle 2 Punkte Aufschlagwechsel, ab 10:10 nach jedem Punkt
  const points = current[0] + current[1];
  const turns = points < 20 ? Math.floor(points / 2) : points;
  const server = ((match.firstServer + sets.length + turns) % 2) as Side;
  return { sets, current, setsWon, server, winner };
}

// ---------------------------------------------------------------------------
// Turnier: Auslosung in Runde 1, danach rücken die Sieger nach
// ---------------------------------------------------------------------------

// Gültiger Satz nach den Regeln: 11 mit mindestens 2 Vorsprung, danach genau 2 (z. B. 13:11)
export function validSet([a, b]: SetScore): boolean {
  const high = Math.max(a, b);
  const diff = Math.abs(a - b);
  return high === 11 ? diff >= 2 : high > 11 && diff === 2;
}

// Gewonnene Sätze aus den Punkten je Satz; null, solange ein Satz ungültig ist, das Spiel
// noch nicht entschieden ist oder danach noch Sätze folgen
export function matchScore(sets: SetScore[], bestOf: number): SetScore | null {
  const need = setsToWin(bestOf);
  const won: SetScore = [0, 0];
  for (const set of sets) {
    if (Math.max(...won) >= need || !validSet(set)) return null;
    won[set[0] > set[1] ? 0 : 1]++;
  }
  return Math.max(...won) === need ? won : null;
}

export interface Tournament {
  players: string[];
  bestOf: number;
  // Plätze in Runde 1 (Index in players), null = Freilos; Länge ist eine Zweierpotenz
  draw: (number | null)[];
  // Punkte je Satz (aus Sicht von a), Schlüssel "runde-spiel" (beide ab 0)
  results: Record<string, SetScore[]>;
}

export interface TournamentGame {
  round: number;
  index: number;
  // Index in players; null = noch offen (oder Freilos in Runde 1)
  a: number | null;
  b: number | null;
  // Punkte je Satz und daraus die gewonnenen Sätze
  sets: SetScore[] | null;
  score: SetScore | null;
  winner: number | null;
  bye: boolean;
}

const gameKey = (round: number, index: number) => `${round}-${index}`;

// Freilose gleichmäßig über Runde 1 verteilen, damit nicht alle oben im Baum landen
export function createTournament(players: string[], bestOf: number, shuffle = true): Tournament {
  const order = players.map((_, index) => index);
  if (shuffle) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }

  const size = 2 ** Math.ceil(Math.log2(Math.max(players.length, 2)));
  const games = size / 2;
  const byes = size - players.length;
  const byeGames = new Set(Array.from({ length: byes }, (_, i) => Math.floor((i * games) / byes)));
  const draw: (number | null)[] = [];
  let next = 0;
  for (let game = 0; game < games; game++) {
    draw.push(order[next++]);
    draw.push(byeGames.has(game) ? null : order[next++]);
  }
  return { players, bestOf, draw, results: {} };
}

export function tournamentRounds(tournament: Tournament): TournamentGame[][] {
  const rounds: TournamentGame[][] = [];
  let slots = tournament.draw;
  for (let round = 0; slots.length > 1; round++) {
    const games: TournamentGame[] = [];
    for (let index = 0; index < slots.length / 2; index++) {
      const a = slots[index * 2];
      const b = slots[index * 2 + 1];
      const bye = round === 0 && (a === null) !== (b === null);
      const sets =
        bye || a === null || b === null
          ? null
          : (tournament.results[gameKey(round, index)] ?? null);
      const score = sets && matchScore(sets, tournament.bestOf);
      const winner = bye ? (a ?? b) : score ? (score[0] > score[1] ? a : b) : null;
      games.push({ round, index, a, b, sets: score ? sets : null, score, winner, bye });
    }
    rounds.push(games);
    slots = games.map((game) => game.winner);
  }
  return rounds;
}

// Ergebnis (Punkte je Satz) eintragen; ändert sich der Sieger, fallen die späteren Spiele auf
// seinem Weg weg
export function setResult(
  tournament: Tournament,
  round: number,
  index: number,
  sets: SetScore[],
): Tournament {
  const before = tournamentRounds(tournament)[round]?.[index];
  const results = { ...tournament.results, [gameKey(round, index)]: sets };
  const after = tournamentRounds({ ...tournament, results })[round][index];
  if (before?.winner !== null && before?.winner !== after.winner) {
    const roundCount = Math.log2(tournament.draw.length);
    for (let r = round + 1, i = index >> 1; r < roundCount; r++, i >>= 1) {
      delete results[gameKey(r, i)];
    }
  }
  return { ...tournament, results };
}

export function roundName(round: number, roundCount: number): string {
  const fromEnd = roundCount - 1 - round;
  return ['Finale', 'Halbfinale', 'Viertelfinale', 'Achtelfinale'][fromEnd] ?? `Runde ${round + 1}`;
}

// Satz-Punkte aus Sicht eines Spielers
export const setsFor = (game: TournamentGame, player: number): SetScore[] =>
  (game.sets ?? []).map(([a, b]) => (player === game.a ? [a, b] : [b, a]));

export interface PlayerStats {
  player: number;
  name: string;
  played: number;
  won: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
  // Höchste erreichte Runde (Index), Sieger = Rundenanzahl
  reached: number;
}

export interface TournamentSummary {
  champion: number;
  finalist: number;
  semifinalists: number[];
  table: PlayerStats[];
  games: number;
  sets: number;
  points: number;
  // Klarster Sieg (Sätze, dann Punkte) und Krimi (meiste Sätze, dann knappste Punkte)
  clearest: TournamentGame | null;
  closest: TournamentGame | null;
  // Weg des Siegers: Gegner und Satz-Punkte aus seiner Sicht
  path: { round: number; opponent: number; score: SetScore; sets: SetScore[] }[];
}

// null, solange das Finale nicht gespielt ist
export function tournamentSummary(tournament: Tournament): TournamentSummary | null {
  const rounds = tournamentRounds(tournament);
  const final = rounds[rounds.length - 1][0];
  if (final.winner === null) return null;

  const table: PlayerStats[] = tournament.players.map((name, player) => ({
    player,
    name,
    played: 0,
    won: 0,
    setsWon: 0,
    setsLost: 0,
    pointsWon: 0,
    pointsLost: 0,
    reached: 0,
  }));
  const played = rounds.flat().filter((game) => game.score && !game.bye);
  for (const game of rounds.flat()) {
    for (const player of [game.a, game.b]) {
      if (player !== null) table[player].reached = Math.max(table[player].reached, game.round);
    }
  }
  table[final.winner].reached = rounds.length;

  const pointsOf = (game: TournamentGame): SetScore =>
    game.sets!.reduce<SetScore>(([x, y], [a, b]) => [x + a, y + b], [0, 0]);
  for (const game of played) {
    const [a, b, [sa, sb], [pa, pb]] = [game.a!, game.b!, game.score!, pointsOf(game)];
    for (const [player, sw, sl, pw, pl] of [
      [a, sa, sb, pa, pb],
      [b, sb, sa, pb, pa],
    ]) {
      const row = table[player];
      row.played++;
      row.setsWon += sw;
      row.setsLost += sl;
      row.pointsWon += pw;
      row.pointsLost += pl;
    }
    table[game.winner!].won++;
  }

  const setMargin = (game: TournamentGame) => Math.abs(game.score![0] - game.score![1]);
  const setCount = (game: TournamentGame) => game.score![0] + game.score![1];
  const pointMargin = (game: TournamentGame) => Math.abs(pointsOf(game)[0] - pointsOf(game)[1]);
  const byMax = (pick: (game: TournamentGame) => number) =>
    played.reduce<TournamentGame | null>(
      (best, game) => (!best || pick(game) > pick(best) ? game : best),
      null,
    );
  const semis = rounds.length > 1 ? rounds[rounds.length - 2] : [];

  return {
    champion: final.winner,
    finalist: final.a === final.winner ? final.b! : final.a!,
    semifinalists: semis
      .map((game) => (game.a === game.winner ? game.b : game.a))
      .filter((player): player is number => player !== null),
    table: table.sort(
      (x, y) =>
        y.reached - x.reached ||
        y.won - x.won ||
        y.setsWon - y.setsLost - (x.setsWon - x.setsLost) ||
        y.pointsWon - y.pointsLost - (x.pointsWon - x.pointsLost) ||
        x.name.localeCompare(y.name, 'de'),
    ),
    games: played.length,
    sets: played.reduce((sum, game) => sum + setCount(game), 0),
    points: played.reduce((sum, game) => sum + pointsOf(game)[0] + pointsOf(game)[1], 0),
    clearest: byMax((game) => setMargin(game) * 1000 + pointMargin(game)),
    closest: byMax((game) => setCount(game) * 1000 - pointMargin(game)),
    path: played
      .filter((game) => game.a === final.winner || game.b === final.winner)
      .map((game) => ({
        round: game.round,
        opponent: game.a === final.winner ? game.b! : game.a!,
        score: (game.a === final.winner
          ? game.score!
          : [game.score![1], game.score![0]]) as SetScore,
        sets: setsFor(game, final.winner!),
      })),
  };
}

// Lokal speichern (Gäste, offline); kaputte oder fehlende Daten = Standard
export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
