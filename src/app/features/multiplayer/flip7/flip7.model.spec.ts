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
  sortedForDisplay,
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

  it('offers Second Chance only to other active players without one', () => {
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

describe('sortedForDisplay', () => {
  it('shows numbers ascending, then modifiers, then actions', () => {
    expect(sortedForDisplay(['SC', '+4', '12', 'x2', '3', 'FREEZE', '0', '+10'])).toEqual([
      '0',
      '3',
      '12',
      'x2',
      '+4',
      '+10',
      'FREEZE',
      'SC',
    ]);
  });
});

describe('describeEvent', () => {
  const nameOf = (seat: number) => ['Anna', 'Ben'][seat];
  const cases: [Flip7Event, string][] = [
    [{ t: 'draw', seat: 0, card: '7' }, 'Anna zieht 7.'],
    [{ t: 'draw', seat: 0, card: 'x2' }, 'Anna zieht ×2.'],
    [{ t: 'bust', seat: 1, card: '5' }, 'Ben hat die 5 doppelt – raus!'],
    [{ t: 'second_chance', seat: 0, card: '5' }, 'Anna rettet sich mit der Zweiten Chance.'],
    [{ t: 'sc_given', seat: 0, target: 1 }, 'Anna schenkt Ben eine Zweite Chance.'],
    [{ t: 'sc_discarded', seat: 0 }, 'Niemand kann die Zweite Chance von Anna nehmen – abgelegt.'],
    [{ t: 'freeze', seat: 0, target: 1 }, 'Anna friert Ben ein.'],
    [{ t: 'freeze', seat: 1, target: 1 }, 'Ben friert sich selbst ein.'],
    [{ t: 'flip3', seat: 0, target: 1 }, 'Anna lässt Ben drei Karten ziehen.'],
    [{ t: 'flip3', seat: 0, target: 0 }, 'Anna zieht selbst drei Karten.'],
    [{ t: 'set_aside', seat: 1, card: 'FREEZE' }, 'Ben legt Einfrieren zur Seite.'],
    [{ t: 'flip7', seat: 1 }, 'Ben hat Flip 7!'],
    [{ t: 'stay', seat: 0 }, 'Anna bleibt stehen.'],
    [{ t: 'reshuffle' }, 'Der Ablagestapel wird neu gemischt.'],
    [{ t: 'left', seat: 1 }, 'Ben hat das Spiel verlassen.'],
    [{ t: 'skip', seat: 0 }, 'Anna wurde übersprungen.'],
  ];

  it.each(cases)('describes %o', (event, text) => {
    expect(describeEvent(event, nameOf)).toBe(text);
  });
});

describe('cardAriaLabel', () => {
  it('reads cards out in German', () => {
    expect(
      ['7', '+4', 'x2', 'FREEZE', 'FLIP3', 'SC'].map((card) => cardAriaLabel(card as Flip7Card)),
    ).toEqual([
      'Zahl 7',
      'Plus 4',
      'Mal 2',
      'Aktion Einfrieren',
      'Aktion Drei ziehen',
      'Aktion Zweite Chance',
    ]);
  });
});
