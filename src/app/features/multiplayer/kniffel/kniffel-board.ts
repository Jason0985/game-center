import {
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
  viewChildren,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { AVATAR_COLORS } from '../table/table.model';
import { reducedMotion } from '../table/table-motion';
import {
  bonusOf,
  CATEGORIES,
  KNIFFEL_BONUS,
  KNIFFEL_BONUS_AT,
  KNIFFEL_ROLLS,
  KnGame,
  LOWER,
  points,
  rankPlayers,
  UPPER,
  upperSum,
} from './kniffel.model';

// Augen je Wert als Rasterplatz (Zeile / Spalte im 3×3-Raster)
const PIPS: Record<number, string[]> = {
  1: ['2 / 2'],
  2: ['1 / 1', '3 / 3'],
  3: ['1 / 1', '2 / 2', '3 / 3'],
  4: ['1 / 1', '1 / 3', '3 / 1', '3 / 3'],
  5: ['1 / 1', '1 / 3', '2 / 2', '3 / 1', '3 / 3'],
  6: ['1 / 1', '2 / 1', '3 / 1', '1 / 3', '2 / 3', '3 / 3'],
};
const NO_HOLD = [false, false, false, false, false];

// Wurf-Animation (ms und Anteile davon): Würfel in den Becher, Becher schütteln, auf den
// Block werfen, liegen lassen, zurück in die Reihe
const ROLL_MS = 2600;
const INTO_CUP = 0.12;
const THROW = 0.38;
const LANDED = 0.66;
const BACK = 0.84;

interface Point {
  x: number;
  y: number;
}

const centerOf = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});
const shift = (from: Point, to: Point, dy = 0) => `${to.x - from.x}px ${to.y - from.y + dy}px`;
const randomFace = () => 1 + Math.floor(Math.random() * 6);

// Abrechnung am Ende, für alle gleichzeitig und Zeile für Zeile: erst kurz den letzten
// Eintrag sehen, dann wandert jedes Feld oben in die Summe oben, der Bonus springt dazu,
// Summe oben und Bonus gehen ins Gesamt und danach kommt Feld für Feld der untere Teil dazu.
// Jeder Schritt zählt seine Punkte langsam hoch (COUNT_MS) und bleibt dann kurz stehen.
type TallyStep = { kind: 'row'; row: number } | { kind: 'bonus' } | { kind: 'carry' };
const TALLY: TallyStep[] = [
  ...UPPER.map((row) => ({ kind: 'row' as const, row })),
  { kind: 'bonus' },
  { kind: 'carry' },
  ...LOWER.map((row) => ({ kind: 'row' as const, row })),
];
const TALLY_START_MS = 1500;
const ROW_MS = 1300;
const BONUS_MS = 1600;
const CARRY_MS = 1800;
const COUNT_MS = 750;
const TALLY_END_MS = 900;
const stepMs = (step: TallyStep) =>
  step.kind === 'row' ? ROW_MS : step.kind === 'bonus' ? BONUS_MS : CARRY_MS;
// Sanft hochzählen: schnell los, langsam ankommen
const easeOut = (t: number) => 1 - (1 - t) ** 3;

// Spielansicht: oben der Kniffelblock (eine Spalte je Spieler), unten die fünf Würfel mit
// Würfeln/Eintragen. Neue Würfe (roll_seq) sehen alle gleich: Würfel fliegen in den Becher,
// er wird geschüttelt und auf den Block geworfen, dann rutschen sie zurück in die Reihe.
// Der Block zeigt in den freien Feldern, was der liegende Wurf brächte; Streichen (0 Punkte)
// muss man bestätigen. Die Summen bleiben bis zum Spielende verdeckt und werden dann
// für alle nachgezählt.
@Component({
  selector: 'app-kniffel-board',
  templateUrl: './kniffel-board.html',
  styleUrl: './kniffel-board.scss',
})
export class KniffelBoard {
  readonly game = input.required<KnGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  readonly isHost = input(false);

  readonly roll = output<boolean[]>();
  readonly hold = output<boolean[]>();
  readonly score = output<number>();
  readonly backToLobby = output<void>();

  private readonly dialog = inject(MatDialog);

