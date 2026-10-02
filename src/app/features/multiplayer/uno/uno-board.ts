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
import {
  ARC_TABLES,
  cardCount,
  formatClock,
  injectTableLayout,
  keyCards,
  KeyedCard,
  seatsAfter,
  seatSpots,
  sizeClass,
} from '../table/table.model';
import { TableTop } from '../table/table-top';
import { UnoCardView } from './uno-card';
import { UnoSeat } from './uno-seat';
import {
  canPlay,
  cardName,
  cardValue,
  COLOR_NAMES,
  handLayout,
  HAND_SPEC,
  isWild,
  UNO_POINTER,
  UnoCard,
  UnoColor,
  unoButtonLit,
  UnoEvent,
  UnoGame,
} from './uno.model';

export interface UnoPlay {
  card: UnoCard;
  color: UnoColor | null;
  target: number | null;
}

// Karte fliegt 320 ms zur Ablage, Ziehen 100 ms versetzt (Spezifikation)
const FLY_MS = 320;
const DRAW_STAGGER_MS = 100;

// Ablage: oberste Karte und zwei darunter, verdreht (unterste zuerst)
const DISCARD_TILTS = [-14, 9, 4];

// Spieltisch: ovale Platte mit Ziehstapel, Ablage und Spielrichtung in der Mitte und den
// Plätzen der Mitspieler, darunter (am Laptop darauf) die eigene Hand mit Uno-Knopf.
// Antippen spielt sofort; Farbwahl und 7-Tausch fragen vorher Farbe bzw. Mitspieler ab.
@Component({
  selector: 'app-uno-board',
  imports: [NgTemplateOutlet, TableTop, UnoCardView, UnoSeat],
  templateUrl: './uno-board.html',
  styleUrls: ['./uno-board.scss', './uno-board-own.scss', './uno-board-places.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'sizeClass()',
    '[style.--hand-w.px]': 'handSpec().w',
    '[style.--hand-h.px]': 'handSpec().h',
    '[style.--hand-max.px]': 'handSpec().max',
  },
})
export class UnoBoard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly game = input.required<UnoGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  // Host darf erst nach UNO_SKIP_AFTER_S überspringen (Uhr im Container)
  readonly canSkip = input(false);
  readonly waitingSeconds = input(0);

  readonly play = output<UnoPlay>();
  readonly draw = output<void>();
  readonly pass = output<void>();
  readonly callUno = output<void>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => ARC_TABLES[this.layout()]);
  readonly sizeClass = computed(() => sizeClass(this.game().seat_count));
  readonly handSpec = computed(() => HAND_SPEC[this.layout()]);
  // Erst nach dem ersten Rendern animieren (sonst fliegt beim Laden alles)
  readonly live = signal(false);
  readonly colors: UnoColor[] = ['R', 'Y', 'B', 'G'];
  readonly colorNames = COLOR_NAMES;

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

  // Farbwahl bzw. Tauschpartner für die angetippte Karte; gilt nur für den angezeigten Stand
  readonly choice = linkedSignal<string | null, { card: UnoCard; kind: 'color' | 'target' } | null>(
    { source: () => this.game().waiting_since, computation: () => null },
  );

  private keyId = 0;
  // Neu gezogene Karten (fliegen vom Stapel ein)
  private fresh = new Set<string>();
  private readonly handKeys = linkedSignal<UnoCard[], KeyedCard<UnoCard>[]>({
    source: () => this.game().hand,
    computation: (hand, previous) =>
      keyCards(previous?.value ?? [], hand, () => {
        const key = `h${++this.keyId}`;
        this.fresh.add(key);
        return key;
      }),
  });

  readonly hand = computed(() => {
    const game = this.game();
    const cards = this.handKeys();
    const spec = this.handSpec();
    const layout = handLayout(cards.length, this.layout());
    const middle = (cards.length - 1) / 2 || 1;
    const myTurn = this.myTurn();
    const picked = this.choice()?.card;
    return {
      ...layout,
      overlap: spec.w - layout.step,
      cards: cards.map((item, index) => {
        const o = index - (cards.length - 1) / 2;
        const playable = myTurn && canPlay(item.card, game, game.drawn);
        const lift = playable ? spec.lift : 0;
        return {
          ...item,
          playable,
          dim: myTurn && !playable,
          picked: picked === item.card,
          transform: `translateY(${spec.sag * (o / middle) ** 2 - lift}px) rotate(${o * layout.deg}deg)`,
          label: `${cardName(item.card)} spielen`,
        };
      }),
    };
  });

  readonly pending = computed(() =>
    this.game().status === 'playing' ? this.game().pending_draw : 0,
  );
  readonly drawPile = computed(() => {
    const game = this.game();
    const myTurn = this.myTurn();
    const pending = this.pending();
    return {
      // Weißer Rand, wenn nichts passt (oder eine Strafe offen ist)
      glow:
        myTurn && !game.drew && (pending > 0 || !this.hand().cards.some((card) => card.playable)),
      enabled: myTurn,
      label: game.drew
        ? 'Karte behalten, Zug beenden'
        : pending && myTurn
          ? `${cardCount(pending)} ziehen`
          : `Karte ziehen, ${game.draw_count} im Stapel`,
    };
  });
  readonly discard = computed(() => {
    const game = this.game();
    const cards = game.discard_top;
    const top = cards.at(-1) ?? null;
    return {
      cards: cards.map((card, i) => ({
        card,
        top: i === cards.length - 1,
        tilt: DISCARD_TILTS[DISCARD_TILTS.length - cards.length + i],
      })),
      label: top ? `Ablage: ${cardName(top)}` : 'Ablage leer',
      // Farbwahl: die Karte leuchtet zusätzlich in der gewählten Farbe
      glow: top && isWild(top) ? game.color : null,
    };
  });
  readonly unoLit = computed(() => unoButtonLit(this.game(), this.me(), this.myTurn()));

  // Mitspieler am Tisch (Prozent der Platte)
  private readonly lastSkipped = computed(
    () => this.game().last_events.find((event) => event.t === 'skipped')?.seat,
  );
  private readonly winSeat = computed(() =>
    this.live() ? this.game().last_events.find((event) => event.t === 'win')?.seat : undefined,
  );
  readonly winSeatIsMe = computed(
    () => this.winSeat() !== undefined && this.winSeat() === this.me()?.seat,
  );
  readonly seats = computed(() => {
    const game = this.game();
    const table = this.table();
    const spots = seatSpots(this.layout(), Math.max(0, game.seat_count - 1));
    const picking = this.choice()?.kind === 'target';
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
        skipped: this.lastSkipped() === player.seat,
        pending: turn ? this.pending() : 0,
        target: picking && player.state === 'active',
      };
    });
  });

  // Zug-Zeiger aus der Tischmitte zum Spieler am Zug
  readonly center = computed(() => UNO_POINTER[this.layout()]);
  readonly centerPos = computed(() => {
    const { x, y } = this.center();
    const table = this.table();
    return { x: (x / table.w) * 100, y: (y / table.h) * 100 };
  });
  readonly pointerTarget = computed(() => {
    const seat = this.turnSeat();
    if (seat === null) return null;
    const center = this.center();
    if (seat === this.me()?.seat) return { x: center.meX, y: center.meY, before: 0 };
    const view = this.seats().find((item) => item.player.seat === seat);
    return view ? { x: view.spot.x, y: view.spot.y, before: center.before } : null;
  });

  // Nur für Screenreader: wer dran ist und was zu tun ist
  readonly status = computed(() => {
    const game = this.game();
    if (game.status !== 'playing') return 'Die Runde ist beendet.';
    const color = game.color ? `Farbe ${COLOR_NAMES[game.color]}. ` : '';
    if (!this.myTurn()) {
      const name = game.players.find((player) => player.seat === game.turn_seat)?.name;
      return `${color}${name ?? 'Jemand'} ist am Zug.`;
    }
    const choice = this.choice();
    if (choice?.kind === 'color') return 'Wähle eine Farbe.';
    if (choice?.kind === 'target') return 'Wähle, mit wem du die Karten tauschst.';
    if (this.pending() && !this.hand().cards.some((card) => card.playable)) {
      return `${color}Du musst ${cardCount(this.pending())} ziehen.`;
    }
    return `${color}Du bist am Zug.`;
  });

  private eventsKey: string | null = null;
  // Wo die eigene Karte beim Antippen lag (Start des eigenen Flugs)
  private ownFrom: DOMRect | null = null;

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
      // Keys erst berechnen lassen, dann die neuen abholen
      untracked(this.handKeys);
      const fresh = [...this.fresh];
      this.fresh.clear();
      if (first || reducedMotion()) return;

      const mySeat = untracked(this.me)?.seat;
      afterNextRender(() => this.animate(game.last_events, mySeat, from, fresh), {
        injector: this.injector,
      });
    });
  }

  // Antippen: Zahl/Aktion spielt sofort, Farbwahl fragt die Farbe, 7 (7-0) den Partner
  tapCard(card: UnoCard, element: HTMLElement): void {
    if (this.busy()) return;
    const game = this.game();
    const current = this.choice();
    if (current?.card === card) {
      this.choice.set(null);
      return;
    }
    this.ownFrom = element.getBoundingClientRect();
    // Offenes eigenes Uno-Fenster: der Zug zieht erst 2 Strafkarten, die 7 ist dann nicht die letzte
    const lastCard = game.hand.length === 1 && game.uno_open_seat !== this.me()?.seat;
    if (isWild(card)) {
      this.choice.set({ card, kind: 'color' });
    } else if (cardValue(card) === '7' && game.settings.sevenZero && !lastCard) {
      this.choice.set({ card, kind: 'target' });
    } else {
      this.choice.set(null);
      this.play.emit({ card, color: null, target: null });
    }
  }

  pickColor(color: UnoColor): void {
    const choice = this.choice();
    if (!choice || this.busy()) return;
    this.play.emit({ card: choice.card, color, target: null });
  }

  pickTarget(seat: number): void {
    const choice = this.choice();
    if (!choice || this.busy()) return;
    this.play.emit({ card: choice.card, color: null, target: seat });
  }

  // Stapel antippen: ziehen bzw. nach dem Ziehen die Karte behalten
  tapPile(): void {
    if (this.busy() || !this.myTurn()) return;
    this.choice.set(null);
    if (this.game().drew) this.pass.emit();
    else this.draw.emit();
  }

  // Viele Karten: seitlich weiter (am Ende zurück zum Anfang)
  scrollHand(scroller: HTMLElement): void {
    const end = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
    scroller.scrollTo({
      left: end ? 0 : scroller.scrollLeft + scroller.clientWidth * 0.8,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  }

  private find(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }

  // Gespielte Karte fliegt zur Ablage (offen), danach meine neuen Karten vom Stapel
  private animate(
    events: UnoEvent[],
    mySeat: number | undefined,
    from: DOMRect | null,
    fresh: string[],
  ): void {
    let delay = 0;
    const fly = (card: Element | null, source: Element | DOMRect | null, flip = false) => {
      if (card instanceof HTMLElement && source && typeof card.animate === 'function') {
        void flyFrom(card, source, { flip, delay, duration: FLY_MS });
      }
    };

    for (const event of events) {
      if (event.t !== 'play') continue;
      const source =
        event.seat === mySeat
          ? (from ?? this.find('.hand'))
          : (this.find(`[data-seat="${event.seat}"] .fan`) ??
            this.find(`[data-seat="${event.seat}"]`));
      fly(this.find('.discard .top'), source);
      delay += FLY_MS;
    }

    // Nach Tausch/Drehen ist die ganze Hand neu, aber nicht gezogen: kein Flug vom Stapel
    const handMoved = events.some(
      (event) =>
        event.t === 'rotate' ||
        (event.t === 'swap' && (event.seat === mySeat || event.target === mySeat)),
    );
    const stack = this.find('.draw-stack');
    for (const key of handMoved ? [] : fresh) {
      fly(this.find(`[data-key="${key}"] app-uno-card`), stack, true);
      delay += DRAW_STAGGER_MS;
    }
  }
}
