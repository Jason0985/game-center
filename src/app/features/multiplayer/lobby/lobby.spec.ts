import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { Flip7Service } from '../flip7/flip7.service';
import { LobbyDetail, LobbyMember } from '../lobby.model';
import { Lobby } from './lobby';

function member(userId: string, ready = false): LobbyMember {
  return {
    user_id: userId,
    ready,
    joined_at: '2026-09-30T12:00:00Z',
    name: userId,
    profile: { id: userId, username: userId, display_name: null },
  };
}

function lobbyDetail(overrides: Partial<LobbyDetail> = {}): LobbyDetail {
  return {
    id: 'lobby-1',
    host_user_id: 'host',
    status: 'open',
    game_key: 'flip-7',
    game_settings: { targetScore: 200 },
    created_at: '2026-09-30T12:00:00Z',
    started_at: null,
    code: null,
    members: [member('host'), member('guest')],
    ...overrides,
  };
}

describe('Lobby', () => {
  let fixture: ComponentFixture<Lobby>;
  let component: Lobby;
  let router: Router;
  let user: ReturnType<typeof signal<{ id: string } | null>>;
  let confirmResult: boolean;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; show: ReturnType<typeof vi.fn> };
  let appErrors: { report: ReturnType<typeof vi.fn> };
  let lobbyService: {
    getLobby: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
    setReady: ReturnType<typeof vi.fn>;
    kick: ReturnType<typeof vi.fn>;
    leave: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    setGame: ReturnType<typeof vi.fn>;
  };
  let flip7: { load: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };

  async function render(userId: string, lobby: LobbyDetail | null = lobbyDetail()) {
    user.set({ id: userId });
    lobbyService.getLobby.mockResolvedValue({ ok: true, value: lobby });
    fixture = TestBed.createComponent(Lobby);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const text = (): string => fixture.nativeElement.textContent;

  beforeEach(async () => {
    user = signal<{ id: string } | null>(null);
    confirmResult = true;
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(confirmResult) })) };
    toast = { success: vi.fn(), show: vi.fn() };
    appErrors = { report: vi.fn() };
    lobbyService = {
      getLobby: vi.fn(),
      subscribeToChanges: vi.fn().mockReturnValue(() => {}),
      setReady: vi.fn().mockResolvedValue({ ok: true }),
      kick: vi.fn().mockResolvedValue({ ok: true }),
      leave: vi.fn().mockResolvedValue({ ok: true }),
      start: vi.fn().mockResolvedValue({ ok: true }),
      setGame: vi.fn().mockResolvedValue({ ok: true }),
    };
    flip7 = {
      load: vi.fn().mockResolvedValue({ ok: true, value: null }),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };

    await TestBed.configureTestingModule({
      imports: [Lobby],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ lobbyId: 'lobby-1' }) } },
        },
        { provide: SessionService, useValue: { user } },
        { provide: MultiplayerLobbyService, useValue: lobbyService },
        { provide: Flip7Service, useValue: flip7 },
        { provide: MatDialog, useValue: dialog },
        { provide: ToastService, useValue: toast },
        { provide: AppErrorService, useValue: appErrors },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('shows the code only to the host', async () => {
    await render('host', lobbyDetail({ code: 'ABC234' }));
    expect(text()).toContain('ABC234');

    fixture.destroy();
    await render('guest', lobbyDetail());
    expect(text()).not.toContain('Lobby-Code');
  });

  it('leaves the page when the user was kicked', async () => {
    await render('guest', lobbyDetail({ members: [member('host')] }));

    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Du bist nicht (mehr) in dieser Lobby.' }),
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/multiplayer');
  });

  it('leaves the page when the lobby was closed', async () => {
    await render('guest', null);

    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Die Lobby wurde geschlossen.' }),
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/multiplayer');
  });

  it('asks the host before closing the lobby', async () => {
    await render('host');

    confirmResult = false;
    await component.leave();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(lobbyService.leave).not.toHaveBeenCalled();

    confirmResult = true;
    await component.leave();
    expect(lobbyService.leave).toHaveBeenCalledWith('lobby-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/multiplayer');
  });

  it('lets members leave the waiting room without confirmation', async () => {
    await render('guest');

    await component.leave();

    expect(dialog.open).not.toHaveBeenCalled();
    expect(lobbyService.leave).toHaveBeenCalledWith('lobby-1');
  });

  it('asks members before leaving a running game', async () => {
    await render('guest', lobbyDetail({ status: 'started' }));

    confirmResult = false;
    await component.leave();
    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ message: 'Du verlässt das laufende Spiel endgültig.' }),
      }),
    );
    expect(lobbyService.leave).not.toHaveBeenCalled();

    confirmResult = true;
    await component.leave();
    expect(lobbyService.leave).toHaveBeenCalledWith('lobby-1');
  });

  it('reloads the lobby after a failed action', async () => {
    await render('guest');
    lobbyService.setReady.mockResolvedValue({
      ok: false,
      message: 'Die Lobby ist nicht mehr offen.',
    });
    lobbyService.getLobby.mockResolvedValue({
      ok: true,
      value: lobbyDetail({ status: 'started' }),
    });

    await component.toggleReady();
    fixture.detectChanges();

    expect(appErrors.report).toHaveBeenCalledWith('Die Lobby ist nicht mehr offen.', {
      title: 'Lobby',
    });
    expect(component.started()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-flip7-game')).not.toBeNull();
    // Im Spiel zeigt der Spieltisch seinen eigenen Kopf
    expect(text()).toContain('Flip 7');
    expect(flip7.load).toHaveBeenCalledWith('lobby-1');
  });

  it('lets only the host change the game settings', async () => {
    await render('host');
    const segments = [
      ...fixture.nativeElement.querySelectorAll('.segments button'),
    ] as HTMLButtonElement[];
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
    expect(lobbyService.setGame).toHaveBeenCalledWith('lobby-1', 'flip-7', { targetScore: null });

    fixture.destroy();
    await render('guest');
    expect(fixture.nativeElement.querySelector('.segments')).toBeNull();
    expect(text()).toContain('200 Punkte');
  });

  it('cannot start without a chosen game', async () => {
    const ready = [member('host', true), member('guest', true)];
    await render('host', lobbyDetail({ members: ready, game_key: null }));
    expect(component.canStart()).toBe(false);
    expect(text()).toContain('Der Host muss noch ein Spiel auswählen.');

    fixture.destroy();
    await render('host', lobbyDetail({ members: ready }));
    expect(component.canStart()).toBe(true);
  });

  it('shows a way back when the lobby cannot be loaded', async () => {
    user.set({ id: 'guest' });
    lobbyService.getLobby.mockResolvedValue({ ok: false, message: 'Keine Verbindung.' });
    fixture = TestBed.createComponent(Lobby);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text()).toContain('Die Lobby konnte nicht geladen werden.');
    const backLink = fixture.nativeElement.querySelector('.lobby-back-link') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/multiplayer');
  });

  it('does not resubscribe when only the session object changes', async () => {
    await render('guest');

    user.set({ id: 'guest' });
    await fixture.whenStable();

    expect(lobbyService.subscribeToChanges).toHaveBeenCalledTimes(1);
  });
});
