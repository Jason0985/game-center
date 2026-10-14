import { Component, computed, input } from '@angular/core';
import { BULL_PATH, bullsLabel, bullsOf, CARD_COLORS } from './nimm6.model';

// Eine Karte nach dem Kartendesign: weißer Rand, Fläche in der Farbe ihrer Hornochsen, oben
// die Ochsen, dahinter ein großer Ochse, die Zahl mit dunkler Kontur; ab 41 px Breite unten
// zwei Eckzahlen. card null = Rückseite. Größe über --card-w vom Elternteil (Höhe 1,42 ×).
@Component({
  selector: 'app-nimm6-card',
  template: `
    @let value = card();
    @if (value === null) {
      <span class="frame" aria-hidden="true"></span>
      <svg class="back-bull" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="bull" /></svg>
      <span class="back-six" aria-hidden="true">nimm 6</span>
    } @else {
      <span class="face" aria-hidden="true">
        <span class="bulls">
          @for (b of heads(); track $index) {
            <svg viewBox="0 0 24 24"><path [attr.d]="bull" /></svg>
          }
        </span>
        <svg class="bg" viewBox="0 0 24 24"><path [attr.d]="bull" /></svg>
        <span class="num">{{ value }}</span>
        <span class="corner corner--start">{{ value }}</span>
        <span class="corner corner--end">{{ value }}</span>
      </span>
    }
  `,
  styleUrl: './nimm6-card.scss',
  host: {
    '[attr.role]': "card() === null ? null : 'img'",
    '[attr.aria-hidden]': 'card() === null || null',
    '[attr.aria-label]': 'label()',
    '[class.back]': 'card() === null',
    '[style.--face]': 'colors()?.face',
    '[style.--deep]': 'colors()?.deep',
    '[style.--ink]': 'colors()?.ink',
  },
})
export class Nimm6CardView {
  readonly card = input.required<number | null>();

  readonly bull = BULL_PATH;
  readonly heads = computed(() => {
    const card = this.card();
    return Array.from({ length: card === null ? 0 : bullsOf(card) });
  });
  readonly colors = computed(() => {
    const card = this.card();
    return card === null ? null : CARD_COLORS[bullsOf(card)];
  });
  readonly label = computed(() => {
    const card = this.card();
    return card === null ? null : `${card}, ${bullsLabel(bullsOf(card))}`;
  });
}
