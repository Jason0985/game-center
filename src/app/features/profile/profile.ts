import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { FriendRelation, FriendsService } from '../../services/friends.service';
import { ToastService } from '../../services/toast.service';
import { AppErrorService } from '../../services/app-error.service';
import { ConfirmationDialog, ConfirmationDialogData } from '../../confirmation-dialog';
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
  private readonly toastService = inject(ToastService);
  private readonly appErrors = inject(AppErrorService);
  readonly session = inject(SessionService);
  private readonly relations = signal<FriendRelation[]>([]);
  readonly friendsLoading = signal(true);
  readonly friendFilter = signal('');

  readonly friends = computed(() =>
    this.relations()
      .filter((relation) => relation.status === 'accepted')
      .sort((a, b) => this.nameOf(a).localeCompare(this.nameOf(b), 'de')),
  );

  readonly filteredFriends = computed(() => {
    const filter = this.friendFilter().trim().toLowerCase();
    return filter
      ? this.friends().filter(
          ({ profile }) =>
            profile.username.toLowerCase().includes(filter) ||
            (profile.display_name ?? '').toLowerCase().includes(filter),
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

  removeFriend(friend: FriendRelation): void {
    const name = this.nameOf(friend);

    this.dialog
      .open<ConfirmationDialog, ConfirmationDialogData, boolean>(ConfirmationDialog, {
        data: {
          title: 'Freund entfernen?',
          message: `Möchtest du ${name} wirklich aus deinen Freunden entfernen? Ihr könnt euch später erneut eine Anfrage schicken.`,
          confirmLabel: 'Entfernen',
          icon: 'person_remove',
        },
      })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) return;

        const result = await this.friendsService.removeFriendship(friend.friendshipId);
        if (!result.ok) {
          this.appErrors.report(result.message);
          return;
        }

        this.relations.update((relations) =>
          relations.filter((relation) => relation.friendshipId !== friend.friendshipId),
        );
        this.toastService.success('Freund entfernt', `${name} ist nicht mehr in deiner Freundesliste.`);
      });
  }

  private nameOf(relation: FriendRelation): string {
    return relation.profile.display_name || relation.profile.username;
  }

  private async loadRelations(userId: string): Promise<void> {
    const relations = await this.friendsService.getRelations(userId);
    if (this.session.user()?.id !== userId) return; // inzwischen ausgeloggt/gewechselt

    this.friendsLoading.set(false);
    if (!relations) {
      this.appErrors.report('Deine Freunde konnten nicht geladen werden.');
      return;
    }

    this.relations.set(relations);
  }
}
