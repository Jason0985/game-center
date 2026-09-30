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
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { AppErrorService } from '../../../services/app-error.service';
import { ActionResult } from '../../../services/supabase-errors';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { Flip7Board } from './flip7-board';
import { Flip7Final } from './flip7-final';
import { Flip7RoundSummary } from './flip7-round-summary';
import { Flip7Service } from './flip7.service';
import { Flip7Game, FLIP7_NEXT_ROUND_DELAY_S, FLIP7_SKIP_AFTER_S } from './flip7.model';

// Lädt das Spiel einer gestarteten Lobby, hält es per Realtime aktuell und
// schaltet zwischen Spielfeld, Rundenübersicht und Endstand um.
@Component({
  selector: 'app-flip7-game',
  imports: [MatButtonModule, MatIconModule, Flip7Board, Flip7RoundSummary, Flip7Final],
  templateUrl: './flip7-game.html',
  styleUrl: './flip7-game.scss',
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

  readonly game = signal<Flip7Game | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly isHost = computed(() => this.hostUserId() === this.userId());

  // Sekundentakt für Countdown und Überspringen; gemessen in lokaler Zeit,
  // damit eine falsch gehende Uhr am Gerät nichts ausmacht
  private readonly now = signal(Date.now());
  private readonly roundOverSince = signal<number | null>(null);
  private readonly waitingSince = signal(Date.now());

  readonly secondsLeft = computed(() => {
    const since = this.roundOverSince();
    if (since === null) return 0;
    return Math.max(0, Math.ceil((since + FLIP7_NEXT_ROUND_DELAY_S * 1000 - this.now()) / 1000));
  });
  readonly canSkip = computed(
    () =>
      this.isHost() &&
      this.game()?.status === 'playing' &&
      this.now() - this.waitingSince() >= FLIP7_SKIP_AFTER_S * 1000,
  );

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
      const timer = setTimeout(
        () => void this.nextRound(game.id, game.round_no, false),
        FLIP7_NEXT_ROUND_DELAY_S * 1000,
      );
      onCleanup(() => clearTimeout(timer));
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
