import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AppErrorService } from '../../../services/app-error.service';
import { Flip7GameView } from './flip7-game';
import { Flip7Service } from './flip7.service';
import { Flip7Game, Flip7Player } from './flip7.model';

function player(seat: number, overrides: Partial<Flip7Player> = {}): Flip7Player {
  return {
    user_id: ['host', 'guest', 'third'][seat],
    seat,
    state: 'active',
    cards: [],
    total_score: 0,
    round_score: null,
    name: ['Host', 'Gast', 'Dritte'][seat],
    ...overrides,
  };
}

function makeGame(overrides: Partial<Flip7Game> = {}): Flip7Game {
  return {
    id: 'game-1',
    target_score: 200,
    status: 'playing',
    seat_count: 3,
    round_no: 1,
    dealer_seat: 2,
    phase: 'turn',
    turn_seat: 0,
    pending_card: null,
    pending_seat: null,
    flip3_seat: null,
    flip3_left: null,
    draw_count: 80,
    discard_count: 0,
    discard_top: [],
    last_events: [],
    round_log: [],
    waiting_since: '2026-09-30T12:00:00Z',
    players: [
      player(0, { cards: ['3'] }),
      player(1, { cards: ['5'] }),
      player(2, { cards: ['7'] }),
    ],
    ...overrides,
  };
}

