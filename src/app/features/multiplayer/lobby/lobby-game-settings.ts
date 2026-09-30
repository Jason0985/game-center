import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { LobbyGameSettings } from '../lobby.model';
import { FLIP7_DEFAULT_TARGET, FLIP7_TARGET_OPTIONS } from '../flip7/flip7.model';

// Spielauswahl und Rahmenbedingungen in der Warte-Lobby; ändern darf nur der Host
@Component({
  selector: 'app-lobby-game-settings',
  imports: [MatIconModule, NgTemplateOutlet],
  templateUrl: './lobby-game-settings.html',
  styleUrl: './lobby-game-settings.scss',
})
export class LobbyGameSetup {
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);

  readonly lobbyId = input.required<string>();
  readonly gameKey = input<string | null>(null);
  readonly settings = input<LobbyGameSettings | null>(null);
  readonly isHost = input(false);
  readonly disabled = input(false);
  // Gespeichert (die Lobby lädt dann neu)
  readonly changed = output<void>();

  readonly targetOptions = FLIP7_TARGET_OPTIONS;
  readonly saving = signal(false);
  readonly selected = computed(() => this.gameKey() === 'flip-7');
  // Auswahl sofort anzeigen, bei Fehler zurücksetzen
  readonly target = linkedSignal<number | null>(() => {
    const settings = this.settings();
    return settings ? settings.targetScore : FLIP7_DEFAULT_TARGET;
  });

  async selectTarget(target: number | null): Promise<void> {
    if (target === this.target() && this.selected()) return;
    await this.save(target);
  }

  async selectGame(): Promise<void> {
    if (!this.selected()) {
      await this.save(this.target());
    }
  }

  private async save(target: number | null): Promise<void> {
    if (!this.isHost() || this.saving()) return;

    const previous = this.target();
    this.target.set(target);
    this.saving.set(true);
    const result = await this.lobbyService.setGame(this.lobbyId(), 'flip-7', {
      targetScore: target,
    });
    this.saving.set(false);

    if (!result.ok) {
      this.target.set(previous);
      this.appErrors.report(result.message, { title: 'Lobby' });
    }
    this.changed.emit();
  }
}
