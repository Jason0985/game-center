import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { reducedMotion } from '../table/table-motion';
import {
  ARC_TABLES,
  AVATAR_COLORS,
  formatClock,
  injectTableLayout,
  seatsAfter,
  seatSpots,
  sizeClass,
} from '../table/table.model';
import { TableTop } from '../table/table-top';
import { Nimm6CardView } from './nimm6-card';
import { Nimm6Seat } from './nimm6-seat';
import {
  BULL_PATH,
  bullsLabel,
  bullsOf,
  N6Game,
  N6Step,
  placementOf,
  replaySteps,
  REVEAL_MS,
  rowBulls,
  stepMs,
} from './nimm6.model';

// Karte in einer Reihe: liegt (card), kommt gerade dazu (new), wird gerade genommen (gone)
interface RowCard {
  card: number;
  state: 'card' | 'new' | 'gone';
}

// Platz rechts der Karten: leer, Ziel der gewählten Karte (ghost), 6. Platz
interface RowSlot {
  mark: string;
  kind: 'empty' | 'six' | 'ghost' | 'ghost-six';
}

// Wo die Reihen auf der Platte liegen (Oberkante, Prozent der Höhe)
const ROWS_TOP: Record<'hoch' | 'quer' | 'laptop', number> = { hoch: 37, quer: 19, laptop: 15 };

// Spieltisch: vier Reihen in der Mitte, rundherum die Mitspieler (Handy: oben in einer
// Zeile), darunter die eigene Hand. Karte antippen wählt, „Karte legen“ legt sie verdeckt.
// Nach dem Aufdecken wird das Anlegen aus last_events Schritt für Schritt nachgespielt
// (replaySteps); bei zu kleiner Karte werden die Reihen zu Buttons.
@Component({
  selector: 'app-nimm6-board',
  imports: [NgTemplateOutlet, TableTop, Nimm6CardView, Nimm6Seat],
  templateUrl: './nimm6-board.html',
  styleUrls: ['./nimm6-board.scss', './nimm6-board-own.scss'],
  host: {
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'sizeClass()',
    '[class.live]': 'live()',
  },
})
export class Nimm6Board {
  readonly game = input.required<N6Game>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  // Restzeit fürs Wählen bzw. die Reihenwahl; null = keine Uhr
  readonly secondsLeft = input<number | null>(null);

  readonly choose = output<number>();
  readonly takeRow = output<number>();

  readonly layout = injectTableLayout();
  readonly table = computed(() => ARC_TABLES[this.layout()]);
  readonly sizeClass = computed(() => sizeClass(this.game().seat_count));
  readonly rowsTop = computed(() => {
    const layout = this.layout();
    return layout === 'phone' ? 0 : ROWS_TOP[layout];
  });
  readonly live = signal(false);
  readonly bull = BULL_PATH;
  readonly clock = computed(() => {
    const left = this.secondsLeft();
    return left === null ? null : formatClock(left);
  });

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  readonly others = computed(() => {
    const { players, seat_count: seats } = this.game();
    return seatsAfter(players, this.me()?.seat ?? -1, seats);
  });
  readonly active = computed(() => this.game().players.filter((p) => p.state === 'active'));

  // ---- Anlegen nachspielen --------------------------------------------------------------

  // Was gerade nachgespielt wird (fest pro Aktion: wählt währenddessen schon jemand die
  // nächste Karte, ändern sich nur die last_events)
  readonly replay = signal<{ before: number[][]; steps: N6Step[] }>({ before: [], steps: [] });
  // -1: aufgedeckte Karten zeigen; k: Schritt k läuft; steps.length: fertig
  readonly cursor = signal(Number.MAX_SAFE_INTEGER);
  readonly animating = computed(() => this.cursor() < this.replay().steps.length);
  readonly step = computed((): N6Step | null => {
    const cursor = this.cursor();
    return this.animating() && cursor >= 0 ? this.replay().steps[cursor] : null;
  });
  private timers: ReturnType<typeof setTimeout>[] = [];

  // Reihen wie gerade zu sehen: während des Nachspielens der Stand vor der Aktion plus die
  // Schritte bis zum laufenden (dessen Karte kommt gerade dazu bzw. nimmt die Reihe)
  readonly shownRows = computed((): RowCard[][] => {
    const game = this.game();
    if (!this.animating()) return game.card_rows.map((row) => row.map(plain));
    const { before, steps } = this.replay();
    const rows = before.map((row) => [...row]);
    const cursor = this.cursor();
    for (let i = 0; i < cursor; i++) {
      const step = steps[i];
      rows[step.row] = step.kind === 'place' ? [...rows[step.row], step.card] : [step.card];
    }
    const view = rows.map((row) => row.map(plain));
    const current = this.step();
    if (current) {
      view[current.row] =
        current.kind === 'place'
          ? [...view[current.row], { card: current.card, state: 'new' }]
          : [
              ...current.taken.map((card): RowCard => ({ card, state: 'gone' })),
              { card: current.card, state: 'new' },
            ];
    }
    return view;
  });

