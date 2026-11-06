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
import { ThemeService } from '../../../services/theme.service';
import { TableDecor } from '../table/table-decor';
import { KniffelDecor } from './kniffel-decor';
import { reducedMotion } from '../table/table-motion';
import {
  bonusOf,
  CATEGORIES,
  KNIFFEL_BONUS,
  KNIFFEL_BONUS_AT,
  KNIFFEL_ROLLS,
  KnGame,
  LOWER,
  rankPlayers,
  pointsFor,
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

// Wurf-Animation in zwei Teilen: Sammeln (Würfel in den Becher, der Becher schüttelt, bis der
// Wurf vom Server da ist; mindestens SHAKE_MS) und Werfen (auf den Block, liegen lassen, zurück
// in die Reihe). Beim eigenen Wurf beginnt das Sammeln schon beim Tippen, so wartet niemand
// auf das Netz. Bewegt wird nur per transform/opacity, das rechnet auch Safari auf der GPU.
const GATHER_MS = 320;
const SHAKE_MS = 420;
const THROW_MS = 1400;
// Anteile von THROW_MS: Würfel tauchen auf, landen, liegen bis BACK, dann zurück in die Reihe
const APPEAR = 0.08;
const LAND = 0.38;
const LANDED = 0.48;
const BACK = 0.76;
// Kommt der Wurf so lange nicht, hört der Becher auf zu schütteln
const GATHER_TIMEOUT_MS = 10_000;
// Ist die eigene Aktion fertig, ohne dass der Wurf da ist, kommt er oft noch per Realtime:
// so lange schüttelt der Becher weiter, bevor er aufgibt
const RESULT_GRACE_MS = 1500;

interface Point {
  x: number;
  y: number;
}

const centerOf = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});
// transform mit immer gleicher Reihenfolge, damit die Schlüsselbilder sauber ineinander übergehen
const move = (from: Point, to: Point, { dy = 0, rotate = 0, scale = 1 } = {}) =>
  `translate(${to.x - from.x}px, ${to.y - from.y + dy}px) rotate(${rotate}deg) scale(${scale})`;
