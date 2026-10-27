import { direction } from './page-transitions';

describe('direction', () => {
  it('fades between tabs', () => {
    expect(direction('/', '/collection')).toBe('tab');
    expect(direction('/profile', '/multiplayer')).toBe('tab');
  });

  it('pushes into pages below a tab and pops back out', () => {
    expect(direction('/profile', '/settings')).toBe('forward');
    expect(direction('/settings', '/settings/push')).toBe('forward');
    expect(direction('/collection', '/collection/f1-strategy')).toBe('forward');
    expect(direction('/collection/f1-strategy', '/collection/f1-strategy/monza')).toBe('forward');
    expect(direction('/settings', '/profile')).toBe('back');
    expect(direction('/collection/paddle-table', '/collection')).toBe('back');
  });
});
