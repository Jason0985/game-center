import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { F1StrategyOverridesService, TrackEditValues } from '../f1-strategy-overrides.service';
import { AppErrorService } from '../../../../services/app-error.service';

interface EditTrackDialogData {
  trackId: string;
  country: string;
  countryCode: string;
  userId: string | null;
  baseValues: TrackEditValues;
  values: TrackEditValues;
}

@Component({
  selector: 'app-edit-track-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatIcon],
  templateUrl: './edit-track-dialog.html',
  styleUrl: './edit-track-dialog.scss',
})
export class EditTrackDialog {
  readonly data = inject<EditTrackDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EditTrackDialog>);
  private readonly overridesService = inject(F1StrategyOverridesService);
  private readonly appErrors = inject(AppErrorService);
  fuelUsage = this.data.values.fuel_50 ?? '';
  goodQualifyingTime = this.data.values.good_quali_time ?? '';
  notes = this.data.values.notes;
  saving = false;
  saveError = '';

  async save(): Promise<void> {
    if (!this.data.userId || this.saving) {
      return;
    }

    this.saving = true;
    this.saveError = '';
    const values: TrackEditValues = {
      fuel_50: this.fuelUsage.trim() || null,
      good_quali_time: this.goodQualifyingTime.trim() || null,
      notes: this.notes.trim(),
    };
    const overrides: Partial<TrackEditValues> = {};

    if (values.fuel_50 !== this.data.baseValues.fuel_50) {
      overrides.fuel_50 = values.fuel_50;
    }
    if (values.good_quali_time !== this.data.baseValues.good_quali_time) {
      overrides.good_quali_time = values.good_quali_time;
    }
    if (values.notes !== this.data.baseValues.notes) {
      overrides.notes = values.notes;
    }

    try {
      await this.overridesService.saveOverrides(this.data.userId, this.data.trackId, overrides);
      this.dialogRef.close(overrides);
    } catch (error) {
      console.error('F1-Strategie konnte nicht gespeichert werden.', error);
      this.saveError = 'Die Änderungen konnten nicht gespeichert werden. Bitte versuche es erneut.';
      this.appErrors.report(this.saveError, { title: 'F1-Strategie nicht gespeichert', toast: false });
      this.saving = false;
    }
  }
}
