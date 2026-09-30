import { Component, inject, Signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

export interface Flip7HistoryRow {
  icon: string;
  color: string;
  text: string;
  // "jetzt" oder "m:ss"
  time: string;
}

// Signale statt fester Werte: Der Verlauf läuft weiter, während er offen ist
export interface Flip7HistoryData {
  rows: Signal<Flip7HistoryRow[]>;
  round: Signal<number>;
}

// Verlauf der laufenden Runde als Bottom-Sheet (neueste Aktion oben und fett)
@Component({
  selector: 'app-flip7-history-sheet',
  template: `
    <div class="grip" aria-hidden="true"></div>
    <div class="head">
      <h2>Verlauf · Runde {{ data.round() }}</h2>
      <button type="button" class="close" aria-label="Schließen" (click)="sheet.dismiss()">
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
      </button>
    </div>
    <ol class="rows">
      @for (row of data.rows(); track $index) {
        <li [class.latest]="$first">
          <span class="icon">
            <span class="material-symbols-rounded" aria-hidden="true" [style.color]="row.color">{{
              row.icon
            }}</span>
          </span>
          <span class="text">{{ row.text }}</span>
          <span class="time">{{ row.time }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
      height: 61dvh;
      box-sizing: border-box;
      padding: 10px 16px 16px;
      color: var(--color-text);
      font-family: var(--font-sans);
      letter-spacing: normal;
    }

    .grip {
      align-self: center;
      width: 40px;
      height: 4px;
      margin-bottom: 6px;
      border-radius: 2px;
      background: #6b7280;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
    }

    .close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: var(--color-surface-raised);
      color: var(--color-text);
      cursor: pointer;
    }

    .close span {
      font-size: 22px;
    }

    .rows {
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 4px;
      border-bottom: 1px solid var(--color-border-subtle);
    }

    li.latest {
      font-weight: 700;
    }

    .icon {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-surface-raised);
    }

    .icon span {
      font-size: 18px;
      font-variation-settings: 'FILL' 1;
    }

    .text {
      flex-grow: 1;
      font-size: 14px;
    }

    .time {
      color: var(--color-text-muted);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class Flip7HistorySheet {
  readonly data = inject<Flip7HistoryData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject(MatBottomSheetRef);
}
