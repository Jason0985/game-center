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

  it('picks a card, says where it goes and lays it face down', async () => {
    await render('guest', makeGame());
    expect(button('Karte wählen')!.disabled).toBe(true);

    card(77)!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('77 kommt an Reihe 3 (nach 72)');
    card(64)!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('64 wäre die 6. Karte in Reihe 2');
    card(7)!.click();
    fixture.detectChanges();
    expect(el().textContent).toContain('7 ist kleiner als jede Reihe');

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

  it('plays for the slow ones once after the turn time', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    await vi.advanceTimersByTimeAsync(29_000);
    expect(nimm6['skip']).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(nimm6['skip']).toHaveBeenCalledTimes(1);
    expect(nimm6['skip']).toHaveBeenCalledWith(turn);
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
    await vi.advanceTimersByTimeAsync(8_500);
    expect(nimm6['nextRound']).toHaveBeenCalledWith('game-1', 1);
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
