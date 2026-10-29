import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';

// Feste Pseudozufallswerte, damit die Fledermäuse bei jedem Laden gleich fliegen
function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const BATS = Array.from({ length: 5 }, (_, i) => ({
  top: 14 + Math.round(seeded(i, 1) * 50),
  size: 18 + Math.round(seeded(i, 2) * 14),
  duration: 22 + Math.round(seeded(i, 3) * 18),
  delay: -Math.round(seeded(i, 4) * 40),
  flap: 0.22 + Math.round(seeded(i, 5) * 14) / 100,
}));

/** Hintergrund: blasser Mond, ein Spinnennetz in der Ecke und ab und zu Fledermäuse. */
@Component({
  selector: 'app-halloween-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hw-moon"></div>
    <div class="hw-web"></div>
    @for (bat of bats; track $index) {
      <span
        class="hw-bat"
        [style.top.vh]="bat.top"
        [style.width.px]="bat.size"
        [style.height.px]="bat.size / 2"
        [style.animation-duration.s]="bat.duration"
        [style.animation-delay.s]="bat.delay"
        [style.--flap]="bat.flap + 's'"
      ></span>
    }
  `,
  styleUrl: './halloween-decor.scss',
  host: { class: 'hw-backdrop', 'aria-hidden': 'true' },
})
export class HalloweenBackdrop {
  readonly bats = BATS;
}

/** Lichterkette in Kürbisorange, Giftgrün und Lila direkt unter dem Kopf. */
@Component({
  selector: 'app-halloween-lights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (bulb of bulbs; track $index) {
      <span class="bulb"></span>
    }
  `,
  styleUrl: './halloween-decor.scss',
  host: { class: 'hw-lights', 'aria-hidden': 'true' },
})
export class HalloweenLights {
  // Reicht für sehr breite Bildschirme, der Rest wird abgeschnitten
  readonly bulbs = Array.from({ length: 64 });
}

const CANDIES = ['🍬', '🍭', '🍫', '🍬', '🍭', '🧁', '🍪', '🍬'];
const CANDY_MS = 1500;

interface Candy {
  id: number;
  emoji: string;
  dx: number;
  dy: number;
  spin: number;
  delay: number;
}

/**
 * Kürbisse, die auf einer Kante stehen (unten bündig mit der Oberkante des Elternelements).
 * Antippen: der Kürbis wackelt, sein Gesicht leuchtet und Süßigkeiten fliegen heraus.
 */
@Component({
  selector: 'app-halloween-pumpkins',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (spot of spots(); track $index; let i = $index) {
      <button
        type="button"
        class="hw-pumpkin"
        [class.hw-pumpkin--small]="spot.small"
        [class.hw-pumpkin--lit]="lit() === i"
        [style.left]="spot.left"
        [style.right]="spot.right"
        aria-label="Kürbis antippen – Süßes!"
        (click)="burst(i, $any($event.currentTarget))"
      >
        <svg viewBox="0 0 40 36" aria-hidden="true">
          <path class="stem" d="M19 7 Q18 2 22 1 L23 3 Q21 4 21.5 7 Z" />
          <ellipse class="lobe" cx="12" cy="21" rx="10" ry="13" />
          <ellipse class="lobe" cx="28" cy="21" rx="10" ry="13" />
          <ellipse class="body" cx="20" cy="21" rx="11" ry="14" />
          <path class="face" d="M11 17 L15 13 L17 18 Z M29 17 L25 13 L23 18 Z" />
          <path
            class="face"
            d="M10 23 Q20 31 30 23 L27 24 L26 27 L23 25 L20 28 L17 25 L14 27 L13 24 Z"
          />
        </svg>
        @for (candy of candies()[i] ?? []; track candy.id) {
          <span
            class="hw-candy"
            [style.--dx.px]="candy.dx"
            [style.--dy.px]="candy.dy"
            [style.--spin.deg]="candy.spin"
            [style.animation-delay.ms]="candy.delay"
            >{{ candy.emoji }}</span
          >
        }
      </button>
    }
  `,
  styleUrl: './halloween-decor.scss',
  host: { class: 'hw-pumpkins' },
})
export class HalloweenPumpkins {
  /** Wo die Kürbisse stehen (CSS left oder right) und ob sie klein sind. */
  readonly spots = input<{ left?: string; right?: string; small?: boolean }[]>([
    { left: '6%' },
    { right: '8%', small: true },
  ]);

  readonly candies = signal<Record<number, Candy[]>>({});
  readonly lit = signal<number | null>(null);

  private nextId = 0;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  burst(index: number, pumpkin?: HTMLElement): void {
    if (!matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      pumpkin?.animate?.(
        [
          { transform: 'rotate(0) scale(1)' },
          { transform: 'rotate(-14deg) scale(1.12, 0.9)' },
          { transform: 'rotate(10deg) scale(0.95, 1.08)' },
          { transform: 'rotate(-5deg)' },
          { transform: 'rotate(0) scale(1)' },
        ],
        { duration: 520, easing: 'ease-out' },
      );
    }
    // Fächer nach oben, mal mehr links, mal mehr rechts
    const fresh = Array.from({ length: 9 }, () => ({
      id: this.nextId++,
      emoji: CANDIES[Math.floor(Math.random() * CANDIES.length)],
      dx: Math.round((Math.random() - 0.5) * 160),
      dy: -Math.round(50 + Math.random() * 80),
      spin: Math.round((Math.random() - 0.5) * 540),
      delay: Math.round(Math.random() * 160),
    }));
    this.candies.update((all) => ({ ...all, [index]: [...(all[index] ?? []), ...fresh] }));
    this.lit.set(index);
    const ids = new Set(fresh.map((candy) => candy.id));
    this.timers.push(
      setTimeout(() => {
        this.candies.update((all) => ({
          ...all,
          [index]: (all[index] ?? []).filter((candy) => !ids.has(candy.id)),
        }));
        if (this.lit() === index && !this.candies()[index]?.length) this.lit.set(null);
      }, CANDY_MS + 200),
    );
  }
}
