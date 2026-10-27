import {
  BjHand,
  BjPlayer,
  blackjackSeats,
  canDouble,
  canSplit,
  chipStack,
  describeEvent,
  formatDelta,
  handValue,
  isBlackjack,
  resetsTimeline,
  roundDelta,
  seatStatus,
  stakeOf,
  valueLabel,
} from './blackjack.model';

function hand(cards: string[], overrides: Partial<BjHand> = {}): BjHand {
  return {
    hand_no: 0,
    cards,
    bet: 50,
    doubled: false,
    state: 'playing',
    result: null,
    payout: null,
    ...overrides,
  };
}

function player(seat: number, overrides: Partial<BjPlayer> = {}): BjPlayer {
  return {
    user_id: `u${seat}`,
    seat,
    state: 'active',
    balance: 1000,
    bet: 0,
    last_bet: 0,
    name: ['Jason', 'Mara', 'Ben'][seat],
    hands: [],
    ...overrides,
  };
}

describe('handValue', () => {
  it('counts an ace as 11 while it fits', () => {
    expect(handValue(['AS', '6D'])).toEqual({ total: 17, soft: true });
    expect(valueLabel(['AS', '6D'])).toBe('7 / 17');
    expect(handValue(['AS', 'AH', '9C'])).toEqual({ total: 21, soft: true });
    expect(valueLabel(['AS', 'AH', '9C'])).toBe('21');
  });

  it('counts pictures as 10 and goes bust above 21', () => {
    expect(handValue(['10S', '6H', 'KD'])).toEqual({ total: 26, soft: false });
    expect(valueLabel(['10S', '6H', 'KD'])).toBe('26');
  });
});

describe('isBlackjack', () => {
  it('needs two cards with 21 and no split', () => {
    expect(isBlackjack(['AS', 'KD'], false)).toBe(true);
    expect(isBlackjack(['AS', 'KD'], true)).toBe(false);
    expect(isBlackjack(['7S', '7D', '7H'], false)).toBe(false);
  });
});

describe('canSplit / canDouble', () => {
  it('splits two cards of equal value once', () => {
    expect(canSplit([hand(['KS', '10D'])], 1000)).toBe(true);
    expect(canSplit([hand(['AS', 'AD'])], 1000)).toBe(true);
    expect(canSplit([hand(['9S', '10D'])], 1000)).toBe(false);
    expect(canSplit([hand(['8S', '8D'])], 40)).toBe(false);
    expect(canSplit([hand(['8S', '8D']), hand(['8C', '3H'], { hand_no: 1 })], 1000)).toBe(false);
  });

  it('doubles two cards when the balance covers the bet', () => {
    expect(canDouble(hand(['5S', '6D']), 50)).toBe(true);
    expect(canDouble(hand(['5S', '6D']), 49)).toBe(false);
    expect(canDouble(hand(['5S', '6D', '2C']), 1000)).toBe(false);
  });
});

describe('chipStack', () => {
  it('takes the largest chips first, at most 6, smallest at the bottom', () => {
    expect(chipStack(75).map((chip) => chip.value)).toEqual([25, 25, 25]);
    expect(chipStack(135).map((chip) => chip.value)).toEqual([10, 25, 100]);
    expect(chipStack(1000).length).toBe(2);
    expect(chipStack(485).length).toBe(6);
  });
});

describe('blackjackSeats', () => {
  it('uses side columns on the phone and the lower arc on the laptop', () => {
    expect(blackjackSeats('phone', 1)).toEqual([{ x: 13.2, y: 42.4 }]);
    expect(blackjackSeats('phone', 4).map((spot) => spot.x)).toEqual([13.2, 13.2, 86.8, 86.8]);
    const laptop = blackjackSeats('laptop', 4);
    expect(laptop.length).toBe(4);
    // Alle unter der Mitte (der Dealer sitzt oben)
    expect(laptop.every((spot) => spot.y > 50)).toBe(true);
    expect(laptop[0].x).toBeLessThan(50);
    expect(laptop[3].x).toBeGreaterThan(50);
  });
});

