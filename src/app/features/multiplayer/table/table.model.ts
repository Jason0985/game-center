import { inject, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

// Gemeinsame Tisch-Logik der Kartenspiele (Flip 7, Skip-Bo): Layouts, Sitzbogen, Uhrzeit

// Spieltisch: vier Layouts (Handy, iPad hoch, iPad quer, Laptop). Maße in Design-Pixeln
// der Tischplatte; die Anzeige rechnet sie in Prozent der Platte um.
export type TableLayout = 'phone' | 'hoch' | 'quer' | 'laptop';

export interface TableGeometry {
  w: number;
  h: number;
  // Ellipse, auf der die Plätze sitzen; Bogen von `from` nach `to` (Grad, im Uhrzeigersinn)
  cx: number;
  cy: number;
  a: number;
  b: number;
  from: number;
  to: number;
}

export interface SeatSpot {
  x: number;
  y: number;
}

// Feste Farbe pro Sitz, weiße Initiale jeweils >= 4.5:1
export const AVATAR_COLORS = [
  '#3b6aa0',
  '#6d45a8',
  '#23705f',
  '#8f4c1f',
  '#4351a8',
  '#4c6379',
  '#655a1f',
  '#8a3a5c',
] as const;

// Breakpoints der vier Layouts; alles andere ist Handy
const QUERIES = {
  laptop: '(min-width: 1280px) and (orientation: landscape)',
  quer: '(min-width: 900px) and (max-width: 1279.98px) and (orientation: landscape)',
  hoch: '(min-width: 600px) and (orientation: portrait)',
} as const;

// Nur im Injection Context (Feld-Initialisierer einer Komponente)
export function injectTableLayout(): Signal<TableLayout> {
  return toSignal(
    inject(BreakpointObserver)
      .observe(Object.values(QUERIES))
      .pipe(
        map((state): TableLayout =>
          state.breakpoints[QUERIES.laptop]
            ? 'laptop'
            : state.breakpoints[QUERIES.quer]
              ? 'quer'
              : state.breakpoints[QUERIES.hoch]
                ? 'hoch'
                : 'phone',
        ),
      ),
    { requireSync: true },
  );
}

// Plätze der Mitspieler (ab dem Platz nach mir, erster links von mir), gleichmäßig nach
// Bogenlänge verteilt: Auf einem Oval lägen sie nach Winkel oben gedrängt.
// gap null: je Platz ein gleich langes Stück, Platz in dessen Mitte (Handy/iPad).
// gap als Zahl: gleichmäßig um den Tisch, neben mir aber mindestens gap frei (Laptop).
export function arcSpots(table: TableGeometry, count: number, gap: number | null): SeatSpot[] {
  const steps = 360;
  const points: [number, number][] = [];
  const lengths = [0];
  for (let i = 0; i <= steps; i++) {
    const t = ((table.from + ((table.to - table.from) * i) / steps) * Math.PI) / 180;
    points.push([table.cx + table.a * Math.cos(t), table.cy - table.b * Math.sin(t)]);
    if (i) {
      const [x0, y0] = points[i - 1];
      lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - x0, points[i][1] - y0));
    }
  }

  let shares = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
  if (gap !== null) {
    shares = Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));
    if (count > 1 && shares[0] < gap) {
      shares = shares.map((_, i) => gap + ((1 - 2 * gap) * i) / (count - 1));
    }
  }

  return shares.map((share) => {
    const target = share * lengths[steps];
    const i = Math.max(
      1,
      lengths.findIndex((length) => length >= target),
    );
    const ratio = (target - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return {
      x: points[i - 1][0] + (points[i][0] - points[i - 1][0]) * ratio,
      y: points[i - 1][1] + (points[i][1] - points[i - 1][1]) * ratio,
    };
  });
}

// Reihum ab dem Platz nach mir; verlassene Spieler behalten ihren Platz
export function seatsAfter<T extends { seat: number }>(
  players: readonly T[],
  mySeat: number,
  count: number,
): T[] {
  return players
    .filter((player) => player.seat !== mySeat)
    .sort((a, b) => ((a.seat - mySeat + count) % count) - ((b.seat - mySeat + count) % count));
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Alter eines Verlaufseintrags ohne Uhrabweichung: gemessen ab dem Moment, in dem das
// neueste Ereignis hier ankam (seenAt), plus Abstand laut Server
export function eventAge(now: number, seenAt: number, latestAt?: string, at?: string): string {
  const ms = now - seenAt + (Date.parse(latestAt ?? '') - Date.parse(at ?? ''));
  return Number.isNaN(ms) ? '' : ms < 10_000 ? 'jetzt' : formatClock(ms / 1000);
}
