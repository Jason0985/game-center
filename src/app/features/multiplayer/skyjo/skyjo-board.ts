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
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { flyFrom, reducedMotion } from '../table/table-motion';
import {
  arcSpots,
  AVATAR_COLORS,
  injectTableLayout,
  seatsAfter,
  sizeClass,
  TableGeometry,
  TableLayout,
} from '../table/table.model';
import { TableTop } from '../table/table-top';
import { SkyjoCardView } from './skyjo-card';
import { SkCellView, SkSeatTag, SkyjoSeat } from './skyjo-seat';
import {
  cardText,
  columnOf,
  formatPoints,
  isHidden,
  openSum,
  SKYJO_CLEAR_MS,
  SKYJO_FLY_MS,
  SkEvent,
  SkGame,
  SkPlayer,
  SkSource,
} from './skyjo.model';

// Tischplatten nach den Artboards (Design-Pixel) und die Ellipse der Plätze darauf.
// Laptop: ganzes Oval, unten Lücke für das eigene Schild.
const TABLES: Record<Exclude<TableLayout, 'phone'>, TableGeometry & { gap: number | null }> = {
  hoch: { w: 788, h: 716, cx: 394, cy: 626, a: 330, b: 584, from: 176, to: 4, gap: null },
  quer: { w: 1140, h: 440, cx: 570, cy: 220, a: 488, b: 220, from: 212, to: -32, gap: null },
  laptop: { w: 1240, h: 500, cx: 620, cy: 250, a: 570, b: 250, from: 270, to: -90, gap: 0.28 },
};

// Spalte, die gerade abgeräumt wird: leuchtet noch kurz, dann fliegt sie auf die Ablage
interface Clearing {
  seat: number;
  col: number;
  card: number;
  n: number;
}

