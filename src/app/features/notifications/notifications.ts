import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { AppErrorService } from '../../services/app-error.service';
import { ConfirmationDialog, ConfirmationDialogData } from '../../confirmation-dialog';
import { firstValueFrom } from 'rxjs';
import { NotificationItem } from './notification.model';
import { notificationTypeConfig } from './notification-types';
import { SystemNotificationDialog } from './system-notification-dialog';
import { MultiplayerLobbyService } from '../multiplayer/multiplayer-lobby.service';

const MARK_SEEN_DELAY_MS = 2000;

@Component({
  selector: 'app-notifications',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  private readonly notificationsService = inject(NotificationsService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly appErrors = inject(AppErrorService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);
  readonly typeConfig = notificationTypeConfig;
  readonly notifications = this.notificationsService.notifications;
  readonly loading = this.notificationsService.loading;
  readonly swipeOffsets = signal<Record<string, number>>({});
  readonly swipeDirections = signal<Record<string, 'left' | 'right'>>({});
  readonly respondingIds = signal<Set<string>>(new Set());
  private activeSwipeId: string | null = null;
  private touchStartX: number | null = null;
  private readonly swipeThreshold = 84;
  private markSeenTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Neue Benachrichtigungen auf dieser Seite nach kurzer Zeit als gelesen markieren
    effect(() => {
      if (this.loading() || !this.notificationsService.unreadCount()) return;

      clearTimeout(this.markSeenTimer);
      this.markSeenTimer = setTimeout(
        () => void this.notificationsService.markRead(),
        MARK_SEEN_DELAY_MS,
      );
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.markSeenTimer));
  }

  async removeNotification(notificationId: string): Promise<void> {
    this.clearSwipeState(notificationId);
    const result = await this.notificationsService.dismiss(notificationId);
    if (!result.ok) {
      this.appErrors.report(result.message);
    }
  }

  async respondToFriendRequest(notification: NotificationItem, accept: boolean): Promise<void> {
    if (this.respondingIds().has(notification.id)) return;
    if (!accept && !(await this.confirmDecline(notification))) return;

    const result = await this.whileResponding(notification.id, () =>
      this.notificationsService.respondToFriendRequest(notification, accept),
    );

    if (!result.ok) {
      this.appErrors.report(result.message);
    } else if (accept) {
      this.toastService.success('Anfrage angenommen', `${notification.sender_name} ist jetzt dein Freund.`);
    } else {
      this.toastService.success('Anfrage abgelehnt');
    }
  }

  private confirmDecline(notification: NotificationItem): Promise<boolean | undefined> {
    return firstValueFrom(
      this.dialog
        .open<ConfirmationDialog, ConfirmationDialogData, boolean>(ConfirmationDialog, {
          data: {
            title: 'Anfrage ablehnen?',
            message: `${notification.sender_name} erfährt davon nichts und kann dir später erneut eine Anfrage schicken.`,
            confirmLabel: 'Ablehnen',
            icon: 'person_off',
          },
        })
        .afterClosed(),
    );
  }

  // Annehmen tritt der Lobby bei (ohne Code), Ablehnen entfernt nur die Einladung
  async respondToGameInvite(notification: NotificationItem, accept: boolean): Promise<void> {
    if (this.respondingIds().has(notification.id)) return;
    if (!accept) {
      await this.removeNotification(notification.id);
      return;
    }

    const result = await this.whileResponding(notification.id, () =>
      this.lobbyService.acceptInvite(notification.id),
    );

    // Auch nach Fehlern neu laden: Realtime meldet gelöschte Einladungen nicht,
    // eine veraltete Einladung bliebe sonst stehen
    void this.notificationsService.reload();
    if (!result.ok) {
      this.appErrors.report(result.message);
    } else if (result.value) {
      void this.router.navigate(['/multiplayer', result.value]);
    } else {
      this.toastService.show({ tone: 'info', icon: 'info', title: 'Die Lobby gibt es nicht mehr.' });
    }
  }

  // Buttons der Anfrage/Einladung sperren, solange die Antwort läuft
  private async whileResponding<T>(notificationId: string, action: () => Promise<T>): Promise<T> {
    this.respondingIds.update((ids) => new Set(ids).add(notificationId));
    try {
      return await action();
    } finally {
      this.respondingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(notificationId);
        return next;
      });
    }
  }

  openSystemNotificationDialog(): void {
    this.dialog
      .open<SystemNotificationDialog, void, number>(SystemNotificationDialog, { width: '400px' })
      .afterClosed()
      .subscribe((recipients) => {
        if (recipients !== undefined) {
          this.toastService.success('Gesendet', `Systembenachrichtigung an ${recipients} Nutzer.`);
          void this.notificationsService.reload();
        }
      });
  }

  // Anfragen müssen beantwortet werden und lassen sich nicht wegwischen.
  // Wichtig: Touch-Handler dürfen nie false zurückgeben, sonst ruft Angular
  // preventDefault() auf und Buttons in der Karte bekommen auf Touch-Geräten keinen Klick.
  isSwipeable(notification: NotificationItem): boolean {
    return this.typeConfig(notification.type).actions !== 'friend-request';
  }

  startSwipe(event: TouchEvent, notification: NotificationItem): void {
    if (!this.isSwipeable(notification)) return;

    const notificationId = notification.id;
    this.activeSwipeId = notificationId;
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
    this.swipeDirections.update((directions) => {
      const nextDirections = { ...directions };
      delete nextDirections[notificationId];
      return nextDirections;
    });
  }

  moveSwipe(event: TouchEvent, notification: NotificationItem): void {
    const notificationId = notification.id;
    if (this.touchStartX === null || this.activeSwipeId !== notificationId) {
      return;
    }

    const currentX = event.touches[0]?.clientX ?? this.touchStartX;
    const offset = currentX - this.touchStartX;
    const limitedOffset = Math.sign(offset) * Math.min(Math.abs(offset), 180);
    this.swipeOffsets.update((offsets) => ({ ...offsets, [notificationId]: limitedOffset }));
  }

  finishSwipe(event: TouchEvent, notification: NotificationItem): void {
    const notificationId = notification.id;
    if (this.touchStartX === null || this.activeSwipeId !== notificationId) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? this.touchStartX;
    const offset = touchEndX - this.touchStartX;
    if (Math.abs(offset) >= this.swipeThreshold) {
      const direction = offset < 0 ? 'left' : 'right';
      this.swipeDirections.update((directions) => ({ ...directions, [notificationId]: direction }));
      this.swipeOffsets.update((offsets) => ({
        ...offsets,
        [notificationId]: direction === 'left' ? -window.innerWidth : window.innerWidth,
      }));
      window.setTimeout(() => void this.removeNotification(notificationId), 220);
    } else {
      this.resetSwipeOffset(notificationId);
    }

    this.touchStartX = null;
    this.activeSwipeId = null;
  }

  getSwipeOffset(notificationId: string): number {
    return this.swipeOffsets()[notificationId] ?? 0;
  }

  isSwipeReady(notificationId: string): boolean {
    return Math.abs(this.getSwipeOffset(notificationId)) >= this.swipeThreshold;
  }

  isSwipeRemoving(notificationId: string): boolean {
    return this.swipeDirections()[notificationId] !== undefined;
  }

  private resetSwipeOffset(notificationId: string): void {
    this.swipeOffsets.update((offsets) => ({ ...offsets, [notificationId]: 0 }));
    this.activeSwipeId = null;
  }

  private clearSwipeState(notificationId: string): void {
    this.swipeOffsets.update((offsets) => {
      const nextOffsets = { ...offsets };
      delete nextOffsets[notificationId];
      return nextOffsets;
    });
    this.swipeDirections.update((directions) => {
      const nextDirections = { ...directions };
      delete nextDirections[notificationId];
      return nextDirections;
    });
  }

  formatTime(createdAt: string): string {
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() - Date.parse(createdAt)) / 60000));

    if (elapsedMinutes < 60) {
      return `vor ${elapsedMinutes} Min.`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `vor ${elapsedHours} Std.`;
    }

    return `vor ${Math.floor(elapsedHours / 24)} Tagen`;
  }
}
