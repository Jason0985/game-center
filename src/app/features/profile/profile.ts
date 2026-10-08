import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { FriendRelation, FriendsService } from '../../services/friends.service';
import { ToastService } from '../../services/toast.service';
import { AppErrorService } from '../../services/app-error.service';
import { ConfirmationDialog, ConfirmationDialogData } from '../../confirmation-dialog';
import { Profile as UserProfile } from './profile.model';
import { ProfileEditDialog, ProfileEditDialogData } from './profile-edit-dialog';
import { FriendAddDialog, FriendAddDialogData } from './friend-add-dialog';
import { AccountDeleteDialog, AccountDeleteDialogData } from './account-delete-dialog';
import { AvatarColorPipe, InitialsPipe } from '../../ui/avatar.pipes';
import { computeStats, GameResultsService, GameStats } from './stats/game-stats';

const LEGAL_LINKS = [
  { path: '/legal/impressum', label: 'Impressum', icon: 'info', tile: 'var(--tile-gray)' },
  {
    path: '/legal/datenschutz',
    label: 'Datenschutz',
    icon: 'privacy_tip',
    tile: 'var(--tile-blue)',
  },
  {
    path: '/legal/nutzungsbedingungen',
    label: 'Nutzungsbedingungen',
    icon: 'gavel',
    tile: 'var(--tile-purple)',
  },
  {
    path: '/legal/lizenzen',
    label: 'Lizenzen & Quellen',
    icon: 'copyright',
    tile: 'var(--tile-green)',
  },
];

@Component({
  selector: 'app-profile',
  imports: [MatIcon, MatTooltip, RouterLink, InitialsPipe, AvatarColorPipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly authService = inject(AuthService);
  private readonly friendsService = inject(FriendsService);
  private readonly resultsService = inject(GameResultsService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly appErrors = inject(AppErrorService);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);
  private readonly relations = signal<FriendRelation[]>([]);
  readonly friendsLoading = signal(true);
  readonly friendFilter = signal('');
  readonly stats = signal<GameStats | null>(null);
  readonly legalLinks = LEGAL_LINKS;

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
        void this.resultsService.getResults(userId).then((results) => {
          if (results && this.session.user()?.id === userId) this.stats.set(computeStats(results));
        });
      }
    });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  deleteAccount(): void {
    const username = this.session.username();
    if (!username) {
      return;
    }

    this.dialog
      .open<AccountDeleteDialog, AccountDeleteDialogData, boolean>(AccountDeleteDialog, {
        data: { username },
        width: '380px',
      })
      .afterClosed()
      .subscribe(async (deleted) => {
        if (!deleted) return;
        this.toastService.success('Konto gelöscht', 'Dein Konto und alle Daten wurden entfernt.');
        await this.router.navigateByUrl('/');
      });
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
          this.toastService.success('Anzeigename gespeichert');
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
        this.toastService.success(
          'Freund entfernt',
          `${name} ist nicht mehr in deiner Freundesliste.`,
        );
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
