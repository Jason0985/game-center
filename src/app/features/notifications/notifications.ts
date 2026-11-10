import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { NotificationsService, UNDO_WINDOW_MS } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { AppErrorService } from '../../services/app-error.service';
import { ConfirmationDialog, ConfirmationDialogData } from '../../confirmation-dialog';
import { firstValueFrom } from 'rxjs';
import { NotificationItem } from './notification.model';
import { notificationTypeConfig } from './notification-types';
import { SystemNotificationDialog } from './system-notification-dialog';
import { MultiplayerLobbyService } from '../multiplayer/multiplayer-lobby.service';
import { SkeletonRows } from '../../ui/skeleton-rows';

const MARK_SEEN_DELAY_MS = 2000;
const UNDO_TOAST_KEY = 'notification-undo';
const DRAG_SLOP_PX = 8;
// Ab diesem Anteil der Breite löscht Loslassen
const COMMIT_FRACTION = 0.38;
// px/ms; schnelles Wischen löscht auch unter der Schwelle
const FLICK_VELOCITY = 0.6;
const FLY_OUT_MS = 240;

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  width: number;
  locked: boolean;
  samples: { x: number; t: number }[];
}

@Component({
  selector: 'app-notifications',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, SkeletonRows],
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
  readonly respondingIds = signal<Set<string>>(new Set());
  readonly swipeableCount = computed(
    () => this.notifications().filter((item) => this.isSwipeable(item)).length,
  );
  // Gezogene Karte, ihr Versatz und ob Loslassen löschen würde
  readonly dragId = signal<string | null>(null);
  readonly dragX = signal(0);
  readonly armed = signal(false);
  // Karten, die gerade aus dem Bild fliegen
  readonly exiting = signal<Map<string, 'left' | 'right'>>(new Map());
  // Erst nach dem ersten Laden neue/zurückgeholte Zeilen einblenden, nicht beim Seitenaufbau
  readonly animateRows = signal(false);
  private drag: DragState | null = null;
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

    effect(() => {
      if (this.loading() || this.animateRows()) return;
      setTimeout(() => this.animateRows.set(true), 100);
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.markSeenTimer));
  }

  // Löschen ohne Rückfrage, dafür mit Rückgängig im Toast
  remove(ids: string[]): void {
    if (!ids.length) return;
    this.notificationsService.dismissWithUndo(ids);
    this.toastService.show(
      {
        key: UNDO_TOAST_KEY,
        tone: 'info',
        icon: 'delete',
        title: ids.length === 1 ? 'Mitteilung gelöscht' : `${ids.length} Mitteilungen gelöscht`,
        action: { label: 'Rückgängig', run: () => this.notificationsService.undoDismiss(ids) },
      },
      UNDO_WINDOW_MS,
    );
  }

  removeAll(): void {
    this.remove(
      this.notifications()
        .filter((item) => this.isSwipeable(item))
        .map((item) => item.id),
    );
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
      this.toastService.success(
        'Anfrage angenommen',
        `${notification.sender_name} ist jetzt dein Freund.`,
      );
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
      const result = await this.notificationsService.dismiss(notification.id);
      if (!result.ok) this.appErrors.report(result.message);
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
      this.toastService.show({
        tone: 'info',
        icon: 'info',
        title: 'Die Lobby gibt es nicht mehr.',
      });
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

  // Anfragen müssen beantwortet werden und lassen sich nicht wegwischen
  isSwipeable(notification: NotificationItem): boolean {
    return this.typeConfig(notification.type).actions !== 'friend-request';
  }

  // Wischen wie in iOS-Listen: erst nach ein paar Pixeln seitwärts greift die Karte,
  // senkrecht bleibt es normales Scrollen (touch-action: pan-y, der Browser meldet dann
  // pointercancel). Handler geben nie false zurück, sonst verhindert Angular den Klick.
  startDrag(event: PointerEvent, notification: NotificationItem): void {
    if (!this.isSwipeable(notification) || this.drag || !event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.exiting().has(notification.id)) return;

    this.drag = {
      id: notification.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: (event.currentTarget as HTMLElement).offsetWidth || window.innerWidth,
      locked: false,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
  }

  moveDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.locked) {
      if (Math.abs(dx) < DRAG_SLOP_PX && Math.abs(dy) < DRAG_SLOP_PX) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        this.drag = null; // senkrecht: der Nutzer scrollt
        return;
      }
      drag.locked = true;
      drag.startX = event.clientX; // ohne Sprung um die Schwelle
      // Klicks gehen ab jetzt an die Karte, nicht an Knöpfe darunter
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      this.dragId.set(drag.id);
    }

    drag.samples.push({ x: event.clientX, t: event.timeStamp });
    if (drag.samples.length > 5) drag.samples.shift();

    const offset = event.clientX - drag.startX;
    this.dragX.set(offset);
    const armed = Math.abs(offset) >= drag.width * COMMIT_FRACTION;
    if (armed !== this.armed()) {
      this.armed.set(armed);
      navigator.vibrate?.(8);
    }
  }

  endDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;
    if (!drag.locked) return;

    const offset = this.dragX();
    const velocity = this.velocity(drag.samples); // px/ms, Vorzeichen = Richtung
    const flick =
      Math.abs(velocity) > FLICK_VELOCITY &&
      Math.sign(velocity) === Math.sign(offset) &&
      Math.abs(offset) > DRAG_SLOP_PX * 3;

    if (event.type !== 'pointercancel' && (this.armed() || flick)) {
      this.flyOut(drag.id, offset < 0 ? 'left' : 'right');
    }
    this.resetDrag();
  }

  // Schnell am Ende der Bewegung: auch kurzes Wischen löscht
  private velocity(samples: { x: number; t: number }[]): number {
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  }

  private flyOut(id: string, direction: 'left' | 'right'): void {
    this.exiting.update((map) => new Map(map).set(id, direction));
    setTimeout(() => {
      this.exiting.update((map) => {
        const next = new Map(map);
        next.delete(id);
        return next;
      });
      this.remove([id]);
    }, FLY_OUT_MS);
  }

  private resetDrag(): void {
    this.dragId.set(null);
    this.dragX.set(0);
    this.armed.set(false);
  }

  cardTransform(id: string): string | null {
    const direction = this.exiting().get(id);
    if (direction) return `translate3d(${direction === 'left' ? -110 : 110}%, 0, 0)`;
    if (this.dragId() !== id) return null;
    return `translate3d(${this.dragX()}px, 0, 0)`;
  }

  // Auf welcher Seite die rote Fläche frei wird
  revealSide(id: string): 'left' | 'right' | null {
    const direction = this.exiting().get(id);
    if (direction) return direction === 'left' ? 'right' : 'left';
    if (this.dragId() !== id || !this.dragX()) return null;
    return this.dragX() < 0 ? 'right' : 'left';
  }

  revealWidth(id: string): number {
    return this.dragId() === id ? Math.abs(this.dragX()) : 0;
  }

  // 0–1: das Symbol blendet mit dem freigelegten Weg ein
  revealProgress(id: string): number {
    if (this.exiting().has(id)) return 1;
    if (this.dragId() !== id) return 0;
    return Math.min(1, Math.max(0, (Math.abs(this.dragX()) - 12) / 48));
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
