import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { SkipboGameView } from './skipbo-game';
import { SkipboService } from './skipbo.service';
import { SkipboGame, SkipboPlayer } from './skipbo.model';

function player(seat: number, overrides: Partial<SkipboPlayer> = {}): SkipboPlayer {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    stock_count: 20,
    stock_top: '2',
    hand_count: 5,
    discards: [[], [], [], []],
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

function makeGame(overrides: Partial<SkipboGame> = {}): SkipboGame {
  return {
    id: 'game-1',
    status: 'playing',
    seat_count: 3,
    dealer_seat: 2,
    turn_seat: 0,
    turn_no: 1,
    build_piles: [
      ['1', '2', '3', '4'],
      [],
      ['1'],
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    ],
    draw_count: 80,
    winner_seat: null,
    last_events: [],
    round_log: [{ t: 'start', seat: 2, r: 0, at: '2026-09-30T12:00:00Z' }],
    waiting_since: '2026-09-30T12:00:00Z',
    players: [player(0, { discards: [['9'], [], [], []] }), player(1), player(2)],
    hand: ['5', '9', 'SB', '2', '12'],
    ...overrides,
  };
}

describe('SkipboGameView', () => {
  let fixture: ComponentFixture<SkipboGameView>;
  let component: SkipboGameView;
  let skipbo: Record<string, ReturnType<typeof vi.fn>>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  async function render(userId: string, game: SkipboGame | null): Promise<void> {
    skipbo['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(SkipboGameView);
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
  const labels = (prefix: string) =>
    buttons()
      .map((candidate) => candidate.getAttribute('aria-label') ?? '')
      .filter((label) => label.startsWith(prefix));
  const tap = (label: string) => {
    labelled(label)!.click();
    fixture.detectChanges();
  };
  const turn = expect.objectContaining({ id: 'game-1', waiting_since: '2026-09-30T12:00:00Z' });
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
    skipbo = {
      load: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      play: vi.fn().mockResolvedValue({ ok: true }),
      discard: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(true) })) };

    await TestBed.configureTestingModule({
      imports: [SkipboGameView],
      providers: [
        provideRouter([]),
        { provide: SkipboService, useValue: skipbo },
        { provide: MatDialog, useValue: dialog },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the table while playing and the final overview once finished', async () => {
    await render('guest', makeGame());
    expect(el().querySelector('app-skipbo-board')).not.toBeNull();
    expect(el().textContent).toContain('Stapel: 80 Karten');
    fixture.destroy();

    await render('guest', makeGame({ status: 'finished', turn_seat: null, winner_seat: 1 }));
    expect(el().querySelector('app-skipbo-final')).not.toBeNull();
    expect(el().textContent).toContain('Gast gewinnt!');
  });

  it('keeps the table for a moment when the game ends live', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame());
    skipbo['load'].mockResolvedValue({
      ok: true,
      value: makeGame({ status: 'finished', turn_seat: null, winner_seat: 0 }),
    });
    skipbo['subscribe'].mock.calls[0][1]();
    await vi.waitFor(() => expect(component.game()?.status).toBe('finished'));
    fixture.detectChanges();
    expect(el().querySelector('app-skipbo-board')).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1_200);
    fixture.detectChanges();
    expect(el().querySelector('app-skipbo-final')).not.toBeNull();
  });

  it('offers only the fitting build piles for a hand card', async () => {
    await render('host', makeGame());
    expect(labels('Aufbaustapel')).toEqual([]);

    tap('Handkarte 5 wählen');
    expect(labels('Aufbaustapel')).toEqual(['Aufbaustapel 1, liegt bei 4, 5 anlegen']);
    // Nochmal antippen hebt die Wahl auf
    tap('Handkarte 5 abwählen');
    expect(labels('Aufbaustapel')).toEqual([]);

    tap('Handkarte 5 wählen');
    tap('Aufbaustapel 1, liegt bei 4, 5 anlegen');
    await vi.waitFor(() =>
      expect(skipbo['play']).toHaveBeenCalledWith(turn, { kind: 'hand', index: 0 }, 0),
    );
  });

  it('ends the turn with a hand card on an own discard pile', async () => {
    await render('host', makeGame());
    tap('Handkarte 9 wählen');
    expect(labels('Ablage')).toEqual([
      'Ablage 1 (1 Karte: 9), hier ablegen und Zug beenden',
      'Ablage 2 (leer), hier ablegen und Zug beenden',
      'Ablage 3 (leer), hier ablegen und Zug beenden',
      'Ablage 4 (leer), hier ablegen und Zug beenden',
    ]);
    tap('Ablage 2 (leer), hier ablegen und Zug beenden');
    await vi.waitFor(() => expect(skipbo['discard']).toHaveBeenCalledWith(turn, 1, 1));
  });

  it('plays from the stock and the discard piles without discard targets', async () => {
    await render('host', makeGame());
    tap('Spielstapel, oberste Karte 2 wählen, noch 20 Karten');
    expect(labels('Ablage')).toEqual(['Ablage 1, oberste Karte 9 wählen']);
    expect(labels('Aufbaustapel')).toEqual(['Aufbaustapel 3, liegt bei 1, 2 anlegen']);

    tap('Ablage 1, oberste Karte 9 wählen');
    expect(labels('Ablage')).toEqual(['Ablage 1, oberste Karte 9 abwählen']);
    expect(labels('Spielstapel')).toEqual(['Spielstapel, oberste Karte 2 wählen, noch 20 Karten']);
    expect(labels('Aufbaustapel')).toEqual([]);

    tap('Spielstapel, oberste Karte 2 wählen, noch 20 Karten');
    tap('Aufbaustapel 3, liegt bei 1, 2 anlegen');
    await vi.waitFor(() =>
      expect(skipbo['play']).toHaveBeenCalledWith(turn, { kind: 'stock', index: 0 }, 2),
    );
  });

  it('lets the joker go on every pile below 12', async () => {
    await render('host', makeGame());
    tap('Handkarte Joker wählen');
    expect(labels('Aufbaustapel')).toEqual([
      'Aufbaustapel 1, liegt bei 4, Joker als 5 anlegen',
      'Aufbaustapel 2, leer, Joker als 1 anlegen',
      'Aufbaustapel 3, liegt bei 1, Joker als 2 anlegen',
      'Aufbaustapel 4, liegt bei 11, Joker als 12 anlegen',
    ]);
  });

  it('locks the own cards while someone else is at turn', async () => {
    await render('guest', makeGame());
    const hand = buttons().filter((candidate) =>
      candidate.getAttribute('aria-label')?.startsWith('Handkarte'),
    );
    expect(hand.length).toBe(5);
    expect(hand.every((card) => card.disabled)).toBe(true);
    expect(labels('Aufbaustapel')).toEqual([]);
    expect(labels('Spielstapel')).toEqual([]);
    expect(el().querySelector('[aria-live="polite"].sr-only')?.textContent).toContain(
      'Host ist am Zug.',
    );
  });

  it('shows the last discard in the header, not the next player refilling', async () => {
    const at = '2026-09-30T12:00:00Z';
    await render(
      'host',
      makeGame({
        turn_seat: 2,
        round_log: [
          { t: 'discard', seat: 1, card: '9', pile: 0, r: 1, at },
          { t: 'draw', seat: 2, n: 1, r: 2, at },
        ],
      }),
    );
    expect(component.lastEvent()?.text).toBe('Gast legt eine 9 ab');
    expect(labelled('Verlauf öffnen. Zuletzt: Gast legt eine 9 ab')).toBeDefined();
  });

  it('puts host actions and leaving into the game menu', async () => {
    vi.useFakeTimers();
    await render('host', makeGame({ turn_seat: 1 }));
    let items = await openMenu();
    expect(menuItem(items, 'Spiel beenden')).toBeDefined();
    expect(menuItem(items, 'überspringen')).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(31_000);
    fixture.detectChanges();
    items = await openMenu();
    menuItem(items, 'Gast überspringen')!.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(dialog.open).toHaveBeenCalled();
    expect(skipbo['skip']).toHaveBeenCalledWith(turn);

    items = await openMenu();
    menuItem(items, 'Spiel beenden')!.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(skipbo['endGame']).toHaveBeenCalledWith('game-1');
    fixture.destroy();
    vi.useRealTimers();

    await render('guest', makeGame({ turn_seat: 1 }));
    const leave = vi.fn();
    component.leave.subscribe(leave);
    items = await openMenu();
    expect(menuItem(items, 'Spiel beenden')).toBeUndefined();
    menuItem(items, 'Spiel verlassen')!.click();
    expect(leave).toHaveBeenCalledWith(false);
  });

  it('lets only the host return to the lobby from the final overview', async () => {
    const finished = makeGame({ status: 'finished', turn_seat: null });
    await render('guest', finished);
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
    expect(button('Zurück zur Warte-Lobby')).toBeUndefined();
    fixture.destroy();

    await render('host', finished);
    const returned = vi.fn();
    component.returned.subscribe(returned);
    button('Zurück zur Warte-Lobby')!.click();
    await vi.waitFor(() => expect(skipbo['returnToLobby']).toHaveBeenCalledWith('lobby-1'));
    await vi.waitFor(() => expect(returned).toHaveBeenCalled());
  });
});
