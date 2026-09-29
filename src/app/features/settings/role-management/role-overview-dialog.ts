import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileService } from '../../../services/profile.service';
import { SessionService } from '../../../services/session.service';
import { Profile } from '../../profile/profile.model';
import { PROFILE_ROLES } from '../../profile/profile-roles';
import { openRoleEditDialog } from './role-edit-dialog';

@Component({
  selector: 'app-role-overview-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './role-overview-dialog.html',
  styleUrl: './role-overview-dialog.scss',
})
export class RoleOverviewDialog {
  private readonly profileService = inject(ProfileService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);

  readonly loading = signal(true);
  private readonly profiles = signal<Profile[]>([]);

  // Nutzer nach Rolle gruppiert, Rollen in fester Reihenfolge
  readonly groups = computed(() =>
    PROFILE_ROLES.map((config) => ({
      config,
      members: this.profiles().filter((profile) => profile.role === config.role),
    })),
  );

  constructor() {
    void this.load();
  }

  edit(profile: Profile): void {
    openRoleEditDialog(this.dialog, profile).subscribe((updated) => {
      if (updated) {
        this.profiles.update((profiles) =>
          profiles.map((existing) => (existing.id === updated.id ? updated : existing)),
        );
      }
    });
  }

  private async load(): Promise<void> {
    this.profiles.set(await this.profileService.listProfiles());
    this.loading.set(false);
  }
}
