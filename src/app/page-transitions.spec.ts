import { direction, isWebKit } from './page-transitions';

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

describe('isWebKit', () => {
  const ua = (userAgent: string) => isWebKit({ userAgent });

  it('spots Safari and every browser on iPhone/iPad', () => {
    expect(
      ua(
        'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(true);
    expect(
      ua(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(true);
    expect(
      ua(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
      ),
    ).toBe(true);
  });

  it('leaves Chrome on desktop and Android alone', () => {
    expect(
      ua(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
      ),
    ).toBe(false);
    expect(
      ua(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
      ),
    ).toBe(false);
  });
});
