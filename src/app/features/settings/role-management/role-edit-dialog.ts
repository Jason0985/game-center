import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../../services/profile.service';
import { Profile, ProfileRole } from '../../profile/profile.model';
import { PROFILE_ROLES } from '../../profile/profile-roles';

export interface RoleEditDialogData {
  profile: Profile;
}

// Liefert das aktualisierte Profil, oder undefined bei Abbruch
export function openRoleEditDialog(dialog: MatDialog, profile: Profile) {
  return dialog
    .open<RoleEditDialog, RoleEditDialogData, Profile>(RoleEditDialog, {
      data: { profile },
      width: '380px',
    })
    .afterClosed();
}

@Component({
  selector: 'app-role-edit-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './role-edit-dialog.html',
  styleUrl: './role-edit-dialog.scss',
})
export class RoleEditDialog {
  private readonly dialogRef = inject(MatDialogRef<RoleEditDialog, Profile>);
  private readonly profileService = inject(ProfileService);
  readonly profile = inject<RoleEditDialogData>(MAT_DIALOG_DATA).profile;

  readonly roles = PROFILE_ROLES;
  readonly selectedRole = signal<ProfileRole>(this.profile.role);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (this.selectedRole() === this.profile.role || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.profileService.setRole(this.profile.id, this.selectedRole());

    this.saving.set(false);

    if (error || !data) {
      // Die DB liefert verständliche deutsche Meldungen (z. B. eigene Rolle)
      this.errorMessage.set(error?.message ?? 'Speichern fehlgeschlagen.');
      return;
    }

    this.dialogRef.close(data);
  }
}
