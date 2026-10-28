import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { Nimm6GameView } from './nimm6-game';
import { Nimm6Service } from './nimm6.service';
import { N6Game, N6Player } from './nimm6.model';

const WAITING = '2026-10-14T12:00:00Z';

function player(seat: number, overrides: Partial<N6Player> = {}): N6Player {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    score: 0,
    round_bulls: 0,
    ready: false,
    rows_taken: 0,
    sixths: 0,
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

function makeGame(overrides: Partial<N6Game> = {}): N6Game {
  return {
    id: 'game-1',
    status: 'playing',
    phase: 'choose',
    seat_count: 2,
    end_score: 66,
    round_no: 1,
    turn_no: 1,
    card_rows: [
      [12, 18, 33],
      [41, 45, 52, 60, 62],
      [70, 72],
      [85, 90, 99],
    ],
    revealed: [],
    resolve_at: 0,
    take_seat: null,
    turn_seat: null,
    last_events: [],
    round_log: [],
    waiting_since: WAITING,
    players: [player(0), player(1)],
    hand: [7, 24, 64, 77],
    chosen: null,
    ...overrides,
  };
}

describe('Nimm6GameView', () => {
  let fixture: ComponentFixture<Nimm6GameView>;
  let component: Nimm6GameView;
  let nimm6: Record<string, ReturnType<typeof vi.fn>>;

  async function render(userId: string, game: N6Game | null): Promise<void> {
    nimm6['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(Nimm6GameView);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lobbyId', 'lobby-1');
    fixture.componentRef.setInput('hostUserId', 'host');
    fixture.componentRef.setInput('userId', userId);
    fixture.detectChanges();
    await vi.waitFor(() => expect(component.loading()).toBe(false));
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement;
  const buttons = (): HTMLButtonElement[] => [...el().querySelectorAll('button')];
  const button = (label: string) =>
    buttons().find((candidate) => candidate.textContent?.includes(label));
  const card = (n: number) =>
    buttons().find((candidate) => candidate.getAttribute('aria-label')?.startsWith(`${n},`));
  const turn = expect.objectContaining({ id: 'game-1', waiting_since: WAITING });

  beforeEach(async () => {
    nimm6 = {
      load: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      choose: vi.fn().mockResolvedValue({ ok: true }),
      takeRow: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      nextRound: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };

    await TestBed.configureTestingModule({
      imports: [Nimm6GameView],
      providers: [
        provideRouter([]),
        { provide: Nimm6Service, useValue: nimm6 },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(true) })) } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('picks a card without saying where it goes and lays it face down', async () => {
    await render('guest', makeGame());
    expect(button('Karte wählen')!.disabled).toBe(true);

    card(77)!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('77 gewählt');
    expect(el().textContent).not.toContain('Reihe 3');
    expect(el().querySelector('.row[data-tone]')).toBeNull();
    card(7)!.click();
    fixture.detectChanges();
    expect(el().textContent).not.toContain('kleiner als jede Reihe');

    button('Karte 7 legen')!.click();
    await vi.waitFor(() => expect(nimm6['choose']).toHaveBeenCalledWith(turn, 7));
  });

  it('waits for the others after laying a card', async () => {
    await render(
      'guest',
      makeGame({ chosen: 24, players: [player(0), player(1, { ready: true })] }),
    );
    expect(el().textContent).toContain('Deine 24 liegt verdeckt – warte auf Host');
    expect(button('Gelegt')!.disabled).toBe(true);
    expect(card(77)!.disabled).toBe(true);
  });

  it('lets the player with a too low card take a row, the cheapest first', async () => {
    const take = makeGame({
      phase: 'take',
      take_seat: 1,
      turn_seat: 1,
      revealed: [
        { s: 1, c: 7 },
        { s: 0, c: 50 },
      ],
      hand: [24, 64, 77],
    });
    await render('guest', take);
    expect(el().textContent).toContain('Deine 7 passt nirgends');
    expect(el().textContent).toContain('Reihe 3 · 2 Karten');
    buttons()
      .find((b) => b.getAttribute('aria-label')?.startsWith('Reihe 1 nehmen'))!
      .click();
    fixture.detectChanges();
    button('Reihe 1 nehmen')!.click();
    await vi.waitFor(() => expect(nimm6['takeRow']).toHaveBeenCalledWith(turn, 0));
    fixture.destroy();

    await render('host', take);
    expect(el().textContent).toContain('Gast wählt eine Reihe für die 7');
    expect(button('Reihe 1 nehmen')).toBeUndefined();
  });

  it('shows a face-down card at every seat that has chosen', async () => {
    await render(
      'guest',
      makeGame({ chosen: 24, players: [player(0, { ready: true }), player(1, { ready: true })] }),
    );
    const laid = (seat: number) => el().querySelector(`[data-laid="${seat}"]`);
    expect(laid(0)?.classList.contains('face')).toBe(false);
    expect(laid(1)?.classList.contains('face')).toBe(false);
    fixture.destroy();

    await render('guest', makeGame({ players: [player(0, { ready: true }), player(1)] }));
    expect(laid(0)).not.toBeNull();
    expect(laid(1)).toBeNull();
  });

  it('turns the cards over, flies them in and hands a taken row over as a pile', async () => {
    vi.useFakeTimers();
    let changed = () => {};
    nimm6['subscribe'].mockImplementation((_id: string, onChange: () => void) => {
      changed = onChange;
      return () => {};
    });
    await render(
      'guest',
      makeGame({ chosen: 77, players: [player(0, { ready: true }), player(1, { ready: true })] }),
    );

    // Host legt die 64 als 6. Karte in Reihe 2 (8 Hornochsen), Gast die 77 an Reihe 3
    nimm6['load'].mockResolvedValue({
      ok: true,
      value: makeGame({
        turn_no: 2,
        waiting_since: '2026-10-14T12:00:40Z',
        card_rows: [[12, 18, 33], [64], [70, 72, 77], [85, 90, 99]],
        revealed: [
          { s: 0, c: 64 },
          { s: 1, c: 77 },
        ],
        resolve_at: 2,
        last_events: [
          {
            t: 'reveal',
            played: [
              { s: 0, c: 64 },
              { s: 1, c: 77 },
            ],
          },
          { t: 'six', seat: 0, card: 64, row: 1, n: 8, cards: [41, 45, 52, 60, 62] },
          { t: 'place', seat: 1, card: 77, row: 2 },
        ],
        players: [player(0, { score: 8, round_bulls: 8, rows_taken: 1, sixths: 1 }), player(1)],
        hand: [7, 24, 64],
      }),
    });
    changed();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    const laid = (seat: number) => el().querySelector(`[data-laid="${seat}"]`)!;
    expect(laid(0).classList.contains('turning')).toBe(true);

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(laid(0).classList.contains('face')).toBe(true);
    expect(laid(0).getAttribute('aria-label')).toMatch(/^64,/);

    // Reihe schiebt sich zum Haufen, darauf die Hornochsen
    await vi.advanceTimersByTimeAsync(1_800 - 300 + 1_250);
    fixture.detectChanges();
    expect(el().querySelector('.pile-badge')?.textContent).toContain('+8');
    expect(el().querySelector('.hit')).toBeNull();

    // Haufen ist beim Host angekommen: „+8“ am Platz
    await vi.advanceTimersByTimeAsync(1_800);
    fixture.detectChanges();
    expect(el().querySelector('.pile-badge')).toBeNull();
    expect(el().querySelector('[data-seat="0"] .hit')?.textContent).toContain('+8');
  });

  it('has no turn clock and never skips by itself', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    await vi.advanceTimersByTimeAsync(120_000);
    fixture.detectChanges();
    expect(nimm6['skip']).not.toHaveBeenCalled();
    expect(el().querySelector('.clock')).toBeNull();
  });

  it('shows the round summary and starts the next round by itself', async () => {
    vi.useFakeTimers();
    await render(
      'guest',
      makeGame({
        phase: 'round_over',
        turn_no: 10,
        players: [
          player(0, { score: 12, round_bulls: 12 }),
          player(1, { score: 5, round_bulls: 5 }),
        ],
      }),
    );
    expect(el().textContent).toContain('Runde 1 vorbei');
    expect(el().textContent).toContain('Sauberste: Gast +5');
    // Erst kurz lesen lassen, dann per Knopf weiter
    const start = () => buttons().find((b) => b.textContent?.includes('Runde 2 starten'))!;
    expect(start().disabled).toBe(true);
    // Uhr im Sekundentakt: frei nach 3 bis 4 s
    await vi.advanceTimersByTimeAsync(4_000);
    fixture.detectChanges();
    expect(start().disabled).toBe(false);
    await vi.advanceTimersByTimeAsync(8_500);
    expect(nimm6['nextRound']).toHaveBeenCalledWith('game-1', 1);
  });

  it('shows "du hast" when only you passed the limit', async () => {
    await render(
      'guest',
      makeGame({
        status: 'finished',
        phase: 'round_over',
        round_no: 4,
        players: [player(0, { score: 31 }), player(1, { score: 70 })],
      }),
    );
    expect(el().textContent).toContain('du hast die 66 geknackt');
  });

  it('ranks the fewest bulls first when the game is over', async () => {
    await render(
      'guest',
      makeGame({
        status: 'finished',
        phase: 'round_over',
        round_no: 4,
        players: [player(0, { score: 70 }), player(1, { score: 31, rows_taken: 4, sixths: 2 })],
      }),
    );
    expect(el().textContent).toContain('Du gewinnt!');
    expect(el().textContent).toContain('Host hat die 66 geknackt');
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
  });
});
