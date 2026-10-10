import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
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
  eveningWinners,
  flip7TargetOf,
  gameOf,
  LOBBY_MAX_MEMBERS,
  LobbyDetail,
  LobbyMember,
  rulesOf,
  settingsLabel,
  startBlocker,
  startMoneyOf,
  unoRulesOf,
} from '../lobby.model';
import { formatMoney } from '../blackjack/blackjack.model';
import { UNO_HOUSE_RULES } from '../uno/uno.model';
import { RulesDialog, RulesDialogData } from '../table/rules-dialog';
import { LobbyInviteSheet, LobbyInviteSheetData } from './lobby-invite-sheet';
import { LobbyGameSheet, LobbyGameSheetData } from './lobby-game-sheet';
import { Flip7GameView } from '../flip7/flip7-game';
import { SkipboGameView } from '../skipbo/skipbo-game';
import { UnoGameView } from '../uno/uno-game';
import { BlackjackGameView } from '../blackjack/blackjack-game';

import { AvatarColorPipe, InitialsPipe } from '../../../ui/avatar.pipes';

@Component({
  selector: 'app-lobby',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    Flip7GameView,
    SkipboGameView,
    UnoGameView,
    BlackjackGameView,
    InitialsPipe,
    AvatarColorPipe,
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly toastService = inject(ToastService);
  private readonly appErrors = inject(AppErrorService);
  private readonly session = inject(SessionService);

  readonly lobbyId = this.route.snapshot.paramMap.get('lobbyId') ?? '';
  readonly maxMembers = LOBBY_MAX_MEMBERS;
  readonly lobby = signal<LobbyDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);

  // Nur die ID: Beim Token-Refresh kommt ein neues User-Objekt, das soll nicht neu abonnieren.
  // authUser, weil auch Gäste (Beitritt per Code ohne Konto) in Lobbys sind
  readonly userId = computed(() => this.session.authUser()?.id ?? null);
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
  // Starten braucht zusätzlich ein gewähltes, startbares Spiel für diese Spielerzahl
  readonly startBlocker = computed(() =>
    startBlocker(this.lobby()?.game_key, this.members().length),
  );
  readonly canStart = computed(() => canStartLobby(this.members()) && !this.startBlocker());
  // Eine Zeile über den Knöpfen: was dem Start noch fehlt; unter der Mindestzahl des
  // Spiels (allein in der Lobby) keine
  readonly status = computed(() => {
    const count = this.members().length;
    if (count < (this.game()?.minPlayers ?? 2)) return null;
    return (
      this.startBlocker() ?? `${this.readyCount()} von ${count} bereit – alle müssen bereit sein`
    );
  });

  // Gast: was er tun kann bzw. worauf er wartet
  readonly guestStatus = computed(() =>
    this.me()?.ready
      ? (this.startBlocker() ?? 'Du bist bereit – der Host startet das Spiel.')
      : 'Tippe auf „Bereit“, sobald du loslegen willst.',
  );

  readonly game = computed(() => gameOf(this.lobby()?.game_key));
  // Host: Kurzbeschreibung und Einstellungen in einer Zeile
  readonly gameSummary = computed(() => {
    const game = this.game();
    if (!game) return 'Noch kein Spiel gewählt';
    const lobby = this.lobby();
    const target = flip7TargetOf(lobby?.game_settings);
    const settings =
      lobby?.game_key === 'flip-7'
        ? target === null
          ? 'Offen'
          : `Ziel ${target}`
        : settingsLabel(lobby?.game_key, lobby?.game_settings);
    return settings ? `${game.tagline} · ${settings}` : game.tagline;
  });
  // Gäste sehen die Einstellungen des Spiels als Chips
  readonly gameSettings = computed((): { label: string; chips: string[] } | null => {
    const lobby = this.lobby();
    const settings = lobby?.game_settings;
    switch (lobby?.game_key) {
      case 'flip-7': {
        const target = flip7TargetOf(settings);
        return { label: 'Punkteziel', chips: [target === null ? 'Offen' : `${target} Punkte`] };
      }
      case 'skip-bo':
        return {
          label: 'Spielstapel',
          chips: [settings?.stockSize ? `${settings.stockSize} Karten` : 'Standard'],
        };
      case 'blackjack':
        return { label: 'Startgeld', chips: [formatMoney(startMoneyOf(settings))] };
      case 'uno': {
        const active = unoRulesOf(settings);
        const chips = UNO_HOUSE_RULES.filter((rule) => active[rule.key]).map((r) => r.label);
        return { label: 'Hausregeln', chips: chips.length ? chips : ['Standardregeln'] };
      }
      default:
        return null;
    }
  });
  readonly rules = computed(() => rulesOf(this.lobby()?.game_key, this.lobby()?.game_settings));

  // Abend-Wertung: Siege seit Eröffnen der Lobby, Spieler danach sortiert (sonst Beitritt)
  readonly wins = computed(() => this.lobby()?.wins ?? {});
  readonly ranking = computed(() =>
    [...this.members()].sort(
      (a, b) => (this.wins()[b.user_id] ?? 0) - (this.wins()[a.user_id] ?? 0),
    ),
  );
  readonly leaderWins = computed(() => {
    const lobby = this.lobby();
    return (lobby && eveningWinners(lobby)?.wins) || 0;
  });

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
    const code = this.code();
    if (!userId || !code) return;

    this.bottomSheet.open<LobbyInviteSheet, LobbyInviteSheetData>(LobbyInviteSheet, {
      data: {
        lobbyId: this.lobbyId,
        userId,
        code,
        memberIds: this.members().map((member) => member.user_id),
      },
      panelClass: 'app-sheet-panel',
      backdropClass: 'app-sheet-backdrop',
      ariaLabel: 'Leute einladen',
      autoFocus: 'dialog',
    });
  }

  openGameSheet(): void {
    this.bottomSheet.open<LobbyGameSheet, LobbyGameSheetData>(LobbyGameSheet, {
      data: {
        lobbyId: this.lobbyId,
        lobby: this.lobby,
        busy: this.busy,
        changed: () => this.reload(),
      },
      panelClass: 'app-sheet-panel',
      backdropClass: 'app-sheet-backdrop',
      ariaLabel: 'Spiel und Regeln',
      autoFocus: 'dialog',
    });
  }

  openRules(): void {
    const game = this.game();
    if (!game) return;

    this.dialog.open<RulesDialog, RulesDialogData>(RulesDialog, {
      data: { title: `${game.name} – Regeln`, rules: [...this.rules()] },
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

  async transferHost(member: LobbyMember): Promise<void> {
    const confirmed = await this.confirm({
      title: 'Host abgeben?',
      message: `${member.name} wird Host, sieht den Lobby-Code und startet das Spiel. Du bleibst als Spieler in der Lobby.`,
      confirmLabel: 'Host abgeben',
      icon: 'workspace_premium',
    });

    if (
      confirmed &&
      (await this.run(() => this.lobbyService.transferHost(this.lobbyId, member.user_id)))
    ) {
      this.toastService.success('Host abgegeben', `${member.name} ist jetzt Host.`);
    }
  }

  // Bestätigt werden: Schließen (Host, wirft alle raus) und Verlassen eines gestarteten
  // Spiels (endgültig, Rückkehr erst in der Warte-Lobby). Verlassen der Warte-Lobby nicht.
  async leave(gameOver = false): Promise<void> {
    if (this.busy()) return;
    const winner = this.isHost() ? this.winnerLine() : undefined;
    const confirmation: ConfirmationDialogData | null = this.isHost()
      ? {
          title: 'Lobby schließen?',
          message: winner
            ? `Alle Spieler werden entfernt. ${winner}.`
            : 'Alle Spieler werden entfernt.',
          confirmLabel: 'Schließen',
          icon: 'logout',
        }
      : this.started()
        ? {
            title: gameOver ? 'Lobby verlassen?' : 'Spiel verlassen?',
            message: gameOver
              ? 'Spielt der Host weiter, bist du nicht mehr dabei.'
              : 'Du verlässt das laufende Spiel endgültig.',
            confirmLabel: 'Verlassen',
            icon: 'logout',
          }
        : null;
    if (confirmation && !(await this.confirm(confirmation))) {
      return;
    }

    this.leaving = true;
    if (await this.run(() => this.lobbyService.leave(this.lobbyId))) {
      if (winner) {
        this.toastService.show(
          { tone: 'success', icon: 'emoji_events', title: 'Lobby geschlossen', message: winner },
          8000,
        );
      }
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
      this.leaveView('Die Lobby wurde geschlossen.', this.winnerLine());
    } else if (!lobby.members.some((member) => member.user_id === this.userId())) {
      this.leaveView('Du bist nicht (mehr) in dieser Lobby.');
    } else {
      const previousHost = this.lobby()?.host_user_id;
      if (
        previousHost &&
        previousHost !== lobby.host_user_id &&
        lobby.host_user_id === this.userId()
      ) {
        this.toastService.show({
          tone: 'info',
          icon: 'workspace_premium',
          title: 'Du bist jetzt Host',
        });
      }
      this.lobby.set(lobby);
      this.loading.set(false);
    }
  }

  // z. B. „Abend-Gewinner: Anna mit 4 Siegen“ aus dem zuletzt geladenen Stand; ohne Siege leer
  private winnerLine(): string | undefined {
    const lobby = this.lobby();
    const winners = lobby && eveningWinners(lobby);
    if (!winners) return undefined;
    const wins = winners.wins === 1 ? '1 Sieg' : `${winners.wins} Siegen`;
    const each = winners.names.length > 1 ? 'je ' : '';
    return `Abend-Gewinner: ${winners.names.join(' & ')} mit ${each}${wins}`;
  }

  private leaveView(title: string, winner?: string): void {
    this.leaving = true;
    if (winner) {
      this.toastService.show({ tone: 'info', icon: 'emoji_events', title, message: winner }, 8000);
    } else {
      this.toastService.show({ tone: 'info', icon: 'info', title });
    }
    void this.router.navigateByUrl('/multiplayer');
  }
}
