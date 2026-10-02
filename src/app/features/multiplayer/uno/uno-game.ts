import { Component, computed, inject, input, output } from '@angular/core';
import { GameStage } from '../table/game-stage';
import { injectFinalDelay, injectTableGame, injectTableHistory } from '../table/table-game';
import { cardCount } from '../table/table.model';
import { UnoBoard, UnoPlay } from './uno-board';
import { UnoFinal } from './uno-final';
import { UnoService } from './uno.service';
import {
  describeEvent,
  eventIcon,
  UNO_HOUSE_RULES,
  UNO_RULES,
  UNO_SKIP_AFTER_S,
  UnoEvent,
  UnoGame,
} from './uno.model';

// Endet die Runde live, bleibt der Tisch so lange stehen (letzter Flug, Sieg-Puls)
const FINAL_DELAY_MS = 1200;

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und schaltet
// zwischen Spieltisch und Rundenende um. Liegt auf der gemeinsamen Bühne (Kopf mit
// letztem Ereignis, Verlauf und ⋮-Menü für Host-Aktionen und Verlassen).
@Component({
  selector: 'app-uno-game',
  imports: [GameStage, UnoBoard, UnoFinal],
  templateUrl: './uno-game.html',
})
export class UnoGameView {
  private readonly uno = inject(UnoService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<UnoGame>({
    service: this.uno,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Uno',
    skipAfterS: UNO_SKIP_AFTER_S,
    skipMessage: 'Der Zug endet; eine offene +2/+4 zieht der Spieler noch.',
    endMessage: () => 'Die laufende Runde wird nicht gewertet. Danach wird der Endstand angezeigt.',
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
  readonly subtitle = computed(() => {
    const game = this.game();
    return game ? `Stapel: ${cardCount(game.draw_count)}` : null;
  });
  // Grundregeln plus die Hausregeln dieses Spiels
  readonly rules = computed(() => {
    const settings = this.game()?.settings ?? {};
    return {
      title: 'Uno – Regeln',
      rules: [
        ...UNO_RULES,
        ...UNO_HOUSE_RULES.filter((rule) => settings[rule.key]).map((rule) => rule.rule),
      ],
    };
  });

  // Im Kopf: die gewählte Farbe steht schon bei „legt Farbwahl“
  private readonly history = injectTableHistory<UnoEvent>({
    log: computed(() => this.game()?.round_log ?? []),
    now: this.table.now,
    describe: (event) => ({
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.table.mySeat()),
    }),
    headline: (event) => event.t !== 'color',
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon
  // weiter, ignoriert die Datenbank sie
  async play(game: UnoGame, move: UnoPlay): Promise<void> {
    await this.table.run(() => this.uno.play(game, move.card, move.color, move.target));
  }

  async draw(game: UnoGame): Promise<void> {
    await this.table.run(() => this.uno.draw(game));
  }

  async pass(game: UnoGame): Promise<void> {
    await this.table.run(() => this.uno.pass(game));
  }

  async callUno(game: UnoGame): Promise<void> {
    await this.table.run(() => this.uno.callUno(game.id));
  }

  async nextRound(game: UnoGame): Promise<void> {
    await this.table.run(() => this.uno.nextRound(game.id, game.round_no));
  }

  openHistory(): void {
    this.history.open();
  }
}