  // Hornochsen je Sitz wie gerade zu sehen (kommende Reihen noch nicht gezählt)
  readonly shownScores = computed(() => {
    const scores = new Map(this.game().players.map((p) => [p.seat, p.score]));
    if (this.animating()) {
      this.replay().steps.forEach((step, i) => {
        if (i >= this.cursor() && step.kind !== 'place') {
          scores.set(step.seat, (scores.get(step.seat) ?? 0) - step.bulls);
        }
      });
    }
    return scores;
  });

  // Aufgedeckte Karten, aufsteigend, mit Stand: done (liegt), now (wird gelegt), next
  readonly strip = computed(() => {
    const game = this.game();
    const showing = this.animating() || (game.phase === 'take' && game.status === 'playing');
    if (!showing || !game.revealed.length) return null;
    const steps = this.replay().steps.length;
    const cursor = this.cursor();
    const start = this.animating() ? game.resolve_at - steps : game.resolve_at;
    const done = this.animating() ? start + Math.max(0, cursor) : game.resolve_at;
    const nowIndex = this.animating() ? (cursor >= 0 ? done : -1) : game.resolve_at;
    return game.revealed.map((played, i) => {
      const player = game.players.find((p) => p.seat === played.s);
      return {
        card: played.c,
        seat: played.s,
        name: played.s === this.me()?.seat ? 'Du' : (player?.name ?? ''),
        initial: (player?.name.trim().charAt(0) || '?').toUpperCase(),
        color: AVATAR_COLORS[played.s % AVATAR_COLORS.length],
        mine: played.s === this.me()?.seat,
        state: i < done && i !== nowIndex ? 'done' : i === nowIndex ? 'now' : 'next',
      };
    });
  });

  // ---- Wählen ---------------------------------------------------------------------------

  readonly choosing = computed(() => {
    const game = this.game();
    return (
      game.status === 'playing' &&
      game.phase === 'choose' &&
      this.me()?.state === 'active' &&
      !this.animating()
    );
  });
  readonly chosen = computed(() => this.game().chosen);
  // Angetippte Karte; gilt nur für den angezeigten Zug
  readonly selected = linkedSignal<string | null, number | null>({
    source: () => this.game().waiting_since,
    computation: () => null,
  });
  readonly picked = computed(() => this.chosen() ?? this.selected());
  // Wohin die angetippte Karte käme (Hinweis und Geisterplatz in der Reihe)
  readonly target = computed(() => {
    const card = this.picked();
    if (card === null || !this.choosing()) return null;
    const placement = placementOf(this.game().card_rows, card);
    return { card, ...placement };
  });
  readonly readyCount = computed(() => this.active().filter((p) => p.ready).length);

  readonly hand = computed(() => {
    const cards = this.game().hand;
    const picked = this.picked();
    const waiting = this.chosen() !== null;
    return cards.map((card, i) => ({
      card,
      on: card === picked,
      z: card === picked ? 20 : i,
      label: `${card}, ${bullsLabel(bullsOf(card))}${waiting && card === picked ? ', gelegt' : ''}`,
    }));
  });

  // ---- Reihe wählen ---------------------------------------------------------------------

  readonly takeMine = computed(() => {
    const game = this.game();
    return (
      game.status === 'playing' &&
      game.phase === 'take' &&
      game.take_seat === this.me()?.seat &&
      !this.animating()
    );
  });
  readonly takeCard = computed(() => {
    const game = this.game();
    return game.phase === 'take' ? (game.revealed[game.resolve_at]?.c ?? null) : null;
  });
  private readonly cheapest = computed(() => {
    const rows = this.game().card_rows;
    let best = 0;
    rows.forEach((row, i) => {
      if (rowBulls(row) < rowBulls(rows[best])) best = i;
    });
    return best;
  });
  readonly takePick = linkedSignal<string | null, number>({
    source: () => this.game().waiting_since,
    computation: () => this.cheapest(),
  });
  readonly takeSummary = computed(() => {
    const row = this.game().card_rows[this.takePick()] ?? [];
    return {
      row: this.takePick() + 1,
      count: row.length,
      bulls: rowBulls(row),
      cheapest: rowBulls(row) === rowBulls(this.game().card_rows[this.cheapest()] ?? []),
    };
  });

