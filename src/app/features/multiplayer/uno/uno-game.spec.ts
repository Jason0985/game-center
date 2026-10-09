import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { FeedbackService } from '../../../services/feedback.service';
import { UnoGameView } from './uno-game';
import { UnoService } from './uno.service';
import { UnoGame, UnoPlayer } from './uno.model';

function player(seat: number, overrides: Partial<UnoPlayer> = {}): UnoPlayer {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    hand_count: 5,
    uno_called: false,
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

function makeGame(overrides: Partial<UnoGame> = {}): UnoGame {
  return {
    id: 'game-1',
    status: 'playing',
    settings: { stacking: false, sevenZero: false, drawUntilPlayable: false },
    seat_count: 3,
    round_no: 1,
    dealer_seat: 2,
    turn_seat: 0,
    turn_no: 1,
    direction: 1,
    color: 'B',
    discard_top: ['R2', 'B7'],
    pending_draw: 0,
    drew: false,
    uno_open_seat: null,
    winner_seat: null,
    last_events: [],
    round_log: [{ t: 'start', round: 1, seat: 2, r: 1, at: '2026-10-02T12:00:00Z' }],
    waiting_since: '2026-10-02T12:00:00Z',
    players: [player(0, { hand_count: 5 }), player(1), player(2)],
    hand: ['R3', 'R7', 'Y7', 'B2', 'W'],
    drawn: null,
    ...overrides,
  };
}

describe('UnoGameView', () => {
  let fixture: ComponentFixture<UnoGameView>;
  let component: UnoGameView;
  let uno: Record<string, ReturnType<typeof vi.fn>>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  async function render(userId: string, game: UnoGame | null): Promise<void> {
    uno['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(UnoGameView);
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
  const labelled = (label: string) =>
    buttons().find((candidate) => candidate.getAttribute('aria-label') === label);
  const enabledCards = () =>
    buttons()
      .filter((candidate) => candidate.classList.contains('hand-card') && !candidate.disabled)
      .map((candidate) => candidate.getAttribute('aria-label'));
  const tap = (label: string) => {
    labelled(label)!.click();
    fixture.detectChanges();
  };
  const turn = expect.objectContaining({ id: 'game-1', waiting_since: '2026-10-02T12:00:00Z' });
  // Das ⋮-Menü liegt im Overlay außerhalb der Komponente
  const openMenu = async (): Promise<HTMLElement[]> => {
    button('more_vert')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
  };
  const menuItem = (items: HTMLElement[], label: string) =>
    items.find((item) => item.textContent?.includes(label));

  beforeEach(async () => {
    uno = {
      load: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      play: vi.fn().mockResolvedValue({ ok: true }),
      draw: vi.fn().mockResolvedValue({ ok: true }),
      pass: vi.fn().mockResolvedValue({ ok: true }),
      callUno: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      nextRound: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(true) })) };

    await TestBed.configureTestingModule({
      imports: [UnoGameView],
      providers: [
        provideRouter([]),
        { provide: UnoService, useValue: uno },
        { provide: MatDialog, useValue: dialog },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays sound/vibration only for new events, not for what was there on opening', async () => {
    const play = vi.spyOn(TestBed.inject(FeedbackService), 'play').mockImplementation(() => {});
    const unoCall = { t: 'uno' as const, seat: 0, r: 2, at: '2026-10-02T12:00:05Z' };
    await render('guest', makeGame({ round_log: [...makeGame().round_log, unoCall] }));
    expect(play).not.toHaveBeenCalled();

    // Gast ist jetzt dran, im selben Zug ruft der Host Uno
    uno['load'].mockResolvedValue({
      ok: true,
      value: makeGame({
        turn_seat: 1,
        round_log: [
          ...makeGame().round_log,
          unoCall,
          { t: 'play', seat: 0, card: 'R3', r: 3, at: '2026-10-02T12:00:09Z' },
          { t: 'uno', seat: 0, r: 3, at: '2026-10-02T12:00:09Z' },
        ],
      }),
    });
    await component['table'].load();
    fixture.detectChanges();

    expect(play.mock.calls).toEqual([['turn'], ['alert']]);
  });

  it('shows the table while playing and the round end once finished', async () => {
    await render('guest', makeGame());
    expect(el().querySelector('app-uno-board')).not.toBeNull();
    expect(el().textContent).not.toContain('Stapel:');
    fixture.destroy();

    const finished = makeGame({
      status: 'finished',
      turn_seat: null,
      winner_seat: 1,
      players: [
        player(0, { hand_count: 3 }),
        player(1, { hand_count: 0 }),
        player(2, { hand_count: 6 }),
      ],
    });
    await render('guest', finished);
    expect(el().querySelector('app-uno-final')).not.toBeNull();
    expect(el().textContent).toContain('Gast gewinnt!');
    expect(el().textContent).toContain('Alle Karten losgeworden');
    expect(el().textContent).not.toContain('Punkte');
  });

  it('keeps the table for a moment when the round ends live', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    uno['load'].mockResolvedValue({
      ok: true,
      value: makeGame({ status: 'finished', turn_seat: null, winner_seat: 0 }),
    });
    uno['subscribe'].mock.calls[0][1]();
    await vi.waitFor(() => expect(component.game()?.status).toBe('finished'));
    fixture.detectChanges();
    expect(el().querySelector('app-uno-board')).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1_200);
    fixture.detectChanges();
    expect(el().querySelector('app-uno-final')).not.toBeNull();
  });

  it('enables only fitting cards, and none when it is not my turn', async () => {
    await render('host', makeGame());
    expect(enabledCards()).toEqual([
      'Rot 7 spielen',
      'Gelb 7 spielen',
      'Blau 2 spielen',
      'Farbwahl spielen',
    ]);
    fixture.destroy();

    await render('guest', makeGame());
    expect(enabledCards()).toEqual([]);
    expect(labelled('Karte ziehen')!.disabled).toBe(true);
  });

  it('plays a number card right away', async () => {
    await render('host', makeGame());
    tap('Blau 2 spielen');
    await vi.waitFor(() => expect(uno['play']).toHaveBeenCalledWith(turn, 'B2', null, null));
  });

  it('asks for the colour of a wild card', async () => {
    await render('host', makeGame());
    tap('Farbwahl spielen');
    expect(uno['play']).not.toHaveBeenCalled();
    tap('Grün wählen');
    await vi.waitFor(() => expect(uno['play']).toHaveBeenCalledWith(turn, 'W', 'G', null));
  });

  it('asks whom to swap with for a 7 under 7-0', async () => {
    await render('host', makeGame({ settings: { sevenZero: true } }));
    expect(el().querySelector('.house-rules li')?.textContent).toBe('7 tauscht, 0 dreht');
    tap('Rot 7 spielen');
    expect(uno['play']).not.toHaveBeenCalled();
    expect(el().querySelector('p.sr-only[aria-live]')?.textContent).toContain(
      'Wähle, mit wem du die Karten tauschst',
    );
    const target = el().querySelector<HTMLButtonElement>('button[appunoseat][data-seat="2"]')!;
    expect(target.getAttribute('aria-label')).toBe('Dritte, 5 Karten – Karten tauschen');
    target.click();
    await vi.waitFor(() => expect(uno['play']).toHaveBeenCalledWith(turn, 'R7', null, 2));
  });

  it('still asks for a swap partner for a last 7 while my own Uno window is open', async () => {
    const lastSeven = { settings: { sevenZero: true }, hand: ['R7' as const] };
    await render('host', makeGame({ ...lastSeven, uno_open_seat: 0 }));
    tap('Rot 7 spielen');
    expect(uno['play']).not.toHaveBeenCalled();
    fixture.destroy();

    await render('host', makeGame(lastSeven));
    tap('Rot 7 spielen');
    await vi.waitFor(() => expect(uno['play']).toHaveBeenCalledWith(turn, 'R7', null, null));
  });

  it('draws from the pile and keeps the drawn card on the second tap', async () => {
    await render('host', makeGame());
    tap('Karte ziehen');
    await vi.waitFor(() => expect(uno['draw']).toHaveBeenCalledWith(turn));
    fixture.destroy();

    await render('host', makeGame({ drew: true, drawn: 'B2', hand: ['R3', 'B2', 'W'] }));
    expect(enabledCards()).toEqual(['Blau 2 spielen']);
    tap('Karte behalten, Zug beenden');
    await vi.waitFor(() => expect(uno['pass']).toHaveBeenCalledWith(turn));
  });

  it('shows a pending +2 with the chip, a glowing pile and draw as the only move', async () => {
    const pending = makeGame({ discard_top: ['B+2'], pending_draw: 2 });
    await render('guest', { ...pending, turn_seat: 0 });
    const seat = el().querySelector('[data-seat="0"]')!;
    expect(seat.getAttribute('aria-label')).toContain('muss 2 ziehen');
    expect(seat.textContent).toContain('+2');
    fixture.destroy();

    await render('host', pending);
    expect(enabledCards()).toEqual([]);
    const pile = labelled('2 Karten ziehen')!;
    expect(pile.classList).toContain('glow');
    pile.click();
    await vi.waitFor(() => expect(uno['draw']).toHaveBeenCalledWith(turn));
  });

  it('lights the Uno button only when calling makes sense', async () => {
    await render('host', makeGame());
    expect(labelled('Uno rufen')!.disabled).toBe(true);
    fixture.destroy();

    await render(
      'host',
      makeGame({
        hand: ['B2', 'R1'],
        players: [player(0, { hand_count: 2 }), player(1), player(2)],
      }),
    );
    const uno_ = labelled('Uno rufen')!;
    expect(uno_.disabled).toBe(false);
    expect(uno_.classList).toContain('lit');
    uno_.click();
    await vi.waitFor(() => expect(uno['callUno']).toHaveBeenCalledWith('game-1'));
  });

  it('lets the host skip a waiting player via the game menu', async () => {
    vi.useFakeTimers();
    await render('host', makeGame({ turn_seat: 1 }));
    let items = await openMenu();
    expect(menuItem(items, 'überspringen')).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(31_000);
    fixture.detectChanges();
    items = await openMenu();
    menuItem(items, 'Gast überspringen')!.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(dialog.open).toHaveBeenCalled();
    expect(uno['skip']).toHaveBeenCalledWith(turn);
  });

  it('offers the next round only to the host', async () => {
    const finished = makeGame({ status: 'finished', turn_seat: null, winner_seat: 0, round_no: 2 });
    await render('guest', finished);
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
    expect(button('Nächste Runde')).toBeUndefined();
    fixture.destroy();

    await render('host', finished);
    button('Nächste Runde')!.click();
    await vi.waitFor(() => expect(uno['nextRound']).toHaveBeenCalledWith('game-1', 2));
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    fixture.detectChanges();
    const returned = vi.fn();
    component.returned.subscribe(returned);
    button('Zurück zur Warte-Lobby')!.click();
    await vi.waitFor(() => expect(uno['returnToLobby']).toHaveBeenCalledWith('lobby-1'));
    await vi.waitFor(() => expect(returned).toHaveBeenCalled());
  });
});
