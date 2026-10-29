import {
  BOARD_SIZE,
  cellOf,
  GOALS,
  HOUSES,
  MePlayer,
  moves,
  rankPlayers,
  rotate,
  TRACK,
  turnsFor,
} from './mensch.model';

const player = (seat: number, pieces: number[], state: MePlayer['state'] = 'active'): MePlayer => ({
  user_id: `u${seat}`,
  seat,
  color: seat,
  state,
  pieces,
  name: `P${seat}`,
});

const key = ([col, row]: readonly [number, number]) => `${col}:${row}`;

describe('mensch model', () => {
  // Gleiche Fälle wie der SQL-Test von _mensch_moves
  it('offers the same moves as the database', () => {
    const cases: [number[], number, (number | null)[]][] = [
      [[-1, -1, -1, -1], 5, [null, null, null, null]],
      [[-1, -1, -1, -1], 6, [0, 0, 0, 0]],
      [[0, -1, -1, -1], 6, [6, null, null, null]],
      [[0, -1, -1, -1], 3, [3, null, null, null]],
      [[0, 6, -1, -1], 6, [null, 12, null, null]],
      [[5, -1, -1, -1], 6, [null, 0, 0, 0]],
      [[38, 41, -1, -1], 4, [null, null, null, null]],
      [[38, 41, -1, -1], 2, [40, 43, null, null]],
      [[38, 41, -1, -1], 5, [null, null, null, null]],
      [[38, 40, 42, 43], 1, [39, 41, null, null]],
      [[10, 14, 20, 30], 4, [null, 18, 24, 34]],
      [[0, 4, -1, -1], 4, [null, 8, null, null]],
    ];
    for (const [pieces, die, expected] of cases) {
      expect(moves(pieces, die), `${pieces} mit ${die}`).toEqual(expected);
    }
  });

  it('lays out 40 track fields, goals and houses without overlap', () => {
    const cells = [...TRACK, ...GOALS.flat(), ...HOUSES.flat()].map(key);
    expect(TRACK.length).toBe(40);
    expect(new Set(cells).size).toBe(cells.length);
    // Jedes Feld der Laufbahn grenzt an das nächste
    TRACK.forEach(([col, row], i) => {
      const [nextCol, nextRow] = TRACK[(i + 1) % TRACK.length];
      expect(Math.abs(col - nextCol) + Math.abs(row - nextRow)).toBe(1);
    });
    // Das Ziel beginnt neben dem Feld vor dem eigenen Start
    GOALS.forEach((goal, color) => {
      const [col, row] = cellOf(color, 0, 39);
      expect(Math.abs(col - goal[0][0]) + Math.abs(row - goal[0][1])).toBe(1);
    });
  });

  it('turns the board so the own colour sits bottom left', () => {
    for (let color = 0; color < 4; color++) {
      expect(key(rotate(TRACK[color * 10], turnsFor(color)))).toBe(key(TRACK[30]));
    }
    expect(rotate([0, 0], 1)).toEqual([BOARD_SIZE - 1, 0]);
  });

  it('ranks by pieces in the goal, then progress, and players who left last', () => {
    const ranked = rankPlayers([
      player(0, [40, 10, -1, -1]),
      player(1, [43, 42, 41, 40]),
      player(2, [40, 10, -1, -1]),
      player(3, [43, 42, 41, 39], 'left'),
    ]);
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [1, 1],
      [0, 2],
      [2, 2],
      [3, null],
    ]);
  });
});
