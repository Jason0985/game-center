import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationsService } from './services/notifications.service';
import { NotificationPopupsService } from './services/notification-popups.service';
import { AppErrorService } from './services/app-error.service';
import { ToastHost } from './toast-host';
import { ThemeService } from './services/theme.service';
import { SessionService } from './services/session.service';
import { PushService } from './services/push.service';

@Component({
  selector: 'app-root',
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notifications = inject(NotificationsService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Das Zahnrad für die Einstellungen erscheint nur auf der Profilseite. */
  readonly onProfile = computed(() => this.url().split(/[?#]/)[0] === '/profile');

  constructor() {
    // Pop-ups für Benachrichtigungen und Fehler app-weit aktivieren
    inject(NotificationPopupsService);
    inject(AppErrorService);
    // Gespeichertes Farbschema anwenden
    inject(ThemeService);
    // Gerät für Push-Nachrichten dem angemeldeten Konto zuordnen
    inject(PushService);
  }
}
