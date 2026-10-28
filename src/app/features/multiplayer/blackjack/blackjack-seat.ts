import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { BlackjackCard } from './blackjack-card';
import { BjPlayer, formatMoney, SeatStatus, stakeOf } from './blackjack.model';

// Am Handy höchstens so viele Mini-Karten, danach "+n"
const MAX_MINI = 4;

// Namensschild am Tisch. Mitspieler kompakt (column: Handy/iPad hoch) mit Mini-Karten über
// dem Schild und einem Token für den Rundenstand, bzw. breit (row: quer/Laptop) mit Karten
// darüber, Status- und Einsatz-Tag. Eigener Platz als Reiter (tab) bzw. Pille (pill).
// Einsatz und Guthaben der anderen stehen am Handy nur in der Tischübersicht.
@Component({
  selector: '[appBlackjackSeat]',
  imports: [BlackjackCard],
  templateUrl: './blackjack-seat.html',
  styleUrl: './blackjack-seat.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'player().state',
    '[attr.data-seat]': 'player().seat',
    '[class.is-turn]': 'turn()',
    '[attr.aria-label]': 'label()',
  },
})
export class BlackjackSeat {
  readonly player = input.required<BjPlayer>();
  readonly variant = input<'column' | 'row' | 'tab' | 'pill'>('column');
  readonly status = input<SeatStatus | null>(null);
  readonly turn = input(false);
  // Als Button: öffnet die Tischübersicht
  readonly opensSheet = input(false);

  readonly own = computed(() => this.variant() === 'tab' || this.variant() === 'pill');
  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly stake = computed(() => stakeOf(this.player()));

  // Karten je Hand (data-card wie am Brett, damit sie vom Schuh einfliegen); kompakt
  // höchstens MAX_MINI, der Rest als "+n"
  readonly hands = computed(() => {
    const player = this.player();
    const limit = this.variant() === 'column' ? MAX_MINI : Infinity;
    let left = limit;
    return player.hands.map((hand) => {
      const cards = hand.cards.slice(0, Math.max(0, left));
      left -= cards.length;
      return {
        key: `s${player.seat}:${hand.hand_no}`,
        cards: cards.map((card, i) => ({ card, key: `s${player.seat}:${hand.hand_no}:${i}` })),
      };
    });
  });
  readonly more = computed(() => {
    const shown = this.hands().reduce((sum, hand) => sum + hand.cards.length, 0);
    return this.player().hands.reduce((sum, hand) => sum + hand.cards.length, 0) - shown;
  });

  readonly label = computed(() => {
    const player = this.player();
    if (this.own()) return `Du, Guthaben ${formatMoney(player.balance)}`;
    const status = this.status();
    const label = [
      player.name,
      status?.long,
      this.stake() && `Einsatz ${formatMoney(this.stake())}`,
      `Guthaben ${formatMoney(player.balance)}`,
    ]
      .filter(Boolean)
      .join(', ');
    return this.opensSheet() ? `${label} – Tischübersicht öffnen` : label;
  });
  readonly formatMoney = formatMoney;
}
