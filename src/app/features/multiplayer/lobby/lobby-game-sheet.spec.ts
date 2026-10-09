import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { LobbyDetail, LobbyGameSettings } from '../lobby.model';
import { LobbyGameSheet, LobbyGameSheetData } from './lobby-game-sheet';

describe('LobbyGameSheet', () => {
  let fixture: ComponentFixture<LobbyGameSheet>;
  let setGame: ReturnType<typeof vi.fn>;
  let changed: ReturnType<typeof vi.fn<() => void>>;

  async function render(gameKey: string | null, gameSettings: LobbyGameSettings | null = null) {
    const lobby = { id: 'lobby-1', game_key: gameKey, game_settings: gameSettings } as LobbyDetail;
    setGame = vi.fn().mockResolvedValue({ ok: true });
    changed = vi.fn<() => void>();
    await TestBed.configureTestingModule({
      imports: [LobbyGameSheet],
      providers: [
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {
            lobbyId: 'lobby-1',
            lobby: signal(lobby),
            busy: signal(false),
            changed,
          } satisfies LobbyGameSheetData,
        },
        { provide: MatBottomSheetRef, useValue: { dismiss: vi.fn() } },
        { provide: MultiplayerLobbyService, useValue: { setGame } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LobbyGameSheet);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const buttons = (selector: string): HTMLButtonElement[] => [
    ...fixture.nativeElement.querySelectorAll(selector),
  ];

  it('lists every game with its player range and marks the current one', async () => {
    await render('skip-bo');

    const games = buttons('[role="radio"]');
    expect(games.map((game) => game.textContent)).toEqual([
      expect.stringContaining('2–8 Spieler'),
      expect.stringContaining('2–6 Spieler'),
      expect.stringContaining('2–8 Spieler'),
      expect.stringContaining('richup.io'),
    ]);
    expect(games[1].getAttribute('aria-checked')).toBe('true');
  });

  it('switches the game with its default settings', async () => {
    await render('flip-7', { targetScore: 150 });

    buttons('[role="radio"]')[2].click();
    await fixture.whenStable();

    expect(setGame).toHaveBeenCalledWith('lobby-1', 'uno', {
      stacking: false,
      sevenZero: false,
      drawUntilPlayable: false,
    });
    expect(changed).toHaveBeenCalled();
  });

  it('saves the Flip 7 target', async () => {
    await render('flip-7', { targetScore: 200 });

    const segments = buttons('.segments button');
    expect(segments.map((button) => button.textContent?.trim())).toEqual([
      '100',
      '150',
      '200',
      '300',
      'Offen',
    ]);
    expect(segments[2].getAttribute('aria-pressed')).toBe('true');

    segments[4].click();
    await fixture.whenStable();
    expect(setGame).toHaveBeenCalledWith('lobby-1', 'flip-7', { targetScore: null });
  });

  it('toggles Uno house rules', async () => {
    const off = { stacking: false, sevenZero: false, drawUntilPlayable: false };
    await render('uno', off);

    const switches = buttons('[role="switch"]');
    expect(switches.map((button) => button.textContent?.trim())).toEqual([
      '+2/+4 stapeln',
      '7 tauscht, 0 dreht',
      'Ziehen, bis es passt',
    ]);
    switches[0].click();
    await fixture.whenStable();
    expect(setGame).toHaveBeenCalledWith('lobby-1', 'uno', { ...off, stacking: true });
  });
});
