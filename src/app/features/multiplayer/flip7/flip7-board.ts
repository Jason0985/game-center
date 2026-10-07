import {
  afterNextRender,
  AnimationCallbackEvent,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CardFlyIn, reducedMotion } from '../table/table-motion';
import { formatClock, injectTableLayout, seatsAfter, TableLayout } from '../table/table.model';
import { TableTop } from '../table/table-top';
import { Flip7CardView } from './flip7-card';
import { Flip7Seat } from './flip7-seat';
import {
  ACTION_NAMES,
  activeSeatOf,
  Flip7ActionCard,
  Flip7Card,
  Flip7Event,
  Flip7Game,
  Flip7Player,
  flip7Score,
  FLIP7_TABLES,
  distinctNumbers,
  isModifierCard,
  isNumberCard,
  modifierText,
  seatSpots,
  targetCandidates,
} from './flip7.model';

interface HandCard {
  card: Flip7Card;
  // Stabil pro Karte (Wert + wievielte dieses Werts), damit nur neue Karten fliegen
  key: string;
}

interface FanCard extends HandCard {
  transform: string;
  highlight: 'dup' | 'bust' | null;
}

interface Slot extends HandCard {
  tilt: number;
  // Bust: die doppelte Karte liegt auf ihrem Zwilling
  dup: HandCard | null;
}

interface Flight {
  id: number;
  card: 'FREEZE' | 'FLIP3';
  target: number;
}

// Stapelmitte (Ring des Zug-Zeigers) und wohin der Zeiger zeigt, wenn ich dran bin
// (auf meine Karten); Design-Pixel der Tischplatte
const POINTER: Record<TableLayout, { x: number; y: number; r: number; meX: number; meY: number }> =
  {
    phone: { x: 189, y: 380, r: 40, meX: 189, meY: 547 },
    hoch: { x: 394, y: 550, r: 58, meX: 287, meY: 795 },
    quer: { x: 532, y: 216, r: 58, meX: 570, meY: 507 },
    laptop: { x: 572, y: 248, r: 58, meX: 603, meY: 512 },
  };

// Bust: Karten liegen verdreht (fest pro Position, damit nichts springt)
const BUST_TILT = [-10, 6, -4, 5, -8, 7, -3];
const OWN_BUST_TILT = [-3, 4, -5, 4, -3, 5, -4];

const CHOOSER_TITLES: Record<Flip7ActionCard, string> = {
  FREEZE: 'Wen frierst du ein?',
  FLIP3: 'Wer muss 3 Karten ziehen?',
  SC: 'Wem gibst du die Second Chance?',
};
const TURN_HINT = 'Stapel antippen zum Ziehen – oder stehen bleiben';

function handCards(player: Flip7Player): HandCard[] {
  const seen = new Map<string, number>();
  return player.cards.map((card) => {
    const index = (seen.get(card) ?? 0) + 1;
    seen.set(card, index);
    return { card, key: `${card}-${index}` };
  });
}