const still = (rotate = 0, scale = 1) => `translate(0px, 0px) rotate(${rotate}deg) scale(${scale})`;
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
  imports: [TableDecor, KniffelDecor],
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
  // Saisonale Deko: oben braucht der Block Platz für Schneekappe bzw. Kürbisse
  readonly decor = inject(ThemeService).decor;

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
  private readonly myScores = computed(
    () => this.game().players.find((player) => player.user_id === this.userId())?.scores ?? [],
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
  // Eigener Eintrag, bis der Server ihn bestätigt (key: Wurf, zu dem er gehört)
  private readonly entering = signal<{ key: string; category: number; value: number } | null>(null);

  // Eigene gehaltene Würfel gelten sofort (der Server erfährt es nebenher); neu ab jedem
  // Wurf und Zug. Bei den anderen zeigt der Block, was der Server weiß.
  private readonly rollKey = computed(() => `${this.game().turn_seat}:${this.game().roll_seq}`);
  private readonly myHeld = linkedSignal({
    source: this.rollKey,
    computation: () => [...this.game().held],
  });
  readonly held = computed(() => (this.myTurn() ? this.myHeld() : this.game().held));
  // Angetipptes Feld, solange der Dialog zum Eintragen offen ist
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
    const entering = this.entering();
    const pending = entering?.key === this.rollKey() ? entering : null;
    return game.players.map((player) => {
      const turn = !this.finished() && player.seat === game.turn_seat;
      const mine = player.seat === this.mySeat();
      const scores =
        mine && pending
          ? player.scores.map((value, i) => (i === pending.category ? pending.value : value))
          : player.scores;
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
        scores,
        turn,
        mine,
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
          turn && game.rolls > 0 && dice.length === 5 && !(mine && pending)
            ? player.scores.map((value, i) =>
                value === null ? pointsFor(dice, i, player.scores) : null,
              )
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
  // Laufender Wurf: gesammelt (Becher schüttelt) bzw. geworfen; Maße von vor dem Sammeln
  private phase: 'idle' | 'gathering' | 'throwing' = 'idle';
  private gatherSeq = 0;
  private gatheredAt = 0;
  private gatherMoving: number[] = [];
  private geometry: { slots: Point[]; rest: Point; area: DOMRect } | null = null;
  private cupShake: Animation | null = null;
  // Sicherheitsnetz des laufenden Sammelns; muss mit dem Wurf weg, sonst trifft es einen späteren
  private gatherTimer: ReturnType<typeof setTimeout> | undefined;
  // Eine eigene Aktion lief (busy war an); geht busy aus, ohne dass sie ankam, wird zurückgesetzt
  private sawBusy = false;
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
          void this.throwDice(game.dice, game.held);
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

    // Eigene Aktion vorbei: kam der Wurf bzw. Eintrag nicht an (Fehler, veraltete Ansicht),
    // Becher und Eintrag zurücknehmen
    effect(() => {
      const busy = this.busy();
      untracked(() => {
        if (busy) {
          this.sawBusy = true;
          return;
        }
        if (!this.sawBusy) return;
        this.sawBusy = false;
        if (this.entering()?.key === this.rollKey()) this.entering.set(null);
        if (this.phase === 'gathering' && this.game().roll_seq === this.gatherSeq) {
          const run = this.run;
          const seq = this.gatherSeq;
          this.timers.push(
            setTimeout(() => {
              if (run === this.run && this.phase === 'gathering' && this.game().roll_seq === seq) {
                this.stop();
                this.show(this.game().dice);
              }
            }, RESULT_GRACE_MS),
          );
        }
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
    if (!this.canRoll()) return;
    const held = this.game().rolls ? this.myHeld() : NO_HOLD;
    this.roll.emit(held);
    if (!reducedMotion()) this.gather(held);
  }

  // Eintragen immer erst im Dialog bestätigen: Der verdeckt den Würfeln-Knopf, so wird nicht
  // aus Versehen nochmal gewürfelt. Eingetragen wird nur, wenn danach noch derselbe Wurf liegt
  async pick(category: number): Promise<void> {
    if (!this.canPick() || this.selected() !== null) return;
    this.selected.set(category);
    const key = this.rollKey();
    const value = pointsFor(this.settled(), category, this.myScores());
    const name = CATEGORIES[category].name;
    const ref = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      {
        data: value
          ? {
              title: `${name} eintragen?`,
              message: `Du trägst ${value} Punkte bei ${name} ein. Danach ist dein Zug vorbei.`,
              confirmLabel: 'Eintragen',
              icon: 'check',
            }
          : {
              title: `${name} streichen?`,
              message: 'Der Wurf bringt hier keine Punkte – das Feld wird mit 0 gestrichen.',
              confirmLabel: 'Streichen',
              icon: 'block',
            },
      },
    );
    const confirmed = (await firstValueFrom(ref.afterClosed())) === true;
    if (key !== this.rollKey()) return;
    this.selected.set(null);
    if (confirmed && this.canPick()) {
      // Steht sofort im Block; kommt der Eintrag nicht an, verschwindet er wieder
      this.entering.set({ key, category, value });
      this.score.emit(category);
    }
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
    this.phase = 'idle';
    this.cupShake = null;
    clearTimeout(this.gatherTimer);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    for (const el of [this.cup(), ...this.dice()]) {
      el?.nativeElement.getAnimations?.().forEach((animation) => animation.cancel());
    }
    this.rolling.set(false);
  }

  private elements() {
    const cup = this.cup()?.nativeElement;
    const sheet = this.sheet()?.nativeElement;
    const els = this.dice().map((ref) => ref.nativeElement);
    return cup && sheet && typeof cup.animate === 'function' && els.length === 5
      ? { cup, sheet, els }
      : null;
  }

  // Würfel in den Becher, der schüttelt, bis throwDice wirft. Alle am Tisch spielen dieselbe
  // Abfolge; beim eigenen Wurf beginnt sie schon beim Tippen
  private gather(held: boolean[]): boolean {
    if (this.phase !== 'idle') return true;
    const parts = this.elements();
    if (!parts) return false;
    const { cup, sheet, els } = parts;

    const before = this.faces();
    const moving = this.slots.filter((i) => !held[i] || !before[i]);
    // Messen, bevor sich etwas bewegt (getBoundingClientRect enthält transform)
    const rest = centerOf(cup.getBoundingClientRect());
    this.geometry = {
      slots: els.map((el) => centerOf(el.getBoundingClientRect())),
      rest,
      area: sheet.getBoundingClientRect(),
    };
    this.phase = 'gathering';
    this.gatherSeq = this.game().roll_seq;
    this.gatheredAt = performance.now();
    this.gatherMoving = moving;
    this.rolling.set(true);
    this.settled.set([]);
    this.faces.set(this.slots.map((i) => before[i] ?? 0));

    cup.animate(
      [
        { opacity: 0, transform: 'translate(0px, 30px) rotate(0deg) scale(0.7)' },
        { opacity: 1, transform: still() },
      ],
      { duration: GATHER_MS * 0.6, easing: 'ease-out', fill: 'forwards' },
    );
    this.cupShake = cup.animate(
      [
        { transform: still(0) },
        { transform: 'translate(-6px, 0px) rotate(-14deg) scale(1)' },
        { transform: 'translate(6px, -4px) rotate(14deg) scale(1)' },
        { transform: still(0) },
      ],
      { duration: 260, delay: GATHER_MS * 0.6, iterations: Infinity },
    );
    for (const i of moving) {
      els[i].animate(
        [
          { opacity: 1, transform: still() },
          {
            opacity: 0,
            transform: move(this.geometry.slots[i], rest, { rotate: 90, scale: 0.45 }),
          },
        ],
        { duration: GATHER_MS, easing: 'ease-in', fill: 'forwards' },
      );
    }

    clearTimeout(this.gatherTimer);
    this.gatherTimer = setTimeout(() => {
      if (this.phase === 'gathering') {
        this.stop();
        this.show(this.game().dice);
      }
    }, GATHER_TIMEOUT_MS);
    return true;
  }

  // Der Wurf ist da: nach dem Schütteln auf den Block werfen, liegen lassen, zurück
  private async throwDice(dice: number[], held: boolean[]): Promise<void> {
    if (this.phase === 'throwing') this.stop();
    if (!this.gather(held)) {
      this.show(dice);
      return;
    }
    const run = this.run;
    const wait = this.gatheredAt + GATHER_MS + SHAKE_MS - performance.now();
    if (wait > 0) await new Promise((resolve) => this.timers.push(setTimeout(resolve, wait)));
    const parts = this.elements();
    if (run !== this.run || !parts || !this.geometry) return;
    this.phase = 'throwing';
    clearTimeout(this.gatherTimer);

    const { cup, els } = parts;
    const { slots, rest, area } = this.geometry;
    const moving = this.gatherMoving;
    // Quer steht der Block links neben der Leiste: Der Becher holt kurz nach rechts aus, kippt mit
    // der Öffnung nach links, und die Würfel fliegen im Bogen auf den Block. Hochkant fliegt der
    // Becher hinauf über den Block und wird dort ausgeschüttet.
    const side = area.right <= rest.x;
    const thrown = side
      ? { x: rest.x - 36, y: rest.y - 8 }
      : { x: area.left + area.width / 2, y: area.top + area.height * 0.72 };
    const cupFrames: Keyframe[] = side
      ? [
          { offset: 0, opacity: 1, transform: still(), easing: 'ease-out' },
          {
            offset: APPEAR * 0.5,
            opacity: 1,
            transform: move(rest, { x: rest.x + 10, y: rest.y + 2 }, { rotate: 14 }),
            easing: 'ease-in',
          },
          {
            offset: APPEAR,
            opacity: 1,
            transform: move(rest, { x: rest.x - 18, y: rest.y - 4 }, { rotate: -105 }),
          },
          {
            offset: 0.22,
            opacity: 0,
            transform: move(rest, { x: rest.x - 26, y: rest.y - 4 }, { rotate: -115 }),
          },
          {
            offset: 1,
            opacity: 0,
            transform: move(rest, { x: rest.x - 26, y: rest.y - 4 }, { rotate: -115 }),
          },
        ]
      : [
          { offset: 0, opacity: 1, transform: still(), easing: 'ease-in' },
          { offset: APPEAR, opacity: 1, transform: move(rest, thrown, { dy: 40, rotate: 150 }) },
          { offset: 0.2, opacity: 0, transform: move(rest, thrown, { dy: 50, rotate: 160 }) },
          { offset: 1, opacity: 0, transform: move(rest, thrown, { dy: 50, rotate: 160 }) },
        ];

    const animations = [
      cup.animate(cupFrames, { duration: THROW_MS, fill: 'forwards' }),
      ...moving.map((i, k) => {
        const slot = slots[i];
        const spread = moving.length === 1 ? 0.5 : k / (moving.length - 1);
        const land = {
          x: area.left + area.width * (0.18 + 0.64 * spread) + (Math.random() - 0.5) * 10,
          y: area.top + area.height * (0.3 + Math.random() * 0.25),
        };
        const middle = { x: (thrown.x + land.x) / 2, y: (thrown.y + land.y) / 2 };
        const tilt = Math.round((Math.random() - 0.5) * 40);
        const bounce = { x: land.x + Math.sign(land.x - thrown.x) * 10, y: land.y };
        return els[i].animate(
          [
            { offset: 0, opacity: 0, transform: move(slot, thrown, { rotate: -540, scale: 0.5 }) },
            {
              offset: APPEAR,
              opacity: 1,
              transform: move(slot, thrown, { rotate: -540, scale: 0.6 }),
              easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)',
            },
            {
              offset: 0.25,
              transform: move(slot, middle, { dy: side ? -80 : -50, rotate: -200, scale: 1.2 }),
            },
            { offset: LAND, transform: move(slot, bounce, { rotate: tilt - 25 }) },
            { offset: LANDED, transform: move(slot, land, { rotate: tilt }) },
            {
              offset: BACK,
              transform: move(slot, land, { rotate: tilt }),
              easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
            },
            { offset: 1, opacity: 1, transform: still() },
          ],
          { duration: THROW_MS },
        );
      }),
    ];
    // Erst jetzt die Sammel-Animationen weg, sonst stünden die Würfel einen Moment in der Reihe
    this.cupShake?.cancel();
    for (const el of [cup, ...els]) {
      el.getAnimations()
        .filter((animation) => !animations.includes(animation))
        .forEach((animation) => animation.cancel());
    }

    // In der Luft wechseln die Augen, beim Aufsetzen zeigen sie den neuen Wurf
    let shuffle: ReturnType<typeof setInterval> | undefined;
    this.timers.push(
      setTimeout(() => {
        shuffle = setInterval(() => {
          this.faces.update((faces) =>
            this.slots.map((i) => (moving.includes(i) ? randomFace() : faces[i])),
          );
        }, 70);
        this.timers.push(shuffle);
      }, THROW_MS * APPEAR),
      setTimeout(() => {
        clearInterval(shuffle);
        this.faces.set(dice);
      }, THROW_MS * LAND),
    );

    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    if (run !== this.run) return;
    cup.getAnimations().forEach((animation) => animation.cancel());
    this.phase = 'idle';
    this.rolling.set(false);
    this.show(dice);
  }
}
