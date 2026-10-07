import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { describeAuthError } from '../../services/supabase-errors';
import { AppErrorService } from '../../services/app-error.service';
import { ConfirmationDialog, ConfirmationDialogData } from '../../confirmation-dialog';
import { MultiplayerLobbyService } from './multiplayer-lobby.service';
import { gameLabel, LOBBY_MAX_MEMBERS, LobbySummary } from './lobby.model';
import { AvatarColorPipe, InitialsPipe } from '../../ui/avatar.pipes';

// Wie profiles_display_name_len in der DB
const GUEST_NAME_MAX_LENGTH = 50;

const normalizeCode = (value: string): string => value.toUpperCase().replace(/\s/g, '').slice(0, 6);

@Component({
  selector: 'app-multiplayer',
  imports: [MatIcon, RouterLink, InitialsPipe, AvatarColorPipe],
  templateUrl: './multiplayer.html',
  styleUrl: './multiplayer.scss',
})
export class Multiplayer {
  readonly session = inject(SessionService);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
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
  // Beitritt nur mit dem Code; ohne Konto der einzige Weg (dann als Gast mit Anzeigename).
  // Vorbelegt über den Link aus der Lobby (?code=…)
  readonly directCode = signal(
    normalizeCode(inject(ActivatedRoute).snapshot.queryParamMap.get('code') ?? ''),
  );
  readonly guestName = signal('');
  readonly guestNameMaxLength = GUEST_NAME_MAX_LENGTH;
  // Nur die ID: Beim Token-Refresh kommt ein neues User-Objekt, das soll nicht neu abonnieren.
  // authUser, damit auch Gäste ihre Lobby wiederfinden
  private readonly userId = computed(() => this.session.authUser()?.id ?? null);

  constructor() {
    effect((onCleanup) => {
      if (!this.session.initialized()) {
        return;
      }

      const userId = this.userId();
      if (!userId) {
        this.myLobbyId.set(null);
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
    input.value = normalizeCode(input.value);
    this.joinCode.set(input.value);
  }

  onDirectCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = normalizeCode(input.value);
    this.directCode.set(input.value);
  }

  // Ohne Sitzung wird vorher ein temporärer Gast mit dem gewählten Anzeigenamen angelegt
  async joinByCode(event: Event): Promise<void> {
    event.preventDefault();
    const code = this.directCode();
    const name = this.guestName().trim();
    const needsGuest = !this.session.hasSession();
    if (this.busy() || code.length < 6 || (needsGuest && !name)) {
      return;
    }

    this.startAction();
    if (needsGuest) {
      const { error } = await this.authService.signInAsGuest(name);
      if (error) {
        console.error('Gast-Anmeldung fehlgeschlagen.', error);
        this.busy.set(false);
        this.fail(describeAuthError(error));
        return;
      }
    }

    const result = await this.lobbyService.joinLobbyByCode(code);
    this.busy.set(false);

    if (result.ok) {
      void this.router.navigate(['/multiplayer', result.value]);
    } else {
      this.fail(result.message);
    }
  }

  // Löscht den Gast samt Lobby-Platz; danach ist man wieder ohne Sitzung
  async endGuestSession(): Promise<void> {
    if (this.busy()) {
      return;
    }

    if (
      this.myLobbyId() &&
      !(await this.confirm({
        title: 'Gastsitzung beenden?',
        message: 'Du verlässt damit auch deine Lobby und ein laufendes Spiel.',
        confirmLabel: 'Beenden',
        icon: 'logout',
      }))
    ) {
      return;
    }

    this.startAction();
    const ok = await this.authService.endGuestSession();
    this.busy.set(false);

    if (ok) {
      this.guestName.set('');
    } else {
      this.fail('Die Gastsitzung konnte nicht beendet werden. Bitte versuche es erneut.');
    }
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

  private async confirm(data: ConfirmationDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      { data },
    );
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  }

  private startAction(): void {
    this.busy.set(true);
    this.errorMessage.set('');
  }

  private async refresh(userId: string): Promise<void> {
    const [lobbies, myLobbyId] = await Promise.all([
      // Gäste sehen die Liste nicht (per RLS ohnehin nur die eigene Lobby): spart Lobbys + Profile.
      // untracked, weil refresh im Effect startet und dort nicht neu abonnieren soll
      untracked(this.session.isLoggedIn)
        ? this.lobbyService.listOpenLobbies()
        : Promise.resolve([]),
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
