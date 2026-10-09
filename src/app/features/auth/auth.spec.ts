import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { AppErrorService } from '../../services/app-error.service';

import { Auth, RESET_SENT_MESSAGE as NEUTRAL_MESSAGE } from './auth';
import { PASSWORD_RESET_ENABLED } from './auth-features';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    nameAllowed: ReturnType<typeof vi.fn>;
    requestPasswordReset: ReturnType<typeof vi.fn>;
  };
  let appErrors: { report: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = {
      login: vi.fn().mockResolvedValue({ error: null }),
      register: vi.fn(),
      nameAllowed: vi.fn().mockResolvedValue(true),
      requestPasswordReset: vi.fn().mockResolvedValue({ error: null }),
    };
    appErrors = { report: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([{ path: 'profile/auth', component: Auth }]),
        { provide: AuthService, useValue: authService },
        { provide: AppErrorService, useValue: appErrors },
        { provide: PASSWORD_RESET_ENABLED, useValue: true },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function text(): string {
    fixture.detectChanges();
    return fixture.nativeElement.textContent as string;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('switches to "forgot" and takes over the email from the login form', async () => {
    component.loginForm.controls.email.setValue('alex@example.de');

    const link = [...fixture.nativeElement.querySelectorAll('button.auth-link')].find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Passwort vergessen?'),
    ) as HTMLButtonElement;
    link.click();
    await fixture.whenStable();

    expect(component.mode()).toBe('forgot');
    expect(component.resetForm.controls.email.value).toBe('alex@example.de');
    expect(text()).toContain('Link senden');
    expect(fixture.nativeElement.querySelector('.ui-segmented')).toBeNull();
  });

  it('starts in "forgot" with ?mode=forgot', async () => {
    const harness = await RouterTestingHarness.create();
    const auth = await harness.navigateByUrl('/profile/auth?mode=forgot', Auth);

    expect(auth.mode()).toBe('forgot');
    expect(harness.routeNativeElement?.textContent).toContain('Passwort vergessen');
  });

  it('shows a neutral message after requesting the link and hides the form', async () => {
    component.forgotPassword();
    component.resetForm.controls.email.setValue('alex@example.de');

    await component.submitReset();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('alex@example.de');
    expect(component.successMessage()).toBe(NEUTRAL_MESSAGE);
    expect(text()).toContain(NEUTRAL_MESSAGE);
    expect(text()).not.toContain('Link senden');
  });

  it('shows the same neutral message when the mail rate limit hits', async () => {
    authService.requestPasswordReset.mockResolvedValue({
      error: { code: 'over_email_send_rate_limit', status: 429, message: 'rate limit' },
    });
    component.forgotPassword();
    component.resetForm.controls.email.setValue('alex@example.de');

    await component.submitReset();

    expect(component.successMessage()).toBe(NEUTRAL_MESSAGE);
    expect(component.errorMessage()).toBe('');
  });

  it('reports the IP rate limit, which does not reveal an account', async () => {
    authService.requestPasswordReset.mockResolvedValue({
      error: { code: 'over_request_rate_limit', status: 429, message: 'rate limit' },
    });
    component.forgotPassword();
    component.resetForm.controls.email.setValue('alex@example.de');

    await component.submitReset();

    expect(component.errorMessage()).toBe('Zu viele Versuche. Bitte warte einen Moment.');
    expect(component.resetSent()).toBe(false);
  });

  it('shows network errors when requesting the link', async () => {
    authService.requestPasswordReset.mockResolvedValue({
      error: { message: 'Failed to fetch', status: 0 },
    });
    component.forgotPassword();
    component.resetForm.controls.email.setValue('alex@example.de');

    await component.submitReset();

    expect(component.errorMessage()).toBe(
      'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.',
    );
    expect(component.resetSent()).toBe(false);
  });

  it('does not request a link for an invalid email', async () => {
    component.forgotPassword();
    component.resetForm.controls.email.setValue('kein-mail');

    await component.submitReset();

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows wrong credentials in German', async () => {
    authService.login.mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    component.loginForm.setValue({ email: 'alex@example.de', password: 'falsch' });

    await component.submitLogin();

    expect(text()).toContain('E-Mail oder Passwort ist falsch.');
    expect(TestBed.inject(Router).url).not.toBe('/profile');
  });

  it('reports a guest seat that could not be freed after the login', async () => {
    authService.login.mockResolvedValue({ error: null, guestCleanupFailed: true });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'alex@example.de', password: 'geheim123' });

    await component.submitLogin();

    expect(appErrors.report).toHaveBeenCalledWith(
      'Dein Gastplatz in der Lobby konnte nicht freigegeben werden. Der Host kann ihn entfernen.',
      { title: 'Anmeldung' },
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  });

  it('keeps the success message after a registration without session', async () => {
    authService.register.mockResolvedValue({
      error: null,
      data: { session: null, user: { id: 'new' } },
      guestCleanupFailed: false,
    });
    component.setMode('register');
    component.registerForm.setValue({
      email: 'alex@example.de',
      username: 'alex',
      displayName: 'Alex',
      password: 'geheim123',
      passwordConfirmation: 'geheim123',
    });

    await component.submitRegistration();

    expect(component.mode()).toBe('login');
    expect(text()).toContain('Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.');
    expect(appErrors.report).not.toHaveBeenCalled();
  });

  it('blocks an inappropriate display name before registering', async () => {
    authService.nameAllowed.mockImplementation(async (name: string) => name !== 'Fiesling');
    component.setMode('register');
    component.registerForm.setValue({
      email: 'alex@example.de',
      username: 'alex',
      displayName: 'Fiesling',
      password: 'geheim123',
      passwordConfirmation: 'geheim123',
    });

    await component.submitRegistration();

    expect(authService.register).not.toHaveBeenCalled();
    expect(text()).toContain('Dieser Anzeigename ist nicht erlaubt.');
  });
});

describe('Auth without password reset', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([{ path: 'profile/auth', component: Auth }]),
        { provide: AuthService, useValue: {} },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('greys out "Passwort vergessen?" and stays on login', async () => {
    const fixture = TestBed.createComponent(Auth);
    await fixture.whenStable();

    const link = [...fixture.nativeElement.querySelectorAll('button.auth-link')].find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Passwort vergessen?'),
    ) as HTMLButtonElement;

    expect(link.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('bald verfügbar');
    fixture.componentInstance.forgotPassword();
    expect(fixture.componentInstance.mode()).toBe('login');
  });

  it('ignores ?mode=forgot', async () => {
    const harness = await RouterTestingHarness.create();
    const auth = await harness.navigateByUrl('/profile/auth?mode=forgot', Auth);

    expect(auth.mode()).toBe('login');
  });
});
