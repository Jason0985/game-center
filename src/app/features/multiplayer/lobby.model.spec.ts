import {
  canStartLobby,
  gameLabel,
  LobbyMember,
  requiredReadyCount,
  startBlocker,
} from './lobby.model';

function members(total: number, ready: number): LobbyMember[] {
  return Array.from({ length: total }, (_, index) => ({
    user_id: `user-${index}`,
    ready: index < ready,
    joined_at: '2026-09-30T12:00:00Z',
    name: `User ${index}`,
    profile: null,
  }));
}

describe('lobby start rule', () => {
  it('needs at least half of the members to be ready', () => {
    expect(canStartLobby(members(2, 1))).toBe(true);
    expect(canStartLobby(members(3, 1))).toBe(false);
    expect(canStartLobby(members(3, 2))).toBe(true);
    expect(canStartLobby(members(4, 2))).toBe(true);
    expect(canStartLobby(members(2, 0))).toBe(false);
  });

  it('never starts with a single member', () => {
    expect(canStartLobby(members(1, 1))).toBe(false);
    expect(canStartLobby(members(1, 0))).toBe(false);
  });

  it('rounds the required ready count up', () => {
    expect(requiredReadyCount(1)).toBe(1);
    expect(requiredReadyCount(3)).toBe(2);
    expect(requiredReadyCount(8)).toBe(4);
  });
});

describe('gameLabel', () => {
  it('names the game and its target score', () => {
    expect(gameLabel('flip-7', { targetScore: 200 })).toBe('Flip 7 · bis 200 Punkte');
    expect(gameLabel('flip-7', { targetScore: null })).toBe('Flip 7 · Offen');
  });

  it('names games without settings plainly', () => {
    expect(gameLabel('skip-bo', {})).toBe('Skip-Bo');
    expect(gameLabel('skip-bo', { stockSize: 15 })).toBe('Skip-Bo · 15 Karten');
  });

  it('lists the active Uno house rules', () => {
    const off = { stacking: false, sevenZero: false, drawUntilPlayable: false };
    expect(gameLabel('uno', off)).toBe('Uno');
    expect(gameLabel('uno', { ...off, sevenZero: true })).toBe('Uno · 7-0');
    expect(gameLabel('uno', { ...off, stacking: true, sevenZero: true })).toBe(
      'Uno · Stapeln, 7-0',
    );
  });

  it('handles lobbies without a game', () => {
    expect(gameLabel(null, null)).toBe('Noch kein Spiel gewählt');
    expect(gameLabel('unknown', { targetScore: 200 })).toBe('Noch kein Spiel gewählt');
  });
});

describe('startBlocker', () => {
  it('lets Flip 7 start', () => {
    expect(startBlocker('flip-7', 8)).toBeNull();
  });

  it('needs a known game', () => {
    expect(startBlocker(null, 2)).toBe('Der Host muss noch ein Spiel auswählen.');
    expect(startBlocker('unknown', 2)).toBe('Der Host muss noch ein Spiel auswählen.');
  });

  it('lets Skip-Bo start with up to 6 players', () => {
    expect(startBlocker('skip-bo', 6)).toBeNull();
    expect(startBlocker('skip-bo', 7)).toBe('Skip-Bo geht mit höchstens 6 Spielern.');
  });

  it('lets Uno start with the full lobby', () => {
    expect(startBlocker('uno', 8)).toBeNull();
  });

  it('never starts Monopoly here (played on richup.io)', () => {
    expect(startBlocker('monopoly', 2)).toBe('Monopoly spielt ihr direkt über den Link oben.');
  });
});
