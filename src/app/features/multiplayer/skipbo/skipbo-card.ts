import { Component, computed, input } from '@angular/core';
import { cardGroup, cardLabel, SkipboCard } from './skipbo.model';

// Eine Karte; card null = Rückseite. Größe kommt vom Elternteil über --card-w/--card-h.
// row: eigene Karten, Aufbaustapel (Wert mittig, Eckindizes, Gruppenpunkte); fan:
// verdeckte Karten im Ablage-Fächer (nur die Zahl oben links im Streifen); flat: nur der
// Wert mittig (kleine Karten); edge: nur die Fläche (Kante einer Karte darunter).
@Component({
  selector: 'app-skipbo-card',
  template: `
    @let value = card();
    @if (value === null) {
      <span class="frame"><span class="sb">SB</span></span>
    } @else if (variant() !== 'edge') {
      @if (value === 'SB') {
        @switch (variant()) {
          @case ('row') {
            <span class="joker">
              <span class="material-symbols-rounded joker-icon">auto_awesome</span>
              <span class="joker-text">JOKER</span>
            </span>
          }
          @case ('fan') {
            <span class="material-symbols-rounded fan-joker">auto_awesome</span>
          }
          @default {
            <span class="material-symbols-rounded flat-joker">auto_awesome</span>
          }
        }
        @if (jokerValue(); as next) {
          <span class="badge">{{ next }}</span>
        }
      } @else if (variant() === 'fan') {
        <span class="fan-value">{{ value }}</span>
      } @else {
        @if (variant() === 'row') {
          <span class="corner corner--start">{{ value }}</span>
          <span class="corner corner--end">{{ value }}</span>
        }
        <span class="value">{{ value }}</span>
        @if (variant() === 'row') {
          <span class="dots">
            @for (dot of dots(); track $index) {
              <span></span>
            }
          </span>
        }
      }
    }
  `,
  styleUrl: './skipbo-card.scss',
  host: {
    '[attr.role]': "card() === null || variant() === 'edge' ? null : 'img'",
    '[attr.aria-hidden]': "card() === null || variant() === 'edge' || null",
    '[attr.aria-label]': 'label()',
    '[attr.data-kind]': "card() === null ? 'back' : 'face'",
    '[attr.data-variant]': 'variant()',
    '[attr.data-group]': 'group()',
    '[class.wide]': "card()?.length === 2 && card() !== 'SB'",
  },
})
export class SkipboCardView {
  readonly card = input.required<SkipboCard | null>();
  readonly variant = input<'row' | 'fan' | 'flat' | 'edge'>('row');
  // Joker oben auf einem Aufbaustapel: Badge mit dem angenommenen Wert
  readonly jokerValue = input<number | null>(null);

  readonly group = computed(() => {
    const card = this.card();
    return card === null ? null : cardGroup(card);
  });
  readonly dots = computed(() => Array.from({ length: Number(this.group()) || 0 }));
  readonly label = computed(() => {
    const card = this.card();
    if (card === null || this.variant() === 'edge') return null;
    return this.jokerValue() ? `Joker als ${this.jokerValue()}` : cardLabel(card);
  });
}
