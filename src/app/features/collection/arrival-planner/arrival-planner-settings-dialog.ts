import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ArrivalPlannerSettings } from './arrival-planner.model';

@Component({
  selector: 'app-arrival-planner-settings-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './arrival-planner-settings-dialog.html',
  styleUrl: './arrival-planner-settings-dialog.scss',
})
export class ArrivalPlannerSettingsDialog {
  readonly dialogRef = inject(MatDialogRef<ArrivalPlannerSettingsDialog>);
  readonly settings: ArrivalPlannerSettings = { ...inject(MAT_DIALOG_DATA) };

  get isValid(): boolean {
    return [
      this.settings.travelMinutes,
      this.settings.trafficBufferMinutes,
      this.settings.preparationMinutes,
    ].every((value) => Number.isInteger(value) && value >= 0 && value <= 300);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.isValid) {
      this.dialogRef.close({ ...this.settings });
    }
  }
}
