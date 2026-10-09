import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS, BACK_TILTS, cardCount } from '../table/table.model';
import { SkipboCardView } from './skipbo-card';
import { SkipboFan } from './skipbo-fan';
import { cardName, SkipboCard, SkipboPlayer } from './skipbo.model';

// Namensschild am Tisch. Mitspieler (column: iPad hoch, row: quer/Laptop, line: Zeile
// in der Handy-Liste) mit Stapel-Chip, Handanzahl und ihrer Auslage (Spielstapel-
// Oberkarte, 4 Ablagen; darunter, bei line rechts daneben);
// eigener Platz als Reiter am Bedienfeld (tab) bzw. Pille auf dem Tisch (pill).
// Größen kommen vom Tisch (CSS-Variablen).
@Component({
  selector: '[appSkipboSeat]',
  imports: [SkipboCardView, SkipboFan],
  templateUrl: './skipbo-seat.html',
  styleUrl: './skipbo-seat.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'player().state',
    '[attr.data-seat]': 'player().seat',
    '[class.is-turn]': 'turn()',
    '[class.is-winner]': 'winner()',
    '[class.has-waiting]': 'waiting() !== null',
    '[attr.aria-label]': 'label()',
  },
})
export class SkipboSeat {
  readonly player = input.required<SkipboPlayer>();
  readonly variant = input<'column' | 'row' | 'line' | 'tab' | 'pill'>('column');
  readonly turn = input(false);
  readonly winner = input(false);
  // Einmaliger Gold-Puls direkt nach dem Sieg
  readonly celebrate = input(false);
  // Host sieht, wie lange dieser Platz schon trödelt ("0:48")
  readonly waiting = input<string | null>(null);
  // Handy: Auslage flach mit Kanten statt gefächert
  readonly flat = input(false);

  readonly own = computed(() => this.variant() === 'tab' || this.variant() === 'pill');
  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly backs = computed(() => BACK_TILTS[Math.min(this.player().hand_count, 3) - 1] ?? []);
  readonly label = computed(() => {
    const player = this.player();
    const name = this.own() ? 'Du' : player.name;
    if (player.state === 'left') return `${name}, hat verlassen`;
    return this.turn() ? `${name}, am Zug` : name;
  });
  readonly stockLabel = computed(() => {
    const { name, stock_top: top, stock_count: count } = this.player();
    return top
      ? `${name}: Spielstapel oben ${cardName(top)}, noch ${cardCount(count)}`
      : `${name}: Spielstapel leer`;
  });

  // Karten unten → oben, wie sie im Fächer liegen
  discardLabel(index: number, pile: readonly SkipboCard[]): string {
    return pile.length
      ? `Ablage ${index + 1}, ${cardCount(pile.length)}: ${pile.map(cardName).join(', ')}`
      : `Ablage ${index + 1}, leer`;
  }
}
