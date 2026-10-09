import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../../services/profile.service';
import { AppErrorService } from '../../../services/app-error.service';
import { Profile, ProfileRole } from '../../profile/profile.model';
import { PROFILE_ROLES, USER_ROLE } from '../../profile/profile-roles';

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
  private readonly appErrors = inject(AppErrorService);
  readonly profile = inject<RoleEditDialogData>(MAT_DIALOG_DATA).profile;

  readonly roles = PROFILE_ROLES;
  readonly userRole = USER_ROLE;
  readonly selectedRoles = signal<ProfileRole[]>(this.profile.roles);
  readonly changed = computed(
    () =>
      this.selectedRoles().length !== this.profile.roles.length ||
      this.selectedRoles().some((role) => !this.profile.roles.includes(role)),
  );
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  toggle(role: ProfileRole): void {
    this.selectedRoles.update((roles) =>
      roles.includes(role) ? roles.filter((existing) => existing !== role) : [...roles, role],
    );
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (!this.changed() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const { data, error } = await this.profileService.setRoles(this.profile.id, this.selectedRoles());

    this.saving.set(false);

    if (error || !data) {
      // Die DB liefert verständliche deutsche Meldungen (z. B. eigene Rolle)
      const message = error?.message ?? 'Speichern fehlgeschlagen.';
      this.errorMessage.set(message);
      this.appErrors.report(message, { title: 'Rollen nicht geändert', toast: false });
      return;
    }

    this.dialogRef.close(data);
  }
}
