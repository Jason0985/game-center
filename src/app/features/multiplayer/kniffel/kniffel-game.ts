import { Component, computed, inject, input, output } from '@angular/core';
import { GameStage } from '../table/game-stage';
import { injectTableGame } from '../table/table-game';
import { KniffelBoard } from './kniffel-board';
import { KniffelService } from './kniffel.service';
import {
  CATEGORIES,
  filledCount,
  KNIFFEL_RULES,
  KNIFFEL_SKIP_AFTER_S,
  KnGame,
} from './kniffel.model';

// Lädt das Spiel einer gestarteten Lobby und hält es per Realtime aktuell. Keine Zugzeit;
// nur der Host kann nach KNIFFEL_SKIP_AFTER_S überspringen. Der Endstand steht auf dem Block.
@Component({
  selector: 'app-kniffel-game',
  imports: [GameStage, KniffelBoard],
  template: `
    <app-game-stage
      gameTitle="Kniffel"
      [subtitle]="subtitle()"
      [players]="game() ? playerCount() : null"
      [loading]="loading()"
      [hasGame]="!!game()"
      [isHost]="isHost()"
      [busy]="busy()"
      [skipName]="table.canSkip() ? table.activeName() : null"
      [waitingClock]="table.waitingClock()"
      [finished]="game()?.status === 'finished'"
      endHint="Zum Endstand"
      [rules]="rules"
      (skip)="table.skip(game()!)"
      (endGame)="table.endGame(game()!)"
      (leave)="leave.emit($event)"
      (backToLobby)="table.backToLobby()"
    >
      @if (game(); as g) {
        <app-kniffel-board
          [game]="g"
          [userId]="userId()"
          [busy]="busy()"
          [isHost]="isHost()"
          (roll)="roll(g, $event)"
          (hold)="hold(g, $event)"
          (score)="score(g, $event)"
          (backToLobby)="table.backToLobby()"
        />
      }
    </app-game-stage>
  `,
})
export class KniffelGameView {
  private readonly kniffel = inject(KniffelService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  readonly table = injectTableGame<KnGame>({
    service: this.kniffel,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Kniffel',
    skipAfterS: KNIFFEL_SKIP_AFTER_S,
    skipMessage:
      'Der Tisch würfelt (falls noch nicht geschehen) und trägt ins Feld mit den meisten Punkten ein.',
    endMessage: () => 'Gewertet wird der Block, wie er jetzt ist.',
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly playerCount = this.table.playerCount;
  readonly rules = { title: 'Kniffel – Regeln', rules: KNIFFEL_RULES };

  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return 'Spiel beendet';
    const active = game.players.find((player) => player.seat === game.turn_seat);
    const round = Math.min(filledCount(active?.scores ?? []) + 1, CATEGORIES.length);
    const who =
      this.table.mySeat() === game.turn_seat ? 'Du bist dran' : `${active?.name} ist dran`;
    return `Runde ${round}/${CATEGORIES.length} · ${who}`;
  });

  // Züge beziehen sich auf den angezeigten Stand; ist das Spiel schon weiter, ignoriert die
  // Datenbank sie
  async roll(game: KnGame, held: boolean[]): Promise<void> {
    await this.table.run(() => this.kniffel.roll(game, held));
  }

  async score(game: KnGame, category: number): Promise<void> {
    await this.table.run(() => this.kniffel.score(game, category));
  }

  // Halten ohne busy: der eigene Block zeigt es sofort, die anderen sehen es nach dem Tick
  async hold(game: KnGame, held: boolean[]): Promise<void> {
    const result = await this.kniffel.hold(game, held);
    if (!result.ok) console.warn('Kniffel: Halten nicht gespeichert.', result.message);
  }
}
