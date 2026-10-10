import { Component, computed, inject, linkedSignal, Signal, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AppErrorService } from '../../../services/app-error.service';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import {
  flip7TargetOf,
  gameOf,
  GAMES,
  LobbyDetail,
  LobbyGameSettings,
  rulesOf,
  startMoneyOf,
  unoRulesOf,
} from '../lobby.model';
import { formatMoney, START_MONEY_OPTIONS } from '../blackjack/blackjack.model';
import { FLIP7_TARGET_OPTIONS } from '../flip7/flip7.model';
import { UNO_HOUSE_RULES, UnoSettings } from '../uno/uno.model';
import { SKIPBO_STOCK_DEFAULT, SKIPBO_STOCK_MAX, SKIPBO_STOCK_MIN } from '../skipbo/skipbo.model';

// Signale statt fester Werte: Die Lobby lädt weiter, während das Sheet offen ist
export interface LobbyGameSheetData {
  lobbyId: string;
  lobby: Signal<LobbyDetail | null>;
  busy: Signal<boolean>;
  // Gespeichert: die Lobby lädt neu
  changed: () => void;
}

// „Spiel & Regeln“ für den Host: Spielwahl, Einstellungen des Spiels und Kurzregeln
@Component({
  selector: 'app-lobby-game-sheet',
  imports: [MatIconModule],
  templateUrl: './lobby-game-sheet.html',
  styleUrl: './lobby-game-sheet.scss',
})
export class LobbyGameSheet {
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);
  private readonly data = inject<LobbyGameSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject(MatBottomSheetRef);

  readonly games = GAMES.map((game) => ({
    ...game,
    meta: game.url
      ? game.tagline
      : `${game.minPlayers}–${game.maxPlayers} Spieler · ${game.tagline}`,
  }));
  readonly targetOptions = FLIP7_TARGET_OPTIONS;
  readonly houseRules = UNO_HOUSE_RULES;
  readonly stockMin = SKIPBO_STOCK_MIN;
  readonly stockMax = SKIPBO_STOCK_MAX;
  readonly moneyOptions = START_MONEY_OPTIONS;
  readonly formatMoney = formatMoney;
  readonly saving = signal(false);
  readonly locked = computed(() => this.data.busy() || this.saving());

  private readonly settings = computed(() => this.data.lobby()?.game_settings ?? null);
  // Auswahl sofort anzeigen, bei Fehler zurücksetzen
  readonly gameKey = linkedSignal(() => this.data.lobby()?.game_key ?? null);
  readonly game = computed(() => gameOf(this.gameKey()));
  readonly target = linkedSignal(() => flip7TargetOf(this.settings()));
  readonly unoRules = linkedSignal(() => unoRulesOf(this.settings()));
  // null = Standard (30, ab 5 Spielern 20)
  readonly stockSize = linkedSignal<number | null>(() => this.settings()?.stockSize ?? null);
  // Wert beim Ziehen des Reglers, gespeichert wird erst beim Loslassen
  readonly stockDraft = linkedSignal(() => this.stockSize() ?? SKIPBO_STOCK_DEFAULT);
  readonly startMoney = linkedSignal(() => startMoneyOf(this.settings()));
  readonly rules = computed(() => rulesOf(this.gameKey(), this.unoRules()));

  async selectGame(gameKey: string): Promise<void> {
    if (gameKey !== this.gameKey()) await this.save(gameKey, {});
  }

  async selectTarget(target: number | null): Promise<void> {
    if (target !== this.target()) await this.save('flip-7', { target });
  }

  async selectStockSize(stockSize: number): Promise<void> {
    if (stockSize !== this.stockSize()) await this.save('skip-bo', { stockSize });
  }

  async selectStartMoney(startMoney: number): Promise<void> {
    if (startMoney !== this.startMoney()) await this.save('blackjack', { startMoney });
  }

  async toggleHouseRule(key: keyof UnoSettings): Promise<void> {
    await this.save('uno', { unoRules: { ...this.unoRules(), [key]: !this.unoRules()[key] } });
  }

  // Flip 7 speichert das Punkteziel, Uno die Hausregeln, Skip-Bo die Stapelgröße, Blackjack
  // das Startgeld, sonst nichts
  private async save(
    gameKey: string,
    change: {
      target?: number | null;
      unoRules?: UnoSettings;
      stockSize?: number;
      startMoney?: number;
    },
  ): Promise<void> {
    if (this.locked()) return;

    const previous = {
      gameKey: this.gameKey(),
      target: this.target(),
      unoRules: this.unoRules(),
      stockSize: this.stockSize(),
      startMoney: this.startMoney(),
    };
    const switching = gameKey !== previous.gameKey;
    this.gameKey.set(gameKey);
    if (change.target !== undefined) this.target.set(change.target);
    if (change.unoRules) this.unoRules.set(change.unoRules);
    if (change.stockSize !== undefined) this.stockSize.set(change.stockSize);
    if (change.startMoney !== undefined) this.startMoney.set(change.startMoney);
    this.saving.set(true);
    const result = await this.lobbyService.setGame(
      this.data.lobbyId,
      gameKey,
      this.settingsFor(gameKey, switching),
    );
    this.saving.set(false);

    if (!result.ok) {
      this.gameKey.set(previous.gameKey);
      this.target.set(previous.target);
      this.unoRules.set(previous.unoRules);
      this.stockSize.set(previous.stockSize);
      this.stockDraft.set(previous.stockSize ?? SKIPBO_STOCK_DEFAULT);
      this.startMoney.set(previous.startMoney);
      this.appErrors.report(result.message, { title: 'Lobby' });
    }
    this.data.changed();
  }

  // Beim Wechsel zu Skip-Bo bzw. Blackjack gilt der Standard-Stapel bzw. das Standard-Startgeld
  private settingsFor(gameKey: string, switching: boolean): LobbyGameSettings {
    if (gameKey === 'flip-7') return { targetScore: this.target() };
    if (gameKey === 'uno') return { ...this.unoRules() };
    if (gameKey === 'blackjack' && !switching) return { startMoney: this.startMoney() };
    const stockSize = this.stockSize();
    if (gameKey === 'skip-bo' && !switching && stockSize !== null) return { stockSize };
    return {};
  }
}
