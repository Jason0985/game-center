import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';
import { supabase } from '../supabase.client';
import { SessionService } from './session.service';
import { AppErrorService } from './app-error.service';
import { ActionResult, describeSupabaseError } from './supabase-errors';

// Öffentlicher VAPID-Schlüssel; der private liegt nur als Secret bei der Edge Function send-push
const VAPID_PUBLIC_KEY =
  'BKAPfgFUijnHJ1ySzBEQJN3t0YxXO4xjQryBXAUtdNcv2BF3G4pXtx4sOnBlx2-nx080FQFH__s5IXAb_DEGXGE';

// unsupported: kein Service Worker/keine Notification-API (Entwicklung, iPhone ohne Installation)
export type PushState = 'unsupported' | 'blocked' | 'off' | 'on';

// Push-Nachrichten: Mitteilungen kommen als System-Benachrichtigung, auch bei geschlossener App.
// Der Angular-Service-Worker zeigt sie an; gespeichert wird das Gerät in push_subscriptions.
@Injectable({ providedIn: 'root' })
export class PushService {
  // Optional: ohne provideServiceWorker (Tests) gilt Push als nicht unterstützt
  private readonly swPush = inject(SwPush, { optional: true });
  private readonly session = inject(SessionService);
  private readonly appErrors = inject(AppErrorService);
  private readonly subscription = toSignal(this.swPush?.subscription ?? of(null), {
    initialValue: null,
  });
  private readonly permission = signal(
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  );
  readonly busy = signal(false);
  readonly isIos = /iPhone|iPad|iPod/.test(globalThis.navigator?.userAgent ?? '');

  readonly state = computed<PushState>(() => {
    if (!this.swPush?.isEnabled || typeof Notification === 'undefined') return 'unsupported';
    if (this.subscription()) return 'on';
    return this.permission() === 'denied' ? 'blocked' : 'off';
  });

  constructor() {
    // Einzige Stelle, die speichert: nach dem Aktivieren und bei jedem Start bzw. Kontowechsel,
    // damit das Gerät immer dem angemeldeten Konto gehört
    effect(() => {
      const subscription = this.subscription();
      if (this.session.user() && subscription) void this.save(subscription);
    });
  }

  async enable(): Promise<ActionResult> {
    if (!this.swPush || this.busy()) return { ok: true };
    this.busy.set(true);
    try {
      await this.swPush.requestSubscription({ serverPublicKey: VAPID_PUBLIC_KEY });
      return { ok: true };
    } catch (error) {
      console.error('Push-Nachrichten konnten nicht aktiviert werden.', error);
      return {
        ok: false,
        message:
          Notification.permission === 'denied'
            ? 'Benachrichtigungen sind für diese Seite blockiert. Erlaube sie in den Browser-Einstellungen.'
            : 'Push-Nachrichten konnten nicht aktiviert werden. Bitte versuche es erneut.',
      };
    } finally {
      this.permission.set(Notification.permission);
      this.busy.set(false);
    }
  }

  // Auch beim Abmelden, damit das nächste Konto auf dem Gerät nichts vom vorherigen bekommt
  async disable(): Promise<ActionResult> {
    const subscription = this.subscription();
    if (!this.swPush || !subscription || this.busy()) return { ok: true };
    this.busy.set(true);
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
      if (error) return { ok: false, message: describeSupabaseError(error) };
      await this.swPush.unsubscribe();
      return { ok: true };
    } catch (error) {
      console.error('Push-Nachrichten konnten nicht deaktiviert werden.', error);
      return { ok: false, message: 'Push-Nachrichten konnten nicht deaktiviert werden.' };
    } finally {
      this.busy.set(false);
    }
  }

  private async save(subscription: PushSubscription): Promise<void> {
    const keys = subscription.toJSON().keys ?? {};
    const { error } = await supabase.rpc('save_push_subscription', {
      p_endpoint: subscription.endpoint,
      p_p256dh: keys['p256dh'] ?? '',
      p_auth: keys['auth'] ?? '',
    });
    if (error) {
      console.error('Gerät für Push-Nachrichten konnte nicht gespeichert werden.', error);
      this.appErrors.report(describeSupabaseError(error), { title: 'Push-Nachrichten' });
    }
  }
}