describe('Flip7GameView', () => {
  let fixture: ComponentFixture<Flip7GameView>;
  let component: Flip7GameView;
  let flip7: Record<string, ReturnType<typeof vi.fn>>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  async function render(userId: string, game: Flip7Game | null): Promise<void> {
    flip7['load'].mockResolvedValue({ ok: true, value: game });
    fixture = TestBed.createComponent(Flip7GameView);
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
  // Gezogen wird per Antippen des verdeckten Stapels
  const drawPile = () => el().querySelector<HTMLButtonElement>('button.draw')!;
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
    flip7 = {
      load: vi.fn(),
      subscribe: vi.fn().mockReturnValue(() => {}),
      hit: vi.fn().mockResolvedValue({ ok: true }),
      stay: vi.fn().mockResolvedValue({ ok: true }),
      chooseTarget: vi.fn().mockResolvedValue({ ok: true }),
      skip: vi.fn().mockResolvedValue({ ok: true }),
      nextRound: vi.fn().mockResolvedValue({ ok: true }),
      endGame: vi.fn().mockResolvedValue({ ok: true }),
      continueOpen: vi.fn().mockResolvedValue({ ok: true }),
      returnToLobby: vi.fn().mockResolvedValue({ ok: true }),
    };
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(true) })) };

    await TestBed.configureTestingModule({
      imports: [Flip7GameView],
      providers: [
        provideRouter([]),
        { provide: Flip7Service, useValue: flip7 },
        { provide: MatDialog, useValue: dialog },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('switches between board, round summary and final overview', async () => {
    await render('guest', makeGame());
    expect(el().querySelector('app-flip7-board')).not.toBeNull();
    expect(el().textContent).toContain('Runde 1 · Ziel 200');
    fixture.destroy();

    vi.useFakeTimers();
    await render('guest', makeGame({ status: 'round_over', phase: null, turn_seat: null }));
    // Erst bleibt der Tisch kurz stehen, dann kommt die Übersicht
    expect(el().querySelector('app-flip7-board')).not.toBeNull();
    expect(el().textContent).toContain('Runde beendet');
    // Sekundentakt: nach spätestens 4 s ist die Übersicht da
    await vi.advanceTimersByTimeAsync(4_000);
    fixture.detectChanges();
    expect(el().querySelector('app-flip7-round-summary')).not.toBeNull();
    expect(el().textContent).toContain('Runde 1 beendet');
    fixture.destroy();
    vi.useRealTimers();

    await render('guest', makeGame({ status: 'finished', phase: null }));
    expect(el().querySelector('app-flip7-final')).not.toBeNull();
  });

  it('keeps the same table through the end of a round', async () => {
    await render('guest', makeGame());
    const board = el().querySelector('app-flip7-board');
    flip7['load'].mockResolvedValue({
      ok: true,
      value: makeGame({ status: 'round_over', phase: null, turn_seat: null }),
    });
    // Realtime meldet das Rundenende; der Tisch darf nicht neu entstehen (sonst keine Animation)
    flip7['subscribe'].mock.calls[0][1]();
    await vi.waitFor(() => expect(component.game()?.status).toBe('round_over'));
    fixture.detectChanges();
    expect(el().querySelector('app-flip7-board')).toBe(board);
  });

  it('enables drawing from the pile and Stay only on the own turn', async () => {
    await render('host', makeGame());
    expect(el().textContent).not.toContain('ist am Zug');
    // Kein Hinweis im Kopf (zu viel am Handy), nur für Screenreader
    expect(el().querySelector('.title-hint')).toBeNull();
    expect(el().querySelector('p.sr-only[aria-live]')?.textContent).toContain(
      'Stapel antippen zum Ziehen – oder Punkte sichern',
    );
    expect(drawPile().disabled).toBe(false);
    expect(drawPile().classList).toContain('glow');

    drawPile().click();
    // Mit dem angezeigten Stand, damit die Datenbank veraltete Züge ignorieren kann
    await vi.waitFor(() =>
      expect(flip7['hit']).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'game-1', waiting_since: '2026-09-30T12:00:00Z' }),
      ),
    );
    fixture.destroy();

    await render('guest', makeGame());
    expect(el().textContent).toContain('Host ist am Zug');
    expect(el().querySelector('.title-hint')).toBeNull();
    expect(drawPile().disabled).toBe(true);
    expect(button('Sichern')!.disabled).toBe(true);
  });

  it('shows a second life as a card, for me with the modifiers and at the others', async () => {
    await render(
      'host',
      makeGame({
        players: [player(0, { cards: ['3', 'SC'] }), player(1, { cards: ['5', 'SC'] }), player(2)],
      }),
    );
    expect(el().querySelector('.mod-sc')?.getAttribute('aria-label')).toBe(
      'Aktionskarte Zweites Leben',
    );
    expect(el().querySelectorAll('.fan-sc').length).toBe(1);
    expect(el().querySelector('.token--sc')).toBeNull();
  });

  it('lets you secure points only after drawing your first card', async () => {
    await render(
      'host',
      makeGame({ players: [player(0), player(1, { cards: ['5'] }), player(2, { cards: ['7'] })] }),
    );
    expect(drawPile().disabled).toBe(false);
    expect(button('Sichern')!.disabled).toBe(true);
    expect(el().querySelector('p.sr-only[aria-live]')?.textContent).toContain(
      'deine erste Karte ziehen',
    );
  });

  it('keeps the buttons disabled until the new state is loaded', async () => {
    await render('host', makeGame());
    let finishLoad!: (value: unknown) => void;
    flip7['load'].mockReturnValue(new Promise((resolve) => (finishLoad = resolve)));

    drawPile().click();
    await vi.waitFor(() => expect(flip7['hit']).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    fixture.detectChanges();
    expect(drawPile().disabled).toBe(true);
    drawPile().click();

    finishLoad({ ok: true, value: makeGame({ waiting_since: '2026-09-30T12:00:05Z' }) });
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    fixture.detectChanges();
    expect(drawPile().disabled).toBe(false);
    expect(flip7['hit']).toHaveBeenCalledTimes(1);
  });

  it('lets only the choosing player pick a target seat at the table', async () => {
    const pending = makeGame({ pending_card: 'FREEZE', pending_seat: 1, turn_seat: 1 });
    await render('guest', pending);
    expect(el().textContent).toContain('Wen frierst du ein?');
    const targets = [...el().querySelectorAll<HTMLButtonElement>('button[appflip7seat]')];
    expect(targets.map((target) => target.getAttribute('aria-label'))).toEqual([
      'Dritte einfrieren, 7 Rundenpunkte',
      'Host einfrieren, 3 Rundenpunkte',
      'Dich selbst wählen, 5 Rundenpunkte',
    ]);

    targets[1].click();
    await vi.waitFor(() =>
      expect(flip7['chooseTarget']).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'game-1', waiting_since: '2026-09-30T12:00:00Z' }),
        0,
      ),
    );
    fixture.destroy();

    await render('host', pending);
    expect(el().textContent).not.toContain('Wen frierst du ein?');
    expect(el().querySelector('button[appflip7seat]')).toBeNull();
    expect(el().textContent).toContain('Gast wählt ein Ziel für Freeze');
  });

  it('puts host actions and leaving into the game menu', async () => {
    vi.useFakeTimers();
    await render('host', makeGame({ turn_seat: 1 }));
    let items = await openMenu();
    expect(menuItem(items, 'Spiel beenden')).toBeDefined();
    expect(menuItem(items, 'Lobby schließen')).toBeDefined();
    expect(menuItem(items, 'überspringen')).toBeUndefined();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(31_000);
    fixture.detectChanges();
    items = await openMenu();
    expect(menuItem(items, 'wartet seit 0:3')).toBeDefined();
    menuItem(items, 'Gast überspringen')!.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(dialog.open).toHaveBeenCalled();
    expect(flip7['skip']).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'game-1', waiting_since: '2026-09-30T12:00:00Z' }),
    );
    fixture.destroy();
    vi.useRealTimers();

    await render('guest', makeGame({ turn_seat: 1 }));
    const leave = vi.fn();
    component.leave.subscribe(leave);
    items = await openMenu();
    expect(menuItem(items, 'Spiel beenden')).toBeUndefined();
    expect(menuItem(items, 'überspringen')).toBeUndefined();
    menuItem(items, 'Spiel verlassen')!.click();
    expect(leave).toHaveBeenCalledWith(false);
    fixture.destroy();

    // Nach Spielende verlässt man nur noch die Lobby
    await render('guest', makeGame({ status: 'finished', phase: null }));
    component.leave.subscribe(leave);
    items = await openMenu();
    menuItem(items, 'Lobby verlassen')!.click();
    expect(leave).toHaveBeenLastCalledWith(true);
  });

  it('lets only the host decide on the final overview', async () => {
    const finished = makeGame({ status: 'finished', phase: null });
    await render('guest', finished);
    expect(el().textContent).toContain('Der Host entscheidet, wie es weitergeht.');
    expect(button('Zurück zur Warte-Lobby')).toBeUndefined();
    expect(button('Weiterspielen')).toBeUndefined();
    fixture.destroy();

    await render('host', finished);
    const returned = vi.fn();
    component.returned.subscribe(returned);
    button('Weiterspielen')!.click();
    await vi.waitFor(() => expect(flip7['continueOpen']).toHaveBeenCalledWith('game-1'));
    await vi.waitFor(() => expect(component.busy()).toBe(false));
    button('Zurück zur Warte-Lobby')!.click();
    await vi.waitFor(() => expect(flip7['returnToLobby']).toHaveBeenCalledWith('lobby-1'));
    await vi.waitFor(() => expect(returned).toHaveBeenCalled());
  });

  it('shows a shared win on a tie', async () => {
    await render(
      'guest',
      makeGame({
        status: 'finished',
        players: [
          player(0, { total_score: 210 }),
          player(1, { total_score: 210 }),
          player(2, { state: 'left', total_score: 300 }),
        ],
      }),
    );
    expect(el().textContent).toContain('Gleichstand – geteilter Sieg');
    expect(el().textContent).toContain('verlassen');
  });

  it('starts the next round exactly once after the summary', async () => {
    vi.useFakeTimers();
    await render('guest', makeGame({ status: 'round_over', phase: null, round_no: 3 }));
    expect(el().querySelector('app-flip7-board')).not.toBeNull();

    // Nach 3 s Tisch bekommt die Übersicht ihren vollen Countdown
    await vi.advanceTimersByTimeAsync(3_000);
    fixture.detectChanges();
    expect(el().textContent).toContain('Nächste Runde in 10 s');

    await vi.advanceTimersByTimeAsync(9_000);
    fixture.detectChanges();
    expect(flip7['nextRound']).not.toHaveBeenCalled();
    expect(button('Jetzt weiter')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(flip7['nextRound']).toHaveBeenCalledTimes(1);
    expect(flip7['nextRound']).toHaveBeenCalledWith('game-1', 3);
    // Hängt der automatische Start, dürfen nach dem Countdown alle weiterschalten
    await vi.advanceTimersByTimeAsync(1_000);
    fixture.detectChanges();
    expect(el().textContent).toContain('Nächste Runde startet');
    expect(button('Jetzt weiter')).toBeDefined();
    expect(button('Spiel beenden')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(20_000);
    fixture.detectChanges();
    expect(flip7['nextRound']).toHaveBeenCalledTimes(1);
  });
});
