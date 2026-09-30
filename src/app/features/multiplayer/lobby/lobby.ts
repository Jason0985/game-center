import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { AppErrorService } from '../../../services/app-error.service';
import { ActionResult } from '../../../services/supabase-errors';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import {
  canStartLobby,
  gameName,
  LOBBY_MAX_MEMBERS,
  LOBBY_MIN_MEMBERS,
  LobbyDetail,
  LobbyMember,
  requiredReadyCount,
} from '../lobby.model';
import { LobbyInviteDialog, LobbyInviteDialogData } from './lobby-invite-dialog';
import { LobbyGameSetup } from './lobby-game-settings';
import { Flip7GameView } from '../flip7/flip7-game';

@Component({
  selector: 'app-lobby',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    LobbyGameSetup,
    Flip7GameView,
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly toastService = inject(ToastService);
  private readonly appErrors = inject(AppErrorService);
  private readonly session = inject(SessionService);

  readonly lobbyId = this.route.snapshot.paramMap.get('lobbyId') ?? '';
  readonly maxMembers = LOBBY_MAX_MEMBERS;
  readonly minMembers = LOBBY_MIN_MEMBERS;
  readonly lobby = signal<LobbyDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);

  // Nur die ID: Beim Token-Refresh kommt ein neues User-Objekt, das soll nicht neu abonnieren
  readonly userId = computed(() => this.session.user()?.id ?? null);
  readonly members = computed(() => this.lobby()?.members ?? []);
  readonly code = computed(() => this.lobby()?.code ?? null);
  readonly isHost = computed(() => {
    const lobby = this.lobby();
    return !!lobby && lobby.host_user_id === this.userId();
  });
  readonly started = computed(() => this.lobby()?.status === 'started');
  readonly hostName = computed(
    () =>
      this.members().find((member) => member.user_id === this.lobby()?.host_user_id)?.name ?? '',
  );
  readonly me = computed(() => this.members().find((member) => member.user_id === this.userId()));
  readonly readyCount = computed(() => this.members().filter((member) => member.ready).length);
  readonly requiredReady = computed(() => requiredReadyCount(this.members().length));
  // Starten braucht zusätzlich ein gewähltes Spiel
  readonly canStart = computed(() => canStartLobby(this.members()) && !!this.lobby()?.game_key);
  readonly gameName = computed(() => gameName(this.lobby()?.game_key) ?? 'Spiel');

  // Nach eigenem Verlassen/Schließen (oder Weg-Navigieren) keine Meldungen und Umleitungen mehr
  private leaving = false;
  private loadSequence = 0;

  constructor() {
    effect((onCleanup) => {
      if (!this.userId()) {
        return;
      }

      void this.load();
      onCleanup(
        this.lobbyService.subscribeToChanges(`lobby-${this.lobbyId}`, () => void this.load()),
      );
    });

    inject(DestroyRef).onDestroy(() => (this.leaving = true));
  }

  async copyCode(): Promise<void> {
    const code = this.code();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      this.toastService.success('Code kopiert');
    } catch (error) {
      console.error('Code konnte nicht kopiert werden.', error);
      this.appErrors.report('Der Code konnte nicht kopiert werden.');
    }
  }

  async toggleReady(): Promise<void> {
    const me = this.me();
    if (!me) return;

    await this.run(() => this.lobbyService.setReady(this.lobbyId, !me.ready));
  }

  async start(): Promise<void> {
    if (!this.canStart()) return;

    await this.run(() => this.lobbyService.start(this.lobbyId));
  }

  // Nach Änderungen aus Spiel oder Spielauswahl sofort neu laden, nicht erst per Realtime
  reload(): void {
    void this.load();
  }

  openInvite(): void {
    const userId = this.userId();
    if (!userId) return;

    this.dialog.open<LobbyInviteDialog, LobbyInviteDialogData>(LobbyInviteDialog, {
      data: {
        lobbyId: this.lobbyId,
        userId,
        memberIds: this.members().map((member) => member.user_id),
      },
      width: '380px',
    });
  }

  async kick(member: LobbyMember): Promise<void> {
    const confirmed = await this.confirm({
      title: 'Spieler entfernen?',
      message: `${member.name} wird aus der Lobby entfernt. Mit dem Code kann ${member.name} erneut beitreten.`,
      confirmLabel: 'Entfernen',
      icon: 'person_remove',
    });

    if (confirmed && (await this.run(() => this.lobbyService.kick(this.lobbyId, member.user_id)))) {
      this.toastService.success('Spieler entfernt', `${member.name} ist nicht mehr in der Lobby.`);
    }
  }

  // Bestätigt werden: Schließen (Host, wirft alle raus) und Verlassen eines laufenden
  // Spiels (endgültig, Rückkehr erst in der Warte-Lobby). Verlassen der Warte-Lobby nicht.
  async leave(): Promise<void> {
    if (this.busy()) return;
    const confirmation: ConfirmationDialogData | null = this.isHost()
      ? {
          title: 'Lobby schließen?',
          message: 'Alle Spieler werden entfernt.',
          confirmLabel: 'Schließen',
          icon: 'logout',
        }
      : this.started()
        ? {
            title: 'Spiel verlassen?',
            message: 'Du verlässt das laufende Spiel endgültig.',
            confirmLabel: 'Verlassen',
            icon: 'logout',
          }
        : null;
    if (confirmation && !(await this.confirm(confirmation))) {
      return;
    }

    this.leaving = true;
    if (await this.run(() => this.lobbyService.leave(this.lobbyId))) {
      void this.router.navigateByUrl('/multiplayer');
    } else {
      this.leaving = false;
      await this.load();
    }
  }

  private async confirm(data: ConfirmationDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      { data },
    );
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  }

  // Aktion ausführen und danach neu laden – auch bei Fehlern, sonst bleibt die Ansicht veraltet
  private async run(action: () => Promise<ActionResult>): Promise<boolean> {
    if (this.busy()) return false;

    this.busy.set(true);
    const result = await action();
    this.busy.set(false);

    if (!result.ok) {
      this.appErrors.report(result.message, { title: 'Lobby' });
    }
    await this.load();
    return result.ok;
  }

  private async load(): Promise<void> {
    if (this.leaving) return;

    // Nur das Ergebnis des neuesten Ladevorgangs übernehmen
    const sequence = ++this.loadSequence;
    const result = await this.lobbyService.getLobby(this.lobbyId);
    if (sequence !== this.loadSequence || this.leaving) return;

    if (!result.ok) {
      this.loading.set(false);
      this.appErrors.report(result.message, { title: 'Lobby' });
      return;
    }

    const lobby = result.value;
    if (!lobby) {
      this.leaveView('Die Lobby wurde geschlossen.');
    } else if (!lobby.members.some((member) => member.user_id === this.userId())) {
      this.leaveView('Du bist nicht (mehr) in dieser Lobby.');
    } else {
      this.lobby.set(lobby);
      this.loading.set(false);
    }
  }

  private leaveView(message: string): void {
    this.leaving = true;
    this.toastService.show({ tone: 'info', icon: 'info', title: message });
    void this.router.navigateByUrl('/multiplayer');
  }
}
