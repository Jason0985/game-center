import { Injectable, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationItem } from '../features/notifications/notification.model';
import { notificationTypeConfig } from '../features/notifications/notification-types';
import {
  SystemAlertDialog,
  SystemAlertDialogData,
  SystemAlertDialogResult,
} from '../features/notifications/system-alert-dialog';
import { NotificationsService } from './notifications.service';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

const NOTIFICATIONS_ROUTE = '/notifications';
const LIVE_TOAST_KEY = 'incoming-notification';

// Regeln für Pop-ups:
// - App-Start/Login: ungelesene "Wichtig"-Systemnachrichten als Dialog (einmal),
//   ungelesene "Info"-Systemnachrichten als Toast
// - Live: jede neue Benachrichtigung als Toast, mehrere kurz hintereinander gebündelt
// - Nie auf der Benachrichtigungsseite (dort sieht man sie ohnehin)
@Injectable({ providedIn: 'root' })
export class NotificationPopupsService {
  private readonly notificationsService = inject(NotificationsService);
  private readonly session = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  private announcedUserId: string | null = null;
  private liveBurst = 0;

  constructor() {
    effect(() => {
      const userId = this.notificationsService.loadedFor();
      if (!userId || userId === this.announcedUserId) return;

      this.announcedUserId = userId;
      untracked(() => this.announceOnStart());
    });

    this.notificationsService.incoming
      .pipe(takeUntilDestroyed())
      .subscribe((item) => this.announceLive(item));
  }

  private announceOnStart(): void {
    if (this.onNotificationsPage()) return;

    const unread = this.notificationsService.notifications().filter((item) => !item.read_at);
    const alerts = unread.filter((item) => item.type === 'system_alert');
    const infos = unread.filter((item) => item.type === 'system_info');

    if (alerts.length) {
      this.dialog
        .open<SystemAlertDialog, SystemAlertDialogData, SystemAlertDialogResult>(
          SystemAlertDialog,
          { data: { alert: alerts[0], moreCount: alerts.length - 1 }, width: '360px' },
        )
        .afterClosed()
        .subscribe((result) => {
          void this.notificationsService.markRead(alerts.map((alert) => alert.id));
          if (result === 'all') {
            void this.router.navigateByUrl(NOTIFICATIONS_ROUTE);
          }
        });
    }

    if (infos.length) {
      const config = notificationTypeConfig('system_info');
      const single = infos.length === 1;
      this.toastService.show(
        {
          tone: config.tone,
          icon: config.icon,
          title: single ? infos[0].title : `${infos.length} neue Systeminfos`,
          message: single ? infos[0].message : 'Tippe, um sie anzusehen.',
          link: NOTIFICATIONS_ROUTE,
        },
        6000,
      );
    }
  }

  private announceLive(item: NotificationItem): void {
    if (this.onNotificationsPage()) return;
    // Eigene Aktionen (z. B. eigener Admin-Broadcast) nicht noch einmal melden
    if (item.sender_id && item.sender_id === this.session.user()?.id) return;

    this.liveBurst = this.toastService.isVisible(LIVE_TOAST_KEY) ? this.liveBurst + 1 : 1;
    const config = notificationTypeConfig(item.type);

    this.toastService.show(
      this.liveBurst === 1
        ? {
            key: LIVE_TOAST_KEY,
            tone: config.tone,
            icon: config.icon,
            title: item.title,
            message: item.message,
            link: NOTIFICATIONS_ROUTE,
          }
        : {
            key: LIVE_TOAST_KEY,
            tone: 'info',
            icon: 'notifications',
            title: `${this.liveBurst} neue Benachrichtigungen`,
            message: 'Tippe, um sie anzusehen.',
            link: NOTIFICATIONS_ROUTE,
          },
    );
  }

  private onNotificationsPage(): boolean {
    return this.router.url.startsWith(NOTIFICATIONS_ROUTE);
  }
}
