import { Injectable, signal } from '@angular/core';
import { NotificationTone } from '../features/notifications/notification-types';

export interface Toast {
  id: number;
  // Toasts mit gleichem key ersetzen sich (z. B. gebündelte Live-Benachrichtigungen)
  key?: string;
  tone: NotificationTone;
  icon: string;
  title: string;
  message?: string;
  // Route, die beim Antippen geöffnet wird
  link?: string;
}

export type ToastInput = Omit<Toast, 'id'>;

const DEFAULT_DURATION_MS = 4000;
const MAX_VISIBLE = 3;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  show(input: ToastInput, durationMs = DEFAULT_DURATION_MS): number {
    const replaced = input.key ? this.toasts().find((toast) => toast.key === input.key) : undefined;
    if (replaced) {
      this.dismiss(replaced.id);
    }

    const toast: Toast = { ...input, id: this.nextId++ };
    this.toasts.update((toasts) => [toast, ...toasts].slice(0, MAX_VISIBLE));
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), durationMs),
    );
    return toast.id;
  }

  success(title: string, message?: string): number {
    return this.show({ tone: 'success', icon: 'check_circle', title, message });
  }

  // Fehler bleiben etwas länger stehen
  error(message: string, title = 'Das hat nicht geklappt'): number {
    return this.show({ tone: 'error', icon: 'error', title, message }, 6000);
  }

  isVisible(key: string): boolean {
    return this.toasts().some((toast) => toast.key === key);
  }

  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
