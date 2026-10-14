import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ActionResult } from '../../../services/supabase-errors';
import { GameStage } from '../table/game-stage';
import { injectTableGame, injectTableHistory } from '../table/table-game';
import { SkyjoBoard } from './skyjo-board';
import { SkyjoFinal } from './skyjo-final';
import { SkyjoRound } from './skyjo-round';
import { SkyjoService } from './skyjo.service';
import {
  describeEvent,
  eventIcon,
  SKYJO_CLEAR_MS,
  SKYJO_NEXT_ROUND_S,
  SKYJO_RESULTS_PAUSE_MS,
  SKYJO_ROUND_MIN_S,
  SKYJO_TURN_S,
  SkEvent,
  SkGame,
  SkSource,
  skyjoRules,
} from './skyjo.model';

type View = 'play' | 'round' | 'last' | 'final';

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und schaltet zwischen
// Spieltisch, Rundenübersicht und Endstand um (endet das Spiel mit dem Rundenende, erst die
// Übersicht der letzten Runde). Zwei Uhren laufen bei allen am Tisch: nach SKYJO_TURN_S
// (plus Animation) deckt der Tisch für den Trödler auf, nach SKYJO_NEXT_ROUND_S geht es
// weiter (die Datenbank prüft beides, doppelte Aufrufe tun nichts).
@Component({
  selector: 'app-skyjo-game',
  imports: [GameStage, SkyjoBoard, SkyjoRound, SkyjoFinal],
  templateUrl: './skyjo-game.html',
})
export class SkyjoGameView {
  private readonly skyjo = inject(SkyjoService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<SkGame>({
    service: this.skyjo,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Skyjo',
    skipAfterS: SKYJO_TURN_S,
    skipMessage: 'Der Tisch deckt eine zufällige Karte auf.',
    endMessage: () =>
      'Gewertet werden die abgeschlossenen Runden. Danach wird der Endstand angezeigt.',
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly playerCount = this.table.playerCount;
  readonly endGame = this.table.endGame;
  readonly backToLobby = this.table.backToLobby;
  readonly rules = computed(() => {
    const game = this.game();
    return {
      title: 'Skyjo – Regeln',
      rules: skyjoRules({
        endScore: game?.end_score ?? 100,
        clearColumns: game?.clear_columns ?? true,
        doubleEnder: game?.double_ender ?? true,
      }),
    };
  });

  // Was der Stand zeigt; die Ansicht folgt live erst, wenn der Tisch fertig animiert hat
  private readonly mode = computed((): View | null => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return game.phase === 'round_over' ? 'last' : 'final';
    return game.phase === 'round_over' ? 'round' : 'play';
  });
  readonly view = signal<View>('play');
  private readonly viewSince = signal(Date.now());

  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    const view = this.view();
    if (view === 'final') return 'Spiel beendet';
    if (view === 'round' || view === 'last') return `Runde ${game.round_no} · Rundenende`;
    if (game.phase === 'reveal') return `Runde ${game.round_no} · Start`;
    if (game.ender_seat !== null) return `Runde ${game.round_no} · letzte Züge`;
    return `Runde ${game.round_no} · bis ${game.end_score} Punkte`;
  });

  // Zugzeit: Rundenstart bzw. Zug, plus die Zeit der letzten Animation (Spalte abräumen)
  private readonly timedTurn = computed(() => {
    const game = this.game();
    return game?.status === 'playing' && (game.phase === 'reveal' || game.phase === 'turn')
      ? game.waiting_since
      : null;
  });
  private readonly turnBudget = linkedSignal({
    source: this.timedTurn,
    computation: () => {
      const game = untracked(this.game);
      const clear = game?.last_events.some((event) => event.t === 'clear');
      return SKYJO_TURN_S + (clear ? Math.ceil(SKYJO_CLEAR_MS / 1000) : 0);
    },
  });
  readonly secondsLeft = computed(() =>
    this.timedTurn()
      ? Math.max(0, Math.min(SKYJO_TURN_S, this.turnBudget() - this.table.waitingSeconds()))
      : null,
  );
  private readonly roundShown = computed(() =>
    this.view() === 'round' || this.view() === 'last'
      ? Math.floor((this.table.now() - this.viewSince()) / 1000)
      : null,
  );
  readonly roundSecondsLeft = computed(() => {
    const shown = this.roundShown();
    return shown === null ? null : Math.max(0, SKYJO_NEXT_ROUND_S - shown);
  });
  readonly roundLocked = computed(
    () => this.view() === 'round' && (this.roundShown() ?? 0) < SKYJO_ROUND_MIN_S,
  );

