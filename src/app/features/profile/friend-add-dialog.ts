import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FriendRelation, FriendsService } from '../../services/friends.service';
import { ProfileService } from '../../services/profile.service';
import { AppErrorService } from '../../services/app-error.service';
import { Profile } from './profile.model';

export interface FriendAddDialogData {
  userId: string;
  relations: FriendRelation[];
}

type RelationState = 'friend' | 'pending' | 'none';

@Component({
  selector: 'app-friend-add-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './friend-add-dialog.html',
  styleUrl: './friend-add-dialog.scss',
})
export class FriendAddDialog {
  private readonly dialogRef = inject(MatDialogRef<FriendAddDialog>);
  private readonly friendsService = inject(FriendsService);
  private readonly profileService = inject(ProfileService);
  private readonly appErrors = inject(AppErrorService);
  private readonly data = inject<FriendAddDialogData>(MAT_DIALOG_DATA);

  readonly search = signal('');
  readonly results = signal<Profile[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  private readonly states = signal(
    new Map<string, RelationState>(
      this.data.relations.map((relation) => [
        relation.profile.id,
        relation.status === 'accepted' ? 'friend' : 'pending',
      ]),
    ),
  );
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimeout));
  }

  stateOf(profileId: string): RelationState {
    return this.states().get(profileId) ?? 'none';
  }

  tooltipOf(profileId: string): string {
    switch (this.stateOf(profileId)) {
      case 'friend':
        return 'Bereits befreundet';
      case 'pending':
        return 'Anfrage ausstehend';
      default:
        return 'Freund hinzufügen';
    }
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.trim();
    this.search.set(searchTerm);
    this.results.set([]);
    clearTimeout(this.searchTimeout);

    if (searchTerm.length < 2) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.searchTimeout = setTimeout(async () => {
      const results = await this.profileService.searchProfiles(searchTerm, this.data.userId);
      if (this.search() !== searchTerm) return; // inzwischen weitergetippt

      this.results.set(results);
      this.loading.set(false);
    }, 250);
  }

  async add(friendId: string): Promise<void> {
    if (this.stateOf(friendId) !== 'none') {
      return;
    }

    this.errorMessage.set('');
    const result = await this.friendsService.addFriend(this.data.userId, friendId);
    if (result.ok) {
      this.states.update((states) => new Map(states).set(friendId, 'pending'));
    } else {
      this.errorMessage.set(result.message);
      this.appErrors.report(result.message, { toast: false });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
