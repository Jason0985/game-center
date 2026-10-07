import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { PasswordReset } from './password-reset';

describe('PasswordReset', () => {
  let component: PasswordReset;
  let fixture: ComponentFixture<PasswordReset>;
  let router: Router;
  let authService: {
    recoveryLinkError: ReturnType<typeof vi.fn>;
    updatePassword: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn> };
  // Konto kam über den Link aus der Mail
  let recovering: ReturnType<typeof signal<boolean>>;
  let finishRecovery: ReturnType<typeof vi.fn>;
  let authUser: ReturnType<
    typeof signal<{ id: string; email: string; is_anonymous?: boolean } | null>
  >;

  async function render(): Promise<string> {
    fixture = TestBed.createComponent(PasswordReset);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  function fill(password: string, passwordConfirmation = password): void {
    component.form.setValue({ password, passwordConfirmation });
  }

  beforeEach(async () => {
    authService = {
      recoveryLinkError: vi.fn().mockResolvedValue(null),
      updatePassword: vi.fn().mockResolvedValue({ error: null }),
    };
    toast = { success: vi.fn() };
    authUser = signal<{ id: string; email: string; is_anonymous?: boolean } | null>({
      id: 'user-1',
      email: 'alex@example.de',
    });
    const user = computed(() => (authUser()?.is_anonymous ? null : authUser()));
    recovering = signal(true);
    finishRecovery = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PasswordReset],
      providers: [
        provideRouter([{ path: 'profile/password', component: PasswordReset }]),
        {
          provide: SessionService,
          useValue: {
            initialized: signal(true),
            user,
            isLoggedIn: computed(() => user() !== null),
            isRecovering: computed(() => recovering() && user() !== null),
            finishRecovery,
          },
        },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  const EXPIRED = {
    message: 'Der Link ist abgelaufen oder wurde schon benutzt.',
    linkInvalid: true,
  };
  const OFFLINE = {
    message: 'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.',
    linkInvalid: false,
  };

  it('shows the link error, a button for a new link and clears the hash', async () => {
    authService.recoveryLinkError.mockResolvedValue(EXPIRED);

    const text = await render();

    expect(text).toContain('Der Link ist abgelaufen oder wurde schon benutzt.');
    expect(text).toContain('Neuen Link anfordern');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([], { replaceUrl: true });
    const link = fixture.nativeElement.querySelector('a.ui-btn') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/profile/auth?mode=forgot');
  });

  it('offers a reload instead of a new link when checking the link failed', async () => {
    authService.recoveryLinkError.mockResolvedValue(OFFLINE);

    const text = await render();

    expect(text).toContain(OFFLINE.message);
    expect(text).toContain('Neu laden');
    expect(text).not.toContain('Neuen Link anfordern');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('removes the error hash from the address (real router)', async () => {
    vi.mocked(router.navigate).mockRestore();
    vi.mocked(router.navigateByUrl).mockRestore();
    authService.recoveryLinkError.mockResolvedValue(EXPIRED);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl(
      '/profile/password#error=access_denied&error_code=otp_expired',
      PasswordReset,
    );
    await harness.fixture.whenStable();

    expect(router.url).toBe('/profile/password');
  });

  it('keeps the hash for a reload when checking the link failed (real router)', async () => {
    vi.mocked(router.navigate).mockRestore();
    vi.mocked(router.navigateByUrl).mockRestore();
    authService.recoveryLinkError.mockResolvedValue(OFFLINE);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/profile/password#access_token=abc&type=recovery', PasswordReset);
    await harness.fixture.whenStable();

    expect(router.url).toBe('/profile/password#access_token=abc&type=recovery');
  });

  it('shows the form for the account from the link', async () => {
    const text = await render();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(text).toContain('für alex@example.de');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows no form for a signed-in account without the link from the mail', async () => {
    recovering.set(false);

    const text = await render();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(text).toContain('Öffne den Link aus der E-Mail erneut');
  });

  it('shows a hint instead of the form for guests', async () => {
    authUser.set({ id: 'guest', email: '', is_anonymous: true });

    const text = await render();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(text).toContain('Öffne den Link aus der E-Mail erneut');
    expect(text).toContain('Neuen Link anfordern');
  });

  it('shows a hint instead of the form without a session', async () => {
    authUser.set(null);

    const text = await render();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(text).toContain('Öffne den Link aus der E-Mail erneut');
  });

  it('needs matching passwords', async () => {
    await render();
    fill('neuesPasswort', 'anderesPasswort');

    await component.submit();

    expect(component.errorMessage()).toBe('Die Passwörter stimmen nicht überein.');
    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('needs at least 8 characters', async () => {
    await render();
    fill('kurz');

    await component.submit();

    expect(authService.updatePassword).not.toHaveBeenCalled();
  });

  it('saves the password, shows a toast and opens the profile', async () => {
    await render();
    fill('neuesPasswort');

    await component.submit();

    expect(authService.updatePassword).toHaveBeenCalledWith('neuesPasswort');
    expect(finishRecovery).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Passwort geändert');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  });

  it('describes "same_password" in German', async () => {
    await render();
    authService.updatePassword.mockResolvedValue({
      error: { code: 'same_password', message: 'New password should be different' },
    });
    fill('altesPasswort');

    await component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Das neue Passwort muss sich vom alten unterscheiden.',
    );
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
