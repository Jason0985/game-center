import {
  canPlay,
  cardName,
  describeEvent,
  handLayout,
  HAND_SPEC,
  rankPlayers,
  UnoCard,
  unoButtonLit,
  UnoGame,
  UnoPlayer,
} from './uno.model';

function player(seat: number, overrides: Partial<UnoPlayer> = {}): UnoPlayer {
  return {
    user_id: `user-${seat}`,
    seat,
    state: 'active',
    hand_count: 5,
    uno_called: false,
    round_points: null,
    score: 0,
    name: ['Lea', 'Ben', 'Carl', 'Dana', 'Emil'][seat],
    ...overrides,
  };
}

function game(overrides: Partial<UnoGame> = {}): UnoGame {
  return {
    id: 'g',
    status: 'playing',
    settings: { stacking: false, sevenZero: false, drawUntilPlayable: false },
    seat_count: 3,
    round_no: 1,
    dealer_seat: 2,
    turn_seat: 0,
    turn_no: 1,
    direction: 1,
    color: 'B',
    discard_top: ['B7'],
    draw_count: 60,
    pending_draw: 0,
    drew: false,
    uno_open_seat: null,
    winner_seat: null,
    last_events: [],
    round_log: [],
    waiting_since: 't',
    players: [player(0), player(1), player(2)],
    hand: [],
    drawn: null,
    ...overrides,
  };
}

const playable = (cards: UnoCard[], g: UnoGame) => cards.filter((c) => canPlay(c, g, g.drawn));

describe('canPlay', () => {
  it('matches colour, value or wild', () => {
    expect(playable(['B2', 'R7', 'R3', 'W', 'W+4', 'GS'], game())).toEqual([
      'B2',
      'R7',
      'W',
      'W+4',
    ]);
    expect(playable(['YS', 'RS', 'B+2'], game({ discard_top: ['GS'], color: 'G' }))).toEqual([
      'YS',
      'RS',
    ]);
  });

  it('follows the colour chosen for a wild', () => {
    expect(playable(['R1', 'Y5', 'W'], game({ discard_top: ['W'], color: 'Y' }))).toEqual([
      'Y5',
      'W',
    ]);
  });

  it('allows nothing under a pending draw without stacking', () => {
    const g = game({ discard_top: ['B+2'], pending_draw: 2 });
    expect(playable(['B+2', 'R+2', 'W+4', 'B5'], g)).toEqual([]);
  });

  it('stacks +2 and +4 on a +2, only +4 on a +4', () => {
    const settings = { stacking: true };
    expect(
      playable(
        ['R+2', 'W+4', 'B5', 'W'],
        game({ settings, discard_top: ['B+2'], pending_draw: 2 }),
      ),
    ).toEqual(['R+2', 'W+4']);
    expect(
      playable(
        ['R+2', 'W+4'],
        game({ settings, discard_top: ['W+4'], color: 'R', pending_draw: 4 }),
      ),
    ).toEqual(['W+4']);
  });

  it('allows only the drawn card after drawing', () => {
    expect(playable(['B2', 'B9', 'W'], game({ drew: true, drawn: 'B9' }))).toEqual(['B9']);
  });
});

describe('cardName', () => {
  it('writes colour and value', () => {
    expect(['R5', 'BS', 'YR', 'G+2', 'W', 'W+4'].map((c) => cardName(c as UnoCard))).toEqual([
      'Rot 5',
      'Blau Aussetzen',
      'Gelb Richtungswechsel',
      'Grün Zieh zwei',
      'Farbwahl',
      'Farbwahl +4',
    ]);
  });
});