describe('seatStatus', () => {
  const playing = { phase: 'playing' as const, turn_seat: 1 };
  const betting = { phase: 'betting' as const, turn_seat: null };

  it('shows the round state in one token', () => {
    expect(seatStatus(player(1, { bet: 50 }), betting, false)).toMatchObject({
      short: '✓ 50',
      tone: 'ready',
    });
    expect(seatStatus(player(1), betting, false).short).toBe('…');
    expect(seatStatus(player(1, { balance: 5 }), betting, false).short).toBe('Pleite');
    expect(seatStatus(player(1, { hands: [hand(['10S', '8D'])] }), playing, false)).toMatchObject({
      short: '18',
      tone: 'turn',
    });
    expect(
      seatStatus(
        player(2, { hands: [hand(['9H', '7S', 'KD'], { state: 'bust' })] }),
        playing,
        false,
      ),
    ).toMatchObject({ short: '26', tone: 'bust', long: 'Überkauft' });
    expect(
      seatStatus(player(2, { hands: [hand(['AH', 'KC'], { state: 'blackjack' })] }), playing, false)
        .short,
    ).toBe('BJ');
    expect(
      seatStatus(
        player(2, { hands: [hand(['10S', '7D']), hand(['10H', 'QD'], { hand_no: 1 })] }),
        playing,
        false,
      ).short,
    ).toBe('17·20');
  });

  it('shows the settled result, but only once the animation is done', () => {
    const won = player(2, {
      hands: [hand(['10S', '9D'], { state: 'stood', result: 'win', payout: 100 })],
    });
    expect(seatStatus(won, betting, false)).toMatchObject({ short: '+50', tone: 'win' });
    expect(seatStatus(won, betting, true).short).toBe('19');
  });
});

describe('stakeOf / roundDelta', () => {
  it('counts the placed bet, else the open hands', () => {
    expect(stakeOf(player(0, { bet: 40, hands: [hand(['KS', '9D'])] }))).toBe(40);
    expect(stakeOf(player(0, { hands: [hand(['8S']), hand(['8D'], { hand_no: 1 })] }))).toBe(100);
    expect(stakeOf(player(0))).toBe(0);
  });

  it('sums the result of all hands', () => {
    const won = hand(['KS', '9D'], { result: 'win', payout: 100 });
    const lost = hand(['8D', '9C'], { hand_no: 1, result: 'lose', payout: 0 });
    expect(roundDelta([won, lost])).toBe(0);
    expect(roundDelta([won])).toBe(50);
    expect(roundDelta([])).toBe(0);
  });
});

describe('resetsTimeline', () => {
  it('lets a bet or a leaving player not cut off the settle animation', () => {
    expect(resetsTimeline([{ t: 'bet', seat: 1, n: 50 }])).toBe(false);
    expect(resetsTimeline([{ t: 'left', seat: 2 }])).toBe(false);
    expect(resetsTimeline([{ t: 'shuffle' }, { t: 'deal' }])).toBe(true);
    expect(resetsTimeline([{ t: 'reveal' }, { t: 'result', seat: 0, hand: 0, k: 'win' }])).toBe(
      true,
    );
  });
});

describe('describeEvent', () => {
  const players = [player(0), player(1)];

  it('speaks to me and about the others', () => {
    expect(describeEvent({ t: 'bet', seat: 1, n: 50 }, players, 0)).toBe('Mara setzt 50');
    expect(describeEvent({ t: 'hit', seat: 0, hand: 0, card: 'KD', n: 26 }, players, 0)).toBe(
      'Du ziehst Karo König – überkauft (26)',
    );
    expect(describeEvent({ t: 'stand', seat: 1, hand: 0, n: 18 }, players, 0)).toBe(
      'Mara hält bei 18',
    );
    expect(describeEvent({ t: 'dealer', n: 21, bj: true }, players, 0)).toBe(
      'Dealer hat Blackjack',
    );
    expect(
      describeEvent({ t: 'result', seat: 1, hand: 0, k: 'blackjack', n: 75 }, players, 0),
    ).toBe('Mara: Blackjack +75');
    expect(describeEvent({ t: 'result', seat: 0, hand: 0, k: 'lose', n: -25 }, players, 0)).toBe(
      'Du verlierst 25',
    );
  });

  it('formats money changes with a real minus', () => {
    expect(formatDelta(1240)).toBe('+1.240');
    expect(formatDelta(-1000)).toBe('−1.000');
    expect(formatDelta(0)).toBe('±0');
  });
});
