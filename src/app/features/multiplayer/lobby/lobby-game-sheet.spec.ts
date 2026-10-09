import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LobbyGameDialog } from './lobby-game-dialog';

describe('LobbyGameDialog', () => {
  it('shows every game with its player range and marks the current one', async () => {
    await TestBed.configureTestingModule({
      imports: [LobbyGameDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { gameKey: 'skip-bo' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LobbyGameDialog);
    await fixture.whenStable();

    const tiles = [...fixture.nativeElement.querySelectorAll('.game-tile')] as HTMLElement[];
    expect(tiles.map((tile) => tile.textContent)).toEqual([
      expect.stringContaining('2–8 Spieler'),
      expect.stringContaining('2–6 Spieler'),
      expect.stringContaining('2–8 Spieler'),
      expect.stringContaining('https://richup.io'),
    ]);
    expect(tiles[1].getAttribute('aria-pressed')).toBe('true');
  });
});
