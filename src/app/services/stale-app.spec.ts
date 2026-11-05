import { isChunkLoadError, isOpaqueScriptError } from './stale-app';

describe('Veraltete App erkennen', () => {
  it('erkennt fehlende Code-Teile in allen Browsern', () => {
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://jason0985.github.io/game-center/chunk-3od1aCqn.js',
        ),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError({ rejection: new Error('error loading dynamically imported module') }),
    ).toBe(true);
    expect(isChunkLoadError(new TypeError("undefined is not an object (evaluating 'e.x')"))).toBe(
      false,
    );
  });

  it('erkennt die anonyme „Script error.“-Meldung', () => {
    expect(isOpaqueScriptError(new Error('Script error.'))).toBe(true);
    expect(isOpaqueScriptError('Script error.')).toBe(true);
    expect(isOpaqueScriptError(new Error('Script error in Lobby'))).toBe(false);
  });
});