  readonly categories = CATEGORIES;
  readonly lower = LOWER;
  // Zeilen des Blocks: Felder 0–12 und die Summenzeilen
  readonly rows = [...UPPER, 'upper', 'bonus', ...LOWER, 'total'] as const;
  readonly sumRows = {
    upper: { name: 'Summe oben', hint: `Bonus ab ${KNIFFEL_BONUS_AT}` },
    bonus: { name: 'Bonus', hint: `+${KNIFFEL_BONUS}` },
    total: { name: 'Gesamt', hint: '' },
  };
  readonly slots = [0, 1, 2, 3, 4];
  readonly pips = PIPS;

  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheet');
  private readonly cup = viewChild<ElementRef<HTMLElement>>('cup');
  private readonly dice = viewChildren<ElementRef<HTMLElement>>('die');

  private readonly mySeat = computed(
    () => this.game().players.find((player) => player.user_id === this.userId())?.seat ?? null,
  );
  readonly finished = computed(() => this.game().status === 'finished');
  readonly myTurn = computed(
    () => !this.finished() && this.mySeat() !== null && this.game().turn_seat === this.mySeat(),
  );
  readonly activeName = computed(
    () => this.game().players.find((player) => player.seat === this.game().turn_seat)?.name ?? '',
  );
  readonly rollsLeft = computed(() => KNIFFEL_ROLLS - this.game().rolls);

  // Was die Würfel gerade zeigen (beim Rollen wechselnd); leer = in diesem Zug noch nicht
  // gewürfelt. settled: der Wurf, sobald er liegt (daraus die Vorschau im Block)
  readonly faces = signal<number[]>([]);
  readonly settled = signal<number[]>([]);
  readonly rolling = signal(false);

  // Eigene gehaltene Würfel gelten sofort (der Server erfährt es nebenher); neu ab jedem
  // Wurf und Zug. Bei den anderen zeigt der Block, was der Server weiß.
  private readonly rollKey = computed(() => `${this.game().turn_seat}:${this.game().roll_seq}`);
  private readonly myHeld = linkedSignal({
    source: this.rollKey,
    computation: () => [...this.game().held],
  });
  readonly held = computed(() => (this.myTurn() ? this.myHeld() : this.game().held));
  // Angetipptes Feld; zweites Antippen bzw. der Knopf trägt ein
  readonly selected = linkedSignal<string, number | null>({
    source: this.rollKey,
    computation: () => null,
  });

  readonly canRoll = computed(
    () =>
      this.myTurn() &&
      this.rollsLeft() > 0 &&
      !this.rolling() &&
      !this.busy() &&
      !(this.game().rolls > 0 && this.held().every(Boolean)),
  );
  readonly canPick = computed(
    () => this.myTurn() && this.game().rolls > 0 && !this.rolling() && !this.busy(),
  );
  readonly canHold = computed(
    () => this.myTurn() && this.game().rolls > 0 && this.rollsLeft() > 0 && !this.rolling(),
  );

  // Abrechnung am Ende: Index in TALLY (-1 noch verdeckt, TALLY.length fertig) und wie weit
  // der Schritt ist (ms seit seinem Beginn)
  readonly tally = signal(-1);
  private readonly tallyAt = signal(0);
  private readonly elapsed = signal(0);
  readonly revealed = computed(() => this.tally() >= TALLY.length);
  readonly tallyStep = computed<TallyStep | null>(() => TALLY[this.tally()] ?? null);
  // Zeile, deren Punkte gerade dazugezählt werden
  readonly addingRow = computed(() => {
    const step = this.tallyStep();
    return step?.kind === 'row' ? step.row : null;
  });
  readonly tallyText = computed(() => {
    const step = this.tallyStep();
    if (!step) return 'Abrechnung – gleich wird zusammengezählt …';
    if (step.kind === 'bonus') return `Bonus: ab ${KNIFFEL_BONUS_AT} oben gibt es ${KNIFFEL_BONUS}`;
    if (step.kind === 'carry') return 'Summe oben und Bonus ins Gesamt';
    return `${CATEGORIES[step.row].name} kommt dazu`;
  });

