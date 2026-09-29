import { Injectable, Injector, computed, effect, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subject } from 'rxjs';
import { supabase } from '../supabase.client';
import {
  NotificationItem,
  SystemNotificationType,
} from '../features/notifications/notification.model';
import { SessionService } from './session.service';
import { ActionResult, describeSupabaseError, failure } from './supabase-errors';
import { AppErrorService } from './app-error.service';

const LOCAL_STORAGE_KEY_PREFIX = 'gameroster:local-notifications:';
const LOCAL_ID_PREFIX = 'local-';
const MAX_LOCAL_NOTIFICATIONS = 20;

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly session = inject(SessionService);
  private readonly injector = inject(Injector);

  // Aus der DB (Freunde, System, ...) und nur lokal auf dem Gerät (App-Fehler)
  private readonly remote = signal<NotificationItem[]>([]);
  private readonly local = signal<NotificationItem[]>([]);

  readonly notifications = computed(() =>
    [...this.local(), ...this.remote()].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
  readonly loading = signal(true);
  // User, für den die Liste zuletzt vollständig geladen wurde (für Start-Pop-ups)
  readonly loadedFor = signal<string | null>(null);
  // Live eingetroffene Benachrichtigungen (für Toasts)
  readonly incoming = new Subject<NotificationItem>();

  private loadedUserId: string | null = null;
  private channel: RealtimeChannel | null = null;

  // Anzahl für das Badge im Header
  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.read_at).length);

  constructor() {
    // Bei Login/Logout Benachrichtigungen und Live-Updates umstellen
    effect(() => {
      if (!this.session.initialized()) return;

      const userId = this.session.user()?.id ?? null;
      if (userId === this.loadedUserId) return;

      this.loadedUserId = userId;
      this.loadedFor.set(null);
      this.remote.set([]);
      this.local.set(userId ? this.loadLocal(userId) : []);
      void this.subscribe(userId);

      if (userId) {
        this.loading.set(true);
        void this.load(userId);
      } else {
        this.loading.set(false);
      }
    });
  }

  async reload(): Promise<void> {
    if (this.loadedUserId) {
      await this.load(this.loadedUserId);
    }
  }

  // Fehler lokal ablegen, damit man ihn später in der Liste noch sieht
  addLocalError(title: string, message: string): void {
    const userId = this.loadedUserId;
    if (!userId) return;

    const item: NotificationItem = {
      id: LOCAL_ID_PREFIX + crypto.randomUUID(),
      recipient_id: userId,
      sender_id: null,
      sender_name: 'Game Center',
      type: 'app_error',
      title,
      message,
      related_id: null,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    this.local.update((items) => [item, ...items].slice(0, MAX_LOCAL_NOTIFICATIONS));
    this.persistLocal();
  }

  // Ohne ids: alle ungelesenen
  async markRead(ids?: string[]): Promise<void> {
    if (!this.loadedUserId) return;

    const unreadIds = new Set(
      this.notifications()
        .filter((item) => !item.read_at && (!ids || ids.includes(item.id)))
        .map((item) => item.id),
    );
    if (!unreadIds.size) return;

    const readAt = new Date().toISOString();
    const markItem = (item: NotificationItem) =>
      unreadIds.has(item.id) ? { ...item, read_at: readAt } : item;
    this.local.update((items) => items.map(markItem));
    this.remote.update((items) => items.map(markItem));
    this.persistLocal();

    const remoteIds = [...unreadIds].filter((id) => !this.isLocal(id));
    if (!remoteIds.length) return;

    const { error } = await supabase.from('notifications').update({ read_at: readAt }).in('id', remoteIds);

    // Nicht kritisch: beim nächsten Laden stimmt der Status wieder
    if (error) {
      console.error('Benachrichtigungen konnten nicht als gelesen markiert werden.', error);
    }
  }

  // Wegklicken: sofort ausblenden, bei Fehler wiederherstellen
  async dismiss(notificationId: string): Promise<ActionResult> {
    if (this.isLocal(notificationId)) {
      this.local.update((items) => items.filter((item) => item.id !== notificationId));
      this.persistLocal();
      return { ok: true };
    }

    const previous = this.remote();
    this.removeRemote(notificationId);

    const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
    if (error) {
      this.remote.set(previous);
      return failure('Benachrichtigung konnte nicht gelöscht werden.', error);
    }

    return { ok: true };
  }

  // Annehmen setzt den Status, Ablehnen löscht die Anfrage (dann kann erneut
  // angefragt werden). Die DB räumt die Anfrage-Benachrichtigung selbst auf.
  async respondToFriendRequest(
    notification: NotificationItem,
    accept: boolean,
  ): Promise<ActionResult> {
    if (!notification.related_id) {
      return failure('Freundschaftsanfrage ohne Verweis.', { message: 'related_id fehlt' });
    }

    const request = accept
      ? supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
      : supabase.from('friendships').delete();

    const { data, error } = await request
      .eq('id', notification.related_id)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      return failure('Freundschaftsanfrage konnte nicht beantwortet werden.', error);
    }

    if (!data?.length) {
      // Schon beantwortet oder zurückgezogen: veraltete Benachrichtigung aufräumen
      await this.dismiss(notification.id);
      return { ok: false, message: 'Diese Anfrage ist nicht mehr offen.' };
    }

    this.removeRemote(notification.id);
    return { ok: true };
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
      console.error('Systembenachrichtigung konnte nicht gesendet werden.', error);
      return { error: describeSupabaseError(error) };
    }

    return { recipients: data as number };
  }

  private isLocal(notificationId: string): boolean {
    return notificationId.startsWith(LOCAL_ID_PREFIX);
  }

  private removeRemote(notificationId: string): void {
    this.remote.update((items) => items.filter((item) => item.id !== notificationId));
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
      // Lazy, da AppErrorService seinerseits diesen Service nutzt
      this.injector
        .get(AppErrorService)
        .report(describeSupabaseError(error), { title: 'Benachrichtigungen nicht geladen' });
    }

    this.remote.set((data as NotificationItem[] | null) ?? []);
    this.loading.set(false);
    this.loadedFor.set(userId);
  }

  private async subscribe(userId: string | null): Promise<void> {
    if (this.channel) {
      const channel = this.channel;
      this.channel = null;
      await supabase.removeChannel(channel);
    }

    if (!userId) return;

    const filter = `recipient_id=eq.${userId}`;
    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter },
        (payload) => {
          const item = payload.new as NotificationItem;
          if (this.loadedUserId !== userId) return;
          if (this.remote().some((existing) => existing.id === item.id)) return;

          this.remote.update((items) => [item, ...items]);
          this.incoming.next(item);
        },
      )
      // Gelesen-Status von anderen Geräten übernehmen
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter },
        (payload) => {
          const item = payload.new as NotificationItem;
          this.remote.update((items) =>
            items.map((existing) => (existing.id === item.id ? item : existing)),
          );
        },
      )
      .subscribe();
  }

  private loadLocal(userId: string): NotificationItem[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId);
      const items = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(items)
        ? (items as NotificationItem[]).filter(
            (item) => typeof item?.id === 'string' && this.isLocal(item.id),
          )
        : [];
    } catch {
      return [];
    }
  }

  private persistLocal(): void {
    if (!this.loadedUserId) return;

    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_PREFIX + this.loadedUserId,
        JSON.stringify(this.local()),
      );
    } catch {}
  }
}
