import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ActionResult } from '../../../services/supabase-errors';
import { GameStage } from '../table/game-stage';
import { injectFinalDelay, injectTableGame, injectTableHistory } from '../table/table-game';
import { BlackjackBoard } from './blackjack-board';
import { BlackjackFinal } from './blackjack-final';
import { BlackjackService } from './blackjack.service';
import {
  BET_WINDOW_S,
  BjAction,
  BjEvent,
  BjGame,
  BLACKJACK_RULES,
  describeEvent,
  eventIcon,
  TURN_S,
} from './blackjack.model';

// Endet das Spiel live, bleibt der Tisch so lange stehen (Aufdecken, Dealer, Chips)
const FINAL_DELAY_MS = 4000;

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und schaltet
// zwischen Spieltisch und Endstand um. Mit Mitspielern laufen zwei Uhren bei allen am
// Tisch: 20 s nach dem ersten Einsatz wird ausgeteilt, nach 30 s ohne Zug hält die Hand
// (die Datenbank prüft beides selbst, doppelte Aufrufe tun nichts).
@Component({
  selector: 'app-blackjack-game',
  imports: [GameStage, BlackjackBoard, BlackjackFinal],
  templateUrl: './blackjack-game.html',
})
export class BlackjackGameView {
  private readonly blackjack = inject(BlackjackService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<BjGame>({
    service: this.blackjack,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Blackjack',
    skipAfterS: TURN_S,
    skipMessage: 'Die Hand am Zug hält.',
    endMessage: () => 'Offene Einsätze gehen zurück. Danach wird der Endstand angezeigt.',
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly waitingClock = this.table.waitingClock;
  readonly playerCount = this.table.playerCount;
  readonly skip = this.table.skip;
  readonly endGame = this.table.endGame;
  readonly backToLobby = this.table.backToLobby;
  readonly showFinal = injectFinalDelay(
    computed(() => this.game()?.status ?? null),
    FINAL_DELAY_MS,
  );
  readonly rules = { title: 'Blackjack – Regeln', rules: BLACKJACK_RULES };

  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return 'Spiel beendet';
    if (game.phase === 'betting') return `Runde ${game.round_no} · Einsätze setzen`;
    const turn =
      game.turn_seat === this.table.mySeat()
        ? 'Du bist am Zug'
        : `${this.table.activeName()} ist am Zug`;
    return `Runde ${game.round_no} · ${turn}`;
  });
  // Beim Setzen bleibt waiting_since gleich (null): Überspringen nur, wenn jemand anderes
  // am Zug ist (allein bzw. selbst am Zug hält man einfach)
  readonly skipName = computed(() =>
    this.table.canSkip() &&
    this.game()?.phase === 'playing' &&
    this.playerCount() > 1 &&
    this.game()?.turn_seat !== this.table.mySeat()
      ? this.table.activeName()
      : null,
  );

  // Zugzeit nur mit Mitspielern
  private readonly timedTurn = computed(() => {
    const game = this.game();
    return game?.status === 'playing' && game.phase === 'playing' && this.playerCount() > 1
      ? game.waiting_since
      : null;
  });
  readonly turnSecondsLeft = computed(() =>
    this.timedTurn() ? Math.max(0, TURN_S - this.table.waitingSeconds()) : null,
  );

  // Setzzeit: läuft ab dem ersten Einsatz der Runde (lokal gemessen)
  private readonly betWindow = computed(() => {
    const game = this.game();
    return game?.status === 'playing' && game.phase === 'betting' && game.first_bet_at
      ? `${game.id}:${game.round_no}:${game.first_bet_at}`
      : null;
  });
  private readonly betStartedAt = signal<number | null>(null);
  readonly betSecondsLeft = computed(() => {
    const start = this.betStartedAt();
    if (start === null) return null;
    return Math.max(0, BET_WINDOW_S - Math.floor((this.table.now() - start) / 1000));
  });

  private readonly history = injectTableHistory<BjEvent>({
    log: computed(() => this.game()?.round_log ?? []),
    now: this.table.now,
    describe: (event) => ({
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.table.mySeat()),
    }),
    cue: (event) => {
      if (event.seat !== this.table.mySeat()) return null;
      if (event.t === 'result' && (event.k === 'win' || event.k === 'blackjack')) return 'win';
      return (event.t === 'hit' || event.t === 'double') && (event.n ?? 0) > 21 ? 'bust' : null;
    },
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  constructor() {
    // Einmal pro Setzfenster: nach Ablauf austeilen lassen
    effect((onCleanup) => {
      if (!this.betWindow()) {
        this.betStartedAt.set(null);
        return;
      }
      const game = untracked(this.game)!;
      this.betStartedAt.set(Date.now());
      this.table.now.set(Date.now());
      const timer = setTimeout(
        () => void this.silent(() => this.blackjack.deal(game.id, game.round_no)),
        BET_WINDOW_S * 1000,
      );
      onCleanup(() => clearTimeout(timer));
    });

    // Einmal pro Zug: nach Ablauf der Zugzeit hält die Hand
    let skipped: string | null = null;
    effect(() => {
      const turn = this.timedTurn();
      if (!turn || skipped === turn || this.table.waitingSeconds() < TURN_S) return;
      skipped = turn;
      const game = untracked(this.game)!;
      void this.silent(() => this.blackjack.skip(game));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon weiter,
  // ignoriert die Datenbank sie
  async bet(game: BjGame, amount: number): Promise<void> {
    await this.table.run(() => this.blackjack.bet(game.id, game.round_no, amount));
  }

  async play(game: BjGame, action: BjAction): Promise<void> {
    await this.table.run(() => this.blackjack.play(game, action));
  }

  openHistory(): void {
    this.history.open();
  }

  // Uhr-Aufrufe aller am Tisch: Fehler nur ins Log (meist war ein anderer schneller)
  private async silent(action: () => Promise<ActionResult>): Promise<void> {
    const result = await action();
    if (!result.ok) console.warn('Blackjack: automatischer Zug nicht ausgeführt.', result.message);
    await this.table.load();
  }
}
