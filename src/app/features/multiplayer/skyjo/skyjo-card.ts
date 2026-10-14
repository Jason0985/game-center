import {
  afterNextRender,
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { reducedMotion } from '../table/table-motion';
import { cardColors, cardText } from './skyjo.model';

// Halbe Drehung beim Aufdecken (Rücken weg, Zahl zurück)
const TURN_MS = 180;

// Eine Karte nach dem Kartendesign: Fläche in der Farbe ihres Werts, heller Innenrahmen,
// Raute dahinter, große Zahl, ab 31 px zwei Eckzahlen. card null = Rückseite (App-Rahmen,
// ab 45 px mit Logo). Wird eine verdeckte Karte aufgedeckt, dreht sie sich um. Größe über
// --card-w vom Elternteil (Höhe 1,42 ×).
@Component({
  selector: 'app-skyjo-card',
  template: `
    @let value = shown();
    @if (value === null) {
      <span class="frame" aria-hidden="true"></span>
      <span class="logo" aria-hidden="true">
        <span>S</span><span>K</span><span>Y</span><span>J</span><span>O</span>
      </span>
    } @else {
      <span class="inner" aria-hidden="true"></span>
      <span class="diamond" aria-hidden="true"></span>
      <span class="value" aria-hidden="true">{{ text() }}</span>
      <span class="corner corner--start" aria-hidden="true">{{ text() }}</span>
      <span class="corner corner--end" aria-hidden="true">{{ text() }}</span>
    }
  `,
  styleUrl: './skyjo-card.scss',
  host: {
    '[attr.role]': "shown() === null ? null : 'img'",
    '[attr.aria-hidden]': 'shown() === null || null',
    '[attr.aria-label]': 'label()',
    '[class.back]': 'shown() === null',
    '[class.turn-away]': "turn() === 'away'",
    '[class.turn-up]': "turn() === 'up'",
    '[style.--face]': 'colors()?.face',
    '[style.--ink]': 'colors()?.ink',
  },
})
export class SkyjoCardView {
  readonly card = input.required<number | null>();

  // Angezeigter Wert: beim Aufdecken erst nach der halben Drehung
  readonly shown = signal<number | null>(null);
  readonly turn = signal<'away' | 'up' | null>(null);
  readonly text = computed(() => {
    const value = this.shown();
    return value === null ? '' : cardText(value);
  });
  readonly colors = computed(() => {
    const value = this.shown();
    return value === null ? null : cardColors(value);
  });
  readonly label = computed(() => {
    const value = this.shown();
    return value === null ? null : `Karte ${cardText(value)}`;
  });

  constructor() {
    let live = false;
    afterNextRender(() => (live = true));
    effect((onCleanup) => {
      const value = this.card();
      const before = untracked(this.shown);
      if (!live || before !== null || value === null || reducedMotion()) {
        this.shown.set(value);
        this.turn.set(null);
        return;
      }
      this.turn.set('away');
      const timers = [
        setTimeout(() => {
          this.shown.set(value);
          this.turn.set('up');
        }, TURN_MS),
        setTimeout(() => this.turn.set(null), TURN_MS * 2 + 40),
      ];
      onCleanup(() => timers.forEach(clearTimeout));
    });
  }
}
