import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NotificationsService } from './services/notifications.service';
import { NotificationPopupsService } from './services/notification-popups.service';
import { AppErrorService } from './services/app-error.service';
import { ToastHost } from './toast-host';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notifications = inject(NotificationsService);

  constructor() {
    // Pop-ups für Benachrichtigungen und Fehler app-weit aktivieren
    inject(NotificationPopupsService);
    inject(AppErrorService);
    // Gespeichertes Farbschema anwenden
    inject(ThemeService);
  }
}