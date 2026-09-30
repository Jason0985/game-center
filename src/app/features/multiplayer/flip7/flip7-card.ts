import { Component, computed, input } from '@angular/core';
import {
  ACTION_COLORS,
  ACTION_ICONS,
  cardAriaLabel,
  cardName,
  Flip7Card,
  isActionCard,
  isNumberCard,
  NUMBER_COLORS,
} from './flip7.model';

// Eine Karte; card null = Rückseite. Größe kommt vom Elternteil über --card-w/--card-h.
// row: eigene Karten, Ablage (Wert mittig, zwei Eckindizes); fan: Mitspieler ab iPad
// (Zahl oben links, Mini-Index unten rechts); flat: kleine Karten nur mit Wert.
@Component({
  selector: 'app-flip7-card',
  template: `
    @let value = card();
    @switch (kind()) {
      @case ('back') {
        <span class="frame"><span class="seven">7</span></span>
      }
      @case ('number') {
        @if (variant() === 'fan') {
          <span class="fan-value">{{ value }}</span>
          <span class="fan-index">{{ value }}</span>
        } @else {
          @if (variant() === 'row') {
            <span class="corner corner--start">{{ value }}</span>
            <span class="corner corner--end">{{ value }}</span>
          }
          <span class="value">{{ value }}</span>
        }
      }
      @case ('modifier') {
        <span class="value">{{ name() }}</span>
      }
      @case ('action') {
        @if (value === 'FLIP3') {
          <span class="three">3</span>
        } @else {
          <span class="material-symbols-rounded icon">{{ icon() }}</span>
        }
        @if (variant() === 'row') {
          <span class="sub">{{ name() }}</span>
        }
      }
    }
  `,
  styleUrl: './flip7-card.scss',
  host: {
    '[attr.role]': "kind() === 'back' ? null : 'img'",
    '[attr.aria-hidden]': "kind() === 'back' || null",
    '[attr.aria-label]': 'label()',
    '[attr.data-kind]': 'kind()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-highlight]': 'highlight()',
    '[class.underline]': "card() === '6' || card() === '9'",
    '[style.--face]': 'colors()?.bg',
    '[style.--ink]': 'colors()?.fg',
  },
})
export class Flip7CardView {
  readonly card = input.required<Flip7Card | null>();
  readonly variant = input<'row' | 'fan' | 'flat'>('row');
  // bust: graue Karte eines rausgeflogenen Spielers; dup: die doppelte Zahl
  readonly highlight = input<'dup' | 'bust' | null>(null);

  readonly kind = computed(() => {
    const card = this.card();
    if (card === null) return 'back';
    if (isNumberCard(card)) return 'number';
    return isActionCard(card) ? 'action' : 'modifier';
  });
  readonly name = computed(() => {
    const card = this.card();
    return card === null ? '' : cardName(card);
  });
  readonly label = computed(() => {
    const card = this.card();
    if (card === null) return null;
    return this.highlight() === 'dup'
      ? `${cardAriaLabel(card)}, doppelt – Bust`
      : cardAriaLabel(card);
  });
  readonly icon = computed(() => {
    const card = this.card();
    return card !== null && isActionCard(card) ? ACTION_ICONS[card].icon : '';
  });
  readonly colors = computed(() => {
    const card = this.card();
    if (card === null) return null;
    if (isNumberCard(card)) return { bg: NUMBER_COLORS[Number(card) % 7], fg: '#0f1115' };
    return isActionCard(card) ? ACTION_COLORS[card] : null;
  });
}
