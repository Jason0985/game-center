import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { cardAriaLabel, cardName, Flip7Card, isActionCard, isNumberCard } from './flip7.model';

export type Flip7CardSize = 'xs' | 'sm' | 'md' | 'lg';

// Akzentfarben der Zahlenkarten, reihum nach Wert
const NUMBER_ACCENTS = [
  'var(--color-chart-cyan)',
  'var(--color-chart-blue)',
  'var(--color-chart-green)',
  'var(--color-chart-yellow)',
  'var(--color-chart-orange)',
  'var(--color-secondary)',
  'var(--color-primary-light)',
];

const ACTION_ICONS = { FREEZE: 'ac_unit', FLIP3: 'filter_3', SC: 'favorite' } as const;

// Eine offene Karte; card null = Rückseite (Nachziehstapel)
@Component({
  selector: 'app-flip7-card',
  imports: [MatIconModule],
  template: `
    @let value = card();
    @if (value === null) {
      <span class="card card--back" role="img" aria-label="Nachziehstapel"></span>
    } @else {
      <span
        [class]="'card card--' + kind()"
        [class.card--dup]="highlight() === 'dup'"
        [style.--accent]="accent()"
        role="img"
        [attr.aria-label]="label()"
      >
        @switch (kind()) {
          @case ('number') {
            <span class="card-corner" aria-hidden="true">{{ value }}</span>
            <span class="card-value" aria-hidden="true">{{ value }}</span>
          }
          @case ('modifier') {
            <span class="card-value" aria-hidden="true">{{ name() }}</span>
          }
          @case ('action') {
            <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
            <span class="card-name" aria-hidden="true">{{ name() }}</span>
          }
        }
      </span>
    }
  `,
  styleUrl: './flip7-card.scss',
  host: { '[attr.data-size]': 'size()' },
})
export class Flip7CardView {
  readonly card = input.required<Flip7Card | null>();
  readonly size = input<Flip7CardSize>('md');
  readonly highlight = input<'dup' | null>(null);

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
    return card === null ? '' : cardAriaLabel(card);
  });
  readonly icon = computed(() => {
    const card = this.card();
    return card !== null && isActionCard(card) ? ACTION_ICONS[card] : '';
  });
  readonly accent = computed(() => {
    const card = this.card();
    if (card === null) return null;
    if (isNumberCard(card)) return NUMBER_ACCENTS[Number(card) % NUMBER_ACCENTS.length];
    if (card === 'FREEZE') return 'var(--color-chart-cyan)';
    if (card === 'FLIP3') return 'var(--color-primary-light)';
    if (card === 'SC') return 'var(--color-success-light)';
    return 'var(--color-warning)';
  });
}
