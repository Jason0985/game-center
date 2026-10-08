import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { THEME_OPTIONS, ThemeService } from '../../services/theme.service';
import { RoleManagement } from './role-management/role-management';
import { PushService } from '../../services/push.service';
import { AppErrorService } from '../../services/app-error.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  imports: [MatIconModule, RouterLink, RoleManagement],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly session = inject(SessionService);
  readonly themes = inject(ThemeService);
  readonly themeOptions = THEME_OPTIONS;
  readonly push = inject(PushService);
  private readonly appErrors = inject(AppErrorService);
  private readonly toasts = inject(ToastService);

  readonly pushHint = computed(() => {
    if (!this.session.isLoggedIn()) return 'Nur mit Konto';
    switch (this.push.state()) {
      case 'on':
        return 'Aktiv auf diesem Gerät';
      case 'blocked':
        return 'Im Browser blockiert – erlaube Benachrichtigungen für diese Seite';
      case 'unsupported':
        return this.push.isIos
          ? 'Auf dem iPhone erst über Teilen → „Zum Home-Bildschirm“ installieren'
          : 'Wird von diesem Browser nicht unterstützt';
      default:
        return 'Auch bei geschlossener App benachrichtigt werden';
    }
  });

  async togglePush(): Promise<void> {
    const turnOn = this.push.state() !== 'on';
    const result = turnOn ? await this.push.enable() : await this.push.disable();
    if (!result.ok) {
      this.appErrors.report(result.message, { title: 'Push-Nachrichten' });
    } else if (turnOn && this.push.state() === 'on') {
      this.toasts.success('Push-Nachrichten aktiviert');
    }
  }
}
