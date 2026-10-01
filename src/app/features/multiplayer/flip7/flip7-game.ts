import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AppErrorService } from '../../../services/app-error.service';
import { ActionResult } from '../../../services/supabase-errors';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { GameStage } from '../table/game-stage';
import { formatClock } from '../table/table.model';
import { Flip7Board } from './flip7-board';
import { Flip7Final } from './flip7-final';
import { Flip7RoundSummary } from './flip7-round-summary';
import { Flip7Service } from './flip7.service';
import {
  activeSeatOf,
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
// gemeinsamen Bühne (Kopf mit ⋮-Menü für Host-Aktionen und Verlassen).
@Component({
  selector: 'app-flip7-game',
  imports: [GameStage, Flip7Board, Flip7RoundSummary, Flip7Final],
  templateUrl: './flip7-game.html',
})
export class Flip7GameView {
  private readonly flip7 = inject(Flip7Service);
  private readonly dialog = inject(MatDialog);
  private readonly appErrors = inject(AppErrorService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  readonly game = signal<Flip7Game | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly isHost = computed(() => this.hostUserId() === this.userId());

  // Sekundentakt für Countdown und Überspringen; gemessen in lokaler Zeit,
  // damit eine falsch gehende Uhr am Gerät nichts ausmacht
  readonly now = signal(Date.now());
  private readonly roundOverSince = signal<number | null>(null);
  private readonly waitingSince = signal(Date.now());

  readonly secondsLeft = computed(() => {
    const since = this.roundOverSince();
    if (since === null) return 0;
    return Math.max(0, Math.ceil((since + ROUND_END_S * 1000 - this.now()) / 1000));
  });
  readonly waitingSeconds = computed(() => Math.floor((this.now() - this.waitingSince()) / 1000));
  readonly waitingClock = computed(() => formatClock(this.waitingSeconds()));
  readonly canSkip = computed(
    () =>
      this.isHost() &&
      this.game()?.status === 'playing' &&
      this.waitingSeconds() >= FLIP7_SKIP_AFTER_S,
  );
  // Rundenende: erst ein paar Sekunden der Tisch (Flip-7-Moment), dann die Übersicht
  readonly showRoundTable = computed(
    () => this.roundOverSince() === null || this.secondsLeft() > FLIP7_NEXT_ROUND_DELAY_S,
  );
  readonly activeName = computed(() => {
    const game = this.game();
    const seat = game ? activeSeatOf(game) : null;
    return game?.players.find((player) => player.seat === seat)?.name ?? 'Spieler';
  });
  readonly playerCount = computed(
    () => this.game()?.players.filter((player) => player.state !== 'left').length ?? 0,
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

  private loadSequence = 0;
  private destroyed = false;

  constructor() {
    effect((onCleanup) => {
      const lobbyId = this.lobbyId();
      void this.load();
      onCleanup(this.flip7.subscribe(lobbyId, () => void this.load()));
    });

    const clock = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearInterval(clock);
    });

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

    // Jede neue Wartesituation (Zug oder Zielauswahl) startet die Uhr fürs Überspringen neu
    const waitingKey = computed(() => {
      const game = this.game();
      return game?.status === 'playing' ? (game.waiting_since ?? '') : null;
    });
    effect(() => {
      waitingKey();
      untracked(() => this.waitingSince.set(Date.now()));
    });
  }

  // Züge beziehen sich auf den angezeigten Stand (game); ist das Spiel schon
  // weiter, ignoriert die Datenbank sie
  async hit(game: Flip7Game): Promise<void> {
    await this.run(() => this.flip7.hit(game));
  }

  async stay(game: Flip7Game): Promise<void> {
    await this.run(() => this.flip7.stay(game));
  }

  async choose(game: Flip7Game, seat: number): Promise<void> {
    await this.run(() => this.flip7.chooseTarget(game, seat));
  }

  // Überspringt nur, wenn nach der Bestätigung noch derselbe Stand gilt
  async skip(game: Flip7Game): Promise<void> {
    const confirmed = await this.confirm({
      title: 'Spieler überspringen?',
      message:
        'Wer gerade am Zug ist, bleibt stehen. Eine offene Zielauswahl wird automatisch getroffen.',
      confirmLabel: 'Überspringen',
      icon: 'skip_next',
    });
    if (confirmed) {
      await this.run(() => this.flip7.skip(game));
    }
  }

  async endGame(game: Flip7Game): Promise<void> {
    const confirmed = await this.confirm({
      title: 'Spiel beenden?',
      message:
        game.status === 'playing'
          ? 'Die laufende Runde wird nicht gewertet.'
          : 'Danach wird der Endstand angezeigt.',
      confirmLabel: 'Beenden',
      icon: 'stop_circle',
    });
    if (confirmed) {
      await this.run(() => this.flip7.endGame(game.id));
    }
  }

  // "Jetzt weiter" (Host sofort, alle nach dem Countdown; Fehler anzeigen) oder
  // Timer bei allen (Fehler ignorieren)
  async nextRound(gameId: string, roundNo: number, manual = true): Promise<void> {
    if (!manual) {
      const result = await this.flip7.nextRound(gameId, roundNo);
      if (!result.ok) console.warn('Nächste Runde nicht gestartet.', result.message);
      await this.load();
      return;
    }
    await this.run(() => this.flip7.nextRound(gameId, roundNo));
  }

  async continueOpen(game: Flip7Game): Promise<void> {
    await this.run(() => this.flip7.continueOpen(game.id));
  }

  async backToLobby(): Promise<void> {
    if (await this.run(() => this.flip7.returnToLobby(this.lobbyId()))) {
      this.returned.emit();
    }
  }

  private async confirm(data: ConfirmationDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      { data },
    );
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  }

  // Aktion ausführen und danach neu laden, auch bei Fehlern (Stand ist dann evtl. weiter).
  // Buttons erst nach dem Neuladen wieder frei, sonst trifft ein zweiter Tipp den alten Stand.
  private async run(action: () => Promise<ActionResult>): Promise<boolean> {
    if (this.busy()) return false;

    this.busy.set(true);
    try {
      const result = await action();
      if (!result.ok) {
        this.appErrors.report(result.message, { title: 'Flip 7' });
      }
      await this.load();
      return result.ok;
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    if (this.destroyed) return;

    const sequence = ++this.loadSequence;
    const result = await this.flip7.load(this.lobbyId());
    if (sequence !== this.loadSequence || this.destroyed) return;

    this.loading.set(false);
    if (result.ok) {
      this.game.set(result.value);
    } else {
      this.appErrors.report(result.message, { title: 'Flip 7' });
    }
  }
}
