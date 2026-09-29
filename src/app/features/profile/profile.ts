import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { FriendRelation, FriendsService } from '../../services/friends.service';
import { Profile as UserProfile } from './profile.model';
import { ProfileEditDialog, ProfileEditDialogData } from './profile-edit-dialog';
import { FriendAddDialog, FriendAddDialogData } from './friend-add-dialog';

@Component({
  selector: 'app-profile',
  imports: [MatIcon, MatButton, MatTooltip, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly authService = inject(AuthService);
  private readonly friendsService = inject(FriendsService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);
  private readonly relations = signal<FriendRelation[]>([]);
  readonly friendsLoading = signal(true);
  readonly friendFilter = signal('');

  readonly friends = computed(() =>
    this.relations()
      .filter((relation) => relation.status === 'accepted')
      .map((relation) => relation.profile)
      .sort((a, b) =>
        (a.display_name || a.username).localeCompare(b.display_name || b.username, 'de'),
      ),
  );

  readonly filteredFriends = computed(() => {
    const filter = this.friendFilter().trim().toLowerCase();
    return filter
      ? this.friends().filter(
          (friend) =>
            friend.username.toLowerCase().includes(filter) ||
            (friend.display_name ?? '').toLowerCase().includes(filter),
        )
      : this.friends();
  });

  constructor() {
    effect(() => {
      const userId = this.session.user()?.id;
      if (userId) {
        void this.loadRelations(userId);
      }
    });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  editDisplayName(): void {
    const userId = this.session.user()?.id;
    const profile = this.session.profile();
    if (!userId || !profile) {
      return;
    }

    this.dialog
      .open<ProfileEditDialog, ProfileEditDialogData, UserProfile>(ProfileEditDialog, {
        data: { userId, displayName: profile.display_name ?? '' },
      })
      .afterClosed()
      .subscribe((updated) => {
        if (updated) {
          this.session.setProfile(updated);
        }
      });
  }

  openAddFriends(): void {
    const userId = this.session.user()?.id;
    if (!userId) {
      return;
    }

    this.dialog
      .open<FriendAddDialog, FriendAddDialogData>(FriendAddDialog, {
        data: { userId, relations: this.relations() },
        width: '380px',
      })
      .afterClosed()
      .subscribe(() => void this.loadRelations(userId));
  }

  private async loadRelations(userId: string): Promise<void> {
    const relations = await this.friendsService.getRelations(userId);
    if (this.session.user()?.id !== userId) return; // inzwischen ausgeloggt/gewechselt

    this.relations.set(relations);
    this.friendsLoading.set(false);
  }
}
