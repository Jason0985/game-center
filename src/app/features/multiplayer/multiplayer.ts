import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AppErrorService } from '../../services/app-error.service';
import { MultiplayerLobbyService } from './multiplayer-lobby.service';
import { gameLabel, LOBBY_MAX_MEMBERS, LobbySummary } from './lobby.model';

@Component({
  selector: 'app-multiplayer',
  imports: [MatIcon, RouterLink],
  templateUrl: './multiplayer.html',
  styleUrl: './multiplayer.scss',
})
export class Multiplayer {
  readonly session = inject(SessionService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly router = inject(Router);
  readonly maxMembers = LOBBY_MAX_MEMBERS;
  readonly gameLabel = gameLabel;
  readonly lobbies = signal<LobbySummary[]>([]);
  // Lobby, in der man selbst gerade ist (dann kein Eröffnen/Beitreten)
  readonly myLobbyId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errorMessage = signal('');
  // Karte, in der gerade das Code-Feld offen ist
  readonly joiningLobbyId = signal<string | null>(null);
  readonly joinCode = signal('');
  // Nur die ID: Beim Token-Refresh kommt ein neues User-Objekt, das soll nicht neu abonnieren
  private readonly userId = computed(() => this.session.user()?.id ?? null);

  constructor() {
    effect((onCleanup) => {
      if (!this.session.initialized()) {
        return;
      }

      const userId = this.userId();
      if (!userId) {
        this.loading.set(false);
        return;
      }

      void this.refresh(userId);
      onCleanup(
        this.lobbyService.subscribeToChanges(
          'multiplayer-lobbies',
          () => void this.refresh(userId),
        ),
      );
    });
  }

  async createLobby(): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.startAction();
    const result = await this.lobbyService.createLobby();
    this.busy.set(false);

    if (result.ok) {
      void this.router.navigate(['/multiplayer', result.value]);
    } else {
      this.fail(result.message);
    }
  }

  openJoin(lobby: LobbySummary): void {
    this.errorMessage.set('');
    this.joinCode.set('');
    this.joiningLobbyId.set(this.joiningLobbyId() === lobby.id ? null : lobby.id);
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/\s/g, '');
    this.joinCode.set(input.value);
  }

  async joinLobby(event: Event, lobby: LobbySummary): Promise<void> {
    event.preventDefault();
    const code = this.joinCode().trim();
    if (this.busy() || !code) {
      return;
    }

    this.startAction();
    const result = await this.lobbyService.joinLobby(lobby.id, code);
    this.busy.set(false);

    if (result.ok) {
      void this.router.navigate(['/multiplayer', lobby.id]);
    } else {
      this.fail(result.message);
    }
  }

  isFull(lobby: LobbySummary): boolean {
    return lobby.memberCount >= LOBBY_MAX_MEMBERS;
  }

  // Fehler auf der Seite anzeigen und zusätzlich als Pop-up/Benachrichtigung melden
  private fail(message: string): void {
    this.errorMessage.set(message);
    this.appErrors.report(message, { title: 'Multiplayer' });
  }

  private startAction(): void {
    this.busy.set(true);
    this.errorMessage.set('');
  }

  private async refresh(userId: string): Promise<void> {
    const [lobbies, myLobbyId] = await Promise.all([
      this.lobbyService.listOpenLobbies(),
      this.lobbyService.findMyLobbyId(userId),
    ]);
    this.loading.set(false);
    this.myLobbyId.set(myLobbyId);

    if (lobbies) {
      this.lobbies.set(lobbies);
    } else {
      this.fail('Die offenen Lobbys konnten nicht geladen werden.');
    }
  }
}
