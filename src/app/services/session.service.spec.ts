import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { OPENED_FROM_RECOVERY_LINK, supabase } from '../supabase.client';
import { ProfileService } from './profile.service';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let callback: (event: AuthChangeEvent, session: Session | null) => void;
  let router: Router;
  let getProfile: ReturnType<typeof vi.fn>;
  let getSession: ReturnType<typeof vi.spyOn>;

  function setup(openedFromRecoveryLink = true): SessionService {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: { getProfile } },
        { provide: OPENED_FROM_RECOVERY_LINK, useValue: openedFromRecoveryLink },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return TestBed.inject(SessionService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    getProfile = vi.fn().mockResolvedValue(null);
    getSession = vi.spyOn(supabase.auth, 'getSession');
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation(((cb: typeof callback) => {
      callback = cb;
      return { data: { subscription: { unsubscribe: () => {} } } };
    }) as never);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const session = { user: { id: 'user-1', is_anonymous: false } } as unknown as Session;
  const otherSession = { user: { id: 'user-2', is_anonymous: false } } as unknown as Session;

  it('loads the profile once at startup and is initialized after INITIAL_SESSION', async () => {
    const service = setup();
    expect(service.initialized()).toBe(false);

    callback('INITIAL_SESSION', session);
    await vi.waitFor(() => expect(service.initialized()).toBe(true));

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('opens the password form after the link from the reset mail', () => {
    const service = setup();

    callback('PASSWORD_RECOVERY', session);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile/password');
    expect(service.isRecovering()).toBe(true);
  });

  it('ignores the recovery event in other tabs', () => {
    const service = setup(false);

    callback('PASSWORD_RECOVERY', session);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(service.isRecovering()).toBe(false);
  });

  it('does not navigate on a normal sign-in', () => {
    const service = setup();

    callback('SIGNED_IN', session);

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(service.isRecovering()).toBe(false);
  });

  it('keeps the recovery across a reload of the tab', () => {
    setup();
    callback('PASSWORD_RECOVERY', session);

    TestBed.resetTestingModule();
    const reloaded = setup(false);
    callback('INITIAL_SESSION', session);

    expect(reloaded.isRecovering()).toBe(true);
  });

  it('ends the recovery for another account, after signing out and when finished', () => {
    const service = setup();
    callback('PASSWORD_RECOVERY', session);

    callback('SIGNED_IN', otherSession);
    expect(service.isRecovering()).toBe(false);

    callback('SIGNED_IN', session);
    expect(service.isRecovering()).toBe(true);

    service.finishRecovery();
    expect(service.isRecovering()).toBe(false);

    callback('PASSWORD_RECOVERY', session);
    callback('SIGNED_OUT', null);
    callback('SIGNED_IN', session);
    expect(service.isRecovering()).toBe(false);
  });
});
