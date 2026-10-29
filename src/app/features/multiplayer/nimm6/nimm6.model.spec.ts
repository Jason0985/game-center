import {
  bullsOf,
  describeEvent,
  N6Event,
  N6Player,
  placementOf,
  rankPlayers,
  replayMs,
  replaySteps,
  rowBulls,
} from './nimm6.model';

function player(seat: number, score: number, overrides: Partial<N6Player> = {}): N6Player {
  return {
    user_id: `u${seat}`,
    seat,
    state: 'active',
    score,
    round_bulls: 0,
    ready: false,
    rows_taken: 0,
    sixths: 0,
    name: ['Anna', 'Ben', 'Cleo', 'Dan'][seat],
    ...overrides,
  };
}

describe('bullsOf', () => {
  it('counts the bulls like the cards: 55 = 7, doubles 5, tens 3, fives 2, else 1', () => {
    expect([55, 11, 99, 10, 100, 5, 85, 1, 104].map(bullsOf)).toEqual([7, 5, 5, 3, 3, 2, 2, 1, 1]);
    expect(rowBulls([41, 45, 52, 60, 62])).toBe(8);
  });

  it('adds up to 171 bulls over the whole deck', () => {
    const all = Array.from({ length: 104 }, (_, i) => i + 1);
    expect(rowBulls(all)).toBe(171);
  });
});

describe('placementOf', () => {
  const rows = [
    [12, 18, 33],
    [41, 45, 52, 60, 62],
    [70, 72],
    [85, 90, 99],
  ];

  it('puts a card behind the highest row end below it', () => {
    expect(placementOf(rows, 77)).toEqual({ row: 2, after: 72, sixth: false });
    expect(placementOf(rows, 40)).toEqual({ row: 0, after: 33, sixth: false });
  });

  it('flags the 6th card and cards below every row', () => {
    expect(placementOf(rows, 64)).toEqual({ row: 1, after: 62, sixth: true });
    expect(placementOf(rows, 7)).toEqual({ row: null, after: null, sixth: false });
  });
});

describe('replaySteps', () => {
  it('rebuilds the rows before the action from the events, backwards', () => {
    const events: N6Event[] = [
      { t: 'reveal', played: [] },
      { t: 'place', seat: 0, card: 35, row: 0 },
      { t: 'six', seat: 1, card: 63, row: 1, n: 8, cards: [41, 45, 52, 60, 62] },
      { t: 'place', seat: 2, card: 64, row: 1 },
    ];
    const after = [
      [12, 18, 33, 35],
      [63, 64],
      [70, 72],
      [85, 90, 99],
    ];
    const { before, steps } = replaySteps({ card_rows: after, last_events: events });
    expect(before).toEqual([
      [12, 18, 33],
      [41, 45, 52, 60, 62],
      [70, 72],
      [85, 90, 99],
    ]);
    expect(steps.map((step) => [step.kind, step.card, step.bulls])).toEqual([
      ['place', 35, 0],
      ['six', 63, 8],
      ['place', 64, 0],
    ]);
    // Aufdecken, zwei Karten legen, einmal Reihe nehmen; dieselben Zahlen wie in
    // _nimm6_replay_ms (Core-Schema)
    expect(replayMs({ card_rows: after, last_events: events })).toBe(1800 + 1000 + 4300 + 1000);
  });

  it('has nothing to replay after a plain choice', () => {
    const game = { card_rows: [[1], [2], [3], [4]], last_events: [{ t: 'ready', seat: 0 }] };
    expect(replaySteps(game as never).steps).toEqual([]);
    expect(replayMs(game as never)).toBe(0);
  });
});

describe('rankPlayers', () => {
  it('ranks the fewest bulls first, ties share a place, leavers last', () => {
    const ranked = rankPlayers([
      player(0, 20),
      player(1, 12),
      player(2, 20),
      player(3, 3, { state: 'left' }),
    ]);
    expect(ranked.map((row) => [row.player.name, row.rank])).toEqual([
      ['Ben', 1],
      ['Anna', 2],
      ['Cleo', 2],
      ['Dan', null],
    ]);
  });
});

describe('describeEvent', () => {
  const players = [player(0, 0), player(1, 0)];

  it('describes placing and taking rows in du and er form', () => {
    expect(describeEvent({ t: 'place', seat: 0, card: 35, row: 0 }, players, 0)).toBe(
      'Du legst 35 an Reihe 1',
    );
    expect(describeEvent({ t: 'six', seat: 1, card: 63, row: 1, n: 8 }, players, 0)).toBe(
      'Ben legt 63 als 6. Karte und nimmt Reihe 2 (+8)',
    );
    expect(describeEvent({ t: 'take', seat: 0, card: 7, row: 3, n: 4 }, players, 0)).toBe(
      'Du nimmst Reihe 4 mit der 7 (+4)',
    );
  });
});
