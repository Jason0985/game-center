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

// Abrechnung am Ende (ms): erst kurz den letzten Eintrag sehen, dann zählen die Summen oben
// hoch, der Bonus kommt dazu und zuletzt laufen die Gesamtsummen aller gleichzeitig hoch –
// wer am meisten hat, zählt am längsten
type Reveal = 'hidden' | 'upper' | 'bonus' | 'total' | 'done';
const REVEAL_START_MS = 1200;
const UPPER_COUNT_MS = 1400;
const BONUS_MS = 1100;
const TOTAL_COUNT_MS = 3600;

// Spielansicht: oben der Kniffelblock (eine Spalte je Spieler), unten die fünf Würfel mit
// Würfeln/Eintragen. Neue Würfe (roll_seq) sehen alle gleich: Würfel fliegen in den Becher,
// er wird geschüttelt und auf den Block geworfen, dann rutschen sie zurück in die Reihe.
// Der Block zeigt in den freien Feldern, was der liegende Wurf brächte, und die laufenden
// Summen; Streichen (0 Punkte) muss man bestätigen. Am Spielende wird für alle nachgezählt.
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

  // Abrechnung am Ende: welcher Schritt läuft und wie weit (ms seit Beginn des Schritts)
  readonly reveal = signal<Reveal>('hidden');
  private readonly revealAt = signal(0);
  private readonly elapsed = signal(0);
  readonly revealed = computed(() => this.reveal() === 'done');

  readonly columns = computed(() => {
    const game = this.game();
    const dice = this.settled();
    const reveal = this.reveal();
    const ms = this.elapsed();
    // Alle zählen gleich schnell; der höchste Wert braucht die ganze Dauer
    const upperMax = Math.max(1, ...game.players.map((p) => upperSum(p.scores)));
    const totalMax = Math.max(1, ...game.players.map((p) => p.total));
    const count = (value: number, max: number, duration: number) =>
      Math.min(value, Math.floor((max * Math.min(ms, duration)) / duration));
    // Während des Spiels stehen die Summen offen da; die Abrechnung zählt erst am Ende
    const live = !this.finished();
    return game.players.map((player) => {
      const turn = live && player.seat === game.turn_seat;
      const upper = upperSum(player.scores);
      const total = player.total;
      return {
        player,
        turn,
        mine: player.seat === this.mySeat(),
        initial: player.name.trim().charAt(0).toUpperCase() || '?',
        color: AVATAR_COLORS[player.seat % AVATAR_COLORS.length],
        sums: live
          ? { upper, bonus: bonusOf(player.scores) || '', total }
          : {
              upper:
                reveal === 'hidden'
                  ? ''
                  : reveal === 'upper'
                    ? count(upper, upperMax, UPPER_COUNT_MS)
                    : upper,
              bonus: reveal === 'hidden' || reveal === 'upper' ? '' : bonusOf(player.scores) || '–',
              total:
                reveal === 'done'
                  ? total
                  : reveal === 'total'
                    ? count(total, totalMax, TOTAL_COUNT_MS)
                    : '',
            },
        // Läuft die Summe gerade noch hoch?
        counting: {
          upper: reveal === 'upper' && count(upper, upperMax, UPPER_COUNT_MS) < upper,
          bonus: false,
          total: reveal === 'total' && count(total, totalMax, TOTAL_COUNT_MS) < total,
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
  private revealTimers: ReturnType<typeof setTimeout>[] = [];
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
        if (!finished) this.setReveal('hidden');
        else if (before === false && !reducedMotion()) this.playReveal();
        else this.setReveal('done');
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.stop();
      this.stopReveal();
    });
  }

  private setReveal(step: Reveal): void {
    this.stopReveal();
    this.reveal.set(step);
  }

  private stopReveal(): void {
    this.revealTimers.forEach(clearTimeout);
    this.revealTimers = [];
    cancelAnimationFrame(this.frame);
  }

  // Zeitleiste der Abrechnung; der Sekundenzeiger fürs Hochzählen läuft per Frame
  private playReveal(): void {
    this.setReveal('hidden');
    const step = (at: number, next: Reveal) =>
      this.revealTimers.push(
        setTimeout(() => {
          this.reveal.set(next);
          this.revealAt.set(performance.now());
          this.elapsed.set(0);
        }, at),
      );
    let t = REVEAL_START_MS;
    step(t, 'upper');
    t += UPPER_COUNT_MS + 300;
    step(t, 'bonus');
    t += BONUS_MS;
    step(t, 'total');
    t += TOTAL_COUNT_MS + 400;
    step(t, 'done');
    const tick = () => {
      this.elapsed.set(performance.now() - this.revealAt());
      if (this.reveal() !== 'done') this.frame = requestAnimationFrame(tick);
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
