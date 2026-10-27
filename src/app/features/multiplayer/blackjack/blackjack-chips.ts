import { Component, computed, input } from '@angular/core';
import { chipStack, CHIPS } from './blackjack.model';

// Chipstapel eines Betrags (Einsatzfeld, fliegende Chips) bzw. ein einzelner Chip
// (value, Chip-Knöpfe). Gestrichelter Rand, Wert im inneren Ring (Karten.dc).
// Größe über --chip (Standard 48 px); gestapelt rückt jeder Chip 4 px höher.
@Component({
  selector: 'app-blackjack-chips',
  template: `
    @for (chip of chips(); track $index) {
      <span class="chip" [style.background]="chip.color" [style.--i]="$index"
        ><span class="chip-in">{{ chip.value }}</span></span
      >
    }
  `,
  styles: `
    :host {
      --chip: 48px;
      position: relative;
      display: block;
      width: var(--chip);
      height: var(--chip);
      pointer-events: none;
    }

    .chip {
      position: absolute;
      top: calc(var(--i) * -4px);
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--chip);
      height: var(--chip);
      box-sizing: border-box;
      border: calc(var(--chip) * 0.083) dashed rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
    }

    .chip-in {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 62.5%;
      height: 62.5%;
      box-sizing: border-box;
      border: 1.5px solid rgba(255, 255, 255, 0.45);
      border-radius: 50%;
      color: #ffffff;
      font-size: calc(var(--chip) * 0.23);
      font-weight: 800;
      letter-spacing: -0.02em;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class BlackjackChips {
  // Betrag als Stapel; value: genau dieser eine Chip
  readonly amount = input(0);
  readonly value = input<number | null>(null);

  readonly chips = computed(() => {
    const value = this.value();
    const chip = CHIPS.find((item) => item.value === value);
    return chip ? [chip] : chipStack(this.amount());
  });
}
