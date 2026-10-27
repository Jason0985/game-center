import { ChangeDetectionStrategy, Component } from '@angular/core';

// Feste Pseudozufallswerte, damit die Flocken bei jedem Laden gleich verteilt sind
function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

interface Flake {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
}

const FLAKES: readonly Flake[] = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round(seeded(i, 1) * 100),
  size: 3 + Math.round(seeded(i, 2) * 4),
  duration: 16 + Math.round(seeded(i, 3) * 14),
  delay: -Math.round(seeded(i, 4) * 30),
  drift: Math.round((seeded(i, 5) - 0.5) * 60),
  opacity: 0.25 + Math.round(seeded(i, 6) * 35) / 100,
}));

/** Hintergrund: hängende Girlanden, leiser Schneefall und ab und zu eine Sternschnuppe. */
@Component({
  selector: 'app-christmas-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xmas-garland"></div>
    @for (flake of flakes; track $index) {
      <span
        class="xmas-flake"
        [style.left.%]="flake.left"
        [style.width.px]="flake.size"
        [style.height.px]="flake.size"
        [style.opacity]="flake.opacity"
        [style.animation-duration.s]="flake.duration"
        [style.animation-delay.s]="flake.delay"
        [style.--drift]="flake.drift + 'px'"
      ></span>
    }
    <span class="xmas-shooting-star"></span>
  `,
  styleUrl: './christmas-decor.scss',
  host: { class: 'xmas-backdrop', 'aria-hidden': 'true' },
})
export class ChristmasBackdrop {
  readonly flakes = FLAKES;
}

/** Lichterkette direkt unter dem Kopf. */
@Component({
  selector: 'app-christmas-lights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (bulb of bulbs; track $index) {
      <span class="xmas-bulb"></span>
    }
  `,
  styleUrl: './christmas-decor.scss',
  host: { class: 'xmas-lights', 'aria-hidden': 'true' },
})
export class ChristmasLights {
  // Reicht für sehr breite Bildschirme, der Rest wird abgeschnitten
  readonly bulbs = Array.from({ length: 64 });
}

/** Schneehaufen auf der Oberkante der Tab-Leiste. */
@Component({
  selector: 'app-christmas-snowbank',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrl: './christmas-decor.scss',
  host: { class: 'xmas-snowbank', 'aria-hidden': 'true' },
})
export class ChristmasSnowbank {}
