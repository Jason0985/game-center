import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { matchScore, SetScore, setsToWin, validSet } from './table-tennis.model';

export interface TtResultSheetData {
  title: string;
  names: [string, string];
  bestOf: number;
  // Bisheriges Ergebnis (Punkte je Satz aus Sicht des ersten Namens)
  sets: SetScore[] | null;
}

type Row = [string, string];

const parse = ([a, b]: Row): SetScore | null =>
  /^\d{1,2}$/.test(a) && /^\d{1,2}$/.test(b) ? [+a, +b] : null;

// Ergebnis eines Turnierspiels: Punkte je Satz; schließt mit den Sätzen (oder ohne Wert)
@Component({
  selector: 'app-tt-result-sheet',
  template: `
    <div class="sheet-grip" aria-hidden="true"></div>
    <div class="sheet-head">
      <h2>{{ data.title }}</h2>
      <button type="button" class="cancel" (click)="sheet.dismiss()">Abbrechen</button>
    </div>

    <div class="grid" role="group" aria-label="Punkte je Satz">
      <span></span>
      <span class="name">{{ data.names[0] }}</span>
      <span></span>
      <span class="name">{{ data.names[1] }}</span>
      @for (row of visibleRows(); track $index; let i = $index) {
        <span class="label">Satz {{ i + 1 }}</span>
        @for (side of [0, 1]; track side) {
          @if (side) {
            <span class="colon" aria-hidden="true">:</span>
          }
          <input
            type="text"
            inputmode="numeric"
            maxlength="2"
            autocomplete="off"
            [class.invalid]="invalid()[i]"
            [attr.aria-label]="'Satz ' + (i + 1) + ', Punkte ' + data.names[side]"
            [value]="row[side]"
            (input)="edit(i, side, $any($event.target).value)"
          />
        }
      }
    </div>

    <p class="status" [class.status--done]="score()" aria-live="polite">
      @if (score(); as result) {
        {{ data.names[result[0] > result[1] ? 0 : 1] }} gewinnt
        {{ Math.max(result[0], result[1]) }}:{{ Math.min(result[0], result[1]) }}
      } @else if (invalid().includes(true)) {
        Ein Satz geht bis 11, mit 2 Punkten Vorsprung (z. B. 11:9 oder 13:11).
      } @else {
        Best of {{ data.bestOf }}: wer zuerst {{ need }} Sätze hat, gewinnt.
      }
    </p>

    <button type="button" class="ui-btn" [disabled]="!score()" (click)="save()">Speichern</button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-sizing: border-box;
      max-height: 88dvh;
      padding: 8px 16px calc(24px + env(safe-area-inset-bottom, 0px));
      overflow-y: auto;
      color: var(--color-text);
      font-family: var(--font-sans);
      letter-spacing: normal;
    }

    .cancel {
      min-height: 44px;
      margin-right: -6px;
      padding: 0 6px;
      border: 0;
      background: none;
      color: var(--color-primary-light);
      font: inherit;
      font-size: 17px;
      cursor: pointer;
    }

    .grid {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 10px 8px;
    }

    .name {
      overflow: hidden;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      color: var(--color-text-muted);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
    }

    .colon {
      color: var(--color-text-subtle);
      font-size: 20px;
      font-weight: 700;
    }

    input {
      width: 100%;
      height: 52px;
      box-sizing: border-box;
      border: 2px solid transparent;
      border-radius: var(--radius-medium);
      background: var(--color-surface-raised);
      color: var(--color-text);
      font: inherit;
      font-size: 24px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    input:focus {
      border-color: var(--color-primary-light);
      outline: 0;
    }

    input.invalid {
      border-color: var(--color-danger-light);
    }

    .status {
      min-height: 40px;
      margin: 0;
      color: var(--color-text-muted);
      font-size: 14px;
      line-height: 1.4;
      text-align: center;
    }

    .status--done {
      color: var(--color-success-light);
      font-size: 17px;
      font-weight: 700;
    }
  `,
})
export class TtResultSheet {
  readonly data = inject<TtResultSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject<MatBottomSheetRef<TtResultSheet, SetScore[]>>(MatBottomSheetRef);
  readonly Math = Math;
  readonly need = setsToWin(this.data.bestOf);

  readonly rows = signal<Row[]>(
    Array.from({ length: this.data.bestOf }, (_, i): Row => {
      const set = this.data.sets?.[i];
      return set ? [String(set[0]), String(set[1])] : ['', ''];
    }),
  );
  // Ausgefüllte Sätze bis zum ersten leeren oder bis zur Entscheidung; spätere (etwa aus einem
  // geänderten alten Ergebnis) zählen nicht
  private readonly sets = computed(() => {
    const sets: SetScore[] = [];
    const won: SetScore = [0, 0];
    for (const row of this.rows()) {
      const set = parse(row);
      if (!set) break;
      sets.push(set);
      if (validSet(set) && ++won[set[0] > set[1] ? 0 : 1] >= this.need) break;
    }
    return sets;
  });
  readonly score = computed(() => matchScore(this.sets(), this.data.bestOf));
  // Bis zur Entscheidung, sonst noch der nächste leere Satz
  readonly visibleRows = computed(() => {
    const count = this.sets().length;
    return this.rows().slice(0, this.score() ? count : Math.min(count + 1, this.data.bestOf));
  });
  // Komplett ausgefüllt, aber kein gültiger Satz
  readonly invalid = computed(() =>
    this.visibleRows().map((row) => {
      const set = parse(row);
      return !!set && !validSet(set);
    }),
  );

  edit(index: number, side: number, value: string): void {
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? (side ? [row[0], value] : [value, row[1]]) : row)),
    );
  }

  save(): void {
    if (this.score()) this.sheet.dismiss(this.sets());
  }
}
