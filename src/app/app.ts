import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { filter, map } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationsService } from './services/notifications.service';
import { HeaderChatService } from './services/header-chat.service';
import { NotificationPopupsService } from './services/notification-popups.service';
import { AppErrorService } from './services/app-error.service';
import { ToastHost } from './toast-host';
import { ThemeService } from './services/theme.service';
import { SessionService } from './services/session.service';
import { PushService } from './services/push.service';
import { PwaService } from './services/pwa.service';
import { FeedbackService } from './services/feedback.service';
import { tabOf } from './nav-tabs';
import {
  ChristmasBackdrop,
  ChristmasLights,
  ChristmasSnowbank,
} from './ui/christmas/christmas-decor';
import {
  HalloweenBackdrop,
  HalloweenLights,
  HalloweenPumpkins,
} from './ui/halloween/halloween-decor';

@Component({
  selector: 'app-root',
  imports: [
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastHost,
    ChristmasBackdrop,
    ChristmasLights,
    ChristmasSnowbank,
    HalloweenBackdrop,
    HalloweenLights,
    HalloweenPumpkins,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notifications = inject(NotificationsService);
  readonly headerChat = inject(HeaderChatService);
  readonly session = inject(SessionService);
  readonly pwa = inject(PwaService);
  private readonly themes = inject(ThemeService);
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

  /** Aktiver Tab für die gleitende Pille (Unterseiten zählen zu ihrem Tab); -1 = keiner. */
  readonly tabIndex = computed(() => tabOf(this.url()));

  /** Kopf wird zu Glas, sobald der Inhalt darunter scrollt. */
  readonly scrolled = signal(false);

  /** Weihnachtsdeko vorerst nur für Admins, die sie in den Einstellungen eingeschaltet haben. */
  // Saisonale Deko aus den Einstellungen; Kürbisse stehen auf der Tab-Leiste
  readonly decor = this.themes.decor;
  readonly navPumpkins = [{ left: '7%' }, { left: '52%', small: true }, { right: '6%' }];

  constructor() {
    // Pop-ups für Benachrichtigungen und Fehler app-weit aktivieren
    inject(NotificationPopupsService);
    inject(AppErrorService);
    // Gerät für Push-Nachrichten dem angemeldeten Konto zuordnen
    inject(PushService);
    // Töne fürs Spiel mit dem ersten Tippen freischalten (Safari)
    inject(FeedbackService);

    const onScroll = () => this.scrolled.set(window.scrollY > 4);
    addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => removeEventListener('scroll', onScroll));
  }
}
