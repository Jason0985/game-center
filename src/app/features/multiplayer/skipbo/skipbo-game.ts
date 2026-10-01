import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { GameStage } from '../table/game-stage';
import { HistoryRow, openHistorySheet } from '../table/history-sheet';
import { injectTableGame } from '../table/table-game';
import { eventAge } from '../table/table.model';
import { SkipboBoard, SkipboDiscard, SkipboPlay } from './skipbo-board';
import { SkipboFinal } from './skipbo-final';
import { SkipboService } from './skipbo.service';
import {
  cardCount,
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
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  readonly isHost = computed(() => this.hostUserId() === this.userId());
  private readonly table = injectTableGame<SkipboGame>({
    service: this.skipbo,
    lobbyId: this.lobbyId,
    isHost: this.isHost,
    title: 'Skip-Bo',
    skipAfterS: SKIPBO_SKIP_AFTER_S,
  });
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly waitingSeconds = this.table.waitingSeconds;
  readonly waitingClock = this.table.waitingClock;
  readonly canSkip = this.table.canSkip;
  readonly showFinal = signal(false);

  private readonly mySeat = computed(
    () => this.game()?.players.find((player) => player.user_id === this.userId())?.seat ?? null,
  );
  readonly activeName = computed(() => {
    const game = this.game();
    return game?.players.find((player) => player.seat === game.turn_seat)?.name ?? 'Spieler';
  });
  readonly playerCount = computed(
    () => this.game()?.players.filter((player) => player.state !== 'left').length ?? 0,
  );
  readonly subtitle = computed(() => {
    const game = this.game();
    return game ? `Stapel: ${cardCount(game.draw_count)}` : null;
  });
  readonly rules = { title: 'Skip-Bo – Regeln', rules: SKIPBO_RULES };

  // Verlauf, neueste oben. Alter ohne Uhrabweichung: gemessen ab dem Moment, in dem
  // das neueste Ereignis hier ankam, plus Abstand laut Server
  private readonly latestAt = computed(() => this.game()?.round_log.at(-1)?.at);
  private readonly arrivedAt = linkedSignal({
    source: this.latestAt,
    computation: () => Date.now(),
  });
  // Zuletzt gesehenes Ereignis (beim ersten Laden und beim Öffnen des Verlaufs)
  private readonly seenAt = linkedSignal<string | undefined, string | undefined>({
    source: this.latestAt,
    computation: (latest, previous) => previous?.value ?? latest,
  });
  readonly historyNew = computed(() => this.latestAt() !== this.seenAt());
  // Im Kopf: Nachziehen anderer überdeckt sonst immer deren Ablegen davor
  readonly lastEvent = computed(() => {
    const seat = this.mySeat();
    const event = [...(this.game()?.round_log ?? [])]
      .reverse()
      .find((e) => e.t !== 'draw' || e.seat === seat);
    return event ? this.describe(event) : null;
  });
  readonly historyRows = computed((): HistoryRow[] => {
    const log = this.game()?.round_log ?? [];
    const now = this.table.now();
    const age = (at?: string) => eventAge(now, this.arrivedAt(), this.latestAt(), at);
    return log.map((event) => ({ ...this.describe(event), time: age(event.at) })).reverse();
  });

  private historySheet: MatBottomSheetRef | null = null;
  // Spiel lief schon in dieser Ansicht: dann kommt der Endstand verzögert
  private seenPlaying = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.historySheet?.dismiss());

    // Endstand: beim Laden eines beendeten Spiels sofort, live erst nach dem letzten Zug
    const status = computed(() => this.game()?.status ?? null);
    effect((onCleanup) => {
      const current = status();
      if (current === 'playing') this.seenPlaying = true;
      if (current !== 'finished') {
        this.showFinal.set(false);
        return;
      }
      if (!this.seenPlaying) {
        this.showFinal.set(true);
        return;
      }
      const timer = setTimeout(() => this.showFinal.set(true), FINAL_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon
  // weiter, ignoriert die Datenbank sie
  async play(game: SkipboGame, move: SkipboPlay): Promise<void> {
    await this.table.run(() => this.skipbo.play(game, move.source, move.pile));
  }

  async discard(game: SkipboGame, move: SkipboDiscard): Promise<void> {
    await this.table.run(() => this.skipbo.discard(game, move.hand, move.pile));
  }

  // Überspringt nur, wenn nach der Bestätigung noch derselbe Stand gilt
  async skip(game: SkipboGame): Promise<void> {
    const confirmed = await this.table.confirm({
      title: 'Spieler überspringen?',
      message: 'Der Zug endet ohne Ablegen, die Handkarten bleiben.',
      confirmLabel: 'Überspringen',
      icon: 'skip_next',
    });
    if (confirmed) {
      await this.table.run(() => this.skipbo.skip(game));
    }
  }

  async endGame(game: SkipboGame): Promise<void> {
    const confirmed = await this.table.confirm({
      title: 'Spiel beenden?',
      message: 'Danach wird der Endstand angezeigt.',
      confirmLabel: 'Beenden',
      icon: 'stop_circle',
    });
    if (confirmed) {
      await this.table.run(() => this.skipbo.endGame(game.id));
    }
  }

  async backToLobby(): Promise<void> {
    if (await this.table.run(() => this.skipbo.returnToLobby(this.lobbyId()))) {
      this.returned.emit();
    }
  }

  openHistory(): void {
    this.seenAt.set(this.latestAt());
    this.historySheet = openHistorySheet(this.bottomSheet, {
      title: signal('Verlauf'),
      rows: this.historyRows,
    });
  }

  private describe(event: SkipboEvent): Omit<HistoryRow, 'time'> {
    return {
      ...eventIcon(event),
      text: describeEvent(event, this.game()?.players ?? [], this.mySeat()),
    };
  }
}
