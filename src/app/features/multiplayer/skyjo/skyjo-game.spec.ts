import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { SkyjoGameView } from './skyjo-game';
import { SkyjoService } from './skyjo.service';
import { SkGame, SkPlayer, SKYJO_CLEAR_MS } from './skyjo.model';

const WAITING = '2026-10-14T12:00:00Z';
const HIDDEN = Array(12).fill(null);

function player(seat: number, overrides: Partial<SkPlayer> = {}): SkPlayer {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    cards: [...HIDDEN],
    cleared: [false, false, false, false],
    flips: 2,
    score: 0,
    round_raw: null,
    round_score: null,
    columns: 0,
    doubled: 0,
    best_round: null,
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

// Gast hat 5 und 0 offen, Host 3 und 4
function makeGame(overrides: Partial<SkGame> = {}): SkGame {
  return {
    id: 'game-1',
    status: 'playing',
    phase: 'turn',
    step: 'draw',
    seat_count: 2,
    end_score: 100,
    clear_columns: true,
    double_ender: true,
    round_no: 1,
    turn_seat: 1,
    drawn: null,
    drawn_from: null,
    discard: [8, 4],
    deck_count: 120,
    ender_seat: null,
    last_turns: [],
    last_events: [],
    round_log: [],
    waiting_since: WAITING,
    players: [
      player(0, { cards: [3, null, null, null, 4, ...HIDDEN.slice(5)] }),
      player(1, { cards: [5, null, null, null, null, 0, ...HIDDEN.slice(6)] }),
    ],
    ...overrides,
  };
}

describe('SkyjoGameView', () => {
  let fixture: ComponentFixture<SkyjoGameView>;
  let component: SkyjoGameView;
  let skyjo: Record<string, ReturnType<typeof vi.fn>>;
  let changed: () => void;

  async function render(userId: string, game: SkGame | null): Promise<void> {
    skyjo['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(SkyjoGameView);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lobbyId', 'lobby-1');
    fixture.componentRef.setInput('hostUserId', 'host');
    fixture.componentRef.setInput('userId', userId);
    fixture.detectChanges();
    await vi.waitFor(() => expect(component.loading()).toBe(false));
    fixture.detectChanges();
  }

  // Neuer Stand per Realtime
  async function update(game: SkGame): Promise<void> {
    skyjo['load'].mockResolvedValue({ ok: true, value: game });
    changed();
    await vi.waitFor(() => expect(component.game()).toBe(game));
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement;
  const buttons = (): HTMLButtonElement[] => [...el().querySelectorAll('button')];
  const button = (label: string) =>
    buttons().find((candidate) => candidate.textContent?.includes(label));
  const labelled = (label: string) =>
    buttons().find((candidate) => candidate.getAttribute('aria-label')?.startsWith(label));
  const cell = (n: number) =>
    el().querySelector<HTMLButtonElement>(`.my-grid [data-cell$=":${n}"]`)!;
  const turn = expect.objectContaining({ id: 'game-1', waiting_since: WAITING });
  // Das ⋮-Menü liegt im Overlay außerhalb der Komponente
  const openMenu = async (): Promise<HTMLElement[]> => {
    button('more_vert')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
  };
  const menuItem = (items: HTMLElement[], label: string) =>
    items.find((item) => item.textContent?.includes(label));
  // Nach einem Zug, bis der Tisch wieder bedienbar ist
  const settled = async () => {
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    skyjo = {
      load: vi.fn(),
      subscribe: vi.fn().mockImplementation((_id: string, onChange: () => void) => {
        changed = onChange;
        return () => {};
      }),
      flip: vi.fn().mockResolvedValue({ ok: true }),
      draw: vi.fn().mockResolvedValue({ ok: true }),
      swap: vi.fn().mockResolvedValue({ ok: true }),
      discard: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      nextRound: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };

    await TestBed.configureTestingModule({
      imports: [SkyjoGameView],
      providers: [
        provideRouter([]),
        { provide: SkyjoService, useValue: skyjo },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(true) })) } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flips two cards at the start of a round, only hidden ones', async () => {
    await render(
      'guest',
      makeGame({
        phase: 'reveal',
        step: null,
        turn_seat: null,
        players: [
          player(0, { flips: 0, cards: [...HIDDEN] }),
          player(1, { flips: 1, cards: [5, ...HIDDEN.slice(1)] }),
        ],
      }),
    );
    expect(el().textContent).toContain('Decke noch 1 Karte auf');
    expect(cell(0).disabled).toBe(true);
    cell(7).click();
    await vi.waitFor(() => expect(skyjo['flip']).toHaveBeenCalledWith(turn, 7));
  });

  it('draws from the pile or takes the top discard on turn', async () => {
    await render('guest', makeGame());
    expect(el().textContent).toContain('Stapel ziehen oder die 4 von der Ablage nehmen');
    labelled('Vom Stapel ziehen')!.click();
    await vi.waitFor(() => expect(skyjo['draw']).toHaveBeenCalledWith(turn, 'pile'));
    await settled();
    labelled('Oberste Ablagekarte nehmen, 4')!.click();
    await vi.waitFor(() => expect(skyjo['draw']).toHaveBeenCalledWith(turn, 'discard'));
  });

  it('swaps or throws away a card drawn from the pile', async () => {
    await render('guest', makeGame({ step: 'place', drawn: -2, drawn_from: 'pile' }));
    expect(el().textContent).toContain('die Ablage, um die −2 abzuwerfen');
    cell(0).click();
    await vi.waitFor(() => expect(skyjo['swap']).toHaveBeenCalledWith(turn, 0));
    await settled();
    labelled('−2 abwerfen')!.click();
    await vi.waitFor(() => expect(skyjo['discard']).toHaveBeenCalledWith(turn));
    fixture.destroy();

    // Von der Ablage muss getauscht werden
    await render('guest', makeGame({ step: 'place', drawn: 4, drawn_from: 'discard' }));
    expect(el().textContent).toContain('um sie gegen die 4 zu tauschen');
    expect(el().querySelector('.pile-btn.throw')).toBeNull();
  });

  it('flips one hidden card after throwing away', async () => {
    await render('guest', makeGame({ step: 'flip' }));
    expect(el().textContent).toContain('Decke eine deiner verdeckten Karten auf');
    expect(cell(0).disabled).toBe(true);
    cell(11).click();
    await vi.waitFor(() => expect(skyjo['flip']).toHaveBeenCalledWith(turn, 11));
  });

  it('only watches while someone else is on turn', async () => {
    await render('host', makeGame({ step: 'place', drawn: 9, drawn_from: 'pile' }));
    expect(el().textContent).toContain('Gast ist dran – hat eine 9 gezogen');
    expect(labelled('Vom Stapel ziehen')!.disabled).toBe(true);
    expect(buttons().filter((b) => b.closest('.my-grid') && !b.disabled)).toEqual([]);
  });

  it('announces the last round and who still has a turn', async () => {
    await render(
      'host',
      makeGame({ ender_seat: 1, turn_seat: 0, last_turns: [0], players: makeGame().players }),
    );
    expect(el().textContent).toContain('Letzte Runde!');
    expect(el().textContent).toContain('Gast hat alles aufgedeckt');
    expect(el().textContent).toContain('Dein letzter Zug');
    expect(el().textContent).toContain('alles offen');
  });

  it('lets a cleared column glow, then sends it to the discard', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    const sevens = [7, 7, null, null, 0, 7, null, null, 1, 7, null, null];
    await update(
      makeGame({
        turn_seat: 0,
        discard: [8, 4, 3, 7, 7, 7],
        last_events: [
          { t: 'swap', seat: 1, cell: 9, card: 7, old: 3, hidden: true, from: 'pile' },
          { t: 'clear', seat: 1, col: 1, card: 7, n: 21 },
        ],
        players: [
          makeGame().players[0],
          player(1, {
            cards: sevens.map((card, i) => (i % 4 === 1 ? null : card)),
            cleared: [false, true, false, false],
            columns: 1,
          }),
        ],
      }),
    );
    expect(el().textContent).toContain('Spalte abgeräumt!');
    expect(el().textContent).toContain('−21');
    expect(el().querySelectorAll('.my-grid .cell.glow').length).toBe(3);
    // Bis die Spalte ankommt, liegt oben noch die getauschte Karte
    const discard = () => el().querySelector('.discard app-skyjo-card')!.getAttribute('aria-label');
    expect(discard()).toBe('Karte 3');

    expect(el().querySelectorAll('.my-grid .cell.glow.mid').length).toBe(1);

    await vi.advanceTimersByTimeAsync(SKYJO_CLEAR_MS + 100);
    fixture.detectChanges();
    expect(el().querySelectorAll('.my-grid .cell.glow').length).toBe(0);
    expect(el().querySelectorAll('.my-grid .slot').length).toBe(3);
    expect(discard()).toBe('Karte 7');
    expect(el().textContent).not.toContain('Spalte abgeräumt!');
  });

  it('never plays for a slow player, only the host can skip after a while', async () => {
    vi.useFakeTimers();
    await render('host', makeGame());
    let items = await openMenu();
    expect(menuItem(items, 'überspringen')).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(skyjo['skip']).not.toHaveBeenCalled();
    fixture.detectChanges();
    items = await openMenu();
    menuItem(items, 'Gast überspringen')!.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(skyjo['skip']).toHaveBeenCalledWith(turn);
  });

  // Viele Züge hintereinander: ein fertiger Stand wird gezeigt, auch wenn schon neu geladen wird
  it('shows each newer state without waiting for the latest load', async () => {
    await render('guest', makeGame());
    const next = makeGame({ turn_seat: 0, waiting_since: '2026-10-14T12:00:05Z' });
    let finish!: (value: unknown) => void;
    skyjo['load']
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
      .mockReturnValueOnce(new Promise(() => {}));
    changed();
    await vi.waitFor(() => expect(skyjo['load']).toHaveBeenCalledTimes(2));
    changed();
    await vi.waitFor(() => expect(skyjo['load']).toHaveBeenCalledTimes(3));
    finish({ ok: true, value: next });
    await vi.waitFor(() => expect(component.game()).toBe(next));
  });

  it('shows the round summary with the doubled ender, then starts the next round', async () => {
    vi.useFakeTimers();
    await render(
      'guest',
      makeGame({
        phase: 'round_over',
        step: null,
        turn_seat: null,
        ender_seat: 0,
        players: [
          player(0, {
            score: 30,
            round_raw: 15,
            round_score: 30,
            doubled: 1,
            cards: Array(12)
              .fill(1)
              .map((v, i) => (i < 3 ? 5 : 0)),
          }),
          player(1, {
            score: 9,
            round_raw: 9,
            round_score: 9,
            cards: Array(12)
              .fill(0)
              .map((v, i) => (i < 9 ? 1 : 0)),
          }),
        ],
      }),
    );
    expect(el().textContent).toContain('Runde 1 vorbei');
    expect(el().textContent).toContain('+15 × 2 = +30');
    expect(el().textContent).toContain('beendet');
    const start = () => button('Runde 2 starten')!;
    expect(start().disabled).toBe(true);
    await vi.advanceTimersByTimeAsync(4_000);
    fixture.detectChanges();
    expect(start().disabled).toBe(false);
    await vi.advanceTimersByTimeAsync(8_500);
    expect(skyjo['nextRound']).toHaveBeenCalledWith('game-1', 1);
  });

  it('shows the last round first when the game ends live, then the final standings', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    await update(
      makeGame({
        status: 'finished',
        phase: 'round_over',
        step: null,
        turn_seat: null,
        round_no: 3,
        waiting_since: null,
        players: [
          player(0, { score: 104, round_raw: 40, round_score: 40, cards: Array(12).fill(4) }),
          player(1, {
            score: 52,
            round_raw: 2,
            round_score: 2,
            best_round: 2,
            columns: 2,
            cards: Array(12).fill(0),
          }),
        ],
      }),
    );
    // Erst stehen lassen (alles aufgedeckt), dann die Übersicht der letzten Runde
    expect(el().textContent).not.toContain('vorbei');
    await vi.advanceTimersByTimeAsync(2_600);
    fixture.detectChanges();
    expect(el().textContent).toContain('Runde 3 vorbei');
    expect(el().textContent).toContain('Host hat 100 erreicht');
    button('Zum Endstand')!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('Du gewinnt!');
    expect(el().textContent).toContain('Host hat die 100 erreicht');
    expect(el().textContent).toContain('Du 2');
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
  });

  it('goes straight to the final standings when loading a finished game', async () => {
    await render(
      'host',
      makeGame({
        status: 'finished',
        phase: 'round_over',
        players: [player(0, { score: 104 }), player(1, { score: 52 })],
      }),
    );
    expect(el().textContent).toContain('Gast gewinnt!');
    expect(el().textContent).toContain('du hast die 100 erreicht');
    expect(button('Zurück zur Warte-Lobby')).toBeDefined();
  });
});
