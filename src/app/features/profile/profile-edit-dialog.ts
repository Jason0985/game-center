import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProfileService } from '../../services/profile.service';
import { AppErrorService } from '../../services/app-error.service';
import { describeSupabaseError } from '../../services/supabase-errors';
import { Profile } from './profile.model';

export interface ProfileEditDialogData {
  userId: string;
  displayName: string;
}

@Component({
  selector: 'app-profile-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './profile-edit-dialog.html',
  styleUrl: './profile-edit-dialog.scss',
})
export class ProfileEditDialog {
  private readonly dialogRef = inject(MatDialogRef<ProfileEditDialog, Profile>);
  private readonly profileService = inject(ProfileService);
  private readonly appErrors = inject(AppErrorService);
  private readonly data = inject<ProfileEditDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly errorMessage = signal('');

  // Gleiche Regeln wie bei der Registrierung bzw. in der Datenbank
  readonly control = new FormControl(this.data.displayName, {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(50)],
  });

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    const displayName = this.control.value.trim();
    if (this.control.invalid || !displayName || this.saving()) {
      this.control.markAsTouched();
      return;
    }

    if (displayName === this.data.displayName) {
      this.dialogRef.close();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.profileService.updateDisplayName(
      this.data.userId,
      displayName,
    );

    this.saving.set(false);

    if (error || !data) {
      const message =
        error?.code === '23514' ? 'Dieser Anzeigename ist nicht erlaubt.' : describeSupabaseError(error);
      this.errorMessage.set(message);
      this.appErrors.report(message, { title: 'Anzeigename nicht gespeichert', toast: false });
      return;
    }

    this.dialogRef.close(data);
  }
}