describe('describeEvent', () => {
  const players = [player(0), player(1), player(2), player(3)];

  it('writes the design texts in Du-form', () => {
    expect(describeEvent({ t: 'play', seat: 1, card: 'B7' }, players, 0)).toBe('Ben legt Blau 7');
    expect(describeEvent({ t: 'play', seat: 0, card: 'W+4' }, players, 0)).toBe(
      'Du legst Farbwahl +4',
    );
    expect(describeEvent({ t: 'color', seat: 0, color: 'B' }, players, 1)).toBe('Lea wählt Blau');
    expect(describeEvent({ t: 'uno', seat: 3 }, players, 0)).toBe('Dana ruft Uno!');
    expect(describeEvent({ t: 'skipped', seat: 1, by: 0 }, players, 2)).toBe(
      'Lea lässt Ben aussetzen',
    );
    expect(describeEvent({ t: 'skipped', seat: 0, by: 2 }, players, 0)).toBe(
      'Carl lässt dich aussetzen',
    );
    expect(describeEvent({ t: 'reverse', seat: 0, dir: -1 }, players, 1)).toBe(
      'Lea wechselt die Richtung',
    );
    expect(describeEvent({ t: 'start', round: 2, seat: 1 }, players, 0)).toBe(
      'Runde 2 beginnt – Geber: Ben',
    );
  });

  it('never names drawn cards', () => {
    expect(describeEvent({ t: 'draw', seat: 1, n: 1 }, players, 0)).toBe('Ben zieht eine Karte');
    expect(describeEvent({ t: 'draw', seat: 0, n: 2 }, players, 0)).toBe('Du ziehst 2 Karten');
    expect(describeEvent({ t: 'penalty', seat: 2, n: 2 }, players, 0)).toBe(
      'Carl zieht 2 Karten – Uno vergessen',
    );
    expect(describeEvent({ t: 'swap', seat: 2, target: 0 }, players, 0)).toBe(
      'Carl tauscht die Karten mit dir',
    );
  });
});

describe('rankPlayers', () => {
  it('puts the winner first, then the fewest points, shares ties, leavers last', () => {
    const ranked = rankPlayers(
      [
        player(0, { round_points: 32 }),
        player(1, { round_points: 117, hand_count: 0 }),
        player(2, { state: 'left' }),
        player(3, { round_points: 14 }),
        player(4, { round_points: 32 }),
      ],
      1,
    );
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [1, 1],
      [3, 2],
      [0, 3],
      [4, 3],
      [2, null],
    ]);
  });

  it('ranks by card count when ended early', () => {
    const ranked = rankPlayers([player(0, { hand_count: 4 }), player(1, { hand_count: 2 })], null);
    expect(ranked.map((row) => [row.player.seat, row.rank])).toEqual([
      [1, 1],
      [0, 2],
    ]);
  });
});

describe('handLayout', () => {
  it('uses the full degrees for 7 cards on the phone', () => {
    const hand = handLayout(7, 'phone');
    expect(hand.deg).toBe(6);
    expect(hand.width).toBeCloseTo(HAND_SPEC.phone.max);
    expect(hand.scroll).toBe(false);
  });

  it('caps the arc and scrolls when cards would show less than 36 %', () => {
    const hand = handLayout(17, 'phone');
    expect(hand.deg).toBeCloseTo(2.75);
    expect(hand.step).toBeCloseTo(54 * 0.36);
    expect(hand.scroll).toBe(true);
    expect(handLayout(12, 'phone').scroll).toBe(false);
  });

  it('keeps a small gap between few cards', () => {
    expect(handLayout(2, 'phone')).toEqual({ step: 60, deg: 6, scroll: false, width: 114 });
  });
});

describe('unoButtonLit', () => {
  const me = player(0);

  it('lights on my turn with two cards when one fits', () => {
    expect(unoButtonLit(game({ hand: ['B2', 'R1'] }), me, true)).toBe(true);
    expect(unoButtonLit(game({ hand: ['R2', 'R1'] }), me, true)).toBe(false);
    expect(unoButtonLit(game({ hand: ['B2', 'R1'] }), me, false)).toBe(false);
  });

  it('lights with one uncalled card, not after calling', () => {
    expect(unoButtonLit(game({ hand: ['R1'], turn_seat: 1 }), me, false)).toBe(true);
    expect(unoButtonLit(game({ hand: ['R1'] }), { ...me, uno_called: true }, false)).toBe(false);
  });
});
