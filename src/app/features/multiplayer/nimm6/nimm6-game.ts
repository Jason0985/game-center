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
import { Nimm6Board } from './nimm6-board';
import { Nimm6Final } from './nimm6-final';
import { Nimm6Round } from './nimm6-round';
import { Nimm6Service } from './nimm6.service';
import {
  describeEvent,
  eventIcon,
  N6Event,
  N6Game,
  NIMM6_HAND,
  NIMM6_NEXT_ROUND_S,
  NIMM6_RESULTS_PAUSE_MS,
  NIMM6_ROUND_MIN_S,
  NIMM6_RULES,
  NIMM6_TURN_S,
  replayMs,
} from './nimm6.model';

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und schaltet zwischen
// Spieltisch, Rundenübersicht und Endstand um. Zwei Uhren laufen bei allen am Tisch: nach
// NIMM6_TURN_S (plus der Zeit fürs Nachspielen) legt der Tisch für Trödler, nach
// NIMM6_NEXT_ROUND_S startet die nächste Runde (die Datenbank prüft beides, doppelte Aufrufe
// tun nichts).
@Component({
  selector: 'app-nimm6-game',
  imports: [GameStage, Nimm6Board, Nimm6Round, Nimm6Final],
  templateUrl: './nimm6-game.html',
})
export class Nimm6GameView {
  private readonly nimm6 = inject(Nimm6Service);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  private readonly table = injectTableGame<N6Game>({
    service: this.nimm6,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Nimm 6',
    skipAfterS: NIMM6_TURN_S,
    skipMessage: 'Wer noch nicht gewählt hat, legt eine zufällige Karte.',
    endMessage: () => 'Gewertet wird der Stand bis hierher. Danach wird der Endstand angezeigt.',
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly playerCount = this.table.playerCount;
  readonly endGame = this.table.endGame;
  readonly backToLobby = this.table.backToLobby;
  readonly rules = { title: 'Nimm 6 – Regeln', rules: NIMM6_RULES };

  // Ansicht: Tisch, Rundenübersicht oder Endstand. Kommt das Spiel live dorthin, bleibt der
  // Tisch stehen, bis das Anlegen nachgespielt ist.
  private readonly mode = computed((): 'play' | 'round' | 'final' | null => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return 'final';
    return game.phase === 'round_over' ? 'round' : 'play';
  });
  readonly view = signal<'play' | 'round' | 'final'>('play');
  private readonly viewSince = signal(Date.now());

  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return 'Spiel beendet';
    if (this.view() === 'round') return `Runde ${game.round_no} · Rundenende`;
    return `Runde ${game.round_no} · Zug ${game.turn_no} von ${NIMM6_HAND}`;
  });

  // Zugzeit: wählen bzw. Reihe nehmen, plus die Zeit fürs Nachspielen des Anlegens
  private readonly timedTurn = computed(() => {
    const game = this.game();
    return game?.status === 'playing' && (game.phase === 'choose' || game.phase === 'take')
      ? game.waiting_since
      : null;
  });
  // Pro Zug fest: wählt später jemand, ändern sich die last_events, die Uhr aber nicht
  private readonly turnBudget = linkedSignal({
    source: this.timedTurn,
    computation: () => {
      const game = untracked(this.game);
      return NIMM6_TURN_S + (game ? Math.ceil(replayMs(game) / 1000) : 0);
    },
  });
  readonly secondsLeft = computed(() =>
    this.timedTurn()
      ? Math.max(0, Math.min(NIMM6_TURN_S, this.turnBudget() - this.table.waitingSeconds()))
      : null,
  );
  private readonly roundShown = computed(() =>
    this.view() === 'round' ? Math.floor((this.table.now() - this.viewSince()) / 1000) : null,
  );
  readonly roundSecondsLeft = computed(() => {
    const shown = this.roundShown();
    return shown === null ? null : Math.max(0, NIMM6_NEXT_ROUND_S - shown);
  });
  readonly roundLocked = computed(() => (this.roundShown() ?? 0) < NIMM6_ROUND_MIN_S);

  private readonly history = injectTableHistory<N6Event>({
    log: computed(() => this.game()?.round_log ?? []),
    now: this.table.now,
    describe: (event) => ({
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.table.mySeat()),
    }),
    headline: (event) => event.t !== 'reveal',
    cue: (event) =>
      (event.t === 'six' || event.t === 'take') && event.seat === this.table.mySeat()
        ? 'bust'
        : null,
  });
  readonly lastEvent = this.history.lastEvent;
  readonly historyNew = this.history.historyNew;

  constructor() {
    // Ansicht umschalten; live aus dem Spiel heraus erst nach dem Nachspielen
    let previous: 'play' | 'round' | 'final' | null = null;
    effect((onCleanup) => {
      const mode = this.mode();
      const from = previous;
      previous = mode;
      if (!mode) return;
      const show = () => {
        this.view.set(mode);
        this.viewSince.set(Date.now());
      };
      if (mode === 'play' || from !== 'play') {
        untracked(show);
        return;
      }
      const delay = replayMs(untracked(this.game)!) + NIMM6_RESULTS_PAUSE_MS;
      const timer = setTimeout(show, delay);
      onCleanup(() => clearTimeout(timer));
    });

    // Einmal pro Zug: nach Ablauf legt der Tisch für die, die noch fehlen
    let skipped: string | null = null;
    effect(() => {
      const turn = this.timedTurn();
      if (!turn || skipped === turn || this.table.waitingSeconds() < this.turnBudget()) return;
      skipped = turn;
      const game = untracked(this.game)!;
      void this.silent(() => this.nimm6.skip(game));
    });

    // Rundenübersicht: nach Ablauf startet die nächste Runde
    effect((onCleanup) => {
      if (this.view() !== 'round') return;
      const game = untracked(this.game)!;
      const timer = setTimeout(
        () => void this.silent(() => this.nimm6.nextRound(game.id, game.round_no)),
        NIMM6_NEXT_ROUND_S * 1000,
      );
      onCleanup(() => clearTimeout(timer));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon weiter,
  // ignoriert die Datenbank sie
  async choose(game: N6Game, card: number): Promise<void> {
    await this.table.run(() => this.nimm6.choose(game, card));
  }

  async takeRow(game: N6Game, row: number): Promise<void> {
    await this.table.run(() => this.nimm6.takeRow(game, row));
  }

  async nextRound(game: N6Game): Promise<void> {
    await this.table.run(() => this.nimm6.nextRound(game.id, game.round_no));
  }

  openHistory(): void {
    this.history.open();
  }

  // Uhr-Aufrufe aller am Tisch: Fehler nur ins Log (meist war ein anderer schneller)
  private async silent(action: () => Promise<ActionResult>): Promise<void> {
    const result = await action();
    if (!result.ok) console.warn('Nimm 6: automatischer Zug nicht ausgeführt.', result.message);
    await this.table.load();
  }
}
