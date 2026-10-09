import {
  cardAriaLabel,
  describeEvent,
  distinctNumbers,
  Flip7Card,
  Flip7Event,
  Flip7Game,
  Flip7Player,
  Flip7PlayerState,
  flip7Score,
  rankPlayers,
  seatSpots,
  targetCandidates,
  winners,
} from './flip7.model';

function player(
  seat: number,
  state: Flip7PlayerState = 'active',
  cards: Flip7Card[] = [],
  total = 0,
  round: number | null = null,
): Flip7Player {
  return {
    user_id: `user-${seat}`,
    seat,
    state,
    cards,
    total_score: total,
    round_score: round,
    name: `Spieler ${seat}`,
  };
}

const game = (players: Flip7Player[]): Pick<Flip7Game, 'players' | 'seat_count'> => ({
  players,
  seat_count: players.length,
});

describe('flip7Score', () => {
  // Gleiche Vektoren wie die SQL-Tests von _flip7_score
  it('doubles only the numbers and adds modifiers afterwards', () => {
    expect(flip7Score(['3', '5', 'x2', '+4'], 'stayed')).toBe(20);
  });

  it('adds the Flip 7 bonus for seven different numbers', () => {
    const cards: Flip7Card[] = ['1', '2', '3', '4', '5', '6', '7', 'x2', '+10'];
    expect(flip7Score(cards, 'flip7')).toBe(28 * 2 + 10 + 15);
  });

  it('counts modifiers without numbers and ignores actions', () => {
    expect(flip7Score(['+2', '+8'], 'stayed')).toBe(10);
    expect(flip7Score(['x2'], 'stayed')).toBe(0);
    expect(flip7Score(['SC', 'FREEZE', '12'], 'frozen')).toBe(12);
  });

  it('is 0 for busted and left players', () => {
    expect(flip7Score(['5', '5'], 'busted')).toBe(0);
    expect(flip7Score(['5'], 'left')).toBe(0);
  });
});

describe('distinctNumbers', () => {
  it('counts different number cards only', () => {
    expect(distinctNumbers(['1', '1', '2', '+4', 'x2', 'SC'])).toBe(2);
    expect(distinctNumbers([])).toBe(0);
  });
});

describe('targetCandidates', () => {
  const players = [
    player(0, 'active', ['SC']),
    player(1, 'active'),
    player(2, 'stayed'),
    player(3, 'active', ['SC']),
  ];

  it('offers Freeze and Flip Three to every active player incl. the drawer', () => {
    expect(targetCandidates(game(players), 'FREEZE', 1)).toEqual([1, 3, 0]);
    expect(targetCandidates(game(players), 'FLIP3', 0)).toEqual([0, 1, 3]);
  });

  it('offers a second life only to other active players without one', () => {
    expect(targetCandidates(game(players), 'SC', 0)).toEqual([1]);
    expect(targetCandidates(game(players), 'SC', 1)).toEqual([]);
  });
});

describe('rankPlayers', () => {
  it('gives equal points the same rank and puts left players last', () => {
    const ranked = rankPlayers([
      player(0, 'stayed', [], 40),
      player(1, 'left', [], 90),
      player(2, 'busted', [], 55),
      player(3, 'stayed', [], 40),
    ]);
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [2, 1],
      [0, 2],
      [3, 2],
      [1, null],
    ]);
  });
});

describe('winners', () => {
  it('returns all players with the best total (shared win)', () => {
    const players = [
      player(0, 'stayed', [], 210),
      player(1, 'stayed', [], 210),
      player(2, 'stayed', [], 150),
    ];
    expect(winners({ players }).map((p) => p.seat)).toEqual([0, 1]);
  });

  it('ignores players who left', () => {
    const players = [player(0, 'left', [], 300), player(1, 'stayed', [], 120)];
    expect(winners({ players }).map((p) => p.seat)).toEqual([1]);
  });
});

