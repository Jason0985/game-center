import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'graphite' | 'light';

export interface ThemeOption {
  id: Theme;
  label: string;
  icon: string;
}

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { id: 'dark', label: 'Dunkel', icon: 'dark_mode' },
  { id: 'graphite', label: 'Grau', icon: 'contrast' },
  { id: 'light', label: 'Hell', icon: 'light_mode' },
];

const STORAGE_KEY = 'game-center-theme';

// Farbe der Browser-/Statusleiste passend zu --color-background des Schemas
const THEME_COLORS: Record<Theme, string> = {
  dark: '#0f1115',
  graphite: '#1c1e22',
  light: '#f4f5f7',
};

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'graphite' || value === 'light';
}

/** Hält das gewählte Farbschema und setzt es als data-theme auf <html>. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readStored());

  constructor() {
    effect(() => this.apply(this.theme()));
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
      return isTheme(stored) ? stored : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }
}
