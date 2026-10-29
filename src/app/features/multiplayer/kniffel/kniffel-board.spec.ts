import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
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

  it('shows the points of the roll in the free fields but hides the sums', async () => {
    await render(makeGame());
    const picks = [...el().querySelectorAll<HTMLButtonElement>('button.pick')];
    expect(picks.length).toBe(12);
    // 3-3-3-5-5: Full House 25, Dreierpasch 19
    expect(picks[7].textContent!.trim()).toBe('25');
    expect(picks[5].textContent!.trim()).toBe('19');
    expect(sums(0)).toEqual(['', '']);
    expect(sums(2)).toEqual(['', '']);
  });

  it('enters a field only after confirming it in a dialog', async () => {
    await render(makeGame());
    const emitted: number[] = [];
    fixture.componentInstance.score.subscribe((category) => emitted.push(category));
    const answer = new Subject<boolean>();
    const open = vi
      .spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => answer } as unknown as MatDialogRef<unknown, boolean>);
    const picks = () => [...el().querySelectorAll<HTMLButtonElement>('button.pick')];
    picks()[7].click();
    fixture.detectChanges();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Full House eintragen?',
          confirmLabel: 'Eintragen',
        }),
      }),
    );
    expect(picks()[7].classList).toContain('selected');
    // Solange der Dialog offen ist, öffnet ein weiteres Antippen keinen zweiten
    picks()[5].click();
    expect(open).toHaveBeenCalledTimes(1);
    expect(emitted).toEqual([]);

    answer.next(true);
    answer.complete();
    await fixture.whenStable();
    expect(emitted).toEqual([8]);
  });

  it('asks before crossing out a field with 0', async () => {
    await render(makeGame());
    const emitted: number[] = [];
    fixture.componentInstance.score.subscribe((category) => emitted.push(category));
    const answer = new Subject<boolean>();
    const open = vi
      .spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => answer } as unknown as MatDialogRef<unknown, boolean>);
    // Kniffel (Feld 11) bringt mit 3-3-3-5-5 nichts
    const kniffel = () => el().querySelectorAll<HTMLButtonElement>('button.pick')[10];
    expect(kniffel().textContent!.trim()).toBe('0');
    kniffel().click();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Kniffel streichen?', confirmLabel: 'Streichen' }),
      }),
    );

    answer.next(false);
    answer.complete();
    await fixture.whenStable();
    expect(emitted).toEqual([]);

    const yes = new Subject<boolean>();
    open.mockReturnValue({ afterClosed: () => yes } as unknown as MatDialogRef<unknown, boolean>);
    kniffel().click();
    yes.next(true);
    yes.complete();
    await fixture.whenStable();
    expect(emitted).toEqual([11]);
  });

  it('shows the joker points for a second Kniffel', async () => {
    const scores = [3, ...FREE.slice(1)].map((v, i) => (i === 11 ? 50 : v));
    await render(
      makeGame({
        dice: [4, 4, 4, 4, 4],
        players: [player(0, scores, 53), player(1, [null, 4, ...FREE.slice(2)], 4)],
      }),
    );
    // Freie Felder: 1–10 und 12 (Kniffel ist belegt)
    const picks = [...el().querySelectorAll<HTMLButtonElement>('button.pick')];
    expect(picks.slice(7, 10).map((pick) => pick.textContent!.trim())).toEqual(['25', '30', '40']);
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

    // Zeile für Zeile: nach den Einsern stehen oben erst deren Punkte
    await vi.advanceTimersByTimeAsync(1500 + 1000);
    fixture.detectChanges();
    expect(sums(0)).toEqual(['10', '5']);
    expect(el().querySelector('tr.adding th')!.textContent).toContain('Einser');
    expect(el().querySelector('.tally')!.textContent).toContain('Einser kommt dazu');
    expect(sums(2)).toEqual(['', '']);

    // Die Abrechnung lässt sich Zeit: nach 10 s ist sie noch nicht durch
    await vi.advanceTimersByTimeAsync(7500);
    fixture.detectChanges();
    expect(el().querySelector('.final')).toBeNull();

    await vi.advanceTimersByTimeAsync(20_000);
    fixture.detectChanges();
    expect(sums(0)).toEqual(['60', '30']);
    expect(sums(2)).toEqual(['165', '70']);
    expect(el().querySelector('tr.adding')).toBeNull();
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
