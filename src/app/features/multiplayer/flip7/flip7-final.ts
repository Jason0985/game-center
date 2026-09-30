import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Flip7Game, rankPlayers, winners } from './flip7.model';

// Endstand. Wie es weitergeht, entscheidet nur der Host.
@Component({
  selector: 'app-flip7-final',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './flip7-final.html',
  styleUrl: './flip7-final.scss',
})
export class Flip7Final {
  readonly game = input.required<Flip7Game>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);

  readonly backToLobby = output<void>();
  readonly continueOpen = output<void>();

  readonly winners = computed(() => winners(this.game()));
  readonly winnerNames = computed(() =>
    this.winners()
      .map((player) => player.name)
      .join(' & '),
  );
  readonly ranking = computed(() => rankPlayers(this.game().players));
  readonly canContinue = computed(
    () => this.game().players.filter((player) => player.state !== 'left').length >= 2,
  );
}
