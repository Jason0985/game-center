import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { gameOf, LobbyGameSettings } from '../lobby.model';
import { LobbyGameDialog, LobbyGameDialogData } from './lobby-game-dialog';
import { FLIP7_DEFAULT_TARGET, FLIP7_TARGET_OPTIONS } from '../flip7/flip7.model';

// Spielauswahl und Rahmenbedingungen in der Warte-Lobby; ändern darf nur der Host
@Component({
  selector: 'app-lobby-game-settings',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './lobby-game-settings.html',
  styleUrl: './lobby-game-settings.scss',
})
export class LobbyGameSetup {
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly dialog = inject(MatDialog);

  readonly lobbyId = input.required<string>();
  readonly gameKey = input<string | null>(null);
  readonly settings = input<LobbyGameSettings | null>(null);
  readonly isHost = input(false);
  readonly disabled = input(false);
  // Gespeichert (die Lobby lädt dann neu)
  readonly changed = output<void>();

  readonly targetOptions = FLIP7_TARGET_OPTIONS;
  readonly saving = signal(false);
  readonly selectedGame = computed(() => gameOf(this.gameKey()));
  readonly flip7 = computed(() => this.gameKey() === 'flip-7');
  // Auswahl sofort anzeigen, bei Fehler zurücksetzen
  readonly target = linkedSignal<number | null>(() => {
    const target = this.settings()?.targetScore;
    return target === undefined ? FLIP7_DEFAULT_TARGET : target;
  });

  async selectTarget(target: number | null): Promise<void> {
    if (target === this.target() && this.flip7()) return;
    await this.save('flip-7', target);
  }

  openGameDialog(): void {
    this.dialog
      .open<LobbyGameDialog, LobbyGameDialogData, string>(LobbyGameDialog, {
        data: { gameKey: this.gameKey() },
        width: '380px',
      })
      .afterClosed()
      .subscribe((gameKey) => {
        if (gameKey) void this.selectGame(gameKey);
      });
  }

  async selectGame(gameKey: string): Promise<void> {
    if (gameKey !== this.gameKey()) {
      await this.save(gameKey, this.target());
    }
  }

  // target gilt nur für Flip 7; Skip-Bo hat keine Einstellungen
  private async save(gameKey: string, target: number | null): Promise<void> {
    if (!this.isHost() || this.saving()) return;

    const previous = this.target();
    this.target.set(target);
    this.saving.set(true);
    const result = await this.lobbyService.setGame(
      this.lobbyId(),
      gameKey,
      gameKey === 'flip-7' ? { targetScore: target } : {},
    );
    this.saving.set(false);

    if (!result.ok) {
      this.target.set(previous);
      this.appErrors.report(result.message, { title: 'Lobby' });
    }
    this.changed.emit();
  }
}
