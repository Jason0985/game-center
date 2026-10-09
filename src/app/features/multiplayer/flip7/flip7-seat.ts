import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import {
  distinctNumbers,
  Flip7ActionCard,
  Flip7Player,
  flip7Score,
  FLIP7_BONUS,
} from './flip7.model';

// 7 Ringsegmente (viewBox 48, Radius 22) im Uhrzeigersinn ab 12 Uhr, 4,5° Lücke je Seite
const RING_PATHS = Array.from({ length: 7 }, (_, i) => {
  const point = (degrees: number) => {
    const rad = (degrees * Math.PI) / 180;
    return `${(24 + 22 * Math.sin(rad)).toFixed(2)} ${(24 - 22 * Math.cos(rad)).toFixed(2)}`;
  };
  return `M${point((i * 360) / 7 + 4.5)} A22 22 0 0 1 ${point(((i + 1) * 360) / 7 - 4.5)}`;
});

const CHOICE_LABELS: Record<Flip7ActionCard, string> = {
  FREEZE: 'Einfrieren',
  FLIP3: 'Flip 3',
  SC: 'Zweites Leben',
};
const CHOICE_ARIA: Record<Flip7ActionCard, (name: string) => string> = {
  FREEZE: (name) => `${name} einfrieren`,
  FLIP3: (name) => `${name} Flip 3 geben`,
  SC: (name) => `${name} ein zweites Leben geben`,
};

// Namensschild am Tisch: Avatar mit Flip-7-Ring, Tokens, Name, ★ Gesamt und Rundenchip.
// Eigener Platz als Pille (mine) bzw. als Reiter am Bedienfeld (tab: nur Avatar und Name,
// die Punkte stehen darunter im Bedienfeld). Als <button> während der Zielwahl, sonst
// <div>. Größen kommen vom Tisch (CSS-Variablen).
@Component({
  selector: '[appFlip7Seat]',
  templateUrl: './flip7-seat.html',
  styleUrl: './flip7-seat.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'player().state',
    '[attr.data-seat]': 'player().seat',
    '[attr.data-choice]': 'choice()',
    '[class.is-turn]': 'turn()',
    '[class.is-dimmed]': 'dimmed()',
    '[class.is-own]': 'own()',
    '[class.has-waiting]': 'waiting() !== null',
    '[attr.aria-label]': 'label()',
  },
})
export class Flip7Seat {
  readonly player = input.required<Flip7Player>();
  // column: Mitspieler Handy/iPad hoch; row: Mitspieler quer/Laptop; mine: eigenes Schild
  readonly variant = input<'column' | 'row' | 'mine' | 'tab'>('column');
  readonly turn = input(false);
  // Noch zu ziehende Karten, solange dieser Platz Flip 3 abarbeitet
  readonly flip3Left = input<number | null>(null);
  // Wählbar als Ziel dieser Aktionskarte
  readonly choice = input<Flip7ActionCard | null>(null);
  readonly dimmed = input(false);
  // Host sieht, wie lange dieser Platz schon trödelt ("0:48")
  readonly waiting = input<string | null>(null);
  // Einmalige Effekte, nur direkt nach der passenden Aktion
  readonly celebrate = input(false);
  // Rundenende-Tisch: Flip-7-Bonus am Chip zeigen
  readonly bonus = input(false);

  readonly ringPaths = RING_PATHS;
  readonly flip7Bonus = FLIP7_BONUS;
  readonly choiceLabels = CHOICE_LABELS;

  readonly filled = computed(() => distinctNumbers(this.player().cards));
  readonly points = computed(() => flip7Score(this.player().cards, this.player().state));
  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly chipText = computed(() =>
    this.player().state === 'busted' ? '0' : `+${this.points()}`,
  );
  readonly own = computed(() => this.variant() === 'mine' || this.variant() === 'tab');
  readonly label = computed(() => {
    const player = this.player();
    const choice = this.choice();
    if (!choice) return this.own() ? null : player.name;
    const points = `${this.points()} Rundenpunkte`;
    return this.own()
      ? `Dich selbst wählen, ${points}`
      : `${CHOICE_ARIA[choice](player.name)}, ${points}`;
  });
}
