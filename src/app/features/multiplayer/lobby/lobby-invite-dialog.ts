import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FriendsService } from '../../../services/friends.service';
import { AppErrorService } from '../../../services/app-error.service';
import { ToastService } from '../../../services/toast.service';
import { Profile } from '../../profile/profile.model';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { displayNameOf } from '../lobby.model';

export interface LobbyInviteDialogData {
  lobbyId: string;
  userId: string;
  memberIds: string[];
}

// member: schon in der Lobby
type InviteState = 'member' | 'invited' | 'none';

const INVITE_STATES: Record<InviteState, { icon: string; label: string }> = {
  member: { icon: 'how_to_reg', label: 'Bereits in der Lobby' },
  invited: { icon: 'schedule', label: 'Eingeladen' },
  none: { icon: 'person_add', label: 'Einladen' },
};

export interface InviteRow {
  profile: Profile;
  name: string;
  state: InviteState;
  icon: string;
  label: string;
  pending: boolean;
}

@Component({
  selector: 'app-lobby-invite-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule],
  templateUrl: './lobby-invite-dialog.html',
  styleUrl: './lobby-invite-dialog.scss',
})
export class LobbyInviteDialog {
  private readonly dialogRef = inject(MatDialogRef<LobbyInviteDialog>);
  private readonly friendsService = inject(FriendsService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly toastService = inject(ToastService);
  private readonly data = inject<LobbyInviteDialogData>(MAT_DIALOG_DATA);

  readonly search = signal('');
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  private readonly memberIds = new Set(this.data.memberIds);
  private readonly friends = signal<{ profile: Profile; name: string }[]>([]);
  private readonly invitedIds = signal<Set<string>>(new Set());
  private readonly pendingIds = signal<Set<string>>(new Set());

  // Suche und Zeilenzustand einmal pro Änderung statt bei jedem Rendern im Template
  readonly rows = computed<InviteRow[]>(() => {
    const filter = this.search().trim().toLowerCase();
    const invited = this.invitedIds();
    const pending = this.pendingIds();

    return this.friends()
      .filter(
        ({ profile }) =>
          !filter ||
          profile.username.toLowerCase().includes(filter) ||
          (profile.display_name ?? '').toLowerCase().includes(filter),
      )
      .map(({ profile, name }) => {
        const state: InviteState = this.memberIds.has(profile.id)
          ? 'member'
          : invited.has(profile.id)
            ? 'invited'
            : 'none';
        return { profile, name, state, ...INVITE_STATES[state], pending: pending.has(profile.id) };
      });
  });

  constructor() {
    void this.loadFriends();
  }

  async invite(row: InviteRow): Promise<void> {
    const id = row.profile.id;
    if (row.state !== 'none' || this.pendingIds().has(id)) {
      return;
    }

    this.errorMessage.set('');
    this.pendingIds.update((ids) => new Set(ids).add(id));
    const result = await this.lobbyService.inviteFriend(this.data.lobbyId, id);
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });

    if (result.ok) {
      this.invitedIds.update((ids) => new Set(ids).add(id));
      this.toastService.success('Einladung gesendet', `${row.name} kann jetzt beitreten.`);
    } else {
      this.errorMessage.set(result.message);
      this.appErrors.report(result.message, { toast: false });
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  private async loadFriends(): Promise<void> {
    const relations = await this.friendsService.getRelations(this.data.userId);
    this.loading.set(false);

    if (!relations) {
      this.errorMessage.set('Deine Freunde konnten nicht geladen werden.');
      return;
    }

    this.friends.set(
      relations
        .filter((relation) => relation.status === 'accepted')
        .map(({ profile }) => ({ profile, name: displayNameOf(profile) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    );
  }
}
