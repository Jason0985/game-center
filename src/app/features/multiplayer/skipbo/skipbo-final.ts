import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { rankPlayers, SkipboGame } from './skipbo.model';

// Endstand nach verbleibenden Spielstapel-Karten. Wie es weitergeht, entscheidet der Host.
@Component({
  selector: 'app-skipbo-final',
  templateUrl: './skipbo-final.html',
  styleUrl: './skipbo-final.scss',
})
export class SkipboFinal {
  readonly game = input.required<SkipboGame>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);

  readonly backToLobby = output<void>();

  readonly ranking = computed(() => rankPlayers(this.game().players));
  readonly winner = computed(() => {
    const game = this.game();
    return game.players.find((player) => player.seat === game.winner_seat) ?? null;
  });
  readonly winnerColor = computed(
    () => AVATAR_COLORS[(this.winner()?.seat ?? 0) % AVATAR_COLORS.length],
  );
}
