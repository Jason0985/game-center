import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { gameOf, LobbyGameSettings } from '../lobby.model';
import { LobbyGameDialog, LobbyGameDialogData } from './lobby-game-dialog';
import { FLIP7_DEFAULT_TARGET, FLIP7_TARGET_OPTIONS } from '../flip7/flip7.model';
import { UNO_DEFAULT_SETTINGS, UNO_HOUSE_RULES, UNO_RULES, UnoSettings } from '../uno/uno.model';
import { SKIPBO_STOCK_DEFAULT, SKIPBO_STOCK_MAX, SKIPBO_STOCK_MIN } from '../skipbo/skipbo.model';

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
  readonly houseRules = UNO_HOUSE_RULES;
  readonly unoRulesText = UNO_RULES;
  readonly stockMin = SKIPBO_STOCK_MIN;
  readonly stockMax = SKIPBO_STOCK_MAX;
  readonly saving = signal(false);
  readonly selectedGame = computed(() => gameOf(this.gameKey()));
  readonly flip7 = computed(() => this.gameKey() === 'flip-7');
  readonly uno = computed(() => this.gameKey() === 'uno');
  readonly skipBo = computed(() => this.gameKey() === 'skip-bo');
  // Auswahl sofort anzeigen, bei Fehler zurücksetzen
  readonly target = linkedSignal<number | null>(() => {
    const target = this.settings()?.targetScore;
    return target === undefined ? FLIP7_DEFAULT_TARGET : target;
  });
  readonly unoRules = linkedSignal<UnoSettings>(() => {
    const settings = this.settings();
    return {
      stacking: settings?.stacking ?? UNO_DEFAULT_SETTINGS.stacking,
      sevenZero: settings?.sevenZero ?? UNO_DEFAULT_SETTINGS.sevenZero,
      drawUntilPlayable: settings?.drawUntilPlayable ?? UNO_DEFAULT_SETTINGS.drawUntilPlayable,
    };
  });
  // null = Standard (30, ab 5 Spielern 20)
  readonly stockSize = linkedSignal<number | null>(() => this.settings()?.stockSize ?? null);
  // Wert beim Ziehen des Reglers, gespeichert wird erst beim Loslassen
  readonly stockDraft = linkedSignal(() => this.stockSize() ?? SKIPBO_STOCK_DEFAULT);
  readonly activeHouseRules = computed(() =>
    UNO_HOUSE_RULES.filter((rule) => this.unoRules()[rule.key]),
  );

  async selectTarget(target: number | null): Promise<void> {
    if (target === this.target() && this.flip7()) return;
    await this.save('flip-7', { target });
  }

  async selectStockSize(stockSize: number): Promise<void> {
    if (stockSize === this.stockSize()) return;
    await this.save('skip-bo', { stockSize });
  }

  async toggleHouseRule(key: keyof UnoSettings): Promise<void> {
    await this.save('uno', { unoRules: { ...this.unoRules(), [key]: !this.unoRules()[key] } });
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
      await this.save(gameKey, {});
    }
  }

  // Einstellungen des Spiels: Flip 7 das Punkteziel, Uno die Hausregeln, Skip-Bo die
  // Stapelgröße, sonst keine.
  // Auswahl sofort anzeigen, bei Fehler zurücksetzen.
  private async save(
    gameKey: string,
    change: { target?: number | null; unoRules?: UnoSettings; stockSize?: number },
  ): Promise<void> {
    if (!this.isHost() || this.saving()) return;

    const previous = {
      target: this.target(),
      unoRules: this.unoRules(),
      stockSize: this.stockSize(),
    };
    if (change.target !== undefined) this.target.set(change.target);
    if (change.unoRules) this.unoRules.set(change.unoRules);
    if (change.stockSize !== undefined) this.stockSize.set(change.stockSize);
    this.saving.set(true);
    const result = await this.lobbyService.setGame(
      this.lobbyId(),
      gameKey,
      this.settingsFor(gameKey),
    );
    this.saving.set(false);

    if (!result.ok) {
      this.target.set(previous.target);
      this.unoRules.set(previous.unoRules);
      this.stockSize.set(previous.stockSize);
      this.stockDraft.set(previous.stockSize ?? SKIPBO_STOCK_DEFAULT);
      this.appErrors.report(result.message, { title: 'Lobby' });
    }
    this.changed.emit();
  }

  private settingsFor(gameKey: string): LobbyGameSettings {
    if (gameKey === 'flip-7') return { targetScore: this.target() };
    if (gameKey === 'uno') return { ...this.unoRules() };
    if (gameKey === 'skip-bo' && this.skipBo()) {
      const stockSize = this.stockSize();
      return stockSize === null ? {} : { stockSize };
    }
    return {};
  }
}
