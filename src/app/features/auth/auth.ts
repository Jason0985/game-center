import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { AppErrorService } from '../../services/app-error.service';
import { describeAuthError } from '../../services/supabase-errors';
import { PASSWORD_RESET_ENABLED } from './auth-features';

type AuthMode = 'login' | 'register' | 'forgot';

export const RESET_SENT_MESSAGE =
  'Falls es ein Konto mit dieser Adresse gibt, ist jetzt eine E-Mail mit einem Link zum Zurücksetzen unterwegs. ' +
  'Der Link gilt eine Stunde. Keine Mail? Prüfe den Spam-Ordner oder versuche es in ein paar Minuten erneut.';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, MatFormField, MatLabel, MatError, MatInput, MatIcon],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  readonly passwordResetEnabled = inject(PASSWORD_RESET_ENABLED);
  // Direkt zum Formular „Passwort vergessen“ über /profile/auth?mode=forgot
  // Signals, weil die Meldungen erst nach einem await gesetzt werden (zoneless)
  readonly mode = signal<AuthMode>(
    this.passwordResetEnabled &&
      inject(ActivatedRoute).snapshot.queryParamMap.get('mode') === 'forgot'
      ? 'forgot'
      : 'login',
  );
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  // Nach dem Absenden nur noch die neutrale Meldung zeigen
  readonly resetSent = signal(false);

  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  registerForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    }),
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    passwordConfirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  resetForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly appErrors: AppErrorService,
  ) {}

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.resetSent.set(false);
  }

  forgotPassword(): void {
    if (!this.passwordResetEnabled) return;
    this.setMode('forgot');
    this.resetForm.controls.email.setValue(this.loginForm.controls.email.value);
  }

  async submitReset(): Promise<void> {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { error } = await this.authService.requestPasswordReset(
      this.resetForm.controls.email.value,
    );

    this.loading.set(false);

    // Mail-Limit (kommt nur für vorhandene Adressen) wie Erfolg anzeigen, sonst verrät es das Konto;
    // das IP-Limit (over_request_rate_limit) verrät nichts und wird normal gemeldet
    if (!error || error.code === 'over_email_send_rate_limit') {
      this.successMessage.set(RESET_SENT_MESSAGE);
      this.resetSent.set(true);
      return;
    }

    this.errorMessage.set(describeAuthError(error));
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.getRawValue();
    const { error, guestCleanupFailed } = await this.authService.login(email, password);

    this.loading.set(false);

    if (error) {
      this.errorMessage.set(describeAuthError(error));
      return;
    }

    this.reportGuestCleanup(guestCleanupFailed);
    await this.router.navigateByUrl('/profile');
  }

  async submitRegistration(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const values = this.registerForm.getRawValue();

    if (values.password !== values.passwordConfirmation) {
      this.errorMessage.set('Die Passwörter stimmen nicht überein.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const [usernameOk, displayNameOk] = await Promise.all([
      this.authService.nameAllowed(values.username),
      this.authService.nameAllowed(values.displayName),
    ]);
    if (!usernameOk || !displayNameOk) {
      this.loading.set(false);
      this.errorMessage.set(
        `Dieser ${usernameOk ? 'Anzeigename' : 'Benutzername'} ist nicht erlaubt. Bitte wähle einen anderen.`,
      );
      return;
    }

    const { error, data, guestCleanupFailed } = await this.authService.register(
      values.email,
      values.password,
      values.username,
      values.displayName,
    );

    this.loading.set(false);

    if (error) {
      this.errorMessage.set(describeAuthError(error));
      return;
    }

    if (!data.session) {
      this.setMode('login');
      this.successMessage.set('Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.');
      return;
    }

    this.reportGuestCleanup(guestCleanupFailed);
    await this.router.navigateByUrl('/profile');
  }

  // Der alte Gast konnte nicht gelöscht werden und belegt noch seinen Lobby-Platz
  private reportGuestCleanup(failed: boolean): void {
    if (failed) {
      this.appErrors.report(
        'Dein Gastplatz in der Lobby konnte nicht freigegeben werden. Der Host kann ihn entfernen.',
        { title: 'Anmeldung' },
      );
    }
  }
}