  readonly columns = computed(() => {
    const game = this.game();
    const dice = this.settled();
    const index = this.tally();
    const step = TALLY[index];
    const progress = easeOut(Math.min(1, this.elapsed() / COUNT_MS));
    const upperEnd = UPPER.length;
    const carryAt = upperEnd + 1;
    return game.players.map((player) => {
      const turn = !this.finished() && player.seat === game.turn_seat;
      const score = (row: number) => player.scores[row] ?? 0;
      // Summe der Felder aus den Schritten vor index, dazu der laufende Schritt anteilig
      const doneRows = (rows: readonly number[]) =>
        TALLY.slice(0, index).reduce(
          (sum, s) => (s.kind === 'row' && rows.includes(s.row) ? sum + score(s.row) : sum),
          0,
        );
      const current = step?.kind === 'row' ? Math.round(score(step.row) * progress) : 0;
      const upper = upperSum(player.scores);
      const bonus = bonusOf(player.scores);
      const upperShown = index < 0 ? '' : index < upperEnd ? doneRows(UPPER) + current : upper;
      const totalShown =
        index < carryAt
          ? ''
          : index >= TALLY.length
            ? player.total
            : index === carryAt
              ? Math.round((upper + bonus) * progress)
              : upper + bonus + doneRows(LOWER) + current;
      const rising = progress < 1 && (step?.kind === 'row' ? score(step.row) > 0 : true);
      return {
        player,
        turn,
        mine: player.seat === this.mySeat(),
        initial: player.name.trim().charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
        sums: {
          upper: upperShown,
          bonus: index < upperEnd ? '' : bonus || '–',
          total: totalShown,
        },
        // Läuft die Summe gerade noch hoch?
        counting: {
          upper: index < upperEnd && step?.kind === 'row' && rising,
          bonus: false,
          total: index >= carryAt && index < TALLY.length && rising,
        },
        // Was der liegende Wurf in den freien Feldern bringen würde
        preview:
          turn && game.rolls > 0 && dice.length === 5
            ? player.scores.map((score, i) => (score === null ? points(dice, i) : null))
            : null,
      };
    });
  });

  readonly hint = computed(() => {
    const game = this.game();
    if (this.finished()) return 'Abrechnung läuft …';
    if (!this.myTurn()) return `${this.activeName()} ist dran`;
    if (this.rolling()) return 'Die Würfel rollen …';
    if (game.rolls === 0) return 'Du bist dran – würfeln!';
    if (this.rollsLeft() === 0) return 'Trag deinen Wurf in ein freies Feld ein';
    return 'Würfel halten, nochmal würfeln oder eintragen';
  });

  readonly selectedLabel = computed(() => {
    const category = this.selected();
    if (category === null) return null;
    const value = points(this.settled(), category);
    const name = CATEGORIES[category].name;
    return value ? `${name} eintragen · ${value}` : `${name} streichen`;
  });

  readonly winners = computed(() =>
    this.revealed() ? rankPlayers(this.game().players).filter((row) => row.rank === 1) : [],
  );
  readonly winnerText = computed(() => {
    const names = this.winners().map((row) =>
      row.player.seat === this.mySeat() ? 'Du' : row.player.name,
    );
    if (!names.length) return 'Spiel beendet';
    if (names.length > 1) return `${names.join(' und ')} gewinnen!`;
    return names[0] === 'Du' ? 'Du gewinnst!' : `${names[0]} gewinnt!`;
  });

  // Gerade eingetragenes Feld ("Sitz:Feld") leuchtet kurz auf
  readonly fresh = signal<string | null>(null);

  private run = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private tallyTimers: ReturnType<typeof setTimeout>[] = [];
  private frame = 0;

