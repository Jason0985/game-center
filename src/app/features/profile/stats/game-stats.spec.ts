import { computeStats, GameResult } from './game-stats';

let id = 0;
function result(finishedAt: string, won: boolean, extra: Partial<GameResult> = {}): GameResult {
  return {
    game_id: `game-${id++}`,
    round_no: 0,
    game_key: 'flip-7',
    placement: won ? 1 : 2,
    player_count: 2,
    won,
    score: null,
    finished_at: finishedAt,
    ...extra,
  };
}

describe('computeStats', () => {
  it('is empty without results', () => {
    const stats = computeStats([]);
    expect(stats.played).toBe(0);
    expect(stats.winRate).toBeNull();
    expect(stats.evenings).toBe(0);
    expect(stats.favorite).toBeNull();
    expect(stats.bestEvening).toBeNull();
  });

  it('counts wins, streaks and evenings (newest first)', () => {
    const stats = computeStats([
      result('2026-10-03T21:00:00', true),
      result('2026-10-03T20:00:00', true),
      result('2026-10-02T23:00:00', false),
      // nach Mitternacht zählt zum Abend davor
      result('2026-10-02T02:00:00', true),
      result('2026-10-01T22:00:00', true),
      result('2026-10-01T21:00:00', true),
    ]);

    expect(stats.played).toBe(6);
    expect(stats.wins).toBe(5);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(3);
    expect(stats.evenings).toBe(3); // 01., 02. und 03.10.
    expect(stats.bestEvening?.wins).toBe(3);
  });

  it('only counts the top-3 rate from 4 players and keeps a best value for Flip 7 only', () => {
    const stats = computeStats([
      result('2026-10-01T20:00:00', false, { player_count: 4, placement: 4 }),
      result('2026-10-01T20:10:00', false, { player_count: 5, placement: 2 }),
      result('2026-10-01T20:20:00', false, { player_count: 3, placement: 3 }),
      result('2026-10-01T20:30:00', true, { game_key: 'uno', score: 0 }),
      result('2026-10-01T20:40:00', false, { game_key: 'uno', score: 5 }),
    ]);

    expect(stats.top3Rate).toBe(0.5);
    const uno = stats.perGame.find((game) => game.key === 'uno');
    expect(uno?.best).toBeNull();
    expect(stats.favorite).toBe('Flip 7');
  });
});
