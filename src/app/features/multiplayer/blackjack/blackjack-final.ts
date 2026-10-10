import { Component, computed, input, output } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { BjGame, BjPlayer, formatDelta, formatMoney } from './blackjack.model';

// Endstand: Rangliste nach Guthaben mit Gewinn/Verlust seit dem Start, Sieger oben
// (Gleichstand teilt). Allein: „Dein Endstand“. Wie es weitergeht, entscheidet der Host.
@Component({
  selector: 'app-blackjack-final',
  templateUrl: './blackjack-final.html',
  styleUrl: './blackjack-final.scss',
})
export class BlackjackFinal {
  readonly game = input.required<BjGame>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);

  readonly backToLobby = output<void>();

  readonly solo = computed(() => this.game().seat_count === 1);
  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  readonly rounds = computed(() => this.game().round_no - 1);
  // Wer verlassen hat, steht am Ende (ohne Rang); gleiches Guthaben = gleicher Rang
  readonly ranking = computed(() => {
    const players = this.game().players;
    const active = players
      .filter((player) => player.state !== 'left')
      .sort((a, b) => b.balance - a.balance || a.seat - b.seat);
    return [
      ...active.map((player) => ({
        player,
        rank: active.findIndex((other) => other.balance === player.balance) + 1,
      })),
      ...players
        .filter((player) => player.state === 'left')
        .map((player) => ({ player, rank: null })),
    ];
  });
  readonly winners = computed(() =>
    this.ranking()
      .filter((row) => row.rank === 1)
      .map((row) => row.player),
  );
  readonly winnerNames = computed(() =>
    this.winners()
      .map((player) => player.name)
      .join(' & '),
  );
  readonly winnerColor = computed(
    () => AVATAR_COLORS[(this.winners()[0]?.seat ?? 0) % AVATAR_COLORS.length],
  );

  delta(player: BjPlayer): string {
    return formatDelta(player.balance - this.game().start_money);
  }

  tone(player: BjPlayer): string {
    const delta = player.balance - this.game().start_money;
    return delta > 0 ? 'win' : delta < 0 ? 'lose' : 'muted';
  }

  readonly formatMoney = formatMoney;
}
