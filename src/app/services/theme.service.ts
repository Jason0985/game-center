import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

/** dark = Grau-Dunkel (einziger Dunkelmodus), system folgt dem Gerät. */
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeOption {
  id: Theme;
  label: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: 'light', label: 'Hell' },
  { id: 'dark', label: 'Dunkel' },
  { id: 'system', label: 'Automatisch' },
];

/** Saisonale Deko über dem Farbschema. */
export type Decor = 'none' | 'christmas' | 'halloween';

export interface DecorOption {
  id: Decor;
  label: string;
}

export const DECOR_OPTIONS: readonly DecorOption[] = [
  { id: 'none', label: 'Keine' },
  { id: 'christmas', label: 'Weihnachten' },
  { id: 'halloween', label: 'Halloween' },
];

const STORAGE_KEY = 'game-center-theme';
const DECOR_KEY = 'game-center-decor';
// Früherer Admin-Schalter nur für Weihnachten
const CHRISTMAS_KEY = 'game-center-christmas';

// Farbe der Browser-/Statusleiste passend zu --color-background des Schemas
const THEME_COLORS: Record<'light' | 'dark', string> = {
  dark: '#111528',
  light: '#f2f2f8',
};

// Akku: Bewegte Deko (Schnee, Fledermäuse, Funkeln, Nebel …) läuft nach jedem Seitenwechsel
// so lange, dann blendet sie aus bzw. steht still (html[data-decor-calm], 'fading' → 'on').
// Sonst zeichnet das Display ununterbrochen mit voller Bildrate.
const DECOR_AWAKE_MS = 20_000;
const DECOR_FADE_MS = 2_000;

function isDecor(value: unknown): value is Decor {
  return value === 'none' || value === 'christmas' || value === 'halloween';
}

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system';
}

/** Hält das gewählte Farbschema und setzt es als data-theme auf <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readStored());
  /** Saisonale Deko (Lichterkette, Schnee bzw. Kürbisse), für alle wählbar. */
  readonly decor = signal<Decor>(this.readDecor());

  private readonly prefersLight =
    typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
  private readonly systemLight = signal(this.prefersLight?.matches ?? false);
  private calmTimers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    const onChange = (event: MediaQueryListEvent) => this.systemLight.set(event.matches);
    this.prefersLight?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.prefersLight?.removeEventListener('change', onChange));

    effect(() => {
      const theme = this.theme();
      this.apply(theme === 'system' ? (this.systemLight() ? 'light' : 'dark') : theme);
    });

    // Saisonale Tischfarben hängen an <html data-decor> (styles/_decor.scss)
    effect(() => {
      const decor = this.decor();
      if (decor === 'none') document.documentElement.removeAttribute('data-decor');
      else document.documentElement.setAttribute('data-decor', decor);
    });

    this.wakeDecor();
    const navigation = inject(Router, { optional: true })?.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.wakeDecor();
    });
    inject(DestroyRef).onDestroy(() => {
      navigation?.unsubscribe();
      this.calmTimers.forEach(clearTimeout);
    });
  }

  /** Bewegte Deko wieder anwerfen; nach DECOR_AWAKE_MS kommt sie zur Ruhe. */
  wakeDecor(): void {
    this.calmTimers.forEach(clearTimeout);
    const root = document.documentElement;
    root.removeAttribute('data-decor-calm');
    this.calmTimers = [
      setTimeout(() => root.setAttribute('data-decor-calm', 'fading'), DECOR_AWAKE_MS),
      setTimeout(() => root.setAttribute('data-decor-calm', 'on'), DECOR_AWAKE_MS + DECOR_FADE_MS),
    ];
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Speicher nicht verfügbar (z. B. privater Modus): Schema gilt nur für diese Sitzung
    }
  }

  setDecor(decor: Decor): void {
    this.decor.set(decor);
    this.wakeDecor();
    try {
      localStorage.setItem(DECOR_KEY, decor);
    } catch {
      // Speicher nicht verfügbar: Deko gilt nur für diese Sitzung
    }
  }

  private readDecor(): Decor {
    try {
      const stored = localStorage.getItem(DECOR_KEY);
      if (isDecor(stored)) return stored;
      return localStorage.getItem(CHRISTMAS_KEY) === '1' ? 'christmas' : 'none';
    } catch {
      return 'none';
    }
  }

  private readStored(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Früheres Grau-Schema ist jetzt der Dunkelmodus
      if (stored === 'graphite') return 'dark';
      return isTheme(stored) ? stored : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }
}
