import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FeedbackService } from '../../../services/feedback.service';
import { TableDecor } from '../table/table-decor';
import { reducedMotion } from '../table/table-motion';
import {
  BOARD_SIZE,
  Cell,
  cellOf,
  GOALS,
  HOUSES,
  inGoal,
  MENSCH_COLORS,
  MENSCH_TRIES,
  MeGame,
  moves,
  rankPlayers,
  rotate,
  TRACK,
  turnsFor,
} from './mensch.model';

// Augen je Wert als Rasterplatz (Zeile / Spalte im 3×3-Raster), wie beim Kniffel-Würfel
const PIPS: Record<number, string[]> = {
  1: ['2 / 2'],
  2: ['1 / 1', '3 / 3'],
  3: ['1 / 1', '2 / 2', '3 / 3'],
  4: ['1 / 1', '1 / 3', '3 / 1', '3 / 3'],
  5: ['1 / 1', '1 / 3', '2 / 2', '3 / 1', '3 / 3'],
  6: ['1 / 1', '2 / 1', '3 / 1', '1 / 3', '2 / 3', '3 / 3'],
};

// Würfel rollt so lange; Figuren hüpfen je Feld so lange; Banner bleibt so lange
const ROLL_MS = 750;
const STEP_MS = 170;
const BANNER_MS = 2600;

const randomFace = () => 1 + Math.floor(Math.random() * 6);

type Field = {
  x: number;
  y: number;
  kind: 'track' | 'start' | 'goal' | 'house';
  color: number | null;
};

// Spielansicht: quadratisches Brett (eigene Farbe unten links) und Bedienfeld mit Würfel und
// Spielern – am Handy hochkant darunter, quer daneben. Neue Würfe (roll_seq) rollen bei allen;
// gezogene Figuren hüpfen Feld für Feld, geschlagene fliegen zurück ins Haus.
@Component({
  selector: 'app-mensch-board',
  imports: [TableDecor],
  templateUrl: './mensch-board.html',
  styleUrl: './mensch-board.scss',
})
export class MenschBoard {
  private readonly feedback = inject(FeedbackService);

  readonly game = input.required<MeGame>();
  readonly userId = input.required<string>();
  readonly busy = input(false);
  readonly isHost = input(false);

  readonly roll = output<void>();
  readonly move = output<number>();
  readonly backToLobby = output<void>();

  readonly size = BOARD_SIZE;
  readonly pips = PIPS;
  readonly colors = MENSCH_COLORS;
  readonly goalSlots = [0, 1, 2, 3];

  readonly me = computed(
    () => this.game().players.find((player) => player.user_id === this.userId()) ?? null,
  );
  readonly finished = computed(() => this.game().status === 'finished');
  readonly myTurn = computed(
    () => !this.finished() && !!this.me() && this.game().turn_seat === this.me()!.seat,
  );
  readonly active = computed(
    () => this.game().players.find((player) => player.seat === this.game().turn_seat) ?? null,
  );

  // Eigene Farbe unten links; Zuschauer sehen das Brett wie Rot
  private readonly turns = computed(() => turnsFor(this.me()?.color ?? 3));
  private readonly place = (cell: Cell) => {
    const [x, y] = rotate(cell, this.turns());
    return { x, y };
  };

  // Alle Felder des Bretts (ohne Figuren); Häuser und Ziele nur für Farben im Spiel
  readonly fields = computed((): Field[] => {
    const colors = this.game().players.map((player) => player.color);
    return [
      ...TRACK.map((cell, i) => ({
        ...this.place(cell),
        kind: i % 10 === 0 ? ('start' as const) : ('track' as const),
        color: i % 10 === 0 ? i / 10 : null,
      })),
      ...GOALS.flatMap((goal, color) =>
        goal.map((cell) => ({ ...this.place(cell), kind: 'goal' as const, color })),
      ),
      ...HOUSES.flatMap((house, color) =>
        house.map((cell) => ({
          ...this.place(cell),
          kind: 'house' as const,
          color: colors.includes(color) ? color : null,
        })),
      ),
    ];
  });

  // Weg der Laufbahn als Linie hinter den Feldern (Mittelpunkte in Feldern)
  readonly path = computed(() =>
    TRACK.map((cell) => {
      const { x, y } = this.place(cell);
      return `${x + 0.5},${y + 0.5}`;
    }).join(' '),
  );

  // Mitte des Bretts: die vier Farben, jede zu ihrem Ziel gedreht (Ziele liegen ungedreht
  // links Rot, oben Blau, rechts Grün, unten Gelb)
  readonly centerGradient = computed(() => {
    const [red, blue, green, yellow] = MENSCH_COLORS.map((color) => color.piece);
    const from = this.turns() * 90 - 45;
    return `conic-gradient(from ${from}deg, ${blue} 0 25%, ${green} 0 50%, ${yellow} 0 75%, ${red} 0)`;
  });

