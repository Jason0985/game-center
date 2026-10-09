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
import { GameStage } from '../table/game-stage';
import { injectTableGame, injectTableHistory } from '../table/table-game';
import { Flip7Board } from './flip7-board';
import { Flip7Final } from './flip7-final';
import { Flip7RoundSummary } from './flip7-round-summary';
import { Flip7Service } from './flip7.service';
import {
  activeSeatOf,
  describeEvent,
  eventIcon,
  Flip7Event,
  Flip7Game,
  FLIP7_NEXT_ROUND_DELAY_S,
  FLIP7_RULES,
  FLIP7_SKIP_AFTER_S,
} from './flip7.model';

// Nach Rundenende bleibt der Tisch so lange stehen, danach kommt die Übersicht
// (mit vollem Countdown; die Datenbank verlangt nur 8 s seit Rundenende)
const ROUND_END_TABLE_S = 3;
const ROUND_END_S = ROUND_END_TABLE_S + FLIP7_NEXT_ROUND_DELAY_S;

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und
// schaltet zwischen Spieltisch, Rundenübersicht und Endstand um. Liegt auf der
// gemeinsamen Bühne (Kopf mit Hinweis, letztem Ereignis, Verlauf und ⋮-Menü).
@Component({
  selector: 'app-flip7-game',
  imports: [GameStage, Flip7Board, Flip7RoundSummary, Flip7Final],
  templateUrl: './flip7-game.html',
})
export class Flip7GameView {
  private readonly flip7 = inject(Flip7Service);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<Flip7Game>({
    service: this.flip7,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Flip 7',
    skipAfterS: FLIP7_SKIP_AFTER_S,
    skipMessage:
      'Wer gerade am Zug ist, sichert seine Punkte. Eine offene Zielauswahl wird automatisch getroffen.',
    endMessage: (game) =>
      game.status === 'playing'
        ? 'Die laufende Runde wird nicht gewertet.'
        : 'Danach wird der Endstand angezeigt.',
    activeSeat: activeSeatOf,
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly now = this.table.now;
  readonly waitingSeconds = this.table.waitingSeconds;
  readonly waitingClock = this.table.waitingClock;
  readonly canSkip = this.table.canSkip;
  readonly activeName = this.table.activeName;
  readonly playerCount = this.table.playerCount;
  readonly skip = this.table.skip;
  readonly endGame = this.table.endGame;
  readonly backToLobby = this.table.backToLobby;

  private readonly roundOverSince = signal<number | null>(null);
  readonly secondsLeft = computed(() => {
    const since = this.roundOverSince();
    if (since === null) return 0;
    return Math.max(0, Math.ceil((since + ROUND_END_S * 1000 - this.now()) / 1000));
  });
  // Rundenende: erst ein paar Sekunden der Tisch (Flip-7-Moment), dann die Übersicht
  readonly showRoundTable = computed(
    () => this.roundOverSince() === null || this.secondsLeft() > FLIP7_NEXT_ROUND_DELAY_S,
  );
  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    return `Runde ${game.round_no} · ${game.target_score ? 'Ziel ' + game.target_score : 'Offen'}`;
  });
  // Tisch statt Übersicht/Endstand (nimmt die volle Höhe, scrollt nicht)
  readonly boardView = computed(() => {
    const game = this.game();
    return (
      !!game && game.status !== 'finished' && (game.status === 'playing' || this.showRoundTable())
    );
  });
  readonly rules = { title: 'Flip 7 – Regeln', rules: FLIP7_RULES };

  // Verlauf der laufenden Runde; "noch N Karten" nur beim neuesten Flip 3, ältere sind erledigt
  private readonly roundLog = computed(() => {
    const game = this.game();
    return game
      ? game.round_log.filter((event) => (event.r ?? game.round_no) === game.round_no)
      : [];
  });
  private readonly liveFlip3 = computed(() =>
    this.roundLog()
      .filter((event) => event.t === 'flip3')
      .at(-1),
  );
  private readonly history = injectTableHistory<Flip7Event>({
    log: this.roundLog,
    now: this.now,
    describe: (event) => {
      const game = this.game()!;
      const context = event === this.liveFlip3() ? game : { ...game, flip3_left: null };
      return { ...eventIcon(event), text: describeEvent(event, context, this.table.mySeat()) };
    },
    cue: (event) => {
      const mine = event.seat === this.table.mySeat();
      if (event.t === 'flip7') return mine ? 'win' : 'alert';
      return event.t === 'bust' && mine ? 'bust' : null;
    },
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  constructor() {
    // Einmal pro Runde: nach Ablauf der Übersicht die nächste Runde anstoßen
    const finishedRound = computed(() => {
      const game = this.game();
      return game?.status === 'round_over' ? `${game.id}:${game.round_no}` : null;
    });
    effect((onCleanup) => {
      if (!finishedRound()) {
        this.roundOverSince.set(null);
        return;
      }

      const game = untracked(this.game)!;
      this.roundOverSince.set(Date.now());
      this.now.set(Date.now());
      // Uhr genau zum Wechsel auf die Übersicht nachstellen, nicht erst beim nächsten Takt
      const timers = [
        setTimeout(() => this.now.set(Date.now()), ROUND_END_TABLE_S * 1000),
        setTimeout(() => void this.nextRound(game.id, game.round_no, false), ROUND_END_S * 1000),
      ];
      onCleanup(() => timers.forEach(clearTimeout));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon
  // weiter, ignoriert die Datenbank sie
  async hit(game: Flip7Game): Promise<void> {
    await this.table.run(() => this.flip7.hit(game));
  }

  async stay(game: Flip7Game): Promise<void> {
    await this.table.run(() => this.flip7.stay(game));
  }

  async choose(game: Flip7Game, seat: number): Promise<void> {
    await this.table.run(() => this.flip7.chooseTarget(game, seat));
  }

  // "Jetzt weiter" (Host sofort, alle nach dem Countdown; Fehler anzeigen) oder
  // Timer bei allen (Fehler ignorieren)
  async nextRound(gameId: string, roundNo: number, manual = true): Promise<void> {
    if (!manual) {
      const result = await this.flip7.nextRound(gameId, roundNo);
      if (!result.ok) console.warn('Nächste Runde nicht gestartet.', result.message);
      await this.table.load();
      return;
    }
    await this.table.run(() => this.flip7.nextRound(gameId, roundNo));
  }

  async continueOpen(game: Flip7Game): Promise<void> {
    await this.table.run(() => this.flip7.continueOpen(game.id));
  }

  openHistory(): void {
    this.history.open();
  }
}
