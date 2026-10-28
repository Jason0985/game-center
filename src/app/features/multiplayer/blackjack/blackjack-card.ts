import { Component, computed, input } from '@angular/core';
import { BjCard, cardName, isPicture, rankOf, suitOf } from './blackjack.model';

// Eine Blackjack-Karte (Karten.dc); card null = Rückseite. Größe kommt vom Elternteil über
// --card-w/--card-h, alles darin wächst mit. Eckindex oben links und (gedreht) unten
// rechts, in der Mitte das Farbsymbol bzw. bei Bildern der gerahmte Buchstabe.
// data-size="mini" (Mitspieler am Handy): nur der Index, mittig.
@Component({
  selector: 'app-blackjack-card',
  template: `
    @if (card(); as c) {
      <span class="ix">
        {{ rank() }}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="suit()?.path" /></svg>
      </span>
      <span class="ctr">
        @if (picture()) {
          <span class="fl">{{ rank() }}</span>
        } @else {
          <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="suit()?.path" /></svg>
        }
      </span>
      <span class="ix ix--end">
        {{ rank() }}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="suit()?.path" /></svg>
      </span>
    } @else {
      <span class="frame"></span>
    }
  `,
  styleUrl: './blackjack-card.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': "card() ? name() : 'Verdeckte Karte'",
    '[attr.data-kind]': "card() ? 'face' : 'back'",
    '[attr.data-red]': 'suit()?.red || null',
  },
})
export class BlackjackCard {
  readonly card = input.required<BjCard | null>();

  readonly rank = computed(() => {
    const card = this.card();
    return card ? rankOf(card) : '';
  });
  readonly suit = computed(() => {
    const card = this.card();
    return card ? suitOf(card) : null;
  });
  readonly picture = computed(() => {
    const card = this.card();
    return !!card && isPicture(card);
  });
  readonly name = computed(() => {
    const card = this.card();
    return card ? cardName(card) : '';
  });
}
