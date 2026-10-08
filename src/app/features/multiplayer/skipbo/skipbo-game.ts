import { Component, computed, inject, input, output } from '@angular/core';
import { GameStage } from '../table/game-stage';
import { HistoryRow } from '../table/history-sheet';
import { injectFinalDelay, injectTableGame, injectTableHistory } from '../table/table-game';
import { SkipboBoard, SkipboDiscard, SkipboPlay } from './skipbo-board';
import { SkipboFinal } from './skipbo-final';
import { SkipboService } from './skipbo.service';
import {
  describeEvent,
  eventIcon,
  SKIPBO_RULES,
  SKIPBO_SKIP_AFTER_S,
  SkipboEvent,
  SkipboGame,
} from './skipbo.model';

// Endet das Spiel live, bleibt der Tisch so lange stehen (letzter Flug, Sieg-Puls)
const FINAL_DELAY_MS = 1200;

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und schaltet
// zwischen Spieltisch und Endstand um. Liegt auf der gemeinsamen Bühne (Kopf mit
// letztem Ereignis, Verlauf und ⋮-Menü für Host-Aktionen und Verlassen).
@Component({
  selector: 'app-skipbo-game',
  imports: [GameStage, SkipboBoard, SkipboFinal],
  templateUrl: './skipbo-game.html',
})
export class SkipboGameView {
  private readonly skipbo = inject(SkipboService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<SkipboGame>({
    service: this.skipbo,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Skip-Bo',
    skipAfterS: SKIPBO_SKIP_AFTER_S,
    skipMessage: 'Der Zug endet ohne Ablegen, die Handkarten bleiben.',
    endMessage: () => 'Danach wird der Endstand angezeigt.',
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly waitingSeconds = this.table.waitingSeconds;
  readonly waitingClock = this.table.waitingClock;
  readonly canSkip = this.table.canSkip;
  readonly activeName = this.table.activeName;
  readonly playerCount = this.table.playerCount;
  readonly skip = this.table.skip;
  readonly endGame = this.table.endGame;
  readonly backToLobby = this.table.backToLobby;
  readonly showFinal = injectFinalDelay(
    computed(() => this.game()?.status ?? null),
    FINAL_DELAY_MS,
  );
  readonly rules = { title: 'Skip-Bo – Regeln', rules: SKIPBO_RULES };

  // Im Kopf: Nachziehen anderer überdeckt sonst immer deren Ablegen davor
  private readonly history = injectTableHistory<SkipboEvent>({
    log: computed(() => this.game()?.round_log ?? []),
    now: this.table.now,
    describe: (event) => this.describe(event),
    headline: (event) => event.t !== 'draw' || event.seat === this.table.mySeat(),
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon
  // weiter, ignoriert die Datenbank sie
  async play(game: SkipboGame, move: SkipboPlay): Promise<void> {
    await this.table.run(() => this.skipbo.play(game, move.source, move.pile));
  }

  async discard(game: SkipboGame, move: SkipboDiscard): Promise<void> {
    await this.table.run(() => this.skipbo.discard(game, move.hand, move.pile));
  }

  openHistory(): void {
    this.history.open();
  }

  private describe(event: SkipboEvent): Omit<HistoryRow, 'time'> {
    return {
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.table.mySeat()),
    };
  }
}
