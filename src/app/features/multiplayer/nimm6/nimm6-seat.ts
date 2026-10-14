import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { BULL_PATH, bullsLabel, N6Player } from './nimm6.model';

// Namensschild am Tisch (Spieltisch-Artboards): Avatar mit Bereit-Token (grüner Haken bzw.
// grau „wählt …“), Name und Hornochsen. Mitspieler als Spalte (Handy, iPad hoch) bzw. Pille
// (quer, Laptop), eigener Platz als Reiter (tab) bzw. Pille (pill). Beim Nehmen einer Reihe
// roter Rand und „+8“. Größen kommen vom Tisch (CSS-Variablen).
@Component({
  selector: '[appNimm6Seat]',
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
        <span class="bulls">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="bull" /></svg>
          {{ score() }}
          @if (long()) {
            <span class="unit">&nbsp;Hornochsen</span>
          }
        </span>
      }
    </span>

    @if (status() === 'ready' && variant() === 'row') {
      <span class="mini-back" aria-hidden="true"></span>
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

  readonly bull = BULL_PATH;
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
}