describe('describeEvent', () => {
  const players = [
    player(0, 'active', [], 0),
    player(1, 'stayed', ['7', '9', '+4'], 0),
    player(2, 'active', ['FLIP3'], 0),
  ].map((p, seat) => ({ ...p, name: ['Anna', 'Ben', 'Carl'][seat] }));
  const game = { players, flip3_seat: 2, flip3_left: 2 };
  // Aus Sicht von Carl (Platz 2): Du-Form, wenn es um ihn geht
  const cases: [Flip7Event, string][] = [
    [{ t: 'draw', seat: 0, card: '7' }, 'Anna zieht eine 7'],
    [{ t: 'draw', seat: 2, card: '+4' }, 'Du ziehst +4'],
    [{ t: 'draw', seat: 2, card: 'FREEZE' }, 'Du ziehst Freeze'],
    [{ t: 'draw', seat: 0, card: 'x2' }, 'Anna zieht ×2'],
    [{ t: 'bust', seat: 1, card: '9' }, 'Ben hat Bust – doppelte 9'],
    [{ t: 'second_chance', seat: 0, card: '5' }, 'Anna rettet sich mit dem zweiten Leben'],
    [{ t: 'sc_given', seat: 0, target: 1 }, 'Anna gibt Ben ein zweites Leben'],
    [{ t: 'sc_given', seat: 0, target: 2 }, 'Anna gibt dir ein zweites Leben'],
    [{ t: 'sc_discarded', seat: 0 }, 'Das zweite Leben von Anna wird abgelegt'],
    [{ t: 'freeze', seat: 0, target: 1 }, 'Anna friert Ben ein'],
    [{ t: 'freeze', seat: 1, target: 1 }, 'Ben friert sich selbst ein'],
    [{ t: 'freeze', seat: 0, target: 2 }, 'Anna friert dich ein'],
    [{ t: 'flip3', seat: 0, target: 2 }, 'Anna gibt dir Flip 3 – noch 2 Karten'],
    [{ t: 'flip3', seat: 0, target: 1 }, 'Anna gibt Ben Flip 3'],
    [{ t: 'set_aside', seat: 1, card: 'FREEZE' }, 'Ben legt Freeze zur Seite'],
    [{ t: 'flip7', seat: 1 }, 'Ben schafft Flip 7! +15'],
    [{ t: 'stay', seat: 1 }, 'Ben sichert (+20)'],
    [{ t: 'stay', seat: 2 }, 'Du sicherst (+0)'],
    [{ t: 'reshuffle' }, 'Die Ablage wird neu gemischt'],
    [{ t: 'left', seat: 1 }, 'Ben hat das Spiel verlassen'],
    [{ t: 'skip', seat: 0 }, 'Anna wurde übersprungen'],
  ];

  it.each(cases)('describes %o', (event, text) => {
    expect(describeEvent(event, game, 2)).toBe(text);
  });
});

describe('cardAriaLabel', () => {
  it('reads cards out in German', () => {
    expect(
      ['7', '+4', 'x2', 'FREEZE', 'FLIP3', 'SC'].map((card) => cardAriaLabel(card as Flip7Card)),
    ).toEqual([
      'Zahl 7',
      'Modifikator +4',
      'Modifikator ×2',
      'Aktionskarte Freeze',
      'Aktionskarte Flip 3',
      'Aktionskarte Zweites Leben',
    ]);
  });
});

describe('seatSpots', () => {
  // Positionen aus den Artboards (Design-Pixel der Tischplatte)
  const near = (spots: { x: number; y: number }[], expected: number[][], tolerance: number) => {
    expect(spots.length).toBe(expected.length);
    spots.forEach((spot, i) => {
      expect(Math.hypot(spot.x - expected[i][0], spot.y - expected[i][1])).toBeLessThanOrEqual(
        tolerance + 1e-9,
      );
    });
  };

  it('matches the laptop artboards (3, 5 and 8 players)', () => {
    near(
      seatSpots('laptop', 2),
      [
        [121.8, 143],
        [1097.4, 142.3],
      ],
      2,
    );
    near(
      seatSpots('laptop', 4),
      [
        [50.7, 504.5],
        [303.9, 46.9],
        [915, 46.5],
        [1169.8, 503.8],
      ],
      2,
    );
    near(
      seatSpots('laptop', 7),
      [
        [50.7, 504.5],
        [50.2, 216.2],
        [303.9, 46.9],
        [610, -2],
        [915, 46.5],
        [1169.3, 215.5],
        [1169.8, 503.8],
      ],
      2,
    );
  });

  it('hangs each fan on the seat side facing the table centre', () => {
    const sides = (layout: 'phone' | 'laptop', count: number) =>
      seatSpots(layout, count).map((spot) => [+spot.dirX.toFixed(1), +spot.dirY.toFixed(1)]);
    // Handy: beide Plätze oben, Fächer darunter, leicht zur Mitte
    expect(sides('phone', 2)).toEqual([
      [0.4, 1],
      [-0.4, 1],
    ]);
    // Laptop: seitliche Plätze außen (Fächer daneben, etwas höher), obere darunter
    expect(sides('laptop', 4)).toEqual([
      [1, -0.7],
      [0.3, 1],
      [-0.3, 1],
      [-1, -0.7],
    ]);
  });

  it('matches the phone and iPad landscape artboards', () => {
    near(
      seatSpots('phone', 2),
      [
        [86.7, 183.6],
        [291.4, 184],
      ],
      6,
    );
    near(
      seatSpots('phone', 4),
      [
        [64.3, 265.9],
        [122.7, 106.3],
        [255.5, 106.5],
        [313.8, 266.4],
      ],
      6,
    );
    near(
      seatSpots('quer', 4),
      [
        [70.7, 226.3],
        [382.1, 41.1],
        [758.8, 41.3],
        [1069.4, 226.8],
      ],
      6,
    );
  });
});