  private readonly history = injectTableHistory<SkEvent>({
    log: computed(() => this.game()?.round_log ?? []),
    now: this.table.now,
    describe: (event) => ({
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.table.mySeat()),
    }),
    cue: (event) => {
      if (event.seat !== this.table.mySeat()) return null;
      if (event.t === 'clear') return 'win';
      return event.t === 'round_end' && event.doubled ? 'bust' : null;
    },
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  constructor() {
    // Ansicht umschalten; live aus dem Spiel heraus erst, wenn alles aufgedeckt zu sehen war
    let previous: View | null = null;
    effect((onCleanup) => {
      const mode = this.mode();
      const from = previous;
      previous = mode;
      if (!mode) return;
      // Beim Laden eines beendeten Spiels gleich zum Endstand
      const target: View = mode === 'last' && from !== 'play' ? 'final' : mode;
      const show = () => {
        this.view.set(target);
        this.viewSince.set(Date.now());
      };
      if (target === 'play' || from !== 'play') {
        untracked(show);
        return;
      }
      const clear = untracked(this.game)!.last_events.some((event) => event.t === 'clear');
      const timer = setTimeout(show, SKYJO_RESULTS_PAUSE_MS + (clear ? SKYJO_CLEAR_MS : 0));
      onCleanup(() => clearTimeout(timer));
    });

    // Einmal pro Zug: nach Ablauf deckt der Tisch für den, der fehlt, auf
    let skipped: string | null = null;
    effect(() => {
      const turn = this.timedTurn();
      if (!turn || skipped === turn || this.table.waitingSeconds() < this.turnBudget()) return;
      skipped = turn;
      const game = untracked(this.game)!;
      void this.silent(() => this.skyjo.skip(game));
    });

    // Rundenübersicht: nach Ablauf nächste Runde bzw. (letzte Runde) zum Endstand
    effect((onCleanup) => {
      const view = this.view();
      if (view !== 'round' && view !== 'last') return;
      const game = untracked(this.game)!;
      const timer = setTimeout(() => {
        if (view === 'last') this.showFinal();
        else void this.silent(() => this.skyjo.nextRound(game.id, game.round_no));
      }, SKYJO_NEXT_ROUND_S * 1000);
      onCleanup(() => clearTimeout(timer));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon weiter,
  // ignoriert die Datenbank sie
  async flip(game: SkGame, cell: number): Promise<void> {
    await this.table.run(() => this.skyjo.flip(game, cell));
  }

  async draw(game: SkGame, source: SkSource): Promise<void> {
    await this.table.run(() => this.skyjo.draw(game, source));
  }

  async swap(game: SkGame, cell: number): Promise<void> {
    await this.table.run(() => this.skyjo.swap(game, cell));
  }

  async discard(game: SkGame): Promise<void> {
    await this.table.run(() => this.skyjo.discard(game));
  }

  async next(game: SkGame): Promise<void> {
    if (this.view() === 'last') {
      this.showFinal();
      return;
    }
    await this.table.run(() => this.skyjo.nextRound(game.id, game.round_no));
  }

  openHistory(): void {
    this.history.open();
  }

  private showFinal(): void {
    this.view.set('final');
    this.viewSince.set(Date.now());
  }

  // Uhr-Aufrufe aller am Tisch: Fehler nur ins Log (meist war ein anderer schneller)
  private async silent(action: () => Promise<ActionResult>): Promise<void> {
    const result = await action();
    if (!result.ok) console.warn('Skyjo: automatischer Zug nicht ausgeführt.', result.message);
    await this.table.load();
  }
}
