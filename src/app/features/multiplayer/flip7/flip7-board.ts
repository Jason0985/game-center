import { Component, computed, inject, input, output } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map } from 'rxjs';
import { Flip7CardView } from './flip7-card';
import {
  describeEvent,
  distinctNumbers,
  Flip7ActionCard,
  Flip7Card,
  Flip7Game,
  Flip7Player,
  flip7Score,
  PLAYER_STATE_LABELS,
  sortedForDisplay,
  targetCandidates,
} from './flip7.model';

interface DisplayCard {
  card: Flip7Card;
  // Stabil pro Karte, damit nur neue Karten die Einblend-Animation bekommen
  key: string;
  dup: boolean;
}

const CHOOSER_TITLES: Record<Flip7ActionCard, string> = {
  FREEZE: 'Wen willst du einfrieren?',
  FLIP3: 'Wer soll drei Karten ziehen?',
  SC: 'Wem schenkst du die Zweite Chance?',
};

const WAITING_TEXTS: Record<Flip7ActionCard, string> = {
  FREEZE: 'wählt ein Ziel für Einfrieren',
  FLIP3: 'wählt ein Ziel für Drei ziehen',
  SC: 'verschenkt eine Zweite Chance',
};

function displayCards(player: Flip7Player): DisplayCard[] {
  // Beim Rausfliegen ist die zuletzt gezogene Karte die doppelte Zahl
  const dup = player.state === 'busted' ? player.cards.at(-1) : undefined;
  const seen = new Map<string, number>();
  return sortedForDisplay(player.cards).map((card) => {
    const index = (seen.get(card) ?? 0) + 1;
    seen.set(card, index);
    return { card, key: `${card}-${index}`, dup: card === dup };
  });
}

// Spielfeld einer laufenden Runde: Status, Mitspieler, eigene Hand und Aktionen
@Component({
  selector: 'app-flip7-board',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, Flip7CardView],
  templateUrl: './flip7-board.html',
  styleUrl: './flip7-board.scss',
})
export class Flip7Board {
  readonly game = input.required<Flip7Game>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);
  // Host darf einen Spieler erst nach FLIP7_SKIP_AFTER_S überspringen (Uhr im Container)
  readonly canSkip = input(false);

  readonly hit = output<void>();
  readonly stay = output<void>();
  readonly choose = output<number>();
  readonly skip = output<void>();
  readonly endGame = output<void>();

  private readonly phone = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  readonly otherCardSize = computed(() => (this.phone() ? 'xs' : 'sm'));
  readonly myCardSize = computed(() => (this.phone() ? 'md' : 'lg'));
  readonly stateLabels = PLAYER_STATE_LABELS;

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  // Reihum ab dem Platz nach mir
  readonly others = computed(() => {
    const { players, seat_count: count } = this.game();
    const mySeat = this.me()?.seat ?? -1;
    return players
      .filter((player) => player.seat !== mySeat)
      .sort((a, b) => ((a.seat - mySeat + count) % count) - ((b.seat - mySeat + count) % count));
  });
  readonly hands = computed(
    () => new Map(this.game().players.map((player) => [player.seat, displayCards(player)])),
  );

  readonly myTurn = computed(() => {
    const game = this.game();
    return (
      game.status === 'playing' &&
      game.phase === 'turn' &&
      !game.pending_card &&
      game.turn_seat === this.me()?.seat &&
      this.me()?.state === 'active'
    );
  });
  readonly choosing = computed(() => {
    const game = this.game();
    const me = this.me();
    return !!me && !!game.pending_card && game.pending_seat === me.seat ? game.pending_card : null;
  });
  readonly chooserTitle = computed(() => {
    const card = this.choosing();
    return card ? CHOOSER_TITLES[card] : '';
  });
  readonly candidates = computed(() => {
    const card = this.choosing();
    const me = this.me();
    if (!card || !me) return [];
    const game = this.game();
    return targetCandidates(game, card, me.seat).map((seat) =>
      game.players.find((player) => player.seat === seat)!,
    );
  });

  // Wer gerade etwas tun muss
  readonly activeSeat = computed(() => {
    const game = this.game();
    return game.pending_card ? game.pending_seat : game.phase === 'turn' ? game.turn_seat : null;
  });
  readonly statusText = computed(() => {
    const game = this.game();
    const seat = this.activeSeat();
    if (seat === null) return 'Karten werden ausgeteilt …';

    const mine = seat === this.me()?.seat;
    if (game.pending_card) {
      return mine
        ? 'Du wählst ein Ziel.'
        : `${this.nameOf(seat)} ${WAITING_TEXTS[game.pending_card]}.`;
    }
    return mine ? 'Du bist am Zug.' : `${this.nameOf(seat)} ist am Zug.`;
  });
  readonly events = computed(() =>
    this.game().last_events.map((event) => describeEvent(event, (seat) => this.nameOf(seat))),
  );
  readonly waitingText = computed(() => {
    const me = this.me();
    if (!me || me.state === 'active') return '';
    return `${PLAYER_STATE_LABELS[me.state]} – warte auf die anderen.`;
  });

  preview(player: Flip7Player): number {
    return flip7Score(player.cards, player.state);
  }

  distinct(player: Flip7Player): number {
    return distinctNumbers(player.cards);
  }

  private nameOf(seat: number): string {
    return this.game().players.find((player) => player.seat === seat)?.name ?? 'Jemand';
  }
}
