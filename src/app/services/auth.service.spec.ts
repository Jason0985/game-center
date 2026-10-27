import { TestBed } from '@angular/core/testing';
import { AuthImplicitGrantRedirectError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { supabase } from '../supabase.client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let calls: string[];
  let rpcError: { message: string } | null;
  // Ergebnisse der nächsten rpc-Aufrufe der Reihe nach, danach rpcError
  let rpcErrors: ({ message: string } | null)[];
  let builder: {
    setHeader: ReturnType<typeof vi.fn>;
    then: (resolve: (value: unknown) => void) => void;
  };
  let rpc: ReturnType<typeof vi.spyOn>;
  let signOut: ReturnType<typeof vi.spyOn>;

  function withSession(session: { access_token: string; user: { is_anonymous: boolean } } | null) {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session },
      error: null,
    } as never);
  }

  const guestSession = { access_token: 'guest-token', user: { is_anonymous: true } };

  beforeEach(() => {
    calls = [];
    rpcError = null;
    rpcErrors = [];
    builder = {
      setHeader: vi.fn().mockReturnThis(),
      then: (resolve) => resolve({ error: rpcErrors.length ? rpcErrors.shift() : rpcError }),
    };
    rpc = vi.spyOn(supabase, 'rpc').mockImplementation(((name: string) => {
      calls.push(`rpc:${name}`);
      return builder;
    }) as never);
    signOut = vi.spyOn(supabase.auth, 'signOut').mockImplementation((async (options?: {
      scope?: string;
    }) => {
      calls.push(`signOut:${options?.scope}`);
      return { error: null };
    }) as never);
    withSession(null);

    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function mockSignIn(result: { error: unknown; data?: unknown }) {
    return vi.spyOn(supabase.auth, 'signInWithPassword').mockImplementation((async () => {
      calls.push('signIn');
      return { data: { session: {}, user: {} }, ...result };
    }) as never);
  }

  function mockSignUp(result: { error: unknown; data: unknown }) {
    return vi.spyOn(supabase.auth, 'signUp').mockImplementation((async () => {
      calls.push('signUp');
      return result;
    }) as never);
  }

  it('logs in without a guest session and deletes nothing', async () => {
    const signIn = mockSignIn({ error: null });

    await service.login('a@b.de', 'geheim123');

    expect(signIn).toHaveBeenCalledWith({ email: 'a@b.de', password: 'geheim123' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('deletes the guest with its own token after a successful login', async () => {
    withSession(guestSession);
    mockSignIn({ error: null });

    const result = await service.login('a@b.de', 'geheim123');

    expect(calls).toEqual(['signIn', 'rpc:end_guest_session']);
    expect(builder.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer guest-token');
    expect(signOut).not.toHaveBeenCalled();
    expect(result.guestCleanupFailed).toBe(false);
  });

  it('retries deleting the guest after a login and succeeds on the second try', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    withSession(guestSession);
    mockSignIn({ error: null });
    rpcErrors = [{ message: 'Failed to fetch' }];

    const pending = service.login('a@b.de', 'geheim123');
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(calls).toEqual(['signIn', 'rpc:end_guest_session', 'rpc:end_guest_session']);
    expect(result.guestCleanupFailed).toBe(false);
  });

  it('reports a failed guest cleanup after a login once all retries failed', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    withSession(guestSession);
    mockSignIn({ error: null });
    rpcError = { message: 'Failed to fetch' };

    const pending = service.login('a@b.de', 'geheim123');
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.error).toBeNull();
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(result.guestCleanupFailed).toBe(true);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('keeps the guest when the login fails', async () => {
    withSession(guestSession);
    const error = { code: 'invalid_credentials', message: 'Invalid login credentials' };
    mockSignIn({ error, data: { session: null, user: null } });

    const result = await service.login('a@b.de', 'falsch');

    expect(result.error).toBe(error);
    expect(rpc).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('deletes the guest and signs out locally after a registration without session', async () => {
    withSession(guestSession);
    mockSignUp({ error: null, data: { session: null, user: { id: 'new' } } });

    await service.register('a@b.de', 'geheim123', 'alex', 'Alex');

    expect(calls).toEqual(['signUp', 'rpc:end_guest_session', 'signOut:local']);
  });

  it('keeps the guest signed in when it cannot be deleted after a registration without session', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    withSession(guestSession);
    mockSignUp({ error: null, data: { session: null, user: { id: 'new' } } });
    rpcError = { message: 'Failed to fetch' };

    const pending = service.register('a@b.de', 'geheim123', 'alex', 'Alex');
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(signOut).not.toHaveBeenCalled();
    expect(result.guestCleanupFailed).toBe(false);
  });

  it('reports a failed guest cleanup after a registration with session', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    withSession(guestSession);
    mockSignUp({ error: null, data: { session: {}, user: { id: 'new' } } });
    rpcError = { message: 'Failed to fetch' };

    const pending = service.register('a@b.de', 'geheim123', 'alex', 'Alex');
    await vi.runAllTimersAsync();

    expect((await pending).guestCleanupFailed).toBe(true);
  });

  it('keeps the new session after a registration with session', async () => {
    withSession(guestSession);
    mockSignUp({ error: null, data: { session: {}, user: { id: 'new' } } });

    await service.register('a@b.de', 'geheim123', 'alex', 'Alex');

    expect(calls).toEqual(['signUp', 'rpc:end_guest_session']);
  });

  it('keeps the guest when the registration fails', async () => {
    withSession(guestSession);
    mockSignUp({ error: { message: 'Database error saving new user' }, data: { session: null } });

    await service.register('a@b.de', 'geheim123', 'vergeben', 'Alex');

    expect(rpc).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('keeps the guest session when deleting the guest fails', async () => {
    withSession(guestSession);
    rpcError = { message: 'Failed to fetch' };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await service.endGuestSession()).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs out locally after deleting the guest', async () => {
    withSession(guestSession);

    expect(await service.endGuestSession()).toBe(true);
    expect(calls).toEqual(['rpc:end_guest_session', 'signOut:local']);
  });

  it('has nothing to end without a guest session', async () => {
    withSession({ access_token: 'account-token', user: { is_anonymous: false } });

    expect(await service.endGuestSession()).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('requests the reset mail with a link to /profile/password', async () => {
    const reset = vi
      .spyOn(supabase.auth, 'resetPasswordForEmail')
      .mockResolvedValue({ data: {}, error: null } as never);

    const { error } = await service.requestPasswordReset('  a@b.de ');

    expect(error).toBeNull();
    expect(reset).toHaveBeenCalledWith('a@b.de', {
      redirectTo: new URL('profile/password', document.baseURI).href,
    });
  });

  it('signs out other sessions after a new password was set', async () => {
    const update = vi
      .spyOn(supabase.auth, 'updateUser')
      .mockResolvedValue({ data: { user: {} }, error: null } as never);

    const { error } = await service.updatePassword('neuesPasswort');

    expect(error).toBeNull();
    expect(update).toHaveBeenCalledWith({ password: 'neuesPasswort' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'others' });
  });

  it('does not sign out other sessions when the password update fails', async () => {
    const failure = { code: 'same_password', message: 'same' };
    vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
      data: { user: null },
      error: failure,
    } as never);

    const { error } = await service.updatePassword('altesPasswort');

    expect(error).toBe(failure);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('describes an expired link from the mail', async () => {
    vi.spyOn(supabase.auth, 'initialize').mockResolvedValue({
      error: new AuthImplicitGrantRedirectError('Email link is invalid or has expired', {
        error: 'access_denied',
        code: 'otp_expired',
      }),
    } as never);

    expect(await service.recoveryLinkError()).toEqual({
      message: 'Der Link ist abgelaufen oder wurde schon benutzt.',
      linkInvalid: true,
    });
  });

  it('does not treat a network error while checking the link as an invalid link', async () => {
    vi.spyOn(supabase.auth, 'initialize').mockResolvedValue({
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    } as never);

    expect(await service.recoveryLinkError()).toEqual({
      message: 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.',
      linkInvalid: false,
    });
  });

  it('reports no link error for a valid link', async () => {
    vi.spyOn(supabase.auth, 'initialize').mockResolvedValue({ error: null } as never);

    expect(await service.recoveryLinkError()).toBeNull();
  });
});
