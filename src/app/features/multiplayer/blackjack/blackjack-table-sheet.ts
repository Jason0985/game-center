import { Component, inject, Signal } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { BlackjackCard } from './blackjack-card';
import { BjCard, BjTone } from './blackjack.model';

export interface BjSheetRow {
  key: string;
  name: string;
  you: boolean;
  // Initiale; null beim Dealer (Symbol)
  initial: string | null;
  color: string;
  turn: boolean;
  status: string;
  tone: BjTone;
  // null = verdeckte Karte
  cards: (BjCard | null)[];
  value: string | null;
  valueTone: BjTone;
  // "100 · −25", "kein Einsatz"; null beim Dealer
  stake: string | null;
  stakeTone: BjTone;
  dot: string | null;
  balance: string | null;
}

// Signale statt fester Werte: Der Tisch läuft weiter, während die Übersicht offen ist
export interface BjSheetData {
  title: Signal<string>;
  sub: Signal<string>;
  rows: Signal<BjSheetRow[]>;
}

// Tischübersicht am Handy/iPad hoch (Handy-Uebersicht.dc): je Platz eine Zeile mit
// Status, Karten, Wert, Einsatz und Ergebnis, Guthaben. Öffnet sich per Tipp auf einen Platz.
@Component({
  selector: 'app-blackjack-table-sheet',
  imports: [BlackjackCard],
  template: `
    <div class="sheet-grip" aria-hidden="true"></div>
    <div class="sheet-head">
      <div class="title">
        <h2>{{ data.title() }}</h2>
        <span class="sub">{{ data.sub() }}</span>
      </div>
      <button type="button" class="close" aria-label="Schließen" (click)="sheet.dismiss()">
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
      </button>
    </div>
    <ul class="rows">
      @for (row of data.rows(); track row.key) {
        <li [class.me]="row.you">
          <span
            class="avatar"
            [class.turn]="row.turn"
            [style.background]="row.color"
            aria-hidden="true"
          >
            @if (row.initial) {
              {{ row.initial }}
            } @else {
              <span class="material-symbols-rounded fill">person</span>
            }
          </span>
          <span class="who">
            <span class="name"
              >{{ row.name }}
              @if (row.you) {
                <span class="you">du</span>
              }
            </span>
            <span class="line">
              <span class="tag" [attr.data-tone]="row.tone">{{ row.status }}</span>
              @if (row.balance) {
                <span class="balance">{{ row.balance }}</span>
              }
            </span>
          </span>
          <span class="cards">
            @for (card of row.cards; track $index) {
              <app-blackjack-card [card]="card" />
            }
          </span>
          <span class="nums">
            @if (row.value) {
              <span class="pill" [attr.data-tone]="row.valueTone">{{ row.value }}</span>
            }
            @if (row.stake) {
              <span class="stake" [attr.data-tone]="row.stakeTone">
                @if (row.dot) {
                  <span class="dot" [style.background]="row.dot"></span>
                }
                {{ row.stake }}
              </span>
            }
          </span>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'blackjack-tones';

    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 80dvh;
      box-sizing: border-box;
      padding: 10px 0 calc(16px + env(safe-area-inset-bottom, 0px));
      color: var(--color-text);
      font-family: var(--font-sans);
      letter-spacing: normal;
    }

    .sheet-head {
      gap: 8px;
      margin-top: 0;
      padding: 0 4px 4px 16px;
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .sheet-head h2 {
      font-size: 17px;
      font-weight: 800;
    }

    .sub {
      color: var(--color-text-muted);
      font-size: 12px;
      font-weight: 500;
    }

    .close {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
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
      gap: 10px;
      min-height: 76px;
      box-sizing: border-box;
      padding: 10px 16px;
      border-top: 1px solid var(--color-border-subtle);
    }

    li.me {
      background: color-mix(in srgb, var(--color-text) 4%, transparent);
    }

    .avatar {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
    }

    .avatar.turn {
      box-shadow:
        0 0 0 2px var(--color-surface),
        0 0 0 4px var(--table-turn);
    }

    .fill {
      font-size: 20px;
      font-variation-settings: 'FILL' 1;
    }

    .who {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: 4px;
      min-width: 0;
    }

    .name {
      overflow: hidden;
      font-size: 14px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .you,
    .balance {
      color: var(--color-text-muted);
      font-size: 11px;
      font-weight: 600;
    }

    .line {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tag,
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 0 7px;
      border-radius: 999px;
      background: var(--tone-bg);
      color: var(--tone-fg);
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      white-space: nowrap;
    }

    .tag {
      height: 18px;
      font-size: 11px;
    }

    .cards {
      display: flex;
      flex: none;
      width: 84px;
    }

    app-blackjack-card {
      --card-w: 40px;
      --card-h: 56px;
    }

    app-blackjack-card + app-blackjack-card {
      margin-left: -26px;
    }

    .nums {
      display: flex;
      flex: none;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
      width: 78px;
    }

    .pill {
      height: 22px;
      padding: 0 9px;
      font-size: 13px;
    }

    .stake {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--tone-fg);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      white-space: nowrap;
    }

    .dot {
      width: 12px;
      height: 12px;
      box-sizing: border-box;
      border: 2px dashed rgba(255, 255, 255, 0.75);
      border-radius: 50%;
    }
  `,
})
export class BlackjackTableSheet {
  readonly data = inject<BjSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject(MatBottomSheetRef);
}

// Panel- und Backdrop-Klassen stehen global in styles.scss (Overlay)
export function openTableSheet(sheet: MatBottomSheet, data: BjSheetData): MatBottomSheetRef {
  return sheet.open(BlackjackTableSheet, {
    data,
    panelClass: 'app-sheet-panel',
    backdropClass: 'app-sheet-backdrop',
    ariaLabel: 'Tischübersicht',
  });
}
