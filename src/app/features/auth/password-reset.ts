import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { AuthService, RecoveryLinkError } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { describeAuthError } from '../../services/supabase-errors';

// Ziel des Links aus der Mail „Passwort zurücksetzen“: Supabase meldet über den Link an,
// hier wird das neue Passwort gesetzt
@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule, RouterLink, MatFormField, MatLabel, MatError, MatInput, MatIcon],
  templateUrl: './password-reset.html',
  styleUrl: './auth.scss',
})
export class PasswordReset {
  readonly session = inject(SessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly checking = signal(true);
  readonly linkError = signal<RecoveryLinkError | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  // Nur für das Konto aus dem Link der Mail (nicht für Gäste oder eine sonst offene Sitzung)
  readonly canSetPassword = computed(
    () => !this.checking() && this.session.initialized() && this.session.isRecovering(),
  );

  readonly form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    passwordConfirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    void this.checkLink();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, passwordConfirmation } = this.form.getRawValue();
    if (password !== passwordConfirmation) {
      this.errorMessage.set('Die Passwörter stimmen nicht überein.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const { error } = await this.authService.updatePassword(password);
    this.loading.set(false);

    if (error) {
      this.errorMessage.set(describeAuthError(error));
      return;
    }

    this.session.finishRecovery();
    this.toast.success('Passwort geändert');
    await this.router.navigateByUrl('/profile');
  }

  reload(): void {
    location.reload();
  }

  private async checkLink(): Promise<void> {
    const linkError = await this.authService.recoveryLinkError();
    this.linkError.set(linkError);
    // #error=… aus der Adresszeile entfernen; bei Netzfehlern bleibt der Hash fürs Neuladen
    if (linkError?.linkInvalid) {
      void this.router.navigate([], { replaceUrl: true });
    }
    this.checking.set(false);
  }
}
