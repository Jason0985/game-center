import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { SessionService } from '../../services/session.service';
import { AppErrorService } from '../../services/app-error.service';
import { Multiplayer } from './multiplayer';
import { MultiplayerLobbyService } from './multiplayer-lobby.service';
import { LobbySummary } from './lobby.model';

describe('Multiplayer', () => {
  let component: Multiplayer;
  let fixture: ComponentFixture<Multiplayer>;
  let router: Router;
  let appErrors: { report: ReturnType<typeof vi.fn> };
  let lobbyService: {
    listOpenLobbies: ReturnType<typeof vi.fn>;
    findMyLobbyId: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
    createLobby: ReturnType<typeof vi.fn>;
    joinLobby: ReturnType<typeof vi.fn>;
  };

  const lobby: LobbySummary = {
    id: 'lobby-1',
    host_user_id: 'host-user',
    hostName: 'Host',
    status: 'open',
    game_key: 'flip-7',
    game_settings: { targetScore: 200 },
    created_at: '2026-09-30T12:00:00Z',
    memberCount: 1,
  };

  async function render(myLobbyId: string | null = null): Promise<void> {
    lobbyService.findMyLobbyId.mockResolvedValue(myLobbyId);
    fixture = TestBed.createComponent(Multiplayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    lobbyService = {
      listOpenLobbies: vi.fn().mockResolvedValue([lobby]),
      findMyLobbyId: vi.fn().mockResolvedValue(null),
      subscribeToChanges: vi.fn().mockReturnValue(() => {}),
      createLobby: vi.fn(),
      joinLobby: vi.fn(),
    };
    appErrors = { report: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Multiplayer],
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: {
            initialized: signal(true),
            user: signal({ id: 'guest-user' }),
            isLoggedIn: signal(true),
          },
        },
        { provide: MultiplayerLobbyService, useValue: lobbyService },
        { provide: AppErrorService, useValue: appErrors },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('creates a lobby and opens it', async () => {
    await render();
    lobbyService.createLobby.mockResolvedValue({ ok: true, value: 'lobby-2' });

    await component.createLobby();

    expect(lobbyService.createLobby).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/multiplayer', 'lobby-2']);
  });

  it('joins a lobby with the entered code', async () => {
    await render();
    lobbyService.joinLobby.mockResolvedValue({ ok: true });

    component.openJoin(lobby);
    component.joinCode.set('ABC234');
    await component.joinLobby(new Event('submit'), lobby);

    expect(lobbyService.joinLobby).toHaveBeenCalledWith('lobby-1', 'ABC234');
    expect(router.navigate).toHaveBeenCalledWith(['/multiplayer', 'lobby-1']);
  });

  it('shows the message of a failed join', async () => {
    await render();
    lobbyService.joinLobby.mockResolvedValue({
      ok: false,
      message: 'Code ist falsch oder die Lobby ist nicht mehr offen.',
    });

    component.joinCode.set('AAAAAA');
    await component.joinLobby(new Event('submit'), lobby);

    expect(component.errorMessage()).toBe('Code ist falsch oder die Lobby ist nicht mehr offen.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('hides create and join while already in a lobby', async () => {
    await render('lobby-1');
    fixture.detectChanges();

    const labels = [...fixture.nativeElement.querySelectorAll('button')].map((button) =>
      (button as HTMLButtonElement).textContent?.trim(),
    );
    expect(labels.some((label) => label?.includes('Lobby eröffnen'))).toBe(false);
    expect(labels.some((label) => label?.includes('Beitreten'))).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Du bist in einer Lobby');
  });

  it('shows the game and a primary join button at the bottom of each card', async () => {
    await render();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.lobby-card') as HTMLElement;
    expect(card.textContent).toContain('Flip 7 · bis 200 Punkte');
    const join = card.querySelector('.lobby-card-actions .lobby-button') as HTMLButtonElement;
    expect(join.textContent?.trim()).toContain('Beitreten');
    expect(join.disabled).toBe(false);
  });

  it('disables the join button of a full lobby', async () => {
    lobbyService.listOpenLobbies.mockResolvedValue([{ ...lobby, memberCount: 8 }]);
    await render();
    fixture.detectChanges();

    const join = fixture.nativeElement.querySelector('.lobby-card-actions .lobby-button');
    expect(join.textContent.trim()).toBe('Voll');
    expect(join.disabled).toBe(true);
  });

  it('hides "Lobby eröffnen" until the own lobby is known', async () => {
    lobbyService.findMyLobbyId.mockReturnValue(new Promise(() => {}));
    fixture = TestBed.createComponent(Multiplayer);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Lobby eröffnen');
  });
});
