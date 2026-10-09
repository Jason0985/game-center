import {
  canPlay,
  describeEvent,
  fanView,
  keepSelection,
  rankPlayers,
  SkipboCard,
  SkipboGame,
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

describe('keepSelection', () => {
  const game = (
    overrides: Partial<SkipboGame> = {},
    me: Partial<SkipboPlayer> = {},
  ): SkipboGame => ({
    id: 'g',
    status: 'playing',
    seat_count: 2,
    dealer_seat: 1,
    turn_seat: 0,
    turn_no: 1,
    build_piles: [[], [], [], []],
    winner_seat: null,
    last_events: [],
    round_log: [],
    waiting_since: 't1',
    players: [player(0, me), player(1)],
    hand: ['3', '7', 'SB'],
    ...overrides,
  });

  it('keeps stock and discard selected after playing from them', () => {
    const before = game();
    const after = game({ waiting_since: 't2' }, { stock_top: '2', discards: [['4'], [], [], []] });
    expect(keepSelection({ kind: 'stock', index: 0 }, before, after, 'user-0')).toEqual({
      kind: 'stock',
      index: 0,
    });
    expect(keepSelection({ kind: 'discard', index: 0 }, before, after, 'user-0')).not.toBeNull();
    expect(keepSelection({ kind: 'discard', index: 1 }, before, after, 'user-0')).toBeNull();
  });

  it('keeps a hand card only while the hand is unchanged', () => {
    const hand = { kind: 'hand' as const, index: 1 };
    expect(keepSelection(hand, game(), game({ waiting_since: 't2' }), 'user-0')).toEqual(hand);
    expect(keepSelection(hand, game(), game({ hand: ['3', 'SB'] }), 'user-0')).toBeNull();
  });

  it('drops the selection when the stock is empty or the turn is over', () => {
    const stock = { kind: 'stock' as const, index: 0 };
    expect(keepSelection(stock, game(), game({}, { stock_top: null }), 'user-0')).toBeNull();
    expect(keepSelection(stock, game(), game({ turn_seat: 1 }), 'user-0')).toBeNull();
  });
});

describe('fanView', () => {
  it('shows the top cards and caps the rest', () => {
    expect(fanView(['1', '2', '3'], 4)).toEqual({ cap: 0, cards: ['1', '2', '3'] });
    expect(fanView(['1', '2', '3', '4', '5', '6'], 3)).toEqual({ cap: 3, cards: ['4', '5', '6'] });
    expect(fanView(['1', '2', '3', '4', '5', '6'], 4).cap).toBe(2);
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
