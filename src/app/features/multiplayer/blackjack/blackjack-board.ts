import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
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
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { flyFrom, injectFlights, reducedMotion } from '../table/table-motion';
import { ARC_TABLES, AVATAR_COLORS, injectTableLayout, seatsAfter } from '../table/table.model';
import { TableTop } from '../table/table-top';
import { BlackjackCard } from './blackjack-card';
import { BlackjackChips } from './blackjack-chips';
import { BlackjackSeat } from './blackjack-seat';
import { BjSheetRow, openTableSheet } from './blackjack-table-sheet';
import {
  BET_MAX,
  BET_MIN,
  BET_WINDOW_S,
  BjAction,
  BjGame,
  BjHand,
  BjPlayer,
  BjTone,
  blackjackSeats,
  canDouble,
  canSplit,
  chipColor,
  chipStack,
  CHIPS,
  formatDelta,
  formatMoney,
  handDelta,
  handValue,
  resetsTimeline,
  roundDelta,
  seatStatus,
  stakeOf,
  TURN_S,
  valueLabel,
} from './blackjack.model';

// Austeilen: 140 ms Abstand, 400 ms Flug; Aufdecken 220 ms, Dealerkarten mit Spannung
const DEAL_STAGGER_MS = 140;
const FLY_MS = 400;
const FLIP_MS = 220;
const DEALER_STEP_MS = 500;
const CHIP_MS = 420;
const CHIP_TAP_MS = 320;
// Mit Mitspielern steht das eigene Ergebnis so lange in der Mitte, dann der Setz-Ring
const BANNER_MS = 3500;
const KEYS: Record<string, BjAction> = { h: 'hit', s: 'stand', d: 'double', p: 'split' };

interface HandView {
  key: string;
  hand: BjHand;
  cards: { card: string; key: string }[];
  value: string;
  tone: BjTone;
  active: boolean;
  stake: string;
  stakeTone: BjTone;
}

