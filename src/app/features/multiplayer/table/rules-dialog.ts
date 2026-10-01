import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface RulesDialogData {
  title: string;
  rules: string[];
}

// Kurzregeln für das ⋮-Menü im Spiel
@Component({
  selector: 'app-rules-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <ul>
        @for (rule of data.rules; track $index) {
          <li>{{ rule }}</li>
        }
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
export class RulesDialog {
  readonly data = inject<RulesDialogData>(MAT_DIALOG_DATA);
}
