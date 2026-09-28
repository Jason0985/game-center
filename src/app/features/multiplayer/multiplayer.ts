import { Component, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { MultiplayerLobby, MultiplayerLobbyService } from './multiplayer-lobby.service';

@Component({
  selector: 'app-multiplayer',
  imports: [MatIcon, RouterLink],
  templateUrl: './multiplayer.html',
  styleUrl: './multiplayer.scss',
})
export class Multiplayer {
  readonly session = inject(SessionService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  readonly lobbies = signal<MultiplayerLobby[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect((onCleanup) => {
      if (!this.session.initialized()) {
        return;
      }

      const user = this.session.user();
      if (!user) {
        this.loading.set(false);
        return;
      }

      void this.refreshLobbies();
      const channel = this.lobbyService.subscribeToChanges(() => void this.refreshLobbies());
      onCleanup(() => void this.lobbyService.removeChannel(channel));
    });
  }

  async createLobby(): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || this.busy()) {
      return;
    }

    this.startAction();
    try {
      const lobby = await this.lobbyService.createLobby(userId);
      this.lobbies.update((lobbies) => [lobby, ...lobbies.filter((item) => item.id !== lobby.id)]);
    } catch {
      this.errorMessage.set('Die Lobby konnte nicht eröffnet werden. Bitte versuche es erneut.');
    } finally {
      this.busy.set(false);
    }
  }

  async chooseFlip7(lobby: MultiplayerLobby): Promise<void> {
    if (!this.isHost(lobby) || this.busy()) {
      return;
    }

    this.startAction();
    try {
      await this.lobbyService.chooseGame(lobby.id);
      await this.refreshLobbies();
    } catch {
      this.errorMessage.set('Flip 7 konnte nicht für diese Lobby ausgewählt werden.');
    } finally {
      this.busy.set(false);
    }
  }

  async toggleMembership(lobby: MultiplayerLobby): Promise<void> {
    const userId = this.session.user()?.id;
    if (!userId || this.isHost(lobby) || this.busy()) {
      return;
    }

    this.startAction();
    try {
      if (this.isMember(lobby)) {
        await this.lobbyService.leaveLobby(lobby.id, userId);
      } else {
        await this.lobbyService.joinLobby(lobby.id, userId);
      }
      await this.refreshLobbies();
    } catch {
      this.errorMessage.set(
        'Die Lobby konnte nicht aktualisiert werden. Bitte versuche es erneut.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  async closeLobby(lobby: MultiplayerLobby): Promise<void> {
    if (!this.isHost(lobby) || this.busy()) {
      return;
    }

    this.startAction();
    try {
      await this.lobbyService.closeLobby(lobby.id);
      this.lobbies.update((lobbies) => lobbies.filter((item) => item.id !== lobby.id));
    } catch {
      this.errorMessage.set('Die Lobby konnte nicht geschlossen werden.');
    } finally {
      this.busy.set(false);
    }
  }

  isHost(lobby: MultiplayerLobby): boolean {
    return lobby.host_user_id === this.session.user()?.id;
  }

  isMember(lobby: MultiplayerLobby): boolean {
    return lobby.memberIds.includes(this.session.user()?.id ?? '');
  }

  private startAction(): void {
    this.busy.set(true);
    this.errorMessage.set('');
  }

  private async refreshLobbies(): Promise<void> {
    try {
      this.lobbies.set(await this.lobbyService.listOpenLobbies());
    } catch {
      this.errorMessage.set('Die offenen Lobbys konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }
}
