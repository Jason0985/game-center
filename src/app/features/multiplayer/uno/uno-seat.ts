import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS, BACK_TILTS, cardCount } from '../table/table.model';
import { UnoPlayer } from './uno.model';

// Rücken unter dem Schild: höchstens so viele, danach zählt nur die Zahl
const MAX_FAN = 10;

// Namensschild am Tisch (Zustände.dc). Mitspieler (column: Handy/iPad hoch, row:
// quer/Laptop) mit Kartenanzahl und Rückenfächer darunter, „UNO!“, Aussetzen-Token und
// rotem Zieh-Chip; eigener Platz als Reiter (tab) bzw. Pille (pill). Als Button
// (7 tauscht) mit Zielring. Größen kommen vom Tisch (CSS-Variablen).
@Component({
  selector: '[appUnoSeat]',
  templateUrl: './uno-seat.html',
  styleUrl: './uno-seat.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'player().state',
    '[attr.data-seat]': 'player().seat',
    '[class.is-turn]': 'turn()',
    '[class.is-winner]': 'winner()',
    '[attr.aria-label]': 'label()',
  },
})
export class UnoSeat {
  readonly player = input.required<UnoPlayer>();
  readonly variant = input<'column' | 'row' | 'tab' | 'pill'>('column');
  readonly dealer = input(false);
  readonly turn = input(false);
  readonly winner = input(false);
  // Einmaliger Gold-Puls direkt nach dem Sieg
  readonly celebrate = input(false);
  // Host sieht, wie lange dieser Platz schon trödelt ("0:48")
  readonly waiting = input<string | null>(null);
  // Wurde gerade übersprungen (Aussetzen-Token, bis er wieder dran wäre)
  readonly skipped = input(false);
  // Muss so viele Karten ziehen (+2/+4-Chip); 0 = nichts offen
  readonly pending = input(0);
  // Rückenfächer unter dem Schild (ab 6 Spielern nur die Zahl)
  readonly fan = input(true);
  // Als Button: Tauschpartner für die 7
  readonly swapTarget = input(false);

  readonly own = computed(() => this.variant() === 'tab' || this.variant() === 'pill');
  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly uno = computed(() => this.player().hand_count === 1 && this.player().uno_called);
  readonly backs = computed(() => BACK_TILTS[Math.min(this.player().hand_count, 3) - 1] ?? []);
  readonly fanCards = computed(() => {
    const n = this.fan() && !this.own() ? Math.min(this.player().hand_count, MAX_FAN) : 0;
    return Array.from({ length: n }, (_, i) => {
      const o = i - (n - 1) / 2;
      return `translateY(${0.4 * o * o}px) rotate(${4 * o}deg)`;
    });
  });
  readonly label = computed(() => {
    const player = this.player();
    const name = this.own() ? 'Du' : player.name;
    if (player.state === 'left') return `${name}, hat verlassen`;
    const label = [
      name,
      !this.own() && cardCount(player.hand_count),
      this.turn() && 'am Zug',
      this.pending() && `muss ${this.pending()} ziehen`,
      this.skipped() && 'setzt aus',
      this.uno() && 'Uno',
    ]
      .filter(Boolean)
      .join(', ');
    return this.swapTarget() ? `${label} – Karten tauschen` : label;
  });
}
