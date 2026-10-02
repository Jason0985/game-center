import { Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { cardName, cardValue, isWild, UnoCard } from './uno.model';

// Eine Uno-Karte (Karten.dc); card null = Rückseite. Größe kommt vom Elternteil über
// --card-w/--card-h, alles darin wächst mit. Farbfläche, großer Wert, Eckindex mit
// Farbform (Rot ●, Gelb ▲, Grün ■, Blau ◆), Farbwahl schwarz mit Farbrad.
@Component({
  selector: 'app-uno-card',
  imports: [NgTemplateOutlet],
  template: `
    @let c = card();
    @if (c === null) {
      <span class="frame"><span class="wheel wheel--back"></span></span>
    } @else {
      <span class="inner"></span>
      <span class="corner corner--start"><ng-container *ngTemplateOutlet="index" /></span>
      <span class="corner corner--end"><ng-container *ngTemplateOutlet="index" /></span>
      @switch (value()) {
        @case ('') {
          <span class="wheel"></span>
        }
        @case ('+4') {
          <span class="wild4"><span class="wheel"></span><span class="plus">+4</span></span>
        }
        @case ('S') {
          <span class="material-symbols-rounded symbol">block</span>
        }
        @case ('R') {
          <span class="material-symbols-rounded symbol">sync_alt</span>
        }
        @default {
          <span class="value" [class.value--plus]="value() === '+2'">{{ value() }}</span>
        }
      }
    }

    <ng-template #index>
      @switch (value()) {
        @case ('') {}
        @case ('S') {
          <span class="material-symbols-rounded">block</span>
        }
        @case ('R') {
          <span class="material-symbols-rounded">sync_alt</span>
        }
        @default {
          {{ value() }}
        }
      }
      @if (!wild()) {
        <span class="shape"></span>
      }
    </ng-template>
  `,
  styleUrl: './uno-card.scss',
  host: {
    '[attr.role]': "card() === null ? null : 'img'",
    '[attr.aria-hidden]': 'card() === null || null',
    '[attr.aria-label]': 'label()',
    '[attr.data-kind]': "card() === null ? 'back' : 'face'",
    '[attr.data-color]': 'card()?.[0] ?? null',
  },
})
export class UnoCardView {
  readonly card = input.required<UnoCard | null>();

  readonly value = computed(() => {
    const card = this.card();
    return card ? cardValue(card) : '';
  });
  readonly wild = computed(() => {
    const card = this.card();
    return !!card && isWild(card);
  });
  readonly label = computed(() => {
    const card = this.card();
    return card ? cardName(card) : null;
  });
}
