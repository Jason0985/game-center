import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

// Chrome/Edge/Samsung Internet: das gemerkte Ereignis öffnet später den Installationsdialog
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const UPDATE_CHECK_MS = 30 * 60 * 1000;

// Wo es keinen Installationsdialog gibt, zeigt die App eine Anleitung
export type InstallGuide = 'ios' | 'mac-safari' | 'other';

// App als PWA: neue Version, offline und Installieren. Läuft app-weit (App-Komponente).
@Injectable({ providedIn: 'root' })
export class PwaService {
  // Optional: ohne provideServiceWorker (Tests, Entwicklung) gibt es keine Updates
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private installPrompt: BeforeInstallPromptEvent | null = null;

  readonly online = signal(globalThis.navigator?.onLine ?? true);
  readonly updateReady = signal(false);
  // Läuft als installierte App (eigenes Fenster statt Browser-Tab)
  readonly standalone = signal(isStandalone());
  readonly canInstall = signal(false);
  readonly installGuide = installGuideFor(globalThis.navigator?.userAgent ?? '');

  constructor() {
    const early = (globalThis as { earlyInstallPrompt?: BeforeInstallPromptEvent })
      .earlyInstallPrompt;
    if (early && !this.standalone()) {
      this.installPrompt = early;
      this.canInstall.set(true);
    }

    const onOnline = () => this.online.set(true);
    const onOffline = () => this.online.set(false);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault(); // eigener Button statt Mini-Leiste des Browsers
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    };
    const onInstalled = () => {
      this.installPrompt = null;
      this.canInstall.set(false);
      this.standalone.set(true);
    };
    // Beim Zurückkehren in die App nach einer neuen Version fragen (Handys schließen sie selten)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && this.swUpdate?.isEnabled) {
        void this.swUpdate.checkForUpdate().catch(() => undefined);
      }
    };

    // Bleibt die App lange offen und sichtbar, zusätzlich alle 30 Minuten (nur ngsw.json, wenige KB)
    const updateTimer = setInterval(onVisible, UPDATE_CHECK_MS);

    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);
    addEventListener('beforeinstallprompt', onInstallPrompt);
    addEventListener('appinstalled', onInstalled);
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(updateTimer);
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
      removeEventListener('beforeinstallprompt', onInstallPrompt);
      removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', onVisible);
    });

    if (this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady.set(true);
      });
      // Zwischengespeicherte Version kaputt: nur Neuladen hilft
      this.swUpdate.unrecoverable.subscribe(() => this.updateReady.set(true));
    }
  }

  async install(): Promise<void> {
    const prompt = this.installPrompt;
    if (!prompt) return;
    await prompt.prompt();
    // Das Ereignis lässt sich nur einmal verwenden; bei Ablehnung schickt Chrome später ein neues
    this.installPrompt = null;
    this.canInstall.set(false);
  }

  reload(): void {
    location.reload();
  }
}

function isStandalone(): boolean {
  return (
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
    (globalThis.navigator as { standalone?: boolean } | undefined)?.standalone === true
  );
}

function installGuideFor(userAgent: string): InstallGuide {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
  // Safari auf dem Mac (Chrome und Edge nennen sich dort auch "Safari")
  if (
    /Macintosh/.test(userAgent) &&
    /Safari/.test(userAgent) &&
    !/Chrome|Chromium|Edg/.test(userAgent)
  ) {
    return 'mac-safari';
  }
  return 'other';
}
