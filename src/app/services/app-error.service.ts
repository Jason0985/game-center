import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { NotificationsService } from './notifications.service';
import { describeSupabaseError } from './supabase-errors';
import { ToastService } from './toast.service';

const DEFAULT_TITLE = 'Das hat nicht geklappt';
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
