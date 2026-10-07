import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';

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

const STORAGE_KEY = 'game-center-theme';

// Farbe der Browser-/Statusleiste passend zu --color-background des Schemas
const THEME_COLORS: Record<'light' | 'dark', string> = {
  dark: '#1c1c1e',
  light: '#f2f2f7',
};

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light' || value === 'system';
}

/** Hält das gewählte Farbschema und setzt es als data-theme auf <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readStored());

  private readonly prefersLight =
    typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
  private readonly systemLight = signal(this.prefersLight?.matches ?? false);

  constructor() {
    const onChange = (event: MediaQueryListEvent) => this.systemLight.set(event.matches);
    this.prefersLight?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.prefersLight?.removeEventListener('change', onChange));

    effect(() => {
      const theme = this.theme();
      this.apply(theme === 'system' ? (this.systemLight() ? 'light' : 'dark') : theme);
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Speicher nicht verfügbar (z. B. privater Modus): Schema gilt nur für diese Sitzung
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
