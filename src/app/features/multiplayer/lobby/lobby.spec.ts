import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { Flip7Service } from '../flip7/flip7.service';
import { SkipboService } from '../skipbo/skipbo.service';
import { UnoService } from '../uno/uno.service';
import { LobbyDetail, LobbyMember } from '../lobby.model';
import { Lobby } from './lobby';
import { LobbyGameSheet } from './lobby-game-sheet';
import { LobbyInviteSheet } from './lobby-invite-sheet';

function member(userId: string, ready = false): LobbyMember {
  return {
    user_id: userId,
    ready,
    joined_at: '2026-09-30T12:00:00Z',
    name: userId,
    profile: { id: userId, username: userId, display_name: null, is_guest: false },
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
    wins: {},
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
  let bottomSheet: { open: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; show: ReturnType<typeof vi.fn> };
  let appErrors: { report: ReturnType<typeof vi.fn> };
  let lobbyService: {
    getLobby: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
    setReady: ReturnType<typeof vi.fn>;
    kick: ReturnType<typeof vi.fn>;
    transferHost: ReturnType<typeof vi.fn>;
    leave: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    setGame: ReturnType<typeof vi.fn>;
  };
  let flip7: { load: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
  let skipbo: { load: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
  let uno: { load: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };

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
    bottomSheet = { open: vi.fn() };
    toast = { success: vi.fn(), show: vi.fn() };
    appErrors = { report: vi.fn() };
    lobbyService = {
      getLobby: vi.fn(),
      subscribeToChanges: vi.fn().mockReturnValue(() => {}),
      setReady: vi.fn().mockResolvedValue({ ok: true }),
      kick: vi.fn().mockResolvedValue({ ok: true }),
      transferHost: vi.fn().mockResolvedValue({ ok: true }),
      leave: vi.fn().mockResolvedValue({ ok: true }),
      start: vi.fn().mockResolvedValue({ ok: true }),
      setGame: vi.fn().mockResolvedValue({ ok: true }),
    };
    flip7 = {
      load: vi.fn().mockResolvedValue({ ok: true, value: null }),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
    skipbo = {
      load: vi.fn().mockResolvedValue({ ok: true, value: null }),
      subscribe: vi.fn().mockReturnValue(() => {}),
    };
    uno = {
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
        { provide: SessionService, useValue: { authUser: user } },
        { provide: MultiplayerLobbyService, useValue: lobbyService },
        { provide: Flip7Service, useValue: flip7 },
        { provide: SkipboService, useValue: skipbo },
        { provide: UnoService, useValue: uno },
        { provide: MatDialog, useValue: dialog },
        { provide: MatBottomSheet, useValue: bottomSheet },
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

  it('lets the host hand over to accounts but not to guests', async () => {
    const anonymous = member('anon');
    anonymous.profile!.is_guest = true;
    await render('host', lobbyDetail({ members: [member('host'), member('bob'), anonymous] }));

    // Host-Abgabe steckt im ⋮-Menü der Zeile (Overlay außerhalb der Komponente)
    const hostItem = async (name: string): Promise<HTMLButtonElement | undefined> => {
      document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
      fixture.nativeElement.querySelector(`[aria-label="Optionen für ${name}"]`).click();
      fixture.detectChanges();
      await fixture.whenStable();
      return [...document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')].find((item) =>
        item.textContent?.includes('Zum Host machen'),
      );
    };
    expect(await hostItem('anon')).toBeUndefined();

    (await hostItem('bob'))!.click();
    await fixture.whenStable();
    expect(lobbyService.transferHost).toHaveBeenCalledWith('lobby-1', 'bob');
  });

  it('tells a member when they became host', async () => {
    await render('guest');
    lobbyService.getLobby.mockResolvedValue({
      ok: true,
      value: lobbyDetail({ host_user_id: 'guest' }),
    });
    component.reload();
    await fixture.whenStable();

    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Du bist jetzt Host' }),
    );
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

  it('names the evening winner when the lobby closes', async () => {
    await render('guest', lobbyDetail({ wins: { host: 3, guest: 1 } }));
    lobbyService.getLobby.mockResolvedValue({ ok: true, value: null });
    component.reload();
    await fixture.whenStable();

    expect(toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Die Lobby wurde geschlossen.',
        message: 'Abend-Gewinner: host mit 3 Siegen',
      }),
      8000,
    );
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

  it('shows the Skip-Bo table for a started Skip-Bo lobby', async () => {
    await render('guest', lobbyDetail({ status: 'started', game_key: 'skip-bo' }));

    expect(fixture.nativeElement.querySelector('app-skipbo-game')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-flip7-game')).toBeNull();
    expect(text()).toContain('Skip-Bo');
    expect(skipbo.load).toHaveBeenCalledWith('lobby-1');
    expect(flip7.load).not.toHaveBeenCalled();
  });

  it('shows the Uno table for a started Uno lobby', async () => {
    await render('guest', lobbyDetail({ status: 'started', game_key: 'uno' }));

    expect(fixture.nativeElement.querySelector('app-uno-game')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-flip7-game')).toBeNull();
    expect(uno.load).toHaveBeenCalledWith('lobby-1');
    expect(flip7.load).not.toHaveBeenCalled();
  });

  it('opens game and invite sheets for the host only', async () => {
    await render('host', lobbyDetail({ code: 'ABC234' }));
    const button = (label: string): HTMLButtonElement =>
      [...fixture.nativeElement.querySelectorAll('button')].find((item: HTMLButtonElement) =>
        item.textContent?.includes(label),
      );

    button('Flip 7').click();
    expect(bottomSheet.open).toHaveBeenLastCalledWith(
      LobbyGameSheet,
      expect.objectContaining({ data: expect.objectContaining({ lobbyId: 'lobby-1' }) }),
    );
    button('Freie Plätze: 6').click();
    expect(bottomSheet.open).toHaveBeenLastCalledWith(
      LobbyInviteSheet,
      expect.objectContaining({
        data: expect.objectContaining({ code: 'ABC234', memberIds: ['host', 'guest'] }),
      }),
    );

    fixture.destroy();
    await render('guest');
    expect(fixture.nativeElement.querySelector('.lobby-game')).toBeNull();
    expect(text()).not.toContain('Freie Plätze');
  });

  it('shows guests the chosen settings', async () => {
    await render('guest');
    expect(text()).toContain('200 Punkte');

    fixture.destroy();
    const off = { stacking: false, sevenZero: true, drawUntilPlayable: false };
    await render('guest', lobbyDetail({ game_key: 'uno', game_settings: off }));
    expect(fixture.nativeElement.querySelectorAll('.lobby-chip').length).toBe(1);
    expect(text()).toContain('7 tauscht, 0 dreht');
  });

  it('shows evening wins only once someone has won', async () => {
    await render('guest');
    expect(fixture.nativeElement.querySelector('.lobby-wins')).toBeNull();

    fixture.destroy();
    await render('guest', lobbyDetail({ wins: { guest: 2 } }));
    const wins = [...fixture.nativeElement.querySelectorAll('.lobby-wins')] as HTMLElement[];
    expect(wins.map((chip) => chip.getAttribute('aria-label'))).toEqual(['2 Siege', '0 Siege']);
    expect(wins[0].classList).toContain('lobby-wins--leader');
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

  it('lets a host start Blackjack alone, but not with 6 players', async () => {
    await render(
      'host',
      lobbyDetail({ members: [member('host', true)], game_key: 'blackjack', game_settings: {} }),
    );
    expect(component.canStart()).toBe(true);
    expect(text()).toContain('1.000 Startgeld');

    fixture.destroy();
    const six = ['host', 'a', 'b', 'c', 'd', 'e'].map((id) => member(id, true));
    await render('host', lobbyDetail({ members: six, game_key: 'blackjack', game_settings: {} }));
    expect(component.canStart()).toBe(false);
    expect(text()).toContain('Blackjack geht mit höchstens 5 Spielern.');
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