  // ---- Reihen für die Anzeige -----------------------------------------------------------

  readonly rows = computed(() => {
    const shown = this.shownRows();
    const target = this.target();
    const step = this.step();
    const takeMine = this.takeMine();
    const takePick = this.takePick();
    return shown.map((cards, i) => {
      const sum = cards.filter((c) => c.state !== 'new').reduce((s, c) => s + bullsOf(c.card), 0);
      const slots: RowSlot[] = [];
      for (let k = cards.length; k < 6; k++) {
        const ghost = target !== null && target.row === i && k === cards.length;
        slots.push({
          kind: ghost ? (k === 5 ? 'ghost-six' : 'ghost') : k === 5 ? 'six' : 'empty',
          mark: ghost ? String(target.card) : k === 5 ? '6' : '',
        });
      }
      let tone: 'target' | 'sixth' | 'take' | 'pick' | 'hot' | null = null;
      if (step && step.row === i) tone = step.kind === 'place' ? 'target' : 'hot';
      else if (takeMine) tone = takePick === i ? 'pick' : 'take';
      else if (target?.row === null) tone = 'take';
      else if (target?.row === i) tone = target.sixth ? 'sixth' : 'target';
      return {
        index: i,
        cards,
        slots,
        sum,
        tone,
        label: `Reihe ${i + 1} nehmen, ${cards.length} Karten, ${bullsLabel(sum)}`,
        text: `Reihe ${i + 1}: ${cards.map((c) => c.card).join(', ')}, ${bullsLabel(sum)}`,
      };
    });
  });

  // ---- Plätze ---------------------------------------------------------------------------

  readonly seats = computed(() => {
    const game = this.game();
    const spots = seatSpots(this.layout(), this.others().length);
    const table = this.table();
    const scores = this.shownScores();
    const step = this.step();
    const waiting = game.status === 'playing' && game.phase === 'choose' && !this.animating();
    return this.others().map((player, i) => ({
      player,
      x: ((spots[i]?.x ?? 0) / table.w) * 100,
      y: ((spots[i]?.y ?? 0) / table.h) * 100,
      score: scores.get(player.seat) ?? player.score,
      status: waiting && player.state === 'active' ? (player.ready ? 'ready' : 'choosing') : null,
      turn: game.phase === 'take' && game.take_seat === player.seat && !this.animating(),
      hit: step && step.kind !== 'place' && step.seat === player.seat ? step.bulls : null,
    }));
  });
  readonly myScore = computed(() => {
    const me = this.me();
    return me ? (this.shownScores().get(me.seat) ?? me.score) : 0;
  });
  readonly myHit = computed(() => {
    const step = this.step();
    return step && step.kind !== 'place' && step.seat === this.me()?.seat ? step.bulls : null;
  });

  // ---- Hinweis --------------------------------------------------------------------------

  // Was gerade passiert bzw. zu tun ist. tone: Farbe der Zeile
  readonly status = computed(
    (): {
      icon: string;
      text: string;
      tone: 'muted' | 'warn' | 'danger' | 'accent';
    } | null => {
      const game = this.game();
      const me = this.me();
      const nameOf = (seat: number | null | undefined) =>
        seat === me?.seat ? 'Du' : (game.players.find((p) => p.seat === seat)?.name ?? 'Jemand');
      const step = this.step();
      if (this.animating()) {
        if (!step)
          return { icon: 'visibility', text: 'Aufgedeckt – kleinste Karte zuerst', tone: 'accent' };
        const who = nameOf(step.seat);
        const du = step.seat === me?.seat;
        if (step.kind === 'place') {
          return {
            icon: 'south',
            text: `${who} ${du ? 'legst' : 'legt'} ${step.card} an Reihe ${step.row + 1}`,
            tone: 'accent',
          };
        }
        return null;
      }
      if (game.status !== 'playing') return null;
      if (game.phase === 'take') {
        if (this.takeMine()) return null;
        return {
          icon: 'touch_app',
          text: `${nameOf(game.take_seat)} wählt eine Reihe für die ${this.takeCard() ?? ''}`,
          tone: 'warn',
        };
      }
      if (game.phase !== 'choose' || me?.state !== 'active') return null;
      const chosen = this.chosen();
      if (chosen !== null) {
        const open = this.active()
          .filter((p) => !p.ready)
          .map((p) => p.name);
        return {
          icon: 'hourglass_top',
          text: open.length
            ? `Deine ${chosen} liegt verdeckt – warte auf ${joinNames(open)}`
            : `Deine ${chosen} liegt verdeckt`,
          tone: 'muted',
        };
      }
      const target = this.target();
      if (!target)
        return {
          icon: 'style',
          text: 'Wähle eine Karte – alle legen gleichzeitig verdeckt',
          tone: 'muted',
        };
      if (target.row === null) {
        return {
          icon: 'warning',
          text: `${target.card} ist kleiner als jede Reihe – du nimmst danach eine Reihe deiner Wahl`,
          tone: 'warn',
        };
      }
      if (target.sixth) {
        const bulls = rowBulls(game.card_rows[target.row]);
        return {
          icon: 'error',
          text: `${target.card} wäre die 6. Karte in Reihe ${target.row + 1} – du nimmst ${bullsLabel(bulls)}`,
          tone: 'danger',
        };
      }
      return {
        icon: 'south',
        text: `${target.card} kommt an Reihe ${target.row + 1} (nach ${target.after})`,
        tone: 'muted',
      };
    },
  );

