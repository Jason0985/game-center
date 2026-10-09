import { ErrorHandler, Injectable, Injector, inject, isDevMode } from '@angular/core';
import { version } from '../../../package.json';
import { supabase } from '../supabase.client';
import { NotificationsService } from './notifications.service';
import { describeSupabaseError } from './supabase-errors';
import { ToastService } from './toast.service';

const DEFAULT_TITLE = 'Das hat nicht geklappt';

// ponytail: pro Seitenaufruf jeder Fehler nur einmal, reicht gegen Schleifen
const storedErrors = new Set<string>();

// Für die Fehler-Überwachung der Admins (client_errors); schlägt das fehl, bleibt es bei der
// Konsole. Nur im Live-Build, nicht lokal.
export function logClientError(message: string, stack: string | null = null): void {
  if (isDevMode() || storedErrors.has(message)) return;
  storedErrors.add(message);
  supabase
    .from('client_errors')
    .insert({
      message: message.slice(0, 1000),
      stack: stack?.slice(0, 8000) ?? null,
      url: location.href.slice(0, 500),
      user_agent: navigator.userAgent.slice(0, 500),
      app_version: version,
    })
    .then(({ error }) => error && console.error('Fehler nicht gespeichert.', error));
}
const DUPLICATE_WINDOW_MS = 5000;

export interface ReportOptions {
  title?: string;
  // false, wenn der Fehler schon sichtbar angezeigt wird (z. B. im Dialog)
  toast?: boolean;
}

// Meldet Fehler als Pop-up und legt sie zusätzlich in den Benachrichtigungen ab,
// damit man sie auch später noch sieht
@Injectable({ providedIn: 'root' })
export class AppErrorService {
  private readonly injector = inject(Injector);
  private readonly lastReported = new Map<string, number>();

  report(message: string, options: ReportOptions = {}): void {
    // Gleiche Fehler kurz hintereinander nur einmal melden
    const now = Date.now();
    if (now - (this.lastReported.get(message) ?? 0) < DUPLICATE_WINDOW_MS) return;
    this.lastReported.set(message, now);

    const title = options.title ?? DEFAULT_TITLE;
    if (options.toast !== false) {
      this.injector.get(ToastService).error(message, title);
    }
    this.notifications.addLocalError(title, message);
  }

  // Erst bei Bedarf holen: NotificationsService meldet selbst über diesen Service
  private get notifications(): NotificationsService {
    return this.injector.get(NotificationsService);
  }
}

// Unerwartete Fehler (Exceptions, nicht abgefangene Promises) ebenfalls melden
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    console.error(error);
    this.store(error);

    // Außerhalb der laufenden Change Detection melden
    setTimeout(() => {
      try {
        this.injector
          .get(AppErrorService)
          .report(this.describe(error), { title: 'Unerwarteter Fehler' });
      } catch (reportError) {
        console.error('Fehler konnte nicht gemeldet werden.', reportError);
      }
    });
  }

  private store(error: unknown): void {
    const cause = (error as { rejection?: unknown })?.rejection ?? error;
    const message =
      cause instanceof Error
        ? `${cause.name}: ${cause.message}`
        : String((cause as { message?: unknown })?.message ?? cause);
    logClientError(message, cause instanceof Error ? (cause.stack ?? null) : null);
  }

  private describe(error: unknown): string {
    const cause = (error as { rejection?: unknown })?.rejection ?? error;
    if (cause && typeof cause === 'object' && 'code' in cause) {
      return describeSupabaseError(cause as { code?: string; message?: string });
    }
    if (cause instanceof TypeError && /fetch|network/i.test(cause.message)) {
      return describeSupabaseError(cause);
    }
    return 'Etwas ist schiefgelaufen. Lade die Seite neu, falls etwas nicht funktioniert.';
  }
}
