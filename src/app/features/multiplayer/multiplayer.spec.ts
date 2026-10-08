import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { AppErrorService } from '../../services/app-error.service';
import { Multiplayer } from './multiplayer';
import { MultiplayerLobbyService } from './multiplayer-lobby.service';
import { LobbySummary } from './lobby.model';

describe('Multiplayer', () => {
  let component: Multiplayer;
  let fixture: ComponentFixture<Multiplayer>;
  let router: Router;
  let appErrors: { report: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let lobbyService: {
    listOpenLobbies: ReturnType<typeof vi.fn>;
    findMyLobbyId: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
    createLobby: ReturnType<typeof vi.fn>;
    joinLobby: ReturnType<typeof vi.fn>;
    joinLobbyByCode: ReturnType<typeof vi.fn>;
  };
  let authService: {
    signInAsGuest: ReturnType<typeof vi.fn>;
    endGuestSession: ReturnType<typeof vi.fn>;
  };
  let authUser: ReturnType<typeof signal<{ id: string; is_anonymous?: boolean } | null>>;

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
      joinLobbyByCode: vi.fn(),
    };
    authService = {
      signInAsGuest: vi.fn().mockResolvedValue({ error: null }),
      endGuestSession: vi.fn().mockResolvedValue(true),
    };
    appErrors = { report: vi.fn() };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(true) })) };
    authUser = signal<{ id: string; is_anonymous?: boolean } | null>({ id: 'guest-user' });

    await TestBed.configureTestingModule({
      imports: [Multiplayer],
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: {
            initialized: signal(true),
            authUser,
            hasSession: computed(() => authUser() !== null),
            isGuest: computed(() => authUser()?.is_anonymous === true),
            isLoggedIn: computed(() => !!authUser() && !authUser()?.is_anonymous),
            displayName: signal('Alex'),
          },
        },
        { provide: AuthService, useValue: authService },
        { provide: MultiplayerLobbyService, useValue: lobbyService },
        { provide: AppErrorService, useValue: appErrors },
        { provide: MatDialog, useValue: dialog },
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

  it('joins with just the code', async () => {
    await render();
    lobbyService.joinLobbyByCode.mockResolvedValue({ ok: true, value: 'lobby-3' });

    component.directCode.set('ABC234');
    await component.joinByCode(new Event('submit'));

    expect(authService.signInAsGuest).not.toHaveBeenCalled();
    expect(lobbyService.joinLobbyByCode).toHaveBeenCalledWith('ABC234');
    expect(router.navigate).toHaveBeenCalledWith(['/multiplayer', 'lobby-3']);
  });

  it('signs in as guest with the chosen name before joining without an account', async () => {
    authUser.set(null);
    await render();
    lobbyService.joinLobbyByCode.mockResolvedValue({ ok: true, value: 'lobby-3' });

    component.directCode.set('ABC234');
    component.guestName.set('  Alex ');
    await component.joinByCode(new Event('submit'));

    expect(authService.signInAsGuest).toHaveBeenCalledWith('Alex');
    expect(lobbyService.joinLobbyByCode).toHaveBeenCalledWith('ABC234');
    expect(router.navigate).toHaveBeenCalledWith(['/multiplayer', 'lobby-3']);
  });

  it('needs a display name to join without an account', async () => {
    authUser.set(null);
    await render();

    component.directCode.set('ABC234');
    await component.joinByCode(new Event('submit'));

    expect(authService.signInAsGuest).not.toHaveBeenCalled();
    expect(lobbyService.joinLobbyByCode).not.toHaveBeenCalled();
  });

  it('does not join when the guest sign-in fails', async () => {
    authUser.set(null);
    await render();
    authService.signInAsGuest.mockResolvedValue({
      error: { message: 'Anonymous sign-ins are disabled' },
    });

    component.directCode.set('ABC234');
    component.guestName.set('Alex');
    await component.joinByCode(new Event('submit'));

    expect(lobbyService.joinLobbyByCode).not.toHaveBeenCalled();
    expect(component.errorMessage()).not.toBe('');
  });

  it('describes a disabled guest access in German', async () => {
    authUser.set(null);
    await render();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    authService.signInAsGuest.mockResolvedValue({
      error: { code: 'anonymous_provider_disabled', message: 'Anonymous sign-ins are disabled' },
    });

    component.directCode.set('ABC234');
    component.guestName.set('Alex');
    await component.joinByCode(new Event('submit'));

    expect(component.errorMessage()).toBe('Der Gastzugang ist gerade nicht verfügbar.');
  });

  it('ends the guest session without asking outside a lobby', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render();
    component.guestName.set('Alex');

    await component.endGuestSession();

    expect(dialog.open).not.toHaveBeenCalled();
    expect(authService.endGuestSession).toHaveBeenCalled();
    expect(component.guestName()).toBe('');
  });

  it('keeps the guest and shows an error when ending the session fails', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render();
    authService.endGuestSession.mockResolvedValue(false);
    component.guestName.set('Alex');

    await component.endGuestSession();

    expect(component.errorMessage()).toBe(
      'Die Gastsitzung konnte nicht beendet werden. Bitte versuche es erneut.',
    );
    expect(component.guestName()).toBe('Alex');
  });

  it('asks before ending the guest session inside a lobby', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render('lobby-1');

    await component.endGuestSession();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(authService.endGuestSession).toHaveBeenCalled();
  });

  it('keeps the guest session when the question is cancelled', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render('lobby-1');
    dialog.open.mockReturnValueOnce({ afterClosed: () => of(false) });

    await component.endGuestSession();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(authService.endGuestSession).not.toHaveBeenCalled();
  });

  it('hides creating and the lobby list for guests', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Lobby eröffnen');
    expect(text).not.toContain('Offene Lobbys');
    expect(text).toContain('Du spielst als Gast');
  });

  it('loads only the own lobby for guests, not the list of open lobbies', async () => {
    authUser.set({ id: 'guest-user', is_anonymous: true });
    await render('lobby-1');

    expect(lobbyService.findMyLobbyId).toHaveBeenCalledWith('guest-user');
    expect(lobbyService.listOpenLobbies).not.toHaveBeenCalled();
    expect(component.myLobbyId()).toBe('lobby-1');
  });
});
