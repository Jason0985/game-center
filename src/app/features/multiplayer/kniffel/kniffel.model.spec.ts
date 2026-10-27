import { bonusOf, KnPlayer, points, rankPlayers, upperSum } from './kniffel.model';

const player = (seat: number, total: number, state: KnPlayer['state'] = 'active'): KnPlayer => ({
  user_id: `u${seat}`,
  seat,
  state,
  scores: Array(13).fill(null),
  total,
  name: `P${seat}`,
});

describe('kniffel model', () => {
  // Gleiche Fälle wie der SQL-Test von _kniffel_points
  it('scores every category like the database', () => {
    const cases: [number[], number, number][] = [
      [[1, 1, 1, 2, 3], 0, 3],
      [[1, 1, 1, 2, 3], 6, 8],
      [[1, 1, 1, 1, 3], 7, 7],
      [[2, 2, 3, 3, 3], 8, 25],
      [[3, 3, 3, 3, 3], 8, 0],
      [[1, 2, 3, 4, 6], 9, 30],
      [[3, 4, 5, 6, 6], 9, 30],
      [[1, 3, 4, 5, 6], 9, 30],
      [[1, 2, 4, 5, 6], 9, 0],
      [[2, 3, 4, 5, 6], 10, 40],
      [[1, 2, 3, 4, 6], 10, 0],
      [[6, 6, 6, 6, 6], 11, 50],
      [[6, 6, 6, 6, 5], 11, 0],
      [[6, 6, 6, 6, 5], 12, 29],
      [[6, 6, 6, 6, 5], 5, 24],
    ];
    for (const [dice, category, expected] of cases) {
      expect(points(dice, category), `${dice} in ${category}`).toBe(expected);
    }
  });

  it('adds the bonus from 63 upwards', () => {
    expect(upperSum([3, 6, 9, 12, 15, 18, 30])).toBe(63);
    expect(bonusOf([3, 6, 9, 12, 15, 18])).toBe(35);
    expect(bonusOf([3, 6, 9, 12, 15, 17])).toBe(0);
  });

  it('ranks the highest total first and players who left last', () => {
    const ranked = rankPlayers([player(0, 120), player(1, 200), player(2, 120), player(3, 300, 'left')]);
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [1, 1],
      [0, 2],
      [2, 2],
      [3, null],
    ]);
  });
});
