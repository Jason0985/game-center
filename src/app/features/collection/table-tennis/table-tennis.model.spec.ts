import {
  counterState,
  CounterMatch,
  createTournament,
  matchScore,
  roundName,
  setResult,
  SetScore,
  Side,
  tournamentRounds,
  tournamentSummary,
} from './table-tennis.model';

const match = (rallies: Side[], bestOf = 3): CounterMatch => ({
  names: ['A', 'B'],
  bestOf,
  firstServer: 0,
  rallies,
});
const times = (side: Side, count: number): Side[] => Array(count).fill(side);

describe('counterState', () => {
  it('wins a set at 11 with two points ahead and continues past 10:10', () => {
    expect(counterState(match(times(0, 11))).sets).toEqual([[11, 0]]);

    const deuce = [...times(0, 10), ...times(1, 10), 0, 1, 0] as Side[];
    expect(counterState(match(deuce)).current).toEqual([12, 11]);
    expect(counterState(match([...deuce, 0])).sets).toEqual([[13, 11]]);
  });

  it('changes serve every two points, from 10:10 every point, and per set', () => {
    expect(counterState(match([])).server).toBe(0);
    expect(counterState(match([0])).server).toBe(0);
    expect(counterState(match([0, 1])).server).toBe(1);
    const deuce = [...times(0, 10), ...times(1, 10)] as Side[];
    expect(counterState(match(deuce)).server).toBe(0);
    expect(counterState(match([...deuce, 1])).server).toBe(1);
    // Zweiter Satz: der andere beginnt
    expect(counterState(match(times(0, 11))).server).toBe(1);
  });

  it('ends the match after enough sets and ignores later rallies', () => {
    const state = counterState(match([...times(1, 11), ...times(1, 11), 0]));
    expect(state.winner).toBe(1);
    expect(state.setsWon).toEqual([0, 2]);
    expect(state.current).toEqual([0, 0]);
  });
});

describe('tournament', () => {
  const names = (count: number) => Array.from({ length: count }, (_, i) => `P${i}`);

  it('fills the bracket up to a power of two with spread byes', () => {
    const tournament = createTournament(names(5), 3, false);
    expect(tournament.draw).toEqual([0, null, 1, null, 2, null, 3, 4]);

    const rounds = tournamentRounds(tournament);
    expect(rounds.map((round) => round.length)).toEqual([4, 2, 1]);
    expect(rounds[0].filter((game) => game.bye).map((game) => game.winner)).toEqual([0, 1, 2]);
    expect(rounds[1][0]).toMatchObject({ a: 0, b: 1, winner: null });
    expect(rounds[1][1]).toMatchObject({ a: 2, b: null });
  });

  it('shuffles without losing players', () => {
    const draw = createTournament(names(7), 3).draw;
    expect(draw.filter((slot) => slot !== null).sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  // Punkte je Satz mit a:b gewonnenen Sätzen; die Sätze des Verlierers zuerst, damit das
  // Spiel mit dem letzten Satz entschieden ist
  const sets = (a: number, b: number): SetScore[] => {
    const won = Array.from({ length: a }, (): SetScore => [11, 7]);
    const lost = Array.from({ length: b }, (): SetScore => [9, 11]);
    return a > b ? [...lost, ...won] : [...won, ...lost];
  };

  it('advances winners and clears the later path when a result changes', () => {
    let tournament = createTournament(names(4), 3, false);
    tournament = setResult(tournament, 0, 0, sets(2, 0));
    tournament = setResult(tournament, 0, 1, sets(1, 2));
    tournament = setResult(tournament, 1, 0, sets(2, 1));
    expect(tournamentRounds(tournament)[1][0]).toMatchObject({ a: 0, b: 3, winner: 0 });

    tournament = setResult(tournament, 0, 0, sets(0, 2));
    expect(tournamentRounds(tournament)[1][0]).toMatchObject({ a: 1, b: 3, score: null });

    // Gleicher Sieger, anderes Ergebnis: das Finale bleibt
    tournament = setResult(tournament, 1, 0, sets(2, 0));
    tournament = setResult(tournament, 0, 0, sets(1, 2));
    expect(tournamentRounds(tournament)[1][0].score).toEqual([2, 0]);
  });

  it('counts sets from the points and rejects impossible results', () => {
    expect(
      matchScore(
        [
          [11, 9],
          [8, 11],
          [13, 11],
        ],
        3,
      ),
    ).toEqual([2, 1]);
    // 11:10 ist kein Satzende, 14:11 auch nicht
    expect(
      matchScore(
        [
          [11, 10],
          [11, 5],
        ],
        3,
      ),
    ).toBeNull();
    expect(
      matchScore(
        [
          [14, 11],
          [11, 5],
        ],
        3,
      ),
    ).toBeNull();
    // Noch nicht entschieden bzw. ein Satz zu viel
    expect(matchScore([[11, 5]], 3)).toBeNull();
    expect(
      matchScore(
        [
          [11, 5],
          [11, 5],
          [11, 5],
        ],
        3,
      ),
    ).toBeNull();
    expect(matchScore([[5, 11]], 1)).toEqual([0, 1]);
  });

  it('sums up the finished tournament', () => {
    let tournament = createTournament(names(3), 5, false);
    // draw: [0, null, 1, 2]
    tournament = setResult(tournament, 0, 1, [
      [11, 9],
      [11, 9],
      [9, 11],
      [9, 11],
      [12, 10],
    ]);
    tournament = setResult(tournament, 1, 0, [
      [3, 11],
      [5, 11],
      [7, 11],
    ]);
    const summary = tournamentSummary(tournament)!;

    expect(summary).toMatchObject({
      champion: 1,
      finalist: 0,
      semifinalists: [2],
      games: 2,
      sets: 8,
      points: 52 + 50 + 48,
    });
    expect(summary.table.map((row) => row.name)).toEqual(['P1', 'P0', 'P2']);
    expect(summary.table[0]).toMatchObject({ setsWon: 6, setsLost: 2, pointsWon: 52 + 33 });
    expect(summary.clearest?.score).toEqual([0, 3]);
    expect(summary.closest?.score).toEqual([3, 2]);
    expect(summary.path).toEqual([
      {
        round: 0,
        opponent: 2,
        score: [3, 2],
        sets: [
          [11, 9],
          [11, 9],
          [9, 11],
          [9, 11],
          [12, 10],
        ],
      },
      {
        round: 1,
        opponent: 0,
        score: [3, 0],
        sets: [
          [11, 3],
          [11, 5],
          [11, 7],
        ],
      },
    ]);
  });

  it('has no summary before the final', () => {
    expect(tournamentSummary(createTournament(names(4), 3))).toBeNull();
  });

  it('names rounds from the end', () => {
    expect([0, 1, 2, 3, 4].map((round) => roundName(round, 5))).toEqual([
      'Runde 1',
      'Achtelfinale',
      'Viertelfinale',
      'Halbfinale',
      'Finale',
    ]);
  });
});
