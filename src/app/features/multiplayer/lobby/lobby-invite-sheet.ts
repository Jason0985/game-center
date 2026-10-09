import { Component, computed, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { FriendsService } from '../../../services/friends.service';
import { AppErrorService } from '../../../services/app-error.service';
import { ToastService } from '../../../services/toast.service';
import { appUrl } from '../../../app-url';
import { AvatarColorPipe, InitialsPipe } from '../../../ui/avatar.pipes';
import { Profile } from '../../profile/profile.model';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { displayNameOf } from '../lobby.model';

export interface LobbyInviteSheetData {
  lobbyId: string;
  userId: string;
  code: string;
  memberIds: string[];
}

// member: schon in der Lobby
type InviteState = 'member' | 'invited' | 'none';

export interface InviteRow {
  profile: Profile;
  name: string;
  state: InviteState;
  pending: boolean;
}

// Einladen für den Host: Link teilen/kopieren, Code kopieren oder Freunde direkt einladen
@Component({
  selector: 'app-lobby-invite-sheet',
  imports: [MatIconModule, InitialsPipe, AvatarColorPipe],
  templateUrl: './lobby-invite-sheet.html',
  styleUrl: './lobby-invite-sheet.scss',
})
export class LobbyInviteSheet {
  private readonly friendsService = inject(FriendsService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly toastService = inject(ToastService);
  private readonly data = inject<LobbyInviteSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject(MatBottomSheetRef);

  readonly search = signal('');
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  private readonly memberIds = new Set(this.data.memberIds);
  readonly friends = signal<{ profile: Profile; name: string }[]>([]);
  private readonly invitedIds = signal<Set<string>>(new Set());
  private readonly pendingIds = signal<Set<string>>(new Set());

  // Teilen-Menü des Geräts (WhatsApp, Nachrichten …); fehlt es (z. B. Firefox am Desktop),
  // bleibt „Link kopieren“
  readonly canShare = typeof globalThis.navigator?.share === 'function';
  readonly shareIcon = /iPhone|iPad|Macintosh/.test(globalThis.navigator?.userAgent ?? '')
    ? 'ios_share'
    : 'share';
  // Link zur Multiplayer-Seite mit vorausgefülltem Code; ohne Konto tritt man darüber als Gast bei
  private readonly link = appUrl(`multiplayer?code=${this.data.code}`);

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
      .map(({ profile, name }) => ({
        profile,
        name,
        state: this.memberIds.has(profile.id)
          ? 'member'
          : invited.has(profile.id)
            ? 'invited'
            : 'none',
        pending: pending.has(profile.id),
      }));
  });

  constructor() {
    void this.loadFriends();
  }

  async share(): Promise<void> {
    try {
      await navigator.share({
        title: 'Game Center',
        text: `Spiel mit mir im Game Center! Lobby-Code: ${this.data.code}`,
        url: this.link,
      });
    } catch (error) {
      // Abbrechen im Teilen-Menü ist kein Fehler
      if ((error as DOMException).name === 'AbortError') return;
      console.error('Link konnte nicht geteilt werden.', error);
      this.appErrors.report('Der Link konnte nicht geteilt werden.');
    }
  }

  copyLink(): Promise<void> {
    return this.copy(this.link, 'Link');
  }

  copyCode(): Promise<void> {
    return this.copy(this.data.code, 'Code');
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

  private async copy(text: string, what: 'Link' | 'Code'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toastService.success(`${what} kopiert`);
    } catch (error) {
      console.error(`${what} konnte nicht kopiert werden.`, error);
      this.appErrors.report(`Der ${what} konnte nicht kopiert werden.`);
    }
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
