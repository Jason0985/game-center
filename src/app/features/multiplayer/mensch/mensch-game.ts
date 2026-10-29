import { Component, computed, inject, input, output } from '@angular/core';
import { GameStage } from '../table/game-stage';
import { ABORT_MESSAGE, injectTableGame } from '../table/table-game';
import { MenschBoard } from './mensch-board';
import { MenschService } from './mensch.service';
import { inGoal, MENSCH_RULES, MENSCH_SKIP_AFTER_S, MeGame } from './mensch.model';

// Lädt das Spiel einer gestarteten Lobby und hält es per Realtime aktuell. Keine Zugzeit;
// nur der Host kann nach MENSCH_SKIP_AFTER_S überspringen. Den Endstand zeigt das Brett.
@Component({
  selector: 'app-mensch-game',
  imports: [GameStage, MenschBoard],
  template: `
    <app-game-stage
      gameTitle="Mensch ärgere dich nicht"
      [subtitle]="subtitle()"
      [players]="game() ? playerCount() : null"
      [loading]="loading()"
      [hasGame]="!!game()"
      [isHost]="isHost()"
      [busy]="busy()"
      [skipName]="table.canSkip() ? table.activeName() : null"
      [waitingClock]="table.waitingClock()"
      [finished]="game()?.status === 'finished'"
      endLabel="Spiel abbrechen"
      endHint="Zählt nicht · zurück in die Lobby"
      [rules]="rules"
      (skip)="table.skip(game()!)"
      (endGame)="table.endGame(game()!)"
      (leave)="leave.emit($event)"
      (backToLobby)="table.backToLobby()"
    >
      @if (game(); as g) {
        <app-mensch-board
          [game]="g"
          [userId]="userId()"
          [busy]="busy()"
          [isHost]="isHost()"
          (roll)="roll(g)"
          (move)="move(g, $event)"
          (backToLobby)="table.backToLobby()"
        />
      }
    </app-game-stage>
  `,
})
export class MenschGameView {
  private readonly mensch = inject(MenschService);

  readonly lobbyId = input.required<string>();
  readonly hostUserId = input.required<string>();
  readonly userId = input.required<string>();
  // Host ist zurück in der Warte-Lobby (die Lobby lädt dann neu)
  readonly returned = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; Bestätigung macht die Lobby.
  // true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();

  readonly table = injectTableGame<MeGame>({
    service: this.mensch,
    lobbyId: this.lobbyId,
    hostUserId: this.hostUserId,
    userId: this.userId,
    returned: this.returned,
    title: 'Mensch ärgere dich nicht',
    skipAfterS: MENSCH_SKIP_AFTER_S,
    skipMessage: 'Der Tisch würfelt und zieht für den Spieler, bis der Nächste dran ist.',
    endMessage: () => ABORT_MESSAGE,
    abort: true,
  });
  readonly isHost = this.table.isHost;
  readonly game = this.table.game;
  readonly loading = this.table.loading;
  readonly busy = this.table.busy;
  readonly playerCount = this.table.playerCount;
  readonly rules = { title: 'Mensch ärgere dich nicht – Regeln', rules: MENSCH_RULES };

  readonly subtitle = computed(() => {
    const game = this.game();
    if (!game) return null;
    if (game.status === 'finished') return 'Spiel beendet';
    const active = game.players.find((player) => player.seat === game.turn_seat);
    const who =
      this.table.mySeat() === game.turn_seat ? 'Du bist dran' : `${active?.name} ist dran`;
    return `${who} · ${inGoal(active?.pieces ?? [])}/4 im Ziel`;
  });

  // Züge beziehen sich auf den angezeigten Stand; ist das Spiel schon weiter, ignoriert die
  // Datenbank sie
  async roll(game: MeGame): Promise<void> {
    await this.table.run(() => this.mensch.roll(game));
  }

  async move(game: MeGame, piece: number): Promise<void> {
    await this.table.run(() => this.mensch.move(game, piece));
  }
}