  constructor() {
    let seq: number | null = null;
    effect(() => {
      const game = this.game();
      const previous = seq;
      seq = game.roll_seq;
      untracked(() => {
        // Neuer Zug (keine Würfel) oder erstes Laden: ohne Animation
        if (!game.dice.length || previous === null || reducedMotion()) {
          this.stop();
          this.show(game.dice);
        } else if (previous !== game.roll_seq) {
          void this.animate(game.dice, game.held);
        } else if (!this.rolling()) {
          this.show(game.dice);
        }
      });
    });

    let before: Map<number, (number | null)[]> | null = null;
    effect(() => {
      const players = this.game().players;
      untracked(() => {
        for (const player of players) {
          const cell = player.scores.findIndex(
            (score, i) => score !== null && before && before.get(player.seat)?.[i] === null,
          );
          if (cell >= 0) this.fresh.set(`${player.seat}:${cell}`);
        }
        before = new Map(players.map((player) => [player.seat, player.scores]));
      });
    });

    // Spielende: beim Laden eines beendeten Spiels gleich alles zeigen, live die Abrechnung
    let wasFinished: boolean | null = null;
    effect(() => {
      const finished = this.finished();
      const before = wasFinished;
      wasFinished = finished;
      untracked(() => {
        if (!finished) this.setTally(-1);
        else if (before === false && !reducedMotion()) this.playTally();
        else this.setTally(TALLY.length);
      });
    });

    // Die Zeile, die gerade dazukommt, auf kleinen Bildschirmen ins Bild holen
    effect(() => {
      const row = this.addingRow();
      if (row === null) return;
      untracked(() =>
        this.sheet()
          ?.nativeElement.querySelector(`[data-row="${row}"]`)
          ?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }),
      );
    });

    inject(DestroyRef).onDestroy(() => {
      this.stop();
      this.stopTally();
    });
  }

  private setTally(index: number): void {
    this.stopTally();
    this.tally.set(index);
  }

  private stopTally(): void {
    this.tallyTimers.forEach(clearTimeout);
    this.tallyTimers = [];
    cancelAnimationFrame(this.frame);
  }

  // Zeitleiste der Abrechnung; das Hochzählen innerhalb eines Schritts läuft per Frame
  private playTally(): void {
    this.setTally(-1);
    const at = (ms: number, index: number) =>
      this.tallyTimers.push(
        setTimeout(() => {
          this.tally.set(index);
          this.tallyAt.set(performance.now());
          this.elapsed.set(0);
        }, ms),
      );
    let t = TALLY_START_MS;
    TALLY.forEach((step, index) => {
      at(t, index);
      t += stepMs(step);
    });
    at(t + TALLY_END_MS, TALLY.length);
    const tick = () => {
      this.elapsed.set(performance.now() - this.tallyAt());
      if (!this.revealed()) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  toggle(i: number): void {
    if (!this.canHold()) return;
    const next = this.myHeld().map((held, j) => (j === i ? !held : held));
    this.myHeld.set(next);
    this.hold.emit(next);
  }

  doRoll(): void {
    if (this.canRoll()) this.roll.emit(this.game().rolls ? this.myHeld() : NO_HOLD);
  }

  pick(category: number): void {
    if (!this.canPick()) return;
    if (this.selected() === category) void this.submit(category);
    else this.selected.set(category);
  }

  enter(): void {
    const category = this.selected();
    if (category !== null && this.canPick()) void this.submit(category);
  }

  // Ein Feld mit 0 zu streichen passiert leicht aus Versehen, deshalb erst nachfragen;
  // eingetragen wird nur, wenn danach noch derselbe Wurf liegt
  private async submit(category: number): Promise<void> {
    if (!points(this.settled(), category)) {
      const key = this.rollKey();
      const ref = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
        ConfirmationDialog,
        {
          data: {
            title: `${CATEGORIES[category].name} streichen?`,
            message: 'Der Wurf bringt hier keine Punkte – das Feld wird mit 0 gestrichen.',
            confirmLabel: 'Streichen',
            icon: 'block',
          },
        },
      );
      const confirmed = (await firstValueFrom(ref.afterClosed())) === true;
      if (!confirmed || key !== this.rollKey() || !this.canPick()) return;
    }
    this.score.emit(category);
  }

  dieLabel(i: number): string {
    const face = this.faces()[i];
    if (!face) return `Würfel ${i + 1}`;
    return this.held()[i] ? `Würfel ${face}, gehalten` : `Würfel ${face}`;
  }

  private show(dice: number[]): void {
    this.faces.set(dice);
    this.settled.set(dice);
  }

  private stop(): void {
    this.run++;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    for (const el of [this.cup(), ...this.dice()]) {
      el?.nativeElement.getAnimations?.().forEach((animation) => animation.cancel());
    }
    this.rolling.set(false);
  }

  // Alle am Tisch spielen dieselbe Abfolge; nur die Landeplätze sind je Gerät zufällig
  private async animate(dice: number[], held: boolean[]): Promise<void> {
    this.stop();
    const run = this.run;
    const before = this.faces();
    const moving = this.slots.filter((i) => !held[i] || !before[i]);
    const cup = this.cup()?.nativeElement;
    const sheet = this.sheet()?.nativeElement;
    const els = this.dice().map((ref) => ref.nativeElement);
    if (!cup || !sheet || typeof cup.animate !== 'function' || els.length !== 5) {
      this.show(dice);
      return;
    }

    this.rolling.set(true);
    this.settled.set([]);
    const area = sheet.getBoundingClientRect();
    const rest = centerOf(cup.getBoundingClientRect());
    const thrown = { x: area.left + area.width / 2, y: area.top + area.height * 0.72 };

    const animations = [
      cup.animate(
        [
          { offset: 0, opacity: 0, translate: '0 30px', scale: '0.7', rotate: '0deg' },
          { offset: 0.08, opacity: 1, translate: '0 0', scale: '1', rotate: '0deg' },
          { offset: 0.14, translate: '-6px 0', rotate: '-14deg' },
          { offset: 0.18, translate: '6px -4px', rotate: '14deg' },
          { offset: 0.22, translate: '-6px 0', rotate: '-14deg' },
          { offset: 0.26, translate: '6px -4px', rotate: '14deg' },
          { offset: 0.3, translate: '-4px 0', rotate: '-8deg' },
          { offset: 0.33, opacity: 1, translate: '0 0', rotate: '0deg', easing: 'ease-in' },
          { offset: THROW, opacity: 1, translate: shift(rest, thrown, 40), rotate: '150deg' },
          { offset: 0.48, opacity: 0, translate: shift(rest, thrown, 50), rotate: '160deg' },
          { offset: 1, opacity: 0, translate: shift(rest, thrown, 50), rotate: '160deg' },
        ],
        { duration: ROLL_MS },
      ),
      ...moving.map((i, k) => {
        const el = els[i];
        const slot = centerOf(el.getBoundingClientRect());
        const spread = moving.length === 1 ? 0.5 : k / (moving.length - 1);
        const land = {
          x: area.left + area.width * (0.18 + 0.64 * spread) + (Math.random() - 0.5) * 10,
          y: area.top + area.height * (0.3 + Math.random() * 0.25),
        };
        const middle = { x: (thrown.x + land.x) / 2, y: (thrown.y + land.y) / 2 };
        const tilt = Math.round((Math.random() - 0.5) * 40);
        const bounce = Math.sign(land.x - thrown.x) * 10;
        return el.animate(
          [
            {
              offset: 0,
              translate: '0 0',
              rotate: '0deg',
              scale: '1',
              opacity: 1,
              easing: 'ease-in',
            },
            {
              offset: INTO_CUP,
              translate: shift(slot, rest),
              rotate: '90deg',
              scale: '0.45',
              opacity: 0,
              easing: 'step-end',
            },
            { offset: THROW - 0.02, translate: shift(slot, thrown), scale: '0.5', opacity: 0 },
            {
              offset: THROW,
              translate: shift(slot, thrown),
              rotate: '-540deg',
              scale: '0.6',
              opacity: 1,
              easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)',
            },
            { offset: 0.5, translate: shift(slot, middle, -50), rotate: '-200deg', scale: '1.2' },
            {
              offset: 0.6,
              translate: shift(slot, { x: land.x + bounce, y: land.y }),
              rotate: `${tilt - 25}deg`,
              scale: '1',
            },
            { offset: LANDED, translate: shift(slot, land), rotate: `${tilt}deg`, scale: '1' },
            {
              offset: BACK,
              translate: shift(slot, land),
              rotate: `${tilt}deg`,
              easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
            },
            { offset: 1, translate: '0 0', rotate: '0deg', scale: '1', opacity: 1 },
          ],
          { duration: ROLL_MS },
        );
      }),
    ];

    // Bis zum Abwurf zeigen die Würfel den alten Wurf (erster Wurf: leer), in der Luft
    // wechseln die Augen, beim Aufsetzen zeigen sie den neuen Wurf
    this.faces.set(this.slots.map((i) => before[i] ?? 0));
    let shuffle: ReturnType<typeof setInterval> | undefined;
    this.timers.push(
      setTimeout(() => {
        shuffle = setInterval(() => {
          this.faces.update((faces) =>
            this.slots.map((i) => (moving.includes(i) ? randomFace() : faces[i])),
          );
        }, 70);
        this.timers.push(shuffle);
      }, ROLL_MS * THROW),
      setTimeout(() => {
        clearInterval(shuffle);
        this.faces.set(dice);
      }, ROLL_MS * 0.6),
    );

    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    if (run !== this.run) return;
    this.rolling.set(false);
    this.show(dice);
  }
}