  // Pfeil am Startfeld zeigt in Laufrichtung (Winkel zum nächsten Feld)
  readonly arrows = computed(() =>
    this.game().players.map((player) => {
      const from = this.place(TRACK[player.color * 10]);
      const to = this.place(TRACK[player.color * 10 + 1]);
      return {
        ...from,
        color: player.color,
        angle: Math.round((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI),
      };
    }),
  );

  // Wohin die eigenen Figuren mit dem liegenden Würfel können (null = gar nicht)
  readonly targets = computed((): (number | null)[] => {
    const game = this.game();
    const me = this.me();
    if (!this.myTurn() || game.phase !== 'move' || !game.die || !me || this.rolling()) {
      return [null, null, null, null];
    }
    return moves(me.pieces, game.die);
  });
  readonly canMove = computed(() => !this.busy() && this.targets().some((to) => to !== null));
  readonly canRoll = computed(
    () => this.myTurn() && this.game().phase === 'roll' && !this.rolling() && !this.busy(),
  );

  // Angezeigter Stand je Figur ("Sitz:Figur" → Schritt); läuft beim Ziehen Feld für Feld nach
  readonly shown = signal<Map<string, number>>(new Map());
  // Geschlagene Figuren fliegen langsamer zurück ins Haus
  readonly flying = signal<Set<string>>(new Set());
  // Figur, deren Ziel gerade hervorgehoben ist (Zeigen/Fokus)
  readonly aimed = signal<number | null>(null);

  readonly pieces = computed(() => {
    const shown = this.shown();
    const targets = this.targets();
    const mySeat = this.me()?.seat;
    return this.game()
      .players.filter((player) => player.state !== 'left')
      .flatMap((player) =>
        player.pieces.map((step, index) => {
          const key = `${player.seat}:${index}`;
          const at = shown.get(key) ?? step;
          const mine = player.seat === mySeat;
          return {
            key,
            index,
            color: player.color,
            ...this.place(cellOf(player.color, index, at)),
            mine,
            movable: mine && targets[index] !== null,
            turn: !this.finished() && player.seat === this.game().turn_seat,
            label: `${MENSCH_COLORS[player.color].name}e Figur von ${mine ? 'dir' : player.name}`,
          };
        }),
      );
  });

  // Zielfelder der ziehbaren Figuren
  readonly markers = computed(() => {
    const me = this.me();
    if (!me || !this.canMove()) return [];
    return this.targets().flatMap((to, index) =>
      to === null
        ? []
        : [{ index, ...this.place(cellOf(me.color, index, to)), aimed: this.aimed() === index }],
    );
  });

  readonly seats = computed(() => {
    const game = this.game();
    return game.players.map((player) => ({
      player,
      mine: player.seat === this.me()?.seat,
      turn: !this.finished() && player.seat === game.turn_seat,
      goal: inGoal(player.pieces),
      winner: player.seat === game.winner_seat,
    }));
  });

  // Was der Würfel gerade zeigt (beim Rollen wechselnd) und in welcher Farbe
  readonly face = signal<number | null>(null);
  readonly rolling = signal(false);
  // Farbe dessen, der zuletzt gewürfelt hat (vor dem ersten Wurf: wer dran ist)
  readonly dieColor = computed(() => {
    const game = this.game();
    const seat = game.rolled_seat ?? game.turn_seat;
    const player = game.players.find((p) => p.seat === seat);
    return player ? MENSCH_COLORS[player.color] : null;
  });

  readonly hint = computed(() => {
    const game = this.game();
    const me = this.me();
    const name = this.active()?.name ?? '';
    if (this.rolling()) return 'Der Würfel rollt …';
    if (!this.myTurn() || !me) {
      return game.phase === 'move' ? `${name} zieht mit ${game.die}` : `${name} ist dran`;
    }
    if (game.phase === 'move') return `Du hast eine ${game.die} – tippe eine Figur an`;
    const rolledMine = game.rolled_seat === me.seat;
    if (rolledMine && game.die === 6 && game.tries === 0) return 'Sechs! Du darfst nochmal würfeln';
    if (rolledMine && game.tries > 0) {
      const left = MENSCH_TRIES - game.tries;
      return `Keine 6 – noch ${left} ${left === 1 ? 'Versuch' : 'Versuche'}`;
    }
    return 'Du bist dran – würfeln!';
  });

  readonly winnerText = computed(() => {
    const game = this.game();
    const winner =
      game.players.find((player) => player.seat === game.winner_seat) ??
      rankPlayers(game.players)[0]?.player;
    if (!winner) return 'Spiel beendet';
    return winner.seat === this.me()?.seat ? 'Du gewinnst!' : `${winner.name} gewinnt!`;
  });

  // Kurzer Hinweis über dem Brett, z. B. wer wen rausgeworfen hat
  readonly banner = signal<{ text: string; color: string } | null>(null);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private bannerTimer: ReturnType<typeof setTimeout> | undefined;
  private rollTimer: ReturnType<typeof setTimeout> | undefined;
  private shuffle: ReturnType<typeof setInterval> | undefined;

  constructor() {
    let seq: number | null = null;
    effect(() => {
      const game = this.game();
      const previous = seq;
      seq = game.roll_seq;
      untracked(() => {
        if (previous !== null && previous !== game.roll_seq && !reducedMotion()) {
          this.animateRoll(game.die);
        } else if (!this.rolling()) {
          this.face.set(game.die);
        }
      });
    });

    let before: MeGame | null = null;
    effect(() => {
      const game = this.game();
      untracked(() => {
        this.follow(before, game);
        before = game;
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.stopSteps();
      this.stopRoll();
      clearTimeout(this.bannerTimer);
    });
  }

  doRoll(): void {
    if (this.canRoll()) this.roll.emit();
  }

  pick(index: number, mine: boolean): void {
    if (mine && this.canMove() && this.targets()[index] !== null) {
      this.aimed.set(null);
      this.move.emit(index);
    }
  }

  // Figuren vom alten zum neuen Stand bewegen: vorwärts Feld für Feld, geschlagene danach
  // zurück ins Haus
  private follow(before: MeGame | null, game: MeGame): void {
    this.stopSteps();
    const now = new Map(
      game.players.flatMap((player) =>
        player.pieces.map((step, i) => [`${player.seat}:${i}`, step] as const),
      ),
    );
    if (!before || before.id !== game.id || reducedMotion()) {
      this.shown.set(now);
      this.flying.set(new Set());
      return;
    }

    const old = new Map(
      before.players.flatMap((player) =>
        player.pieces.map((step, i) => [`${player.seat}:${i}`, step] as const),
      ),
    );
    const shown = new Map(old);
    const captured: string[] = [];
    let longest = 0;
    for (const [key, step] of now) {
      const from = old.get(key) ?? step;
      if (from === step) continue;
      if (from >= 0 && step > from && step - from <= 6) {
        // Feld für Feld
        longest = Math.max(longest, step - from);
        for (let s = from + 1; s <= step; s++) {
          this.timers.push(
            setTimeout(
              () => this.shown.update((map) => new Map(map).set(key, s)),
              (s - from) * STEP_MS,
            ),
          );
        }
      } else if (step < 0 && from >= 0) {
        captured.push(key);
      } else {
        shown.set(key, step);
      }
    }
    this.shown.set(shown);
    this.flying.set(new Set(captured));

    if (captured.length) {
      this.timers.push(
        setTimeout(
          () => {
            this.shown.update((map) => {
              const next = new Map(map);
              captured.forEach((key) => next.set(key, -1));
              return next;
            });
            this.announceCapture(before, game, captured);
          },
          (longest + 1) * STEP_MS,
        ),
      );
    }
    this.timers.push(
      setTimeout(
        () => {
          this.shown.set(now);
          this.flying.set(new Set());
        },
        (longest + 5) * STEP_MS,
      ),
    );
  }

  private announceCapture(before: MeGame, game: MeGame, captured: string[]): void {
    const hunter = game.players.find((player) => player.seat === before.turn_seat);
    const victims = captured.map((key) =>
      game.players.find((p) => `${p.seat}` === key.split(':')[0]),
    );
    const victim = victims[0];
    if (!hunter || !victim) return;
    const mySeat = this.me()?.seat;
    const hunterName = hunter.seat === mySeat ? 'Du hast' : `${hunter.name} hat`;
    const victimName = victim.seat === mySeat ? 'dich' : victim.name;
    this.showBanner(`${hunterName} ${victimName} rausgeworfen!`, MENSCH_COLORS[hunter.color].piece);
    this.feedback.play(victim.seat === mySeat ? 'bust' : 'alert');
  }

  private showBanner(text: string, color: string): void {
    clearTimeout(this.bannerTimer);
    this.banner.set({ text, color });
    this.bannerTimer = setTimeout(() => this.banner.set(null), BANNER_MS);
  }

  private stopSteps(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  // Würfel taumelt, die Augen wechseln, am Ende liegt der neue Wurf
  private animateRoll(die: number | null): void {
    this.stopRoll();
    this.rolling.set(true);
    this.shuffle = setInterval(() => this.face.set(randomFace()), 80);
    this.rollTimer = setTimeout(() => {
      this.stopRoll();
      this.face.set(die);
    }, ROLL_MS);
  }

  private stopRoll(): void {
    clearInterval(this.shuffle);
    clearTimeout(this.rollTimer);
    this.rolling.set(false);
  }
}
