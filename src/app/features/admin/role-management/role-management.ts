import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileService } from '../../../services/profile.service';
import { SessionService } from '../../../services/session.service';
import { Profile } from '../../profile/profile.model';
import { profileRoleConfigs } from '../../profile/profile-roles';
import { openRoleEditDialog } from './role-edit-dialog';
import { RoleOverviewDialog } from './role-overview-dialog';

// Karte auf der Admin-Seite: Nutzer suchen und Rollen anpassen
@Component({
  selector: 'app-role-management',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss',
})
export class RoleManagement {
  private readonly profileService = inject(ProfileService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);

  readonly roleConfigs = profileRoleConfigs;
  readonly search = signal('');
  readonly results = signal<Profile[]>([]);
  readonly loading = signal(false);
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimeout));
  }

  onSearch(event: Event): void {
    this.runSearch((event.target as HTMLInputElement).value.trim());
  }

  private runSearch(searchTerm: string): void {
    this.search.set(searchTerm);
    this.results.set([]);
    clearTimeout(this.searchTimeout);

    const userId = this.session.user()?.id;
    if (searchTerm.length < 2 || !userId) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.searchTimeout = setTimeout(async () => {
      const results = await this.profileService.searchProfiles(searchTerm, userId);
      if (this.search() !== searchTerm) return; // inzwischen weitergetippt

      this.results.set(results);
      this.loading.set(false);
    }, 250);
  }

  edit(profile: Profile): void {
    openRoleEditDialog(this.dialog, profile).subscribe((updated) => {
      if (updated) {
        this.results.update((results) =>
          results.map((existing) => (existing.id === updated.id ? updated : existing)),
        );
      }
    });
  }

  openOverview(): void {
    this.dialog
      .open(RoleOverviewDialog, { width: '420px' })
      .afterClosed()
      // Rollen können in der Übersicht geändert worden sein
      .subscribe(() => this.runSearch(this.search()));
  }
}
