import { Component, computed, effect, input, signal } from '@angular/core';
import { reducedMotion } from '../table/table-motion';
import { AVATAR_COLORS } from '../table/table.model';
import { Nimm6CardView } from './nimm6-card';
import { BULL_PATH, bullsLabel, COUNT_UP_MS, N6Player } from './nimm6.model';

// Karte am Platz: verdeckt gelegt (card null), aufgedeckt, oder gerade auf dem Weg in die
// Reihe (hidden: Platz bleibt, damit der Flug dort starten kann)
export interface N6Laid {
  card: number | null;
  // Aufdecken, erste Hälfte: Rücken dreht sich weg
  turning: boolean;
  // Wird gerade gelegt bzw. wartet auf die Reihenwahl
  now: boolean;
  hidden: boolean;
}

// Namensschild am Tisch (Spieltisch-Artboards): Avatar mit Bereit-Token (grüner Haken bzw.
// grau „wählt …“), Name und Hornochsen (zählen hoch, wenn eine Reihe ankommt), daneben die
// gelegte Karte (verdeckt, beim Aufdecken umgedreht). Mitspieler als Spalte (Handy, iPad hoch) bzw. Pille
// (quer, Laptop), eigener Platz als Reiter (tab) bzw. Pille (pill). Beim Nehmen einer Reihe
// roter Rand und „+8“. Größen kommen vom Tisch (CSS-Variablen).
@Component({
  selector: '[appNimm6Seat]',
  imports: [Nimm6CardView],
  template: `
    @let p = player();
    <span class="avatar-wrap">
      @if (p.state === 'left') {
        <span class="avatar avatar--left" aria-hidden="true">
          <span class="material-symbols-rounded">event_seat</span>
        </span>
      } @else {
        <span class="avatar" [style.background]="color()" aria-hidden="true">{{ initial() }}</span>
        @if (status() !== null) {
          <span class="token token--ready" [class.on]="status() === 'ready'" aria-hidden="true">
            <span class="material-symbols-rounded fill">{{
              status() === 'ready' ? 'check' : 'more_horiz'
            }}</span>
          </span>
        }
      }
    </span>

    <span class="info">
      <span class="name">
        <span class="name-text">{{ own() ? 'Du' : p.name }}</span>
      </span>
      @if (p.state === 'left') {
        <span class="gone">hat verlassen</span>
      } @else {
        <span class="bulls" [class.counting]="counting()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="bull" /></svg>
          {{ shownScore() }}
          @if (long()) {
            <span class="unit">&nbsp;Hornochsen</span>
          }
        </span>
      }
    </span>

    @if (laid(); as l) {
      <app-nimm6-card
        class="laid"
        [class.face]="l.card !== null"
        [class.turning]="l.turning"
        [class.now]="l.now"
        [class.hidden]="l.hidden"
        [card]="l.card"
        [attr.data-laid]="p.seat"
      />
    } @else if (status() === 'choosing' && variant() === 'row') {
      <span class="choosing" aria-hidden="true">wählt …</span>
    }
    @if (hit(); as n) {
      <span class="hit" aria-hidden="true">+{{ n }}</span>
    }
    @if (waiting(); as time) {
      <span class="waiting">
        <span class="material-symbols-rounded" aria-hidden="true">hourglass_bottom</span>
        <span class="sr-only">wartet seit </span>{{ time }}
      </span>
    }
  `,
  styleUrl: './nimm6-seat.scss',
  host: {
    // Reaktionen im Spiel erscheinen an diesem Platz (ReactionLayer)
    '[attr.data-player]': 'player().user_id',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'player().state',
    '[attr.data-seat]': 'player().seat',
    '[class.is-turn]': 'turn()',
    '[class.is-hit]': 'hit() !== null',
    '[class.is-waiting]': "status() === 'choosing'",
    '[attr.aria-label]': 'label()',
  },
})
export class Nimm6Seat {
  readonly player = input.required<N6Player>();
  readonly variant = input<'column' | 'row' | 'tab' | 'pill'>('column');
  // Angezeigte Hornochsen (während des Anlegens noch ohne die kommenden Reihen)
  readonly score = input.required<number>();
  // ready: hat gewählt; choosing: wählt noch; null: kein Token
  readonly status = input<'ready' | 'choosing' | null>(null);
  // Muss gerade eine Reihe wählen
  readonly turn = input(false);
  // Hat gerade eine Reihe genommen (so viele Hornochsen)
  readonly hit = input<number | null>(null);
  // Host sieht, wie lange dieser Platz schon trödelt ("0:48")
  readonly waiting = input<string | null>(null);
  // "12 Hornochsen" statt nur der Zahl
  readonly long = input(false);
  // Gelegte Karte am Platz
  readonly laid = input<N6Laid | null>(null);

  readonly bull = BULL_PATH;
  // Angezeigte Hornochsen: wachsen in COUNT_UP_MS auf score (fallen sofort)
  readonly shownScore = signal(0);
  readonly counting = signal(false);
  readonly own = computed(() => this.variant() === 'tab' || this.variant() === 'pill');
  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly label = computed(() => {
    const player = this.player();
    const name = this.own() ? 'Du' : player.name;
    if (player.state === 'left') return `${name}, hat verlassen`;
    return [
      name,
      bullsLabel(this.score()),
      this.status() === 'ready' && 'hat gewählt',
      this.status() === 'choosing' && 'wählt noch',
      this.turn() && 'wählt eine Reihe',
      this.hit() !== null && `nimmt ${bullsLabel(this.hit()!)}`,
    ]
      .filter(Boolean)
      .join(', ');
  });

  constructor() {
    let current: number | null = null;
    effect((onCleanup) => {
      const target = this.score();
      const from = current;
      if (
        from === null ||
        target <= from ||
        reducedMotion() ||
        typeof requestAnimationFrame !== 'function'
      ) {
        current = target;
        this.shownScore.set(target);
        return;
      }
      const start = performance.now();
      let frame = 0;
      const tick = (time: number) => {
        const k = Math.min(1, (time - start) / COUNT_UP_MS);
        current = Math.round(from + (target - from) * k);
        this.shownScore.set(current);
        this.counting.set(k < 1);
        if (k < 1) frame = requestAnimationFrame(tick);
      };
      this.counting.set(true);
      frame = requestAnimationFrame(tick);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        this.counting.set(false);
      });
    });
  }
}