// Blackjack-Tisch: Dealer oben, Mitspieler an den Seiten (Handy) bzw. im unteren Bogen
// (Laptop), eigene Hand unten in der Mitte. Darunter das Bedienfeld mit Guthaben und
// Ziehen/Halten/Verdoppeln/Teilen bzw. Chips zum Setzen. Allein (Main.dc) mit Schuh und
// Regeln in der Mitte; mit Mitspielern ist die Mitte frei für Setz-Ring und Ergebnis.
@Component({
  selector: 'app-blackjack-board',
  imports: [NgTemplateOutlet, TableTop, BlackjackCard, BlackjackChips, BlackjackSeat],
  templateUrl: './blackjack-board.html',
  styleUrls: [
    './blackjack-board.scss',
    './blackjack-board-own.scss',
    './blackjack-board-places.scss',
  ],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-solo]': 'solo() || null',
    '[class.dealing]': 'dealing()',
    '(document:keydown)': 'onKey($event)',
  },
})
export class BlackjackBoard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly game = input.required<BjGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  // Sekunden bis zum Austeilen (null: Setzzeit läuft nicht) bzw. bis die Hand hält
  // (null: allein oder nicht am Zug); Uhren im Container
  readonly betSecondsLeft = input<number | null>(null);
  readonly turnSecondsLeft = input<number | null>(null);

  readonly bet = output<number>();
  readonly play = output<BjAction>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => ARC_TABLES[this.layout()]);
  readonly wide = computed(() => this.layout() === 'quer' || this.layout() === 'laptop');
  readonly solo = computed(() => this.game().seat_count === 1);
  readonly chips = CHIPS;
  // Kein Zug-Zeiger: der Dealer sitzt oben, wer dran ist, zeigt der weiße Rand
  readonly noPointer = { x: 0, y: 0, r: 0 };
  readonly formatMoney = formatMoney;
  readonly formatDelta = formatDelta;

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  readonly myHands = computed(() => this.me()?.hands ?? []);
  readonly playing = computed(
    () => this.game().status === 'playing' && this.game().phase === 'playing',
  );
  readonly betting = computed(
    () => this.game().status === 'playing' && this.game().phase === 'betting',
  );
  readonly myTurn = computed(
    () => this.playing() && this.me() !== null && this.game().turn_seat === this.me()?.seat,
  );
  readonly activeHand = computed(() =>
    this.myTurn()
      ? (this.myHands().find((hand) => hand.hand_no === this.game().turn_hand) ?? null)
      : null,
  );

  // Abrechnung läuft (Animation): Dealerwert, Ergebnisse und Guthaben erst danach
  readonly settling = signal(false);
  // Es wird ausgeteilt (Animation): Werte erst, wenn die Karten liegen
  readonly dealing = signal(false);
  // Verdeckte Dealerkarte bleibt Rücken, bis sie in der Animation aufgedeckt wird
  private readonly concealHole = signal(false);
  // Mit Mitspielern: eigenes Ergebnis kurz in der Mitte
  private readonly freshResult = signal(false);

  // Setzen: Chips, die noch nicht gesetzt sind; gilt nur für den angezeigten Stand
  readonly draft = linkedSignal({
    source: () => `${this.game().round_no}|${this.me()?.bet}`,
    computation: () => 0,
  });
  // „Einsatz ändern“ statt der Karten der letzten Runde
  readonly editing = linkedSignal({ source: () => this.game().round_no, computation: () => false });
  // Leeres Einsatzfeld statt der Karten der letzten Runde
  readonly betView = computed(
    () =>
      this.betting() &&
      (this.editing() || this.draft() > 0 || !!this.me()?.bet || !this.myHands().length),
  );

  readonly balance = computed(() => {
    const me = this.me();
    if (!me) return 0;
    // Gewinne erst gutschreiben, wenn die Chips angekommen sind
    const pending = this.settling()
      ? me.hands.reduce((sum, hand) => sum + (hand.payout ?? 0), 0)
      : 0;
    return me.balance - pending;
  });
  // Was noch gesetzt werden kann (Guthaben und Höchsteinsatz)
  private readonly betRoom = computed(
    () => Math.min(BET_MAX, this.me()?.balance ?? 0) - this.draft(),
  );

  // Dealer: offene Karten, dahinter der Rücken; beim Setzen zwei leere Felder
  readonly dealer = computed(() => {
    const game = this.game();
    if (this.betView() || !game.dealer_cards.length) return null;
    const conceal = this.concealHole() || this.settling();
    const cards = game.dealer_cards.map((card, i) => ({
      key: `d:${i}`,
      card: i === 1 && this.concealHole() ? null : card,
    }));
    if (game.dealer_hole) cards.push({ key: `d:${cards.length}`, card: null });
    // Wert erst nach dem Aufdecken (vorher nur die offene Karte, Ass als "1 / 11")
    const hidden = game.dealer_hole || conceal;
    const shown = hidden ? game.dealer_cards.slice(0, 1) : game.dealer_cards;
    const { total } = handValue(shown);
    const blackjack = shown.length === 2 && total === 21;
    return {
      cards,
      value: blackjack ? 'Blackjack' : hidden ? valueLabel(shown) : String(total),
      tone: (blackjack ? 'bj' : total > 21 ? 'bust' : 'value') as BjTone,
      up: handValue(game.dealer_cards.slice(0, 1)).total,
    };
  });

  readonly hands = computed((): HandView[] => {
    const me = this.me();
    if (!me || this.betView()) return [];
    const split = me.hands.length > 1;
    return me.hands.map((hand) => {
      const { total } = handValue(hand.cards);
      const shown = hand.result !== null && !this.settling();
      const delta = handDelta(hand);
      return {
        key: `s${me.seat}:${hand.hand_no}`,
        hand,
        cards: hand.cards.map((card, i) => ({ card, key: `s${me.seat}:${hand.hand_no}:${i}` })),
        value:
          hand.state === 'blackjack'
            ? 'Blackjack'
            : total > 21
              ? `${total} · Überkauft`
              : hand.state === 'playing'
                ? valueLabel(hand.cards)
                : String(total),
        tone: hand.state === 'blackjack' ? 'bj' : total > 21 ? 'bust' : 'value',
        active: split && this.activeHand() === hand,
        stake: shown ? formatDelta(delta) : formatMoney(hand.bet),
        stakeTone: !shown
          ? 'muted'
          : hand.result === 'blackjack'
            ? 'bj'
            : delta > 0
              ? 'win'
              : delta < 0
                ? 'lose'
                : 'muted',
      };
    });
  });

  // Einsatzfeld beim Setzen: gesetzt bzw. noch nicht gesetzte Chips
  readonly spot = computed(() => {
    const placed = this.me()?.bet ?? 0;
    return { amount: placed || this.draft(), placed: placed > 0 };
  });

  // Was das Bedienfeld zeigt
  readonly panel = computed((): 'actions' | 'again' | 'chips' => {
    if (!this.betting()) return 'actions';
    return this.betView() ? 'chips' : 'again';
  });
  readonly actions = computed(() => {
    const hand = this.activeHand();
    const balance = this.me()?.balance ?? 0;
    const free = !this.busy() && !!hand;
    return {
      hit: free,
      stand: free,
      double: free && !!hand && canDouble(hand, balance),
      split: free && canSplit(this.myHands(), balance),
    };
  });
  readonly chipButtons = computed(() =>
    CHIPS.map((chip) => ({
      ...chip,
      disabled: this.busy() || this.settling() || !!this.me()?.bet || chip.value > this.betRoom(),
      label: `Chip ${chip.value} setzen`,
    })),
  );
  readonly setLabel = computed(() => {
    const me = this.me();
    if (me?.bet) return `Gesetzt · ${formatMoney(me.bet)}`;
    if ((me?.balance ?? 0) < BET_MIN) return 'Pleite';
    return this.draft() >= BET_MIN
      ? `Setzen · ${formatMoney(this.draft())}`
      : `Ab ${BET_MIN} setzen`;
  });
  readonly again = computed(() => {
    const me = this.me();
    const last = me?.last_bet ?? 0;
    return {
      amount: last,
      enabled: !this.busy() && !this.settling() && last >= BET_MIN && last <= (me?.balance ?? 0),
    };
  });

  // Mitspieler am Tisch (Prozent der Platte)
  readonly others = computed(() => {
    const { players, seat_count: seats } = this.game();
    return seatsAfter(players, this.me()?.seat ?? -1, seats);
  });
  readonly seats = computed(() => {
    const game = this.game();
    const spots = blackjackSeats(this.layout(), this.others().length);
    return this.others().map((player, i) => ({
      player,
      x: spots[i]?.x ?? 50,
      y: spots[i]?.y ?? 50,
      turn: this.playing() && game.turn_seat === player.seat,
      status: this.dealing() ? null : seatStatus(player, game, this.settling()),
    }));
  });

  // Setz-Ring mit Mitspielern: Restzeit und wer schon gesetzt hat
  readonly ring = computed(() => {
    if (this.solo() || !this.betting()) return null;
    const active = this.game().players.filter((player) => player.state === 'active');
    const ready = active.filter((player) => player.bet > 0).length;
    const total = active.filter((player) => player.bet > 0 || player.balance >= BET_MIN).length;
    const left = this.betSecondsLeft();
    return {
      clock: left === null ? null : `0:${String(left).padStart(2, '0')}`,
      share: left === null ? 1 : left / BET_WINDOW_S,
      ready: `${ready} von ${total} bereit`,
    };
  });
  readonly ringLength = 2 * Math.PI * 28;

  // Eigenes Ergebnis der letzten Runde (Zustaende.dc)
  readonly banner = computed(() => {
    const game = this.game();
    const hands = this.myHands();
    if (!this.betting() || this.betView() || this.settling() || !hands.length) return null;
    if (!this.solo() && !this.freshResult()) return null;
    const delta = roundDelta(hands);
    const dealer = handValue(game.dealer_cards).total;
    const dealerBj = game.dealer_cards.length === 2 && dealer === 21;
    let title = delta > 0 ? 'Gewonnen' : delta < 0 ? 'Verloren' : 'Unentschieden';
    let tone: BjTone = delta > 0 ? 'win' : delta < 0 ? 'lose' : 'muted';
    if (hands.length === 1) {
      const [hand] = hands;
      if (hand.result === 'blackjack') [title, tone] = ['Blackjack!', 'bj'];
      else if (hand.state === 'bust') title = 'Überkauft';
      else if (hand.result === 'lose' && dealerBj) title = 'Dealer hat Blackjack';
      else if (hand.result === 'win' && dealer > 21) title = 'Dealer überkauft';
    }
    return {
      title,
      tone,
      sub: `${delta ? formatDelta(delta) : 'Einsatz zurück'} · Dealer ${dealerBj ? 'Blackjack' : dealer}`,
    };
  });

  // Rechts in der Kopfzeile des Bedienfelds: was gerade los ist
  readonly hint = computed(() => {
    const game = this.game();
    const me = this.me();
    if (!me || game.status !== 'playing') return '';
    if (this.betting()) {
      if (me.bet) return this.solo() ? '' : (this.ring()?.ready ?? '');
      if (me.balance < BET_MIN) return 'Pleite – du setzt aus';
      return this.betView() ? 'Einsatz wählen' : `Einsatz ${formatMoney(me.last_bet)}`;
    }
    if (!me.hands.length) return 'Du setzt diese Runde aus';
    if (!this.myTurn()) {
      const name = game.players.find((player) => player.seat === game.turn_seat)?.name;
      return `${name ?? 'Jemand'} ist am Zug`;
    }
    // Geteilt: welche Hand dran ist (mit Zugzeit zeigt das nur der weiße Rahmen, sonst zu lang)
    const hands = this.myHands();
    const left = this.turnSecondsLeft();
    const clock = left !== null && left <= 10 ? ` · Noch ${left} s` : '';
    const which =
      hands.length > 1 && !clock ? `Hand ${(game.turn_hand ?? 0) + 1} von ${hands.length} · ` : '';
    return `${which}Dealer zeigt ${this.dealer()?.up ?? ''}${clock}`;
  });
  // Laptop: Zugzeit als Ring neben dem Hinweis
  readonly turnRing = computed(() => {
    const left = this.turnSecondsLeft();
    return left === null || !this.myTurn() ? null : { left, share: left / TURN_S };
  });
  readonly turnRingLength = 2 * Math.PI * 19;

  // Nur für Screenreader: was gerade zu tun ist
  readonly status = computed(() => {
    const hint = this.hint();
    if (this.myTurn()) {
      const hand = this.activeHand();
      return `Du bist am Zug${hand ? `, deine Hand ${valueLabel(hand.cards)}` : ''}. ${hint}.`;
    }
    return hint ? `${hint}.` : '';
  });

  // Chips, die fliegen (Setzen, Gewinn, Verlust)
  private readonly flights = injectFlights<{ value: number }>('.chip-flight');
  readonly chipFlights = this.flights.list;

  private sheet: MatBottomSheetRef | null = null;
  private eventsKey: string | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    effect(() => {
      const game = this.game();
      const key = `${game.waiting_since}|${game.round_no}|${JSON.stringify(game.last_events)}`;
      const first = this.eventsKey === null;
      if (key === this.eventsKey) return;
      this.eventsKey = key;
      if (first) return;

      const events = game.last_events;
      const settles = events.some((event) => event.t === 'result' || event.t === 'reveal');
      const motion = !reducedMotion();
      untracked(() => {
        // Nur Einsätze o. Ä.: laufende Zeitleiste (Abrechnung, Austeilen) weiterlaufen lassen
        if (!resetsTimeline(events)) return;
        this.timers.forEach(clearTimeout);
        this.timers = [];
        this.freshResult.set(false);
        this.settling.set(motion && settles);
        this.dealing.set(motion && events.some((event) => event.t === 'deal'));
        this.concealHole.set(motion && events.some((event) => event.t === 'reveal'));
        if (!motion && settles) this.showResult();
      });
      if (motion) afterNextRender(() => this.animate(game, settles), { injector: this.injector });
    });

    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach(clearTimeout);
      this.sheet?.dismiss();
    });
  }

  addChip(value: number, button: HTMLElement): void {
    if (this.busy() || this.settling() || value > this.betRoom()) return;
    this.draft.update((draft) => draft + value);
    const spot = this.find('.bet-spot');
    if (!spot || reducedMotion()) return;
    const from = button.getBoundingClientRect();
    this.flights.launch([{ from, to: chipRect(spot, from.width), delay: 0, value }], CHIP_TAP_MS);
  }

  clearDraft(): void {
    this.draft.set(0);
  }

  placeBet(): void {
    if (!this.busy() && this.draft() >= BET_MIN) this.bet.emit(this.draft());
  }

  rebet(): void {
    if (this.again().enabled) this.bet.emit(this.again().amount);
  }

  doAction(action: BjAction): void {
    if (this.actions()[action]) this.play.emit(action);
  }

  // Laptop: H/S/D/P (Laptop.dc)
  onKey(event: KeyboardEvent): void {
    const action = KEYS[event.key.toLowerCase()];
    if (!action || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    // Nicht beim Tippen und nicht hinter offenen Dialogen/Sheets
    if ((event.target as Element).closest?.('input, textarea, [contenteditable]')) return;
    if (document.querySelector('.cdk-overlay-backdrop-showing')) return;
    this.doAction(action);
  }

  openTable(): void {
    const game = this.game;
    this.sheet = openTableSheet(this.bottomSheet, {
      title: computed(() => `Tisch · Runde ${game().round_no}`),
      sub: computed(() => {
        const players = game().players.filter((player) => player.state === 'active');
        const stakes = players.reduce((sum, player) => sum + stakeOf(player), 0);
        const up = this.dealer()?.up;
        return [
          `${players.length} Spieler`,
          `Einsätze gesamt ${formatMoney(stakes)}`,
          up && game().dealer_hole ? `Dealer zeigt ${up}` : null,
        ]
          .filter(Boolean)
          .join(' · ');
      }),
      rows: computed(() => this.sheetRows()),
    });
  }

  private sheetRows(): BjSheetRow[] {
    const game = this.game();
    const dealer = this.dealer();
    const rows: BjSheetRow[] = [
      {
        key: 'dealer',
        name: 'Dealer',
        you: false,
        initial: null,
        color: 'var(--tile-gray)',
        turn: false,
        status: dealer
          ? game.dealer_hole
            ? `zeigt ${dealer.up}`
            : `hat ${dealer.value}`
          : 'mischt',
        tone: 'muted',
        cards: dealer?.cards.map((item) => item.card) ?? [],
        value: dealer?.value ?? null,
        valueTone: dealer?.tone ?? 'value',
        stake: null,
        stakeTone: 'muted',
        dot: null,
        balance: null,
      },
    ];
    for (const player of game.players) {
      const status = seatStatus(player, game, this.settling());
      const hands = player.hands;
      const stake = stakeOf(player);
      const settled = game.phase === 'betting' && !player.bet && hands.length && !this.settling();
      const delta = roundDelta(hands);
      rows.push({
        key: player.user_id,
        name: player.name,
        you: player.user_id === this.userId(),
        initial: player.name.trim().charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
        turn: this.playing() && game.turn_seat === player.seat,
        status: status.long,
        tone: status.tone,
        cards: player.bet ? [] : hands.flatMap((hand) => hand.cards),
        value:
          player.bet || !hands.length ? null : hands.map((h) => valueLabel(h.cards)).join(' · '),
        valueTone: status.tone === 'bust' || status.tone === 'bj' ? status.tone : 'value',
        stake: stake
          ? settled
            ? `${formatMoney(stake)} · ${formatDelta(delta)}`
            : formatMoney(stake)
          : 'kein Einsatz',
        stakeTone: settled ? (delta > 0 ? 'win' : delta < 0 ? 'lose' : 'muted') : 'muted',
        dot: stake ? chipColor(stake) : null,
        balance: `Guthaben ${formatMoney(player.balance)}`,
      });
    }
    return rows;
  }

  private find(selector: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(selector);
  }

  // Zeitleiste aus last_events: Austeilen in echter Reihenfolge, gezogene Karten aus dem
  // Schuh, Aufdecken, Dealerkarten mit Pause, zuletzt die Chips. settling hält bis dahin
  // Dealerwert, Ergebnisse und Gewinne zurück.
  private animate(game: BjGame, settles: boolean): void {
    const shoe = this.find('.shoe');
    const mySeat = this.me()?.seat;
    const playerHand = (seat?: number, hand?: number) =>
      game.players.find((p) => p.seat === seat)?.hands.find((h) => h.hand_no === hand);
    let t = 0;
    const fly = (key: string, source: Element | null = shoe, flip = true) => {
      const card = this.find(`[data-card="${key}"]`);
      if (card && source && typeof card.animate === 'function') {
        void flyFrom(card, source, { flip, delay: t, duration: FLY_MS, hidden: true });
      }
    };
    const later = (ms: number, run: () => void) => this.timers.push(setTimeout(run, ms));
    const chips: { from: DOMRect; to: DOMRect; delay: number; value: number }[] = [];

    for (const event of game.last_events) {
      switch (event.t) {
        case 'bet': {
          // Mitspieler: Chip vom Schild auf den Platz
          const seat = this.find(`[data-seat="${event.seat}"]`);
          const token = this.find(
            `[data-seat="${event.seat}"] .token, [data-seat="${event.seat}"] .tag`,
          );
          if (event.seat !== mySeat && seat && token) {
            chips.push({
              from: chipRect(seat, 30),
              to: chipRect(token, 16),
              delay: t,
              value: chipStack(event.n ?? BET_MIN).at(-1)?.value ?? BET_MIN,
            });
          }
          break;
        }
        case 'deal': {
          const seats = game.players
            .filter((player) => player.hands.length)
            .map((player) => player.seat);
          const order = [
            ...seats.map((seat) => `s${seat}:0:0`),
            'd:0',
            ...seats.map((seat) => `s${seat}:0:1`),
          ];
          for (const key of order) {
            fly(key);
            t += DEAL_STAGGER_MS;
          }
          fly('d:1', shoe, false);
          t += FLY_MS;
          // Blackjack: einmal golden pulsieren
          for (const seat of seats) {
            if (playerHand(seat, 0)?.state === 'blackjack')
              this.pulse(`[data-hand="s${seat}:0"]`, t);
          }
          break;
        }
        case 'hit':
        case 'double': {
          const hand = playerHand(event.seat, event.hand);
          const index = hand?.cards.lastIndexOf(event.card ?? '') ?? -1;
          fly(`s${event.seat}:${event.hand}:${index}`);
          t += FLY_MS;
          if ((event.n ?? 0) > 21) this.shake(`[data-hand="s${event.seat}:${event.hand}"]`, t);
          break;
        }
        case 'split':
          fly(`s${event.seat}:1:0`, this.find(`[data-card="s${event.seat}:0:0"]`), false);
          t += FLY_MS;
          fly(`s${event.seat}:0:1`);
          t += DEAL_STAGGER_MS;
          fly(`s${event.seat}:1:1`);
          t += FLY_MS;
          break;
        case 'reveal': {
          // Rücken dreht weg, dann die Vorderseite herein
          const at = t;
          later(at, () => {
            const card = this.find('[data-card="d:1"]');
            const turn = card?.animate?.([{ transform: 'none' }, { transform: 'rotateY(90deg)' }], {
              duration: FLIP_MS / 2,
              easing: 'ease-in',
            });
            const show = () => {
              this.concealHole.set(false);
              card?.animate?.([{ transform: 'rotateY(90deg)' }, { transform: 'none' }], {
                duration: FLIP_MS / 2,
                easing: 'ease-out',
              });
            };
            if (turn) turn.finished.then(show, show);
            else show();
          });
          t += FLIP_MS + DEALER_STEP_MS / 2;
          break;
        }
        case 'dealer':
          for (let i = 2; i < game.dealer_cards.length; i++) {
            fly(`d:${i}`);
            t += DEALER_STEP_MS;
          }
          break;
        case 'result': {
          const own = event.seat === mySeat;
          // Eigene Hand: Einsatzfeld (geteilt mit Mitspielern nur der Betrag), sonst das Schild
          const hand = `[data-hand="s${event.seat}:${event.hand}"]`;
          const spot = own
            ? [this.find(`${hand} .bet-spot`), this.find(`${hand} .stake`)].find(
                (element) => !!element?.getBoundingClientRect().width,
              )
            : this.find(`[data-seat="${event.seat}"]`);
          const dealer = this.find('.dealer-cards');
          const target = own ? this.find('.balance') : spot;
          if (!spot || !dealer || !target || event.k === 'push') break;
          const value = chipStack(Math.abs(event.n ?? 0) || BET_MIN).at(-1)?.value ?? BET_MIN;
          if (event.k === 'lose') {
            chips.push({ from: chipRect(spot, 40), to: chipRect(dealer, 40), delay: t, value });
          } else {
            chips.push({ from: chipRect(dealer, 40), to: chipRect(spot, 40), delay: t, value });
            if (own) {
              chips.push({
                from: chipRect(spot, 40),
                to: chipRect(target, 28),
                delay: t + CHIP_MS,
                value,
              });
            }
          }
          break;
        }
      }
    }

    if (chips.length) {
      this.flights.launch(chips, CHIP_MS, true);
      t = Math.max(t, ...chips.map((chip) => chip.delay + CHIP_MS));
    }
    if (game.last_events.some((event) => event.t === 'deal')) {
      later(t, () => this.dealing.set(false));
    }
    if (settles) {
      later(t, () => {
        this.settling.set(false);
        this.concealHole.set(false);
        this.showResult();
      });
    }
  }

  // Ergebnis-Banner kurz zeigen (allein bleibt es bis zum nächsten Einsatz)
  private showResult(): void {
    this.freshResult.set(true);
    this.timers.push(setTimeout(() => this.freshResult.set(false), BANNER_MS));
  }

  private shake(selector: string, delay: number): void {
    this.find(selector)?.animate?.(
      [
        { translate: '0' },
        { translate: '-6px' },
        { translate: '6px' },
        { translate: '-4px' },
        { translate: '0' },
      ],
      { duration: 300, delay },
    );
  }

  private pulse(selector: string, delay: number): void {
    this.find(selector)?.animate?.(
      [
        { scale: '1', filter: 'none' },
        { scale: '1.06', filter: 'drop-shadow(0 0 14px var(--table-gold))', offset: 0.4 },
        { scale: '1', filter: 'none' },
      ],
      { duration: 600, delay, easing: 'ease-out' },
    );
  }
}

// Quadrat in Chipgröße mittig auf einem Element (Start und Ziel fliegender Chips)
function chipRect(element: Element, size: number): DOMRect {
  const rect = element.getBoundingClientRect();
  return new DOMRect(
    rect.x + (rect.width - size) / 2,
    rect.y + (rect.height - size) / 2,
    size,
    size,
  );
}
