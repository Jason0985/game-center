import {
  afterNextRender,
  AnimationCallbackEvent,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { map } from 'rxjs';
import { Flip7CardView } from './flip7-card';
import { Flip7HistoryRow, Flip7HistorySheet } from './flip7-history-sheet';
import { Flip7Seat } from './flip7-seat';
import {
  ACTION_NAMES,
  activeSeatOf,
  describeEvent,
  eventIcon,
  Flip7ActionCard,
  Flip7Card,
  Flip7Event,
  Flip7Game,
  Flip7Layout,
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

// Breakpoints der vier Layouts; alles andere ist Handy
const QUERIES = {
  laptop: '(min-width: 1280px) and (orientation: landscape)',
  quer: '(min-width: 900px) and (max-width: 1279.98px) and (orientation: landscape)',
  hoch: '(min-width: 600px) and (orientation: portrait)',
} as const;

// Stapelmitte (Ring des Zug-Zeigers) und wohin der Zeiger zeigt, wenn ich dran bin
// (auf meine Karten); Design-Pixel der Tischplatte
const POINTER: Record<Flip7Layout, { x: number; y: number; r: number; meX: number; meY: number }> =
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

function handCards(player: Flip7Player): HandCard[] {
  const seen = new Map<string, number>();
  return player.cards.map((card) => {
    const index = (seen.get(card) ?? 0) + 1;
    seen.set(card, index);
    return { card, key: `${card}-${index}` };
  });
}

function reducedMotion(): boolean {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Spieltisch einer laufenden Runde: ovale Platte mit Plätzen, Fächern und Stapel,
// darunter (bzw. am Laptop darauf) der eigene Platz mit Karten und Aktionen.
@Component({
  selector: 'app-flip7-board',
  imports: [NgTemplateOutlet, Flip7CardView, Flip7Seat],
  templateUrl: './flip7-board.html',
  styleUrls: ['./flip7-board.scss', './flip7-board-places.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'sizeClass()',
    '[class.live]': 'live()',
  },
})
export class Flip7Board {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly game = input.required<Flip7Game>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);
  // Host darf einen Spieler erst nach FLIP7_SKIP_AFTER_S überspringen (Uhr im Container)
  readonly canSkip = input(false);
  readonly waitingSeconds = input(0);
  // Sekundentakt aus dem Container (Alter der Verlaufseinträge)
  readonly now = input(0);

  readonly hit = output<void>();
  readonly stay = output<void>();
  readonly choose = output<number>();

  readonly layout = toSignal(
    inject(BreakpointObserver)
      .observe(Object.values(QUERIES))
      .pipe(
        map((state): Flip7Layout =>
          state.breakpoints[QUERIES.laptop]
            ? 'laptop'
            : state.breakpoints[QUERIES.quer]
              ? 'quer'
              : state.breakpoints[QUERIES.hoch]
                ? 'hoch'
                : 'phone',
        ),
      ),
    { requireSync: true },
  );
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
    const mySeat = this.me()?.seat ?? -1;
    return players
      .filter((player) => player.seat !== mySeat)
      .sort((a, b) => ((a.seat - mySeat + count) % count) - ((b.seat - mySeat + count) % count));
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
  readonly chooserTitle = computed(() => {
    const card = this.choosing();
    return card ? CHOOSER_TITLES[card] : '';
  });
  readonly chooserHint = computed(() =>
    this.choosing() === 'SC'
      ? 'Tippe auf einen Platz am Tisch.'
      : 'Tippe auf einen Platz am Tisch – auch dich selbst.',
  );

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

  // Mitte: Ablage (quer/Laptop) mit offener Aktionskarte obenauf
  readonly discard = computed(() => {
    const game = this.game();
    const pile = game.discard_count > 0 ? game.discard_top : [];
    const cards: Flip7Card[] = game.pending_card ? [...pile, game.pending_card] : [...pile];
    return { top: cards.at(-1) ?? null, below: cards.at(-2) ?? null };
  });

  // Verlauf der Runde, neueste oben; Alter ohne Uhrabweichung: gemessen ab dem
  // Moment, in dem das neueste Ereignis hier ankam, plus Abstand laut Server
  private readonly roundLog = computed(() => {
    const game = this.game();
    return game.round_log.filter((event) => event.r === undefined || event.r === game.round_no);
  });
  private readonly seenAt = linkedSignal({
    source: () => this.roundLog().at(-1)?.at,
    computation: () => Date.now(),
  });
  // Nur beim neuesten Flip 3 "noch N Karten" zeigen, ältere Einträge sind erledigt
  private readonly liveFlip3 = computed(() =>
    this.roundLog()
      .filter((event) => event.t === 'flip3')
      .at(-1),
  );
  readonly lastEvent = computed(() => {
    const event = this.roundLog().at(-1) ?? this.game().last_events.at(-1);
    return event ? this.describe(event) : this.roundStart();
  });
  readonly historyRows = computed((): Flip7HistoryRow[] => {
    const log = this.roundLog();
    const latestAt = Date.parse(log.at(-1)?.at ?? '');
    const age = (at?: string) => {
      const ms = this.now() - this.seenAt() + (latestAt - Date.parse(at ?? ''));
      return Number.isNaN(ms) ? '' : ms < 10_000 ? 'jetzt' : formatClock(ms / 1000);
    };
    return [
      ...log.map((event) => ({ ...this.describe(event), time: age(event.at) })).reverse(),
      { ...this.roundStart(), time: log.length ? age(log[0].at) : 'jetzt' },
    ];
  });

  // Zug-Zeiger vom Stapel zum Spieler am Zug; Winkel läuft den kürzesten Weg weiter
  readonly pointerCenter = computed(() => POINTER[this.layout()]);
  private readonly pointerTarget = computed(() => {
    const game = this.game();
    const seat = this.activeSeat();
    if (game.status !== 'playing' || game.phase !== 'turn' || game.pending_card || seat === null) {
      return null;
    }
    const center = this.pointerCenter();
    const table = this.table();
    let x = center.meX;
    let y = center.meY;
    let before = 0;
    if (seat !== this.me()?.seat) {
      const spot = this.seats().find((view) => view.player.seat === seat);
      if (!spot) return null;
      x = (spot.fanX / 100) * table.w;
      y = (spot.fanY / 100) * table.h;
      before = 30;
    }
    const angle = (Math.atan2(y - center.y, x - center.x) * 180) / Math.PI;
    return { angle, tip: Math.hypot(x - center.x, y - center.y) - before };
  });
  private readonly pointerAngle = linkedSignal<number | undefined, number>({
    source: () => this.pointerTarget()?.angle,
    computation: (angle, previous) => {
      if (angle === undefined) return previous?.value ?? 0;
      if (!previous) return angle;
      return previous.value + ((((angle - previous.value) % 360) + 540) % 360) - 180;
    },
  });
  readonly pointer = computed(() => {
    const target = this.pointerTarget();
    if (!target) return null;
    const { x, y, r } = this.pointerCenter();
    const tip = x + target.tip;
    return {
      angle: this.pointerAngle(),
      x1: x + r + 6,
      x2: Math.max(x + r + 6, tip - 8),
      head: `${tip},${y} ${tip - 12.6},${y - 7.2} ${tip - 12.6},${y + 7.2}`,
    };
  });

  // Freeze/Flip 3 fliegt von der Mitte zum Ziel
  readonly flights = signal<Flight[]>([]);
  private flightId = 0;
  private eventsKey: string | null = null;

  private readonly stack = viewChild<ElementRef<HTMLElement>>('stack');
  private readonly seen = new Set<string>();
  private flyBatch = 0;
  private historySheet: MatBottomSheetRef | null = null;

  constructor() {
    afterNextRender(() => this.live.set(true));
    // Verlauf schließen, wenn der Tisch verschwindet (Rundenübersicht)
    inject(DestroyRef).onDestroy(() => this.historySheet?.dismiss());

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

  openHistory(): void {
    this.historySheet = this.bottomSheet.open(Flip7HistorySheet, {
      data: { rows: this.historyRows, round: computed(() => this.game().round_no) },
      panelClass: 'flip7-history-panel',
      backdropClass: 'flip7-history-backdrop',
      ariaLabel: 'Verlauf',
    });
  }

  // Karte vom Stapel: kurz anheben, im Bogen zum Platz, im letzten Drittel umdrehen
  fly(event: AnimationCallbackEvent, id: string): void {
    const isNew = this.live() && !this.seen.has(id);
    this.seen.add(id);
    const card = event.target as HTMLElement;
    const stack = this.stack()?.nativeElement;
    if (!isNew || !stack || typeof card.animate !== 'function' || reducedMotion()) {
      event.animationComplete();
      return;
    }

    const from = stack.getBoundingClientRect();
    const to = card.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.width / (to.width || 1);
    const middle = (scale + 1) / 2;
    const delay = this.flyBatch++ * 100;
    if (!delay) setTimeout(() => (this.flyBatch = 0));

    card
      .animate(
        [
          { translate: `${dx}px ${dy}px`, scale: `${scale}` },
          { translate: `${dx}px ${dy - 4}px`, scale: `${scale}`, offset: 0.2 },
          { translate: `${dx * 0.45}px ${dy * 0.45 - 40}px`, scale: `${middle}`, offset: 0.6 },
          { translate: `${dx * 0.15}px ${dy * 0.15 - 16}px`, scale: `0 ${middle}`, offset: 0.8 },
          { translate: '0 0', scale: '1' },
        ],
        { duration: 400, delay, easing: 'ease-out', fill: 'backwards' },
      )
      .finished.catch(() => undefined)
      .finally(() => event.animationComplete());
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

  private describe(event: Flip7Event): Omit<Flip7HistoryRow, 'time'> {
    const game = this.game();
    const context = event === this.liveFlip3() ? game : { ...game, flip3_left: null };
    return {
      ...eventIcon(event),
      text: describeEvent(event, context, this.me()?.seat ?? null),
    };
  }

  private roundStart(): Omit<Flip7HistoryRow, 'time'> {
    const game = this.game();
    const dealer = game.players.find((player) => player.seat === game.dealer_seat);
    const name = dealer === this.me() ? 'du' : (dealer?.name ?? '–');
    return {
      icon: 'refresh',
      color: 'var(--color-text-muted)',
      text: `Runde ${game.round_no} beginnt – Geber: ${name}`,
    };
  }
}
