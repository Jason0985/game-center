import {
  cardColors,
  cardText,
  describeEvent,
  formatPoints,
  hiddenCount,
  isHidden,
  openSum,
  rankPlayers,
  SkPlayer,
  skyjoRules,
} from './skyjo.model';

function player(seat: number, overrides: Partial<SkPlayer> = {}): SkPlayer {
  return {
    user_id: `u${seat}`,
    seat,
    state: 'active',
    cards: Array(12).fill(null),
    cleared: [false, false, false, false],
    flips: 0,
    score: 0,
    round_raw: null,
    round_score: null,
    columns: 0,
    doubled: 0,
    best_round: null,
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

describe('skyjo model', () => {
  it('colors the cards by value like the card design', () => {
    expect(cardColors(-2).face).toBe('#3d44b0');
    expect(cardColors(0).face).toBe('#4cc3ef');
    expect(cardColors(4).face).toBe('#4fbf68');
    expect(cardColors(5).face).toBe('#f5cf3a');
    expect(cardColors(9).face).toBe('#e5484d');
    expect(cardText(-1)).toBe('−1');
    expect(formatPoints(-21)).toBe('−21');
    expect(formatPoints(7)).toBe('+7');
  });

  it('counts open cards and knows which are still hidden', () => {
    const p = player(0, {
      cards: [5, null, null, 0, -1, null, null, 3, 12, null, null, 4],
      cleared: [false, true, false, false],
    });
    expect(openSum(p.cards)).toBe(23);
    expect(isHidden(p, 1)).toBe(false);
    expect(isHidden(p, 2)).toBe(true);
    expect(hiddenCount(p)).toBe(3);
  });

  it('ranks the fewest points first, ties share a place, leavers last', () => {
    const ranked = rankPlayers([
      player(0, { score: 30 }),
      player(1, { score: 14 }),
      player(2, { score: 30, state: 'left' }),
    ]);
    expect(ranked.map((r) => [r.player.seat, r.rank])).toEqual([
      [1, 1],
      [0, 2],
      [2, null],
    ]);
  });

  it('describes moves from the own and the others’ view', () => {
    const players = [player(0), player(1)];
    expect(describeEvent({ t: 'draw', seat: 1, from: 'discard', card: 4 }, players, 0)).toBe(
      'Gast nimmt die 4 von der Ablage',
    );
    expect(
      describeEvent({ t: 'swap', seat: 0, cell: 3, card: -2, old: 9, hidden: true }, players, 0),
    ).toBe('Du tauschst eine verdeckte 9 gegen die −2');
    expect(describeEvent({ t: 'clear', seat: 1, col: 1, card: 7, n: 21 }, players, 0)).toBe(
      'Gast räumt Spalte 2 ab (drei 7er)',
    );
    expect(describeEvent({ t: 'round_end', round: 2, seat: 0, doubled: true }, players, 0)).toBe(
      'Runde 2 beendet – du zählst doppelt',
    );
  });

  it('lists only the rules that are switched on', () => {
    const all = skyjoRules({ endScore: 50, clearColumns: true, doubleEnder: true });
    const none = skyjoRules({ endScore: 150, clearColumns: false, doubleEnder: false });
    expect(all.some((rule) => rule.includes('Spalte'))).toBe(true);
    expect(all.some((rule) => rule.includes('doppelt'))).toBe(true);
    expect(all.at(-1)).toContain('50 Punkte');
    expect(none.some((rule) => rule.includes('Spalte fliegen'))).toBe(false);
    expect(none.some((rule) => rule.includes('doppelt'))).toBe(false);
  });
});
