import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { flyFrom, reducedMotion } from '../table/table-motion';
import { formatClock, injectTableLayout, seatsAfter } from '../table/table.model';
import { TableTop } from '../table/table-top';
import { SkipboCardView } from './skipbo-card';
import { SkipboFan } from './skipbo-fan';
import { SkipboSeat } from './skipbo-seat';
import {
  canPlay,
  cardCount,
  cardName,
  fanView,
  HAND_ARC,
  isJoker,
  keyCards,
  KeyedCard,
  LAPTOP_SMALL_POINTER_Y,
  POINTER,
  seatSpots,
  SKIPBO_TABLES,
  sizeClass,
  SkipboCard,
  SkipboEvent,
  SkipboGame,
  SkipboSource,
  SPREAD_DY,
  validPiles,
} from './skipbo.model';

export interface SkipboPlay {
  source: SkipboSource;
  pile: number;
}

export interface SkipboDiscard {
  hand: number;
  pile: number;
}

// Jede gespielte/abgelegte Karte eines Zugs fliegt nach der vorigen; Abräumen bei 12
// (Goldrand 600 ms nach 400 ms, Gleiten 360 ms) ist danach vorbei
const STEP_MS = 400;
const CLEAR_MS = 1400;

// Spieltisch: ovale Platte mit Nachziehstapel, 4 Aufbaustapeln und den Plätzen der
// Mitspieler, darunter (am Laptop darauf) der eigene Bereich. Alles per Antippen:
// Karte wählen (Hand, Spielstapel, Ablage), dann einen markierten Stapel.
@Component({
  selector: 'app-skipbo-board',
  imports: [NgTemplateOutlet, SkipboCardView, SkipboFan, SkipboSeat, TableTop],
  templateUrl: './skipbo-board.html',
  styleUrls: ['./skipbo-board.scss', './skipbo-board-own.scss', './skipbo-board-places.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'sizeClass()',
  },
})
export class SkipboBoard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly game = input.required<SkipboGame>();
  readonly userId = input.required<string>();
  readonly isHost = input(false);
  readonly busy = input(false);
  // Host darf erst nach SKIPBO_SKIP_AFTER_S überspringen (Uhr im Container)
  readonly canSkip = input(false);
  readonly waitingSeconds = input(0);

  readonly play = output<SkipboPlay>();
  readonly discard = output<SkipboDiscard>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => SKIPBO_TABLES[this.layout()]);
  readonly sizeClass = computed(() => sizeClass(this.game().seat_count));
  // Erst nach dem ersten Rendern animieren (sonst fliegt beim Laden alles)
  readonly live = signal(false);

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  readonly others = computed(() => {
    const { players, seat_count: seats } = this.game();
    return seatsAfter(players, this.me()?.seat ?? -1, seats);
  });
  readonly turnSeat = computed(() =>
    this.game().status === 'playing' ? this.game().turn_seat : null,
  );
  readonly myTurn = computed(
    () =>
      this.turnSeat() !== null &&
      this.turnSeat() === this.me()?.seat &&
      this.me()?.state === 'active',
  );

  // Gewählte Karte und aufgeklappte Ablage gelten nur für den angezeigten Stand
  readonly selected = linkedSignal<string | null, SkipboSource | null>({
    source: () => this.game().waiting_since,
    computation: () => null,
  });
  readonly expanded = linkedSignal<string | null, number | null>({
    source: () => this.game().waiting_since,
    computation: () => null,
  });
  private keyId = 0;
  // Stabile Keys: nur neu gezogene Karten fliegen
  private readonly handKeys = linkedSignal<SkipboCard[], KeyedCard[]>({
    source: () => this.game().hand,
    computation: (hand, previous) =>
      keyCards(previous?.value ?? [], hand, () => `h${++this.keyId}`),
  });

  readonly selectedCard = computed((): SkipboCard | null => {
    const source = this.selected();
    const me = this.me();
    if (!source || !me) return null;
    if (source.kind === 'hand') return this.game().hand[source.index] ?? null;
    if (source.kind === 'stock') return me.stock_top;
    return me.discards[source.index]?.at(-1) ?? null;
  });
  readonly handSelected = computed(() => this.selected()?.kind === 'hand');

  readonly builds = computed(() => {
    const card = this.selectedCard();
    return this.game().build_piles.map((pile, index) => {
      const value = pile.length;
      const top = pile.at(-1) ?? null;
      const target = !!card && canPlay(card, pile);
      const where = `Aufbaustapel ${index + 1}, ${value ? `liegt bei ${value}` : 'leer'}`;
      const next = card && isJoker(card) ? `Joker als ${value + 1}` : `${value + 1}`;
      return {
        index,
        value,
        top,
        // Bis zu 2 Kanten der echten Karten darunter (die tiefere zuerst)
        edges: pile.slice(Math.max(0, value - 3), -1),
        joker: top && isJoker(top) ? value : null,
        target,
        dim: !!card && !target,
        label: target ? `${where}, ${next} anlegen` : where,
      };
    });
  });

  // Eigener Bereich
  readonly myStock = computed(() => {
    const me = this.me();
    if (!me) return null;
    const top = me.stock_top;
    const selected = this.selected()?.kind === 'stock';
    return {
      top,
      count: me.stock_count,
      backs: Math.max(0, Math.min(2, me.stock_count - 1)),
      selected,
      source: this.myTurn() && !!top,
      label:
        this.myTurn() && top
          ? `Spielstapel, oberste Karte ${cardName(top)} ${selected ? 'abwählen' : 'wählen'}, noch ${cardCount(me.stock_count)}`
          : top
            ? `Spielstapel, noch ${cardCount(me.stock_count)}, oben ${cardName(top)}`
            : 'Spielstapel, leer',
    };
  });
  readonly myDiscards = computed(() => {
    const me = this.me();
    if (!me) return [];
    const source = this.selected();
    const visible = this.layout() === 'phone' ? 3 : 4;
    return me.discards.map((pile, index) => {
      const list = `${cardCount(pile.length)}: ${pile.map(cardName).join(', ')}`;
      const selected = source?.kind === 'discard' && source.index === index;
      const top = pile.at(-1);
      const mode = this.handSelected()
        ? ('target' as const)
        : this.myTurn() && top
          ? ('source' as const)
          : ('static' as const);
      return {
        index,
        cards: pile,
        cap: fanView(pile, visible).cap,
        selected,
        mode,
        label:
          mode === 'target'
            ? `Ablage ${index + 1} (${pile.length ? list : 'leer'}), hier ablegen und Zug beenden`
            : mode === 'source'
              ? `Ablage ${index + 1}, oberste Karte ${cardName(top!)} ${selected ? 'abwählen' : 'wählen'}`
              : `Ablage ${index + 1}, ${pile.length ? list : 'leer'}`,
      };
    });
  });
  readonly hand = computed(() => {
    const cards = this.handKeys();
    const arc = HAND_ARC[this.layout()];
    const source = this.selected();
    const middle = (cards.length - 1) / 2;
    return {
      cards: cards.map((item, index) => {
        const offset = index - middle;
        const selected = source?.kind === 'hand' && source.index === index;
        return {
          ...item,
          index,
          selected,
          transform: `translateY(${arc.k * offset * offset - (selected ? arc.lift : 0)}px) rotate(${offset * arc.deg}deg)`,
          label: `Handkarte ${cardName(item.card)} ${selected ? 'abwählen' : 'wählen'}`,
        };
      }),
      empty: Array.from({ length: Math.max(0, 5 - cards.length) }),
      // Platz für die am Rand abgesenkten Karten
      sag: arc.k * middle * middle,
    };
  });

  // Mitspieler am Tisch (Prozent der Platte)
  private readonly winSeat = computed(() =>
    this.live() ? this.game().last_events.find((event) => event.t === 'win')?.seat : undefined,
  );
  readonly winSeatIsMe = computed(
    () => this.winSeat() !== undefined && this.winSeat() === this.me()?.seat,
  );
  readonly isJoker = isJoker;
  readonly cardCount = cardCount;
  readonly seats = computed(() => {
    const game = this.game();
    const table = this.table();
    const spots = seatSpots(this.layout(), Math.max(0, game.seat_count - 1));
    return this.others().map((player, i) => {
      const turn = player.seat === this.turnSeat();
      return {
        player,
        spot: spots[i],
        x: (spots[i].x / table.w) * 100,
        y: (spots[i].y / table.h) * 100,
        turn,
        waiting: this.canSkip() && turn ? formatClock(this.waitingSeconds()) : null,
        winner: game.winner_seat === player.seat,
        celebrate: this.winSeat() === player.seat,
      };
    });
  });

  // Zug-Zeiger vom Nachziehstapel zur Auslage des Spielers am Zug
  readonly pointerCenter = computed(() => {
    const pointer = POINTER[this.layout()];
    return this.layout() === 'laptop' && this.sizeClass() === 's'
      ? { ...pointer, y: LAPTOP_SMALL_POINTER_Y }
      : pointer;
  });
  readonly pointerTarget = computed(() => {
    const seat = this.turnSeat();
    if (seat === null) return null;
    const center = this.pointerCenter();
    if (seat === this.me()?.seat) return { x: center.meX, y: center.meY, before: 0 };
    const view = this.seats().find((item) => item.player.seat === seat);
    if (!view) return null;
    return {
      x: view.spot.x,
      y: view.spot.y + SPREAD_DY[this.layout()][this.sizeClass()],
      before: this.layout() === 'phone' ? 22 : 40,
    };
  });

  // Nur für Screenreader: wer dran ist und was die Wahl erlaubt
  readonly status = computed(() => {
    const game = this.game();
    if (game.status !== 'playing') return 'Das Spiel ist beendet.';
    if (!this.myTurn()) {
      const name = game.players.find((player) => player.seat === game.turn_seat)?.name;
      return `${name ?? 'Jemand'} ist am Zug.`;
    }
    const card = this.selectedCard();
    if (!card) return 'Du bist am Zug. Wähle eine Karte.';
    const n = validPiles(card, game.build_piles).length;
    const fits =
      n === 0
        ? 'kein Aufbaustapel passt'
        : n === 1
          ? '1 Aufbaustapel passt'
          : `${n} Aufbaustapel passen`;
    return `${cardName(card)} gewählt: ${fits}${this.handSelected() ? ', oder lege sie auf eine Ablage.' : '.'}`;
  });

  // Abräumen bei 12: gespielte Karte liegt noch kurz als Geist im leeren Platz
  readonly ghosts = signal<ReadonlyMap<number, SkipboCard>>(new Map());
  private eventsKey: string | null = null;
  // Wo die eigene Karte beim Antippen des Ziels lag (Start des eigenen Flugs)
  private ownFrom: DOMRect | null = null;
  private ghostTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => this.live.set(true));

    effect(() => {
      const game = this.game();
      const key = `${game.waiting_since}|${JSON.stringify(game.last_events)}`;
      const first = this.eventsKey === null;
      if (key === this.eventsKey) return;
      this.eventsKey = key;
      const from = this.ownFrom;
      this.ownFrom = null;
      if (first || reducedMotion()) return;

      const events = game.last_events;
      const ghosts = new Map<number, SkipboCard>();
      events.forEach((event, i) => {
        const played = events[i - 1];
        if (event.t === 'clear' && played?.card) ghosts.set(event.pile!, played.card);
      });
      untracked(() => this.ghosts.set(ghosts));
      clearTimeout(this.ghostTimer);
      if (ghosts.size) this.ghostTimer = setTimeout(() => this.ghosts.set(new Map()), CLEAR_MS);

      const mySeat = untracked(this.me)?.seat;
      afterNextRender(() => this.animate(events, mySeat, from), { injector: this.injector });
    });
  }

  select(source: SkipboSource): void {
    if (this.busy()) return;
    const current = this.selected();
    this.selected.set(
      current?.kind === source.kind && current.index === source.index ? null : source,
    );
  }

  toggleCap(index: number): void {
    this.expanded.update((open) => (open === index ? null : index));
  }

  playTo(pile: number): void {
    const source = this.selected();
    if (!source || this.busy()) return;
    this.ownFrom = this.sourceElement(source)?.getBoundingClientRect() ?? null;
    this.play.emit({ source, pile });
  }

  discardTo(pile: number): void {
    const source = this.selected();
    if (source?.kind !== 'hand' || this.busy()) return;
    this.ownFrom = this.sourceElement(source)?.getBoundingClientRect() ?? null;
    this.discard.emit({ hand: source.index, pile });
  }

  private find(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }

  private sourceElement(source: SkipboSource): HTMLElement | null {
    if (source.kind === 'hand') return this.find(`[data-hand="${source.index}"] app-skipbo-card`);
    if (source.kind === 'stock') return this.find('.my-stock .top');
    return this.find(`.mine-discards [data-discard="${source.index}"] .fan-top`);
  }

  // Karten der letzten Aktion nacheinander fliegen lassen: Gespieltes zum Aufbaustapel,
  // Abgelegtes auf die Ablage (beides offen), danach meine nachgezogenen Karten (umgedreht)
  private animate(events: SkipboEvent[], mySeat: number | undefined, from: DOMRect | null): void {
    let delay = 0;
    const fly = (card: Element | null, source: Element | DOMRect | null, flip = false) => {
      if (card instanceof HTMLElement && source && typeof card.animate === 'function') {
        void flyFrom(card, source, { flip, delay });
      }
    };
    const seatPart = (seat: number, part: string) =>
      this.find(`[data-seat="${seat}"] ${part}`) ?? this.find(`[data-seat="${seat}"]`);

    for (const event of events) {
      const mine = event.seat === mySeat;
      if (event.t === 'play') {
        const source = mine
          ? (from ??
            this.find(
              event.src === 'stock'
                ? '.my-stock'
                : event.src === 'discard'
                  ? `.mine-discards [data-discard="${event.i}"]`
                  : '.hand',
            ))
          : seatPart(
              event.seat!,
              event.src === 'stock'
                ? '.spread-stock'
                : event.src === 'discard'
                  ? `[data-discard="${event.i}"]`
                  : '.backs',
            );
        fly(this.find(`[data-build="${event.pile}"] .top`), source);
        // Neue Oberkarte des Spielstapels dreht sich auf (nicht beim Sieg: Stapel leer)
        if (event.src === 'stock' && event.left) {
          const top = mine
            ? this.find('.my-stock .top')
            : seatPart(event.seat!, '.spread-stock .top');
          top?.animate?.([{ transform: 'rotateY(90deg)' }, { transform: 'none' }], {
            duration: 240,
            delay: delay + 160,
            easing: 'ease-out',
            fill: 'backwards',
          });
        }
        delay += STEP_MS;
      } else if (event.t === 'discard') {
        const target = mine
          ? this.find(`.mine-discards [data-discard="${event.pile}"] .fan-top`)
          : seatPart(event.seat!, `[data-discard="${event.pile}"] .fan-top`);
        fly(target, mine ? (from ?? this.find('.hand')) : seatPart(event.seat!, '.backs'));
        delay += STEP_MS;
      } else if (event.t === 'draw' && mine && event.n) {
        const stack = this.find('.draw-stack');
        const cards = [...this.host.nativeElement.querySelectorAll('.hand-card app-skipbo-card')];
        for (const card of cards.slice(-event.n)) {
          fly(card, stack, true);
          delay += 100;
        }
      }
    }
  }
}
