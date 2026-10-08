import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Flip7Game, FLIP7_BONUS, PLAYER_STATE_LABELS, rankPlayers } from './flip7.model';

// Kurze Übersicht nach jeder Runde; die nächste Runde startet der Container per Timer
@Component({
  selector: 'app-flip7-round-summary',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './flip7-round-summary.html',
  styleUrl: './flip7-round-summary.scss',
})
export class Flip7RoundSummary {
  readonly game = input.required<Flip7Game>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);
  readonly secondsLeft = input(0);

  readonly next = output<void>();
  readonly endGame = output<void>();

  readonly bonus = FLIP7_BONUS;
  readonly stateLabels = PLAYER_STATE_LABELS;
  readonly ranking = computed(() => rankPlayers(this.game().players));
  readonly flip7Player = computed(
    () => this.game().players.find((player) => player.state === 'flip7') ?? null,
  );

  progress(total: number): number {
    const target = this.game().target_score;
    return target ? Math.min(100, Math.round((total / target) * 100)) : 0;
  }
}
