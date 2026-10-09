import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS, cardCount } from '../table/table.model';
import { rankPlayers, UnoGame } from './uno.model';

// Rundenende: Sieger zuerst, dann nach Restkarten (bei Uno zählen keine Punkte).
// Wie es weitergeht, entscheidet der Host.
@Component({
  selector: 'app-uno-final',
  templateUrl: './uno-final.html',
  styleUrl: './uno-final.scss',
})
export class UnoFinal {
  readonly game = input.required<UnoGame>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);

  readonly nextRound = output<void>();
  readonly backToLobby = output<void>();

  readonly ranking = computed(() => rankPlayers(this.game().players, this.game().winner_seat));
  readonly winner = computed(() => {
    const game = this.game();
    return game.players.find((player) => player.seat === game.winner_seat) ?? null;
  });
  readonly winnerColor = computed(
    () => AVATAR_COLORS[(this.winner()?.seat ?? 0) % AVATAR_COLORS.length],
  );
  readonly canContinue = computed(
    () => this.game().players.filter((player) => player.state === 'active').length >= 2,
  );
  readonly cardCount = cardCount;
}
