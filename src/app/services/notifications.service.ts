import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase.client';
import {
  NotificationItem,
  SystemNotificationType,
} from '../features/notifications/notification.model';
import { SessionService } from './session.service';

const SEEN_STORAGE_KEY_PREFIX = 'gameroster:seen-notifications:';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly session = inject(SessionService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly loading = signal(true);
  private readonly seenIds = signal<Set<string>>(new Set());
  private loadedUserId: string | null = null;
  private channel: RealtimeChannel | null = null;

  // Anzahl für das Badge im Header
  readonly unreadCount = computed(
    () => this.notifications().filter((item) => !this.seenIds().has(item.id)).length,
  );

  constructor() {
    // Bei Login/Logout Benachrichtigungen, Live-Updates und Gelesen-Status umstellen
    effect(() => {
      if (!this.session.initialized()) return;

      const userId = this.session.user()?.id ?? null;
      if (userId === this.loadedUserId) return;

      this.loadedUserId = userId;
      this.notifications.set([]);
      this.seenIds.set(userId ? this.loadSeenIds(userId) : new Set());
      void this.subscribe(userId);

      if (userId) {
        this.loading.set(true);
        void this.load(userId);
      } else {
        this.loading.set(false);
      }
    });
  }

  markAllSeen(): void {
    const userId = this.loadedUserId;
    if (!userId) return;

    const seenIds = new Set(this.seenIds());
    this.notifications().forEach((item) => seenIds.add(item.id));
    this.seenIds.set(seenIds);

    try {
      localStorage.setItem(SEEN_STORAGE_KEY_PREFIX + userId, JSON.stringify([...seenIds]));
    } catch {}
  }

  async reload(): Promise<void> {
    if (this.loadedUserId) {
      await this.load(this.loadedUserId);
    }
  }

  // Wegklicken: sofort ausblenden und in der DB löschen
  async dismiss(notificationId: string): Promise<void> {
    this.removeLocally(notificationId);

    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    if (error) {
      console.error('Benachrichtigung konnte nicht gelöscht werden.', error);
    }
  }

  // Die DB entfernt die Anfrage-Benachrichtigung danach selbst (Trigger)
  async respondToFriendRequest(notification: NotificationItem, accept: boolean): Promise<boolean> {
    if (!notification.related_id) return false;

    const { data, error } = await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'declined', updated_at: new Date().toISOString() })
      .eq('id', notification.related_id)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      console.error('Freundschaftsanfrage konnte nicht beantwortet werden.', error);
      return false;
    }

    if (!data?.length) {
      // Schon beantwortet oder zurückgezogen: veraltete Benachrichtigung aufräumen
      await this.dismiss(notification.id);
      return true;
    }

    this.removeLocally(notification.id);
    return true;
  }

  // Nur für Admins; die Berechtigung prüft die Datenbank
  async sendSystemNotification(
    type: SystemNotificationType,
    title: string,
    message: string,
  ): Promise<{ recipients: number } | { error: string }> {
    const { data, error } = await supabase.rpc('send_system_notification', {
      p_type: type,
      p_title: title,
      p_message: message,
    });

    if (error) {
      return { error: error.code === '42501' ? 'Keine Berechtigung.' : error.message };
    }

    return { recipients: data as number };
  }

  private removeLocally(notificationId: string): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  private async load(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (this.loadedUserId !== userId) return; // inzwischen ausgeloggt/gewechselt

    if (error) {
      console.error('Benachrichtigungen konnten nicht geladen werden.', error);
    }

    this.notifications.set((data as NotificationItem[] | null) ?? []);
    this.loading.set(false);
  }

  private async subscribe(userId: string | null): Promise<void> {
    if (this.channel) {
      const channel = this.channel;
      this.channel = null;
      await supabase.removeChannel(channel);
    }

    if (!userId) return;

    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const item = payload.new as NotificationItem;
          if (this.loadedUserId !== userId) return;

          this.notifications.update((items) =>
            items.some((existing) => existing.id === item.id) ? items : [item, ...items],
          );
        },
      )
      .subscribe();
  }

  private loadSeenIds(userId: string): Set<string> {
    try {
      const raw = localStorage.getItem(SEEN_STORAGE_KEY_PREFIX + userId);
      const ids = raw ? (JSON.parse(raw) as unknown) : [];
      return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
