import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FLIP7_BONUS } from './flip7.model';

// Kurzregeln für das ⋮-Menü im Spiel
@Component({
  selector: 'app-flip7-rules-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Flip 7 – Regeln</h2>
    <mat-dialog-content>
      <ul>
        <li>
          Wer am Zug ist, zieht eine Karte oder bleibt stehen. Stehen bleiben sichert die Punkte
          dieser Runde.
        </li>
        <li>
          Zieht jemand eine Zahl, die er schon hat, ist das ein Bust: 0 Punkte in dieser Runde.
        </li>
        <li>
          Sieben verschiedene Zahlen sind Flip 7: +{{ bonus }} Punkte, und die Runde endet sofort.
        </li>
        <li>Modifikatoren: ×2 verdoppelt die Zahlen, +2 bis +10 kommen danach dazu.</li>
        <li>
          Freeze: Das Ziel muss sofort stehen bleiben. Flip 3: Das Ziel zieht drei Karten. Second
          Chance: fängt einen Bust einmal ab.
        </li>
        <li>
          Erreicht jemand am Rundenende das Punkteziel, ist das Spiel vorbei: Die meisten Punkte
          gewinnen, bei Gleichstand wird geteilt.
        </li>
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>Schließen</button>
    </mat-dialog-actions>
  `,
  styles: `
    ul {
      display: grid;
      gap: 8px;
      margin: 0;
      padding-left: 18px;
      font-size: 14px;
      line-height: 1.5;
    }
  `,
})
export class Flip7RulesDialog {
  readonly bonus = FLIP7_BONUS;
}
