import {
  canPlay,
  describeEvent,
  fanView,
  keyCards,
  KeyedCard,
  rankPlayers,
  seatSpots,
  sizeClass,
  SkipboCard,
  SkipboPlayer,
  validPiles,
} from './skipbo.model';

function player(seat: number, overrides: Partial<SkipboPlayer> = {}): SkipboPlayer {
  return {
    user_id: `user-${seat}`,
    seat,
    state: 'active',
    stock_count: 10,
    stock_top: '1',
    hand_count: 5,
    discards: [[], [], [], []],
    name: ['Lea', 'Ben', 'Carl', 'Dana', 'Emil'][seat],
    ...overrides,
  };
}

describe('canPlay / validPiles', () => {
  it('takes a number only on top of its predecessor', () => {
    expect(canPlay('1', [])).toBe(true);
    expect(canPlay('2', [])).toBe(false);
    expect(canPlay('5', ['1', '2', '3', '4'])).toBe(true);
    expect(canPlay('6', ['1', '2', '3', '4'])).toBe(false);
  });

  it('lets the joker go on every pile below 12 as the next value', () => {
    const full = Array.from({ length: 12 }, (_, i) => String(i + 1)) as SkipboCard[];
    expect(validPiles('SB', [[], ['1', '2'], full, ['1']])).toEqual([0, 1, 3]);
    expect(validPiles('2', [[], ['1'], full, ['SB']])).toEqual([1, 3]);
  });
});

describe('fanView', () => {
  it('shows the top cards and caps the rest', () => {
    expect(fanView(['1', '2', '3'], 4)).toEqual({ cap: 0, cards: ['1', '2', '3'] });
    expect(fanView(['1', '2', '3', '4', '5', '6'], 3)).toEqual({ cap: 3, cards: ['4', '5', '6'] });
    expect(fanView(['1', '2', '3', '4', '5', '6'], 4).cap).toBe(2);
  });
});

describe('keyCards', () => {
  let id = 0;
  const newKey = () => `k${++id}`;

  it('keeps keys when a card leaves the middle and gives drawn cards new ones', () => {
    const hand = keyCards([], ['5', '9', 'SB', '2', '5'], newKey);
    const played = keyCards(hand, ['5', '9', '2', '5'], newKey);
    expect(played.map((item) => item.key)).toEqual([
      hand[0].key,
      hand[1].key,
      hand[3].key,
      hand[4].key,
    ]);

    const drawn: KeyedCard[] = keyCards(played, ['5', '9', '2', '5', '7'], newKey);
    expect(drawn.slice(0, 4)).toEqual(played);
    expect(played.map((item) => item.key)).not.toContain(drawn[4].key);
  });
});

describe('seatSpots', () => {
  const near = (actual: { x: number; y: number }, x: number, y: number) => {
    expect(Math.abs(actual.x - x)).toBeLessThanOrEqual(2);
    expect(Math.abs(actual.y - y)).toBeLessThanOrEqual(2);
  };

  it('matches the artboard seats', () => {
    const phone = seatSpots('phone', 3);
    near(phone[0], 70.9, 215);
    near(phone[1], 189.2, 40);
    near(phone[2], 307.2, 215.4);
    near(seatSpots('laptop', 5)[0], 65.9, 274.4);
  });
});

describe('sizeClass', () => {
  it('shrinks the seats with more players', () => {
    expect([2, 3, 4, 5, 6].map(sizeClass)).toEqual(['l', 'l', 'm', 's', 's']);
  });
});

describe('rankPlayers', () => {
  it('ranks by remaining stock, shares ties and puts leavers last', () => {
    const ranked = rankPlayers([
      player(0, { stock_count: 4 }),
      player(1, { stock_count: 0 }),
      player(2, { state: 'left', stock_count: 1 }),
      player(3, { stock_count: 4 }),
      player(4, { stock_count: 9 }),
    ]);
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [1, 1],
      [0, 2],
      [3, 2],
      [4, 4],
      [2, null],
    ]);
  });
});

describe('describeEvent', () => {
  const players = [player(0), player(1), player(2), player(3), player(4)];

  it('writes the design texts', () => {
    expect(describeEvent({ t: 'play', seat: 2, src: 'stock', left: 12 }, players, 0)).toBe(
      'Carl spielt vom Spielstapel – noch 12',
    );
    expect(
      describeEvent({ t: 'play', seat: 0, src: 'hand', card: 'SB', value: 8, pile: 1 }, players, 0),
    ).toBe('Du legst einen Joker als 8');
    expect(
      describeEvent({ t: 'play', seat: 1, src: 'hand', card: '5', value: 5, pile: 2 }, players, 0),
    ).toBe('Ben legt eine 5 auf Stapel 3');
    expect(describeEvent({ t: 'discard', seat: 3, card: '9', pile: 0 }, players, 0)).toBe(
      'Dana legt eine 9 ab',
    );
    expect(describeEvent({ t: 'draw', seat: 0, n: 5 }, players, 0)).toBe('Du ziehst 5 Karten nach');
    expect(describeEvent({ t: 'clear', pile: 2 }, players, 0)).toBe(
      'Stapel 3 ist voll und wird abgeräumt',
    );
    expect(describeEvent({ t: 'win', seat: 4 }, players, 0)).toBe(
      'Emil gewinnt – Spielstapel leer',
    );
  });
});
