import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { BlackjackGameView } from './blackjack-game';
import { BlackjackService } from './blackjack.service';
import { BjGame, BjHand, BjPlayer } from './blackjack.model';

function hand(cards: string[], overrides: Partial<BjHand> = {}): BjHand {
  return {
    hand_no: 0,
    cards,
    bet: 50,
    doubled: false,
    state: 'playing',
    result: null,
    payout: null,
    ...overrides,
  };
}

function player(seat: number, overrides: Partial<BjPlayer> = {}): BjPlayer {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    balance: 1000,
    bet: 0,
    last_bet: 0,
    name: ['Host', 'Gast', 'Dritte'][seat],
    hands: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<BjGame> = {}): BjGame {
  return {
    id: 'game-1',
    status: 'playing',
    phase: 'betting',
    seat_count: 2,
    start_money: 1000,
    round_no: 1,
    turn_seat: null,
    turn_hand: null,
    dealer_cards: [],
    dealer_hole: false,
    shoe_count: 312,
    first_bet_at: null,
    last_events: [],
    round_log: [],
    waiting_since: null,
    players: [player(0), player(1)],
    ...overrides,
  };
}

// Host am Zug mit Ass + 6, Gast hält 18
function playingGame(overrides: Partial<BjGame> = {}): BjGame {
  return makeGame({
    phase: 'playing',
    turn_seat: 0,
    turn_hand: 0,
    dealer_cards: ['9S'],
    dealer_hole: true,
    waiting_since: '2026-10-10T12:00:00Z',
    players: [
      player(0, { balance: 950, hands: [hand(['AS', '6D'])] }),
      player(1, { balance: 950, hands: [hand(['10C', '8D'], { state: 'stood' })] }),
    ],
    ...overrides,
  });
}

describe('BlackjackGameView', () => {
  let fixture: ComponentFixture<BlackjackGameView>;
  let component: BlackjackGameView;
  let blackjack: Record<string, ReturnType<typeof vi.fn>>;

  async function render(userId: string, game: BjGame | null): Promise<void> {
    blackjack['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(BlackjackGameView);
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
  const turn = expect.objectContaining({ id: 'game-1', waiting_since: '2026-10-10T12:00:00Z' });
  const openMenu = async (): Promise<HTMLElement[]> => {
    button('more_vert')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
  };

  beforeEach(async () => {
    blackjack = {
      load: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      bet: vi.fn().mockResolvedValue({ ok: true }),
      deal: vi.fn().mockResolvedValue({ ok: true }),
      play: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };

    await TestBed.configureTestingModule({
      imports: [BlackjackGameView],
      providers: [
        provideRouter([]),
        { provide: BlackjackService, useValue: blackjack },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({ afterClosed: () => of(true) })) } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets a bet from chips', async () => {
    await render('guest', makeGame());
    labelled('Chip 25 setzen')!.click();
    labelled('Chip 25 setzen')!.click();
    fixture.detectChanges();
    button('Setzen · 50')!.click();
    await vi.waitFor(() => expect(blackjack['bet']).toHaveBeenCalledWith('game-1', 1, 50));
  });

  it('offers the same bet again after a round', async () => {
    const settled = hand(['10C', '9H'], { state: 'stood', result: 'win', payout: 100 });
    await render(
      'host',
      makeGame({
        round_no: 2,
        players: [player(0, { last_bet: 50, hands: [settled] }), player(1)],
      }),
    );
    button('Nochmal · 50')!.click();
    await vi.waitFor(() => expect(blackjack['bet']).toHaveBeenCalledWith('game-1', 2, 50));
  });

  it('plays the hand on turn and only then', async () => {
    await render('host', playingGame());
    expect(button('Teilen')!.disabled).toBe(true);
    button('Ziehen')!.click();
    await vi.waitFor(() => expect(blackjack['play']).toHaveBeenCalledWith(turn, 'hit'));
    fixture.destroy();

    await render('guest', playingGame());
    expect(button('Ziehen')!.disabled).toBe(true);
    expect(el().textContent).toContain('Host ist am Zug');
  });

  it('deals once when the betting window runs out', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame({ first_bet_at: '2026-10-10T12:00:00Z' }));
    await vi.advanceTimersByTimeAsync(19_000);
    expect(blackjack['deal']).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(blackjack['deal']).toHaveBeenCalledTimes(1);
    expect(blackjack['deal']).toHaveBeenCalledWith('game-1', 1);
  });

  it('lets the hand stand after 30 s, but only with others at the table', async () => {
    vi.useFakeTimers();
    await render('guest', playingGame());
    await vi.advanceTimersByTimeAsync(29_000);
    expect(blackjack['skip']).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(blackjack['skip']).toHaveBeenCalledTimes(1);
    expect(blackjack['skip']).toHaveBeenCalledWith(turn);
    fixture.destroy();
    blackjack['skip'].mockClear();

    const solo = playingGame({ seat_count: 1 });
    await render('host', { ...solo, players: [solo.players[0]] });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(blackjack['skip']).not.toHaveBeenCalled();
  });

  it('never offers skipping while bets are placed', async () => {
    vi.useFakeTimers();
    await render('host', makeGame());
    await vi.advanceTimersByTimeAsync(31_000);
    fixture.detectChanges();
    const items = await openMenu();
    expect(items.some((item) => item.textContent?.includes('überspringen'))).toBe(false);
  });

  it('offers the host to skip others only, never themselves', async () => {
    vi.useFakeTimers();
    await render('host', playingGame());
    await vi.advanceTimersByTimeAsync(31_000);
    expect(component.skipName()).toBeNull();
    fixture.destroy();

    await render('host', playingGame({ turn_seat: 1 }));
    await vi.advanceTimersByTimeAsync(31_000);
    expect(component.skipName()).toBe('Gast');
    fixture.destroy();

    const solo = playingGame({ seat_count: 1 });
    await render('host', { ...solo, players: [solo.players[0]] });
    await vi.advanceTimersByTimeAsync(31_000);
    expect(component.skipName()).toBeNull();
  });

  it('shows the own final balance when a solo game is over', async () => {
    await render(
      'host',
      makeGame({
        status: 'finished',
        seat_count: 1,
        round_no: 5,
        players: [player(0, { balance: 0 })],
      }),
    );
    expect(el().textContent).toContain('Dein Endstand');
    expect(el().textContent).toContain('−1.000 seit dem Start');
    expect(button('Zurück zur Warte-Lobby')).toBeDefined();
  });

  it('ranks by balance when a game with others is over', async () => {
    await render(
      'guest',
      makeGame({
        status: 'finished',
        round_no: 3,
        players: [player(0, { balance: 1240 }), player(1, { balance: 800 })],
      }),
    );
    expect(el().textContent).toContain('Host gewinnt!');
    expect(el().textContent).toContain('+240');
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
  });
});
