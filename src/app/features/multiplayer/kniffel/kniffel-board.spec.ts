import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KniffelBoard } from './kniffel-board';
import { KnGame, KnPlayer } from './kniffel.model';

function player(seat: number, scores: (number | null)[], total: number): KnPlayer {
  return { user_id: `u${seat}`, seat, state: 'active', scores, total, name: `P${seat}` };
}

const FREE = Array<number | null>(13).fill(null);

function makeGame(overrides: Partial<KnGame> = {}): KnGame {
  return {
    id: 'g1',
    status: 'playing',
    seat_count: 2,
    turn_seat: 0,
    dice: [3, 3, 3, 5, 5],
    held: [false, false, false, false, false],
    rolls: 1,
    roll_seq: 1,
    waiting_since: 'now',
    players: [player(0, [3, ...FREE.slice(1)], 3), player(1, [null, 4, ...FREE.slice(2)], 4)],
    ...overrides,
  };
}

describe('KniffelBoard', () => {
  let fixture: ComponentFixture<KniffelBoard>;
  const el = () => fixture.nativeElement as HTMLElement;
  const sums = (row: number) =>
    [...el().querySelectorAll('tr.sum')[row].querySelectorAll('td')].map((td) =>
      td.textContent!.trim(),
    );

  async function render(game: KnGame): Promise<void> {
    fixture.componentRef.setInput('game', game);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KniffelBoard] }).compileComponents();
    fixture = TestBed.createComponent(KniffelBoard);
    fixture.componentRef.setInput('userId', 'u0');
  });

  afterEach(() => vi.useRealTimers());

  it('marks free fields without the points and hides the sums while playing', async () => {
    await render(makeGame());
    const picks = [...el().querySelectorAll<HTMLButtonElement>('button.pick')];
    expect(picks.length).toBe(12);
    expect(picks.every((pick) => pick.textContent!.trim() === '')).toBe(true);
    // Full House wäre 25 – steht nirgends
    const cells = [...el().querySelectorAll('tbody td')].map((td) => td.textContent!.trim());
    expect(cells.filter(Boolean)).toEqual(['3', '4']);
    expect(sums(0)).toEqual(['', '']);
    expect(sums(2)).toEqual(['', '']);

    picks[7].click();
    fixture.detectChanges();
    expect(el().querySelector('.enter')!.textContent).toContain('Full House eintragen');
    expect(el().querySelector('.enter')!.textContent).not.toContain('25');
  });

  it('counts the sums up for everyone once the game ends live', async () => {
    vi.useFakeTimers();
    await render(makeGame());
    const done = makeGame({
      status: 'finished',
      turn_seat: null,
      players: [player(0, Array(13).fill(10), 165), player(1, Array(13).fill(5), 70)],
    });
    await render(done);
    expect(sums(2)).toEqual(['', '']);
    expect(el().querySelector('.final')).toBeNull();

    await vi.advanceTimersByTimeAsync(10_000);
    fixture.detectChanges();
    expect(sums(2)).toEqual(['165', '70']);
    expect(el().querySelector('.final')!.textContent).toContain('Du gewinnst!');
  });

  it('shows the final sums at once when opening a finished game', async () => {
    await render(
      makeGame({
        status: 'finished',
        turn_seat: null,
        players: [player(0, Array(13).fill(1), 13), player(1, Array(13).fill(2), 26)],
      }),
    );
    expect(sums(2)).toEqual(['13', '26']);
    expect(el().querySelector('.final')!.textContent).toContain('P1 gewinnt!');
  });
});