// Spieltisch einer laufenden Runde: ovale Platte mit Plätzen, Fächern und Stapel,
// darunter (bzw. am Laptop darauf) der eigene Platz mit Karten. Ziehen per Antippen des
// Stapels, „Stehen bleiben“ direkt darunter; Hinweis und Verlauf stehen im Kopf der Bühne.
@Component({
  selector: 'app-flip7-board',
  imports: [NgTemplateOutlet, Flip7CardView, Flip7Seat, TableTop],
  templateUrl: './flip7-board.html',
  styleUrls: ['./flip7-board.scss', './flip7-board-places.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'sizeClass()',
    '[class.live]': 'live()',
  },
})
export class Flip7Board {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly game = input.required<Flip7Game>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);
  // Host darf einen Spieler erst nach FLIP7_SKIP_AFTER_S überspringen (Uhr im Container)
  readonly canSkip = input(false);
  readonly waitingSeconds = input(0);

  readonly hit = output<void>();
  readonly stay = output<void>();
  readonly choose = output<number>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => FLIP7_TABLES[this.layout()]);
  // Mitspieler-Schilder: ≤ 3 Spieler groß, 4–5 mittel, ab 6 Grundgröße
  readonly sizeClass = computed(() => {
    const count = this.game().seat_count;
    return count <= 3 ? 'l' : count <= 5 ? 'm' : 's';
  });
  // Erst nach dem ersten Rendern animieren (sonst fliegt beim Laden alles)
  readonly live = signal(false);

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  // Reihum ab dem Platz nach mir; verlassene Spieler behalten ihren Platz
  readonly others = computed(() => {
    const { players, seat_count: count } = this.game();
    return seatsAfter(players, this.me()?.seat ?? -1, count);
  });

  readonly activeSeat = computed(() => activeSeatOf(this.game()));
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
    return !!me && game.status === 'playing' && !!game.pending_card && game.pending_seat === me.seat
      ? game.pending_card
      : null;
  });
  readonly candidates = computed(() => {
    const card = this.choosing();
    const me = this.me();
    return new Set(card && me ? targetCandidates(this.game(), card, me.seat) : []);
  });

  // Effekte nur direkt nach der passenden Aktion (last_events = letzte Aktion)
  private readonly eventSeats = computed(() => {
    const seatsOf = (type: Flip7Event['t']) =>
      new Set(
        this.game()
          .last_events.filter((event) => event.t === type)
          .map((event) => event.seat),
      );
    return { flip7: seatsOf('flip7'), secondChance: seatsOf('second_chance') };
  });

  readonly seats = computed(() => {
    const game = this.game();
    const layout = this.layout();
    const table = this.table();
    const spots = seatSpots(layout, Math.max(0, game.seat_count - 1));
    const choosing = this.choosing();
    const candidates = this.candidates();
    const events = this.eventSeats();

    return this.others().map((player, i) => {
      const spot = spots[i];
      const busted = player.state === 'busted';
      const numbers = handCards(player).filter((item) => isNumberCard(item.card));
      const fan: FanCard[] = numbers.map((item, index) => {
        const offset = index - (numbers.length - 1) / 2;
        const tilt = busted ? BUST_TILT[index % BUST_TILT.length] : null;
        return {
          ...item,
          transform:
            layout === 'phone'
              ? `rotate(${tilt ?? Math.round(offset * 3)}deg)`
              : `translateY(${(1.3 * offset * offset).toFixed(1)}px) rotate(${tilt ?? offset * 6}deg)`,
          highlight: busted ? (index === numbers.length - 1 ? 'dup' : 'bust') : null,
        };
      });
      const distinct = distinctNumbers(player.cards);
      return {
        player,
        x: (spot.x / table.w) * 100,
        y: (spot.y / table.h) * 100,
        fanX: (spot.fanX / table.w) * 100,
        fanY: (spot.fanY / table.h) * 100,
        fan,
        dots:
          busted || player.state === 'flip7' || player.state === 'left'
            ? null
            : Array.from({ length: 7 }, (_, dot) => dot < distinct),
        mods: modifierText(player.cards),
        choice: choosing && candidates.has(player.seat) ? choosing : null,
        dimmed: !!choosing && !candidates.has(player.seat),
        turn: player.seat === this.activeSeat(),
        waiting:
          this.isHost() && this.canSkip() && player.seat === this.activeSeat()
            ? formatClock(this.waitingSeconds())
            : null,
        celebrate: this.live() && events.flip7.has(player.seat),
        scBreak: events.secondChance.has(player.seat),
        flip3Left: this.flip3Left(player.seat),
        bonus: game.status === 'round_over' && player.state === 'flip7',
      };
    });
  });

  // Eigene Karten: 7 Zahlen-Slots in Zugreihenfolge, daneben die Modifikatoren
  readonly mine = computed(() => {
    const me = this.me();
    if (!me) return null;
    const cards = handCards(me);
    const numbers = cards.filter((item) => isNumberCard(item.card));
    const busted = me.state === 'busted';
    const dup = busted ? numbers.at(-1) : undefined;
    const rest = dup ? numbers.slice(0, -1) : numbers;
    const twin = dup ? rest.findIndex((item) => item.card === dup.card) : -1;
    const slots: Slot[] = rest.map((item, index) => ({
      ...item,
      tilt: busted ? OWN_BUST_TILT[index % OWN_BUST_TILT.length] : 0,
      dup: index === twin ? dup! : null,
    }));
    const mods = cards.filter((item) => isModifierCard(item.card));
    return {
      player: me,
      slots,
      empty: Array.from({ length: Math.max(0, 7 - slots.length) }),
      mods: mods.map((item, index) => ({ ...item, tilt: (index - (mods.length - 1) / 2) * 5 })),
      modText: modifierText(me.cards) || '—',
      flip3Left: this.flip3Left(me.seat),
      choice: this.choosing() && this.candidates().has(me.seat) ? this.choosing() : null,
      celebrate: this.live() && this.eventSeats().flip7.has(me.seat),
      scBreak: this.eventSeats().secondChance.has(me.seat),
      bonus: this.game().status === 'round_over' && me.state === 'flip7',
      points: flip7Score(me.cards, me.state),
    };
  });

  readonly statusText = computed(() => {
    const game = this.game();
    const me = this.me();
    const name = (seat: number | null) =>
      game.players.find((player) => player.seat === seat)?.name ?? 'Jemand';

    if (game.status === 'round_over') {
      const winner = game.players.find((player) => player.state === 'flip7');
      if (!winner) return 'Runde beendet';
      return winner === me
        ? 'Runde beendet – du schaffst Flip 7'
        : `Runde beendet – ${winner.name} schafft Flip 7`;
    }
    if (me && me.state !== 'active') {
      const points = flip7Score(me.cards, me.state);
      if (me.state === 'stayed') return `Du bleibst stehen – ${points} Punkte gesichert`;
      if (me.state === 'frozen') return `Du bist eingefroren – ${points} Punkte gesichert`;
      if (me.state === 'busted') return 'Bust – diese Runde 0 Punkte';
      if (me.state === 'flip7') return `Du schaffst Flip 7 – ${points} Punkte gesichert`;
    }

    const seat = this.activeSeat();
    if (seat === null) return 'Karten werden ausgeteilt …';
    if (seat === me?.seat) return '';
    return game.pending_card
      ? `${name(seat)} wählt ein Ziel für ${ACTION_NAMES[game.pending_card]}`
      : `${name(seat)} ist am Zug`;
  });
  // Hinweis im Kopf der Bühne: was ich gerade tun kann bzw. wie es um mich steht (wer
  // sonst am Zug ist, zeigt der Zeiger)
  readonly hint = computed(() => {
    const card = this.choosing();
    if (card) return `${CHOOSER_TITLES[card]} Tippe einen Platz an`;
    if (this.myTurn()) return TURN_HINT;
    const ownStatus = this.activeSeat() === null || this.me()?.state !== 'active';
    return ownStatus ? this.statusText() || null : null;
  });

  // Mitte: Ablage (quer/Laptop) mit offener Aktionskarte obenauf
  readonly discard = computed(() => {
    const game = this.game();
    const pile = game.discard_count > 0 ? game.discard_top : [];
    const cards: Flip7Card[] = game.pending_card ? [...pile, game.pending_card] : [...pile];
    return { top: cards.at(-1) ?? null, below: cards.at(-2) ?? null };
  });

  // Zug-Zeiger vom Stapel zum Spieler am Zug (zeichnet die Tischplatte)
  readonly pointerCenter = computed(() => POINTER[this.layout()]);
  readonly pointerTarget = computed(() => {
    const game = this.game();
    const seat = this.activeSeat();
    if (game.status !== 'playing' || game.phase !== 'turn' || game.pending_card || seat === null) {
      return null;
    }
    const center = this.pointerCenter();
    const table = this.table();
    if (seat === this.me()?.seat) return { x: center.meX, y: center.meY, before: 0 };
    const spot = this.seats().find((view) => view.player.seat === seat);
    if (!spot) return null;
    return { x: (spot.fanX / 100) * table.w, y: (spot.fanY / 100) * table.h, before: 30 };
  });

  // Freeze/Flip 3 fliegt von der Mitte zum Ziel
  readonly flights = signal<Flight[]>([]);
  private flightId = 0;
  private eventsKey: string | null = null;

  private readonly stack = viewChild<ElementRef<HTMLElement>>('stack');
  private readonly flyIn = new CardFlyIn(this.live);

  constructor() {
    afterNextRender(() => this.live.set(true));

    effect(() => {
      const game = this.game();
      const key = `${game.waiting_since}|${JSON.stringify(game.last_events)}`;
      const first = this.eventsKey === null;
      if (key === this.eventsKey) return;
      this.eventsKey = key;
      if (first || reducedMotion()) return;

      const added = game.last_events
        .filter(
          (event) => (event.t === 'freeze' || event.t === 'flip3') && event.target !== undefined,
        )
        .map((event) => ({
          id: ++this.flightId,
          card: event.t === 'freeze' ? ('FREEZE' as const) : ('FLIP3' as const),
          target: event.target!,
        }));
      if (added.length) {
        untracked(() => this.flights.update((list) => [...list, ...added]));
      }
    });
  }

  flip3Left(seat: number): number | null {
    const game = this.game();
    return game.flip3_seat === seat && game.flip3_left ? game.flip3_left : null;
  }

  pick(seat: number): void {
    if (!this.busy()) this.choose.emit(seat);
  }

  tapPile(): void {
    if (!this.busy() && this.myTurn()) this.hit.emit();
  }

  // Karte vom Stapel an ihren Platz (Vorlage ruft das bei animate.enter)
  fly(event: AnimationCallbackEvent, id: string): void {
    this.flyIn.fly(event, id, this.stack()?.nativeElement);
  }

  // Freeze/Flip 3: in der Mitte aufdrehen (200 ms), dann im Bogen zum Ziel-Schild (280 ms)
  flyAction(event: AnimationCallbackEvent, flight: Flight): void {
    const card = event.target as HTMLElement;
    const seat = this.host.nativeElement.querySelector(`[data-seat="${flight.target}"]`);
    const done = () => {
      event.animationComplete();
      this.flights.update((list) => list.filter((item) => item !== flight));
    };
    if (!seat || typeof card.animate !== 'function') {
      done();
      return;
    }

    const from = card.getBoundingClientRect();
    const to = seat.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    card
      .animate(
        [
          { transform: 'rotateY(90deg)' },
          { transform: 'rotateY(0deg)', offset: 200 / 480 },
          {
            transform: `translate(${dx / 2}px, ${dy / 2 - 40}px) rotate(-14deg) scale(0.86)`,
            offset: 340 / 480,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(0.74)`, opacity: 0.9 },
        ],
        { duration: 480, easing: 'ease-out', fill: 'forwards' },
      )
      .finished.catch(() => undefined)
      .finally(done);
  }
}