  // 6. Karte bzw. Reihe genommen: Kasten mit den genommenen Karten (beim Nachspielen)
  readonly taken = computed(() => {
    const step = this.step();
    if (!step || step.kind === 'place') return null;
    const me = this.me();
    const player = this.game().players.find((p) => p.seat === step.seat);
    const who = step.seat === me?.seat ? 'Du' : (player?.name ?? 'Jemand');
    const score = this.shownScores().get(step.seat) ?? 0;
    return {
      six: step.kind === 'six',
      title: step.kind === 'six' ? '6. Karte!' : 'Zu klein!',
      text: `${who} ${step.seat === me?.seat ? 'nimmst' : 'nimmt'} Reihe ${step.row + 1}`,
      sub: `Die ${step.card} beginnt die Reihe neu.`,
      bulls: step.bulls,
      change: `${who}: ${score} → ${score + step.bulls}`,
      pile: step.taken.slice(-5).map((card, i) => ({ card, x: i * 12, y: 4 - i, deg: -8 + i * 4 })),
    };
  });

  // Für Screenreader
  readonly srStatus = computed(() => {
    const taken = this.taken();
    if (taken) return `${taken.title} ${taken.text}, ${bullsLabel(taken.bulls)}.`;
    if (this.takeMine()) return `Deine ${this.takeCard()} passt nirgends. Wähle eine Reihe.`;
    return this.status()?.text ?? '';
  });

  constructor() {
    afterNextRender(() => this.live.set(true));
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));

    // Neue Aktion mit Anlegen: Schritt für Schritt nachspielen (nicht beim ersten Laden)
    let eventsKey: string | null = null;
    effect(() => {
      const game = this.game();
      const key = `${game.id}|${game.round_no}|${JSON.stringify(game.last_events)}`;
      const first = eventsKey === null;
      if (key === eventsKey) return;
      eventsKey = key;
      const replay = replaySteps(game);
      if (!first && !replay.steps.length && untracked(this.animating)) return;
      untracked(() => {
        this.replay.set(replay);
        this.play(first || reducedMotion());
      });
    });
  }

  private play(skip: boolean): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const { steps } = untracked(this.replay);
    if (skip || !steps.length) {
      this.cursor.set(Number.MAX_SAFE_INTEGER);
      return;
    }
    const revealed = untracked(this.game).last_events.some((event) => event.t === 'reveal');
    let t = 0;
    this.cursor.set(revealed ? -1 : 0);
    if (revealed) t += REVEAL_MS;
    steps.forEach((step, i) => {
      if (i > 0 || revealed) this.timers.push(setTimeout(() => this.cursor.set(i), t));
      t += stepMs(step);
    });
    this.timers.push(setTimeout(() => this.cursor.set(Number.MAX_SAFE_INTEGER), t));
  }

  tapCard(card: number): void {
    if (this.busy() || !this.choosing() || this.chosen() !== null) return;
    this.selected.set(this.selected() === card ? null : card);
  }

  lay(): void {
    const card = this.selected();
    if (card !== null && !this.busy() && this.choosing() && this.chosen() === null) {
      this.choose.emit(card);
    }
  }

  pickRow(row: number): void {
    if (this.takeMine()) this.takePick.set(row);
  }

  confirmTake(): void {
    if (this.takeMine() && !this.busy()) this.takeRow.emit(this.takePick());
  }
}

const plain = (card: number): RowCard => ({ card, state: 'card' });

function joinNames(names: string[]): string {
  return names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
}
