import { Component, computed, input } from '@angular/core';
import {
  ACTION_COLORS,
  ACTION_ICONS,
  cardAriaLabel,
  cardName,
  Flip7Card,
  isActionCard,
  isNumberCard,
  MODIFIER_COLORS,
  NUMBER_COLORS,
} from './flip7.model';

// Eine Karte; card null = Rückseite. Größe kommt vom Elternteil über --card-w/--card-h.
// row: eigene Karten, Ablage (Innenrahmen wie Uno, Wert mittig, zwei Eckindizes); fan:
// Mitspieler ab iPad (Zahl oben links, Mini-Index unten rechts); flat: kleine Karten nur
// mit Wert.
@Component({
  selector: 'app-flip7-card',
  template: `
    @let value = card();
    @if (kind() !== 'back' && variant() === 'row') {
      <span class="inner"></span>
    }
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
        @if (variant() === 'row') {
          <span class="corner corner--start">{{ name() }}</span>
          <span class="corner corner--end">{{ name() }}</span>
        }
        <span class="value">{{ name() }}</span>
      }
      @case ('action') {
        @if (value === 'FLIP3') {
          <svg class="flip3" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="6.5" width="9" height="13" rx="1.8" transform="rotate(-16 7 13)" />
            <rect x="12.5" y="6.5" width="9" height="13" rx="1.8" transform="rotate(16 17 13)" />
            <rect x="7.5" y="4.5" width="9" height="13.5" rx="1.8" />
            <text x="12" y="14.6" text-anchor="middle">3</text>
          </svg>
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
    '[class.double]': "card() === 'x2'",
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
    if (isNumberCard(card)) return NUMBER_COLORS[Number(card)];
    if (isActionCard(card)) return ACTION_COLORS[card];
    return card === 'x2' ? MODIFIER_COLORS.double : MODIFIER_COLORS.bonus;
  });
}