// Spieltisch: oben die Mitspieler mit ihren Rastern (Handy: in einer Zeile, sonst um die
// Platte), in der Mitte Stapel, gezogene Karte und Ablage, unten das eigene Raster.
// Wer dran ist, tippt Stapel bzw. Ablage, dann eine eigene Karte zum Tauschen – oder wirft
// die Stapelkarte per Antippen der Ablage ab und deckt eine eigene auf. Karten fliegen dabei von Stapel zu Raster
// zu Ablage (aus last_events), drei gleiche in einer Spalte leuchten kurz und fliegen auf
// die Ablage.
@Component({
  selector: 'app-skyjo-board',
  imports: [NgTemplateOutlet, TableTop, SkyjoCardView, SkyjoSeat],
  templateUrl: './skyjo-board.html',
  styleUrls: ['./skyjo-board.scss', './skyjo-board-own.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'size()',
  },
})
export class SkyjoBoard {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly game = input.required<SkGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);

  readonly flip = output<number>();
  readonly draw = output<SkSource>();
  readonly swap = output<number>();
  readonly discardDrawn = output<void>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => {
    const layout = this.layout();
    return layout === 'phone' ? null : TABLES[layout];
  });
  readonly size = computed(() => sizeClass(this.game().seat_count));
  readonly formatPoints = formatPoints;
  readonly cardText = cardText;

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  private readonly mySeat = computed(() => this.me()?.seat ?? -1);
  readonly others = computed(() => {
    const { players, seat_count: seats } = this.game();
    return seatsAfter(players, this.mySeat(), seats);
  });
  private readonly playing = computed(() => this.game().status === 'playing');
  readonly myTurn = computed(() => {
    const game = this.game();
    return (
      this.playing() &&
      game.phase === 'turn' &&
      this.me()?.state === 'active' &&
      game.turn_seat === this.mySeat()
    );
  });
  // Rundenstart: ich decke noch auf
  readonly revealing = computed(() => {
    const me = this.me();
    return (
      this.playing() && this.game().phase === 'reveal' && me?.state === 'active' && me.flips < 2
    );
  });
  readonly step = computed(() => (this.myTurn() ? this.game().step : null));

  // ---- Spalte abräumen (Animation) ------------------------------------------------------

  readonly clearing = signal<Clearing | null>(null);

  // Raster wie gerade zu sehen (die abgeräumte Spalte leuchtet noch)
  private cellsOf(player: SkPlayer): SkCellView[] {
    const clearing = this.clearing();
    return player.cards.map((card, cell) => {
      const col = columnOf(cell);
      const glow = clearing?.seat === player.seat && clearing.col === col;
      return {
        cell,
        card: glow ? clearing.card : card,
        gone: player.cleared[col] && !glow,
        glow,
      };
    });
  }

  // Oberste Ablagekarte; beim Abräumen erst, wenn die Spalte angekommen ist
  readonly discardTop = computed(() => {
    const discard = this.game().discard;
    const shown = this.clearing() ? discard.slice(0, -3) : discard;
    return shown.at(-1) ?? null;
  });

  // ---- Mitspieler -----------------------------------------------------------------------

  readonly seats = computed(() => {
    const game = this.game();
    const table = this.table();
    const spots = table ? arcSpots(table, this.others().length, table.gap) : [];
    return this.others().map((player, i) => ({
      player,
      cells: this.cellsOf(player),
      sum: openSum(player.cards),
      status: this.statusOf(player),
      turn: this.playing() && game.phase === 'turn' && game.turn_seat === player.seat,
      tag: this.tagOf(player),
      x: table ? ((spots[i]?.x ?? 0) / table.w) * 100 : null,
      y: table ? ((spots[i]?.y ?? 0) / table.h) * 100 : null,
    }));
  });

  private statusOf(player: SkPlayer): 'ready' | 'waiting' | null {
    if (!this.playing() || this.game().phase !== 'reveal' || player.state !== 'active') return null;
    return player.flips >= 2 ? 'ready' : 'waiting';
  }

  // Letzte Runde: wer alles offen hat, wer schon fertig ist, wer noch dran kommt
  private tagOf(player: SkPlayer): SkSeatTag | null {
    const game = this.game();
    if (!this.playing() || game.phase !== 'turn' || game.ender_seat === null) return null;
    if (player.state !== 'active') return null;
    if (player.seat === game.ender_seat) return { text: 'alles offen', tone: 'gold' };
    if (player.seat === game.turn_seat) return null;
    return game.last_turns.includes(player.seat)
      ? { text: 'noch ein Zug', tone: 'muted' }
      : { text: 'fertig', tone: 'done' };
  }

  // ---- Eigenes Raster -------------------------------------------------------------------

  readonly mySum = computed(() => openSum(this.me()?.cards ?? []));
  readonly myCells = computed(() => {
    const me = this.me();
    if (!me) return [];
    const step = this.step();
    const flipping = step === 'flip' || this.revealing();
    return this.cellsOf(me).map((view) => {
      const pick =
        !view.gone && !view.glow && (step === 'place' || (flipping && isHidden(me, view.cell)));
      return {
        ...view,
        pick,
        // Beim Aufdecken sind die offenen Karten zurückgenommen
        dim: flipping && !pick && !view.gone,
        label: view.gone
          ? `Spalte ${columnOf(view.cell) + 1} abgeräumt`
          : view.card === null
            ? step === 'place'
              ? `Verdeckte Karte tauschen`
              : pick
                ? 'Verdeckte Karte aufdecken'
                : 'Verdeckte Karte'
            : step === 'place'
              ? `Deine ${cardText(view.card)} tauschen`
              : `Deine Karte ${cardText(view.card)}`,
      };
    });
  });
  // Rundenstart: so viele schon aufgedeckt (Punkte im Hinweis)
  readonly revealDots = computed(() => {
    const flips = Math.min(2, this.me()?.flips ?? 0);
    return [flips > 0, flips > 1];
  });

  // ---- Stapel ---------------------------------------------------------------------------

  readonly canDraw = computed(() => this.step() === 'draw' && !this.busy());
  readonly canTakeDiscard = computed(() => this.canDraw() && this.discardTop() !== null);
  readonly canThrow = computed(
    () => this.step() === 'place' && this.game().drawn_from === 'pile' && !this.busy(),
  );
  readonly drawnLabel = computed(() => {
    const game = this.game();
    if (game.drawn === null) return 'Hand';
    if (this.myTurn()) return 'Gezogen';
    const name = game.players.find((p) => p.seat === game.turn_seat)?.name;
    return name ? `${name} zieht` : 'Gezogen';
  });

  // ---- Hinweise -------------------------------------------------------------------------

  private nameOf(seat: number | null | undefined): string {
    if (seat === this.mySeat()) return 'Du';
    return this.game().players.find((player) => player.seat === seat)?.name ?? 'Jemand';
  }

  // Letzte Runde: wer alles aufgedeckt hat
  readonly lastRound = computed(() => {
    const game = this.game();
    if (!this.playing() || game.phase !== 'turn' || game.ender_seat === null) return null;
    const mine = game.ender_seat === this.mySeat();
    return {
      text: mine
        ? 'Du hast alles aufgedeckt – jeder andere hat noch einen Zug.'
        : `${this.nameOf(game.ender_seat)} hat alles aufgedeckt – jeder hat noch einen Zug.`,
    };
  });

  // Gerade abgeräumte Spalte, für den Kasten (eigene) bzw. die Statuszeile (andere)
  readonly cleared = computed(() => {
    const clearing = this.clearing();
    if (!clearing) return null;
    const mine = clearing.seat === this.mySeat();
    const card = cardText(clearing.card);
    return {
      mine,
      title: mine ? 'Spalte abgeräumt!' : `${this.nameOf(clearing.seat)} räumt ab!`,
      text: `Drei ${card}er in Spalte ${clearing.col + 1} fliegen raus.`,
      points: formatPoints(-clearing.n),
    };
  });

  // Was gerade zu tun ist bzw. passiert. tone: Farbe der Zeile
  readonly hint = computed(
    (): { icon: string; text: string; tone: 'accent' | 'warn' | 'muted' } | null => {
      const game = this.game();
      const me = this.me();
      if (!this.playing() || !me) return null;
      if (me.state !== 'active')
        return { icon: 'visibility', text: 'Du schaust zu.', tone: 'muted' };

      if (game.phase === 'reveal') {
        if (me.flips < 2) {
          return {
            icon: 'flip',
            text: me.flips ? 'Decke noch 1 Karte auf' : 'Decke 2 Karten auf',
            tone: 'accent',
          };
        }
        const open = this.game()
          .players.filter((p) => p.state === 'active' && p.flips < 2)
          .map((p) => p.name);
        return {
          icon: 'hourglass_top',
          text: open.length ? `Warte auf ${joinNames(open)}` : 'Gleich geht es los',
          tone: 'muted',
        };
      }
      if (game.phase !== 'turn') return null;

      const final = game.ender_seat !== null;
      const drawn = game.drawn === null ? '' : cardText(game.drawn);
      if (!this.myTurn()) {
        const name = this.nameOf(game.turn_seat);
        const doing =
          game.step === 'place'
            ? ` – hat eine ${drawn} ${game.drawn_from === 'discard' ? 'von der Ablage' : 'gezogen'}`
            : game.step === 'flip'
              ? ' – deckt eine Karte auf'
              : '';
        return { icon: 'hourglass_top', text: `${name} ist dran${doing}`, tone: 'muted' };
      }
      const last = final ? 'Dein letzter Zug: ' : '';
      if (this.step() === 'draw') {
        const top = this.discardTop();
        return {
          icon: 'touch_app',
          text:
            top === null
              ? `${last}Ziehe vom Stapel.`
              : `${last || 'Du bist dran: '}Stapel ziehen oder die ${cardText(top)} von der Ablage nehmen.`,
          tone: 'accent',
        };
      }
      if (this.step() === 'place') {
        const tap = this.layout() === 'laptop' ? 'Klicke' : 'Tippe';
        return {
          icon: 'swap_horiz',
          text:
            game.drawn_from === 'pile'
              ? `${tap} eine Karte zum Tauschen – oder die Ablage, um die ${drawn} abzuwerfen.`
              : `${tap} eine Karte, um sie gegen die ${drawn} zu tauschen.`,
          tone: 'accent',
        };
      }
      return { icon: 'flip', text: 'Decke eine deiner verdeckten Karten auf.', tone: 'warn' };
    },
  );

  // Punkte bisher (iPad, Laptop): wenigste zuerst
  readonly scores = computed(() => {
    const game = this.game();
    return [...game.players]
      .filter((player) => player.state === 'active')
      .sort((a, b) => a.score - b.score || a.seat - b.seat)
      .map((player) => ({
        seat: player.seat,
        name: player.seat === this.mySeat() ? 'Du' : player.name,
        initial: (player.name.trim().charAt(0) || '?').toUpperCase(),
        color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
        total: player.score,
        open: openSum(player.cards),
        bar: Math.min(100, (player.score / game.end_score) * 100),
      }));
  });

  // Für Screenreader
  readonly srStatus = computed(() => {
    const cleared = this.cleared();
    if (cleared) return `${cleared.title} ${cleared.text}`;
    const hint = this.hint()?.text ?? '';
    const last = this.lastRound()?.text;
    return [last, hint].filter(Boolean).join(' ');
  });

  colorOf(seat: number): string {
    return AVATAR_COLORS[seat % AVATAR_COLORS.length];
  }

  initialOf(name: string): string {
    return (name.trim().charAt(0) || '?').toUpperCase();
  }

  // ---- Aktionen -------------------------------------------------------------------------

  pickCell(cell: number): void {
    if (this.busy()) return;
    const view = this.myCells().find((c) => c.cell === cell);
    if (!view?.pick) return;
    if (this.step() === 'place') this.swap.emit(cell);
    else this.flip.emit(cell);
  }

  drawFrom(source: SkSource): void {
    if (source === 'pile' ? this.canDraw() : this.canTakeDiscard()) this.draw.emit(source);
  }

  throwAway(): void {
    if (this.canThrow()) this.discardDrawn.emit();
  }

  // ---- Animation ------------------------------------------------------------------------

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));

    // Neue Aktion: Karten fliegen lassen (nicht beim ersten Laden)
    let eventsKey: string | null = null;
    effect(() => {
      const game = this.game();
      const key = `${game.id}|${game.round_no}|${game.waiting_since}|${JSON.stringify(game.last_events)}`;
      const first = eventsKey === null;
      if (key === eventsKey) return;
      eventsKey = key;
      if (first) return;
      const events = game.last_events;
      untracked(() => this.play(events));
    });
  }

  private play(events: readonly SkEvent[]): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const clear = events.find((event) => event.t === 'clear');
    this.clearing.set(
      clear && !reducedMotion()
        ? {
            seat: clear.seat ?? -1,
            col: clear.col ?? 0,
            card: clear.card ?? 0,
            n: clear.n ?? 0,
          }
        : null,
    );
    if (reducedMotion()) return;

    // Vor dem Rendern merken, wo die gezogene Karte lag (danach ist der Platz leer)
    const drawnSlot = this.rect('.drawn-slot');
    afterNextRender(
      () => {
        for (const event of events) {
          if (event.t === 'draw') {
            this.fly(
              '.drawn-slot app-skyjo-card',
              event.from === 'discard' ? '.discard' : '.deck',
              {
                flip: event.from !== 'discard',
              },
            );
          } else if (event.t === 'swap') {
            const cell = `[data-cell="${event.seat}:${event.cell}"]`;
            this.fly(`${cell} app-skyjo-card`, drawnSlot);
            this.fly('.discard app-skyjo-card', cell);
          } else if (event.t === 'discard') {
            this.fly('.discard app-skyjo-card', drawnSlot);
          }
        }
      },
      { injector: this.injector },
    );

    if (clear) {
      this.timers.push(
        setTimeout(() => {
          this.clearing.set(null);
          afterNextRender(
            () =>
              this.fly(
                '.discard app-skyjo-card',
                `[data-cell="${clear.seat}:${(clear.col ?? 0) + 4}"]`,
              ),
            { injector: this.injector },
          );
        }, SKYJO_CLEAR_MS),
      );
    }
  }

  // Element (bzw. erstes passendes) fliegt von from an seinen Platz
  private fly(
    selector: string,
    from: string | DOMRect | null,
    { flip = false }: { flip?: boolean } = {},
  ): void {
    const card = this.host.nativeElement.querySelector<HTMLElement>(selector);
    const start = typeof from === 'string' ? this.rect(from) : from;
    if (!card || !start || typeof card.animate !== 'function') return;
    void flyFrom(card, start, { flip, duration: SKYJO_FLY_MS });
  }

  private rect(selector: string): DOMRect | null {
    const element = this.host.nativeElement.querySelector<HTMLElement>(selector);
    const rect = element?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect : null;
  }
}

function joinNames(names: string[]): string {
  return names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
}
