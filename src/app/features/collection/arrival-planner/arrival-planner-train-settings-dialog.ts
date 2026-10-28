import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { isValidTrainSettings, TrainPlannerSettings } from './arrival-planner-train.model';

@Component({
  selector: 'app-arrival-planner-train-settings-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './arrival-planner-train-settings-dialog.html',
  styleUrl: './arrival-planner-settings-dialog.scss',
})
export class ArrivalPlannerTrainSettingsDialog {
  readonly dialogRef = inject(MatDialogRef<ArrivalPlannerTrainSettingsDialog>);
  readonly settings: TrainPlannerSettings = { ...inject(MAT_DIALOG_DATA) };

  get isValid(): boolean {
    return isValidTrainSettings(this.settings);
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
