import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { NotificationItem } from './notification.model';
import { notificationTypeConfig } from './notification-types';
import { SystemNotificationDialog } from './system-notification-dialog';

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
  readonly session = inject(SessionService);
  readonly typeConfig = notificationTypeConfig;
  readonly notifications = this.notificationsService.notifications;
  readonly loading = this.notificationsService.loading;
  readonly swipeOffsets = signal<Record<string, number>>({});
  readonly swipeDirections = signal<Record<string, 'left' | 'right'>>({});
  readonly respondingIds = signal<Set<string>>(new Set());
  readonly statusMessage = signal('');
  private activeSwipeId: string | null = null;
  private touchStartX: number | null = null;
  private readonly swipeThreshold = 84;
  private markSeenTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Neue Benachrichtigungen auf dieser Seite nach kurzer Zeit als gesehen markieren
    effect(() => {
      if (this.loading() || !this.notificationsService.unreadCount()) return;

      clearTimeout(this.markSeenTimer);
      this.markSeenTimer = setTimeout(
        () => this.notificationsService.markAllSeen(),
        MARK_SEEN_DELAY_MS,
      );
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.markSeenTimer));
  }

  removeNotification(notificationId: string): void {
    void this.notificationsService.dismiss(notificationId);
    this.clearSwipeState(notificationId);
  }

  async respondToFriendRequest(notification: NotificationItem, accept: boolean): Promise<void> {
    if (this.respondingIds().has(notification.id)) return;

    this.respondingIds.update((ids) => new Set(ids).add(notification.id));
    const done = await this.notificationsService.respondToFriendRequest(notification, accept);
    this.respondingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(notification.id);
      return next;
    });

    this.statusMessage.set(
      done
        ? accept
          ? `${notification.sender_name} ist jetzt dein Freund.`
          : 'Anfrage abgelehnt.'
        : 'Das hat nicht geklappt. Bitte versuche es erneut.',
    );
  }

  // Spieleinladungen haben noch kein Backend und werden nur entfernt
  respondToGameInvite(notificationId: string): void {
    this.removeNotification(notificationId);
  }

  openSystemNotificationDialog(): void {
    this.dialog
      .open<SystemNotificationDialog, void, number>(SystemNotificationDialog, { width: '400px' })
      .afterClosed()
      .subscribe((recipients) => {
        if (recipients !== undefined) {
          this.statusMessage.set(`Systembenachrichtigung an ${recipients} Nutzer gesendet.`);
          void this.notificationsService.reload();
        }
      });
  }

  startSwipe(event: TouchEvent, notificationId: string): void {
    this.activeSwipeId = notificationId;
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
    this.swipeDirections.update((directions) => {
      const nextDirections = { ...directions };
      delete nextDirections[notificationId];
      return nextDirections;
    });
  }

  moveSwipe(event: TouchEvent, notificationId: string): void {
    if (this.touchStartX === null || this.activeSwipeId !== notificationId) {
      return;
    }

    const currentX = event.touches[0]?.clientX ?? this.touchStartX;
    const offset = currentX - this.touchStartX;
    const limitedOffset = Math.sign(offset) * Math.min(Math.abs(offset), 180);
    this.swipeOffsets.update((offsets) => ({ ...offsets, [notificationId]: limitedOffset }));
  }

  finishSwipe(event: TouchEvent, notificationId: string): void {
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
      window.setTimeout(() => this.removeNotification(notificationId), 220);
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
