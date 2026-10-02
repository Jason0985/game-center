import {
  computed,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { AppErrorService } from '../../../services/app-error.service';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult } from '../multiplayer-lobby.service';
import { HistoryRow, openHistorySheet } from './history-sheet';
import { TableTurn } from './table-data';
import { eventAge, formatClock } from './table.model';

// Gemeinsamer Rahmen der Spielansichten (Flip 7, Skip-Bo, Uno). Nur im Injection Context
// (Feld-Initialisierer der Komponente).
export function injectTableGame<
  G extends TableTurn & {
    status: string;
    turn_seat: number | null;
    players: readonly { user_id: string; seat: number; state: string; name: string }[];
  },
>(options: {
  service: {
    load(lobbyId: string): Promise<LobbyResult<G | null>>;
    subscribe(lobbyId: string, onChange: () => void): () => void;
    skip(turn: G): Promise<ActionResult>;
    endGame(gameId: string): Promise<ActionResult>;
    returnToLobby(lobbyId: string): Promise<ActionResult>;
  };
  lobbyId: Signal<string>;
  hostUserId: Signal<string>;
  userId: Signal<string>;
  // Host ist zurück in der Warte-Lobby
  returned: { emit(): void };
  // Titel der Fehlermeldungen
  title: string;
  skipAfterS: number;
  // Texte der Bestätigungen fürs Überspringen und Beenden
  skipMessage: string;
  endMessage(game: G): string;
  // Wer gerade dran ist (sonst turn_seat)
  activeSeat?(game: G): number | null;
}) {
  const { service, lobbyId, userId, title, skipAfterS } = options;
  const activeSeat = options.activeSeat ?? ((game: G) => game.turn_seat);
  const appErrors = inject(AppErrorService);
  const dialog = inject(MatDialog);
  const isHost = computed(() => options.hostUserId() === userId());

  const game = signal<G | null>(null);
  const loading = signal(true);
  const busy = signal(false);
  let loadSequence = 0;
  let destroyed = false;

  const load = async (): Promise<void> => {
    if (destroyed) return;

    const sequence = ++loadSequence;
    const result = await service.load(lobbyId());
    if (sequence !== loadSequence || destroyed) return;

    loading.set(false);
    if (result.ok) {
      game.set(result.value);
    } else {
      appErrors.report(result.message, { title });
    }
  };

  effect((onCleanup) => {
    const id = lobbyId();
    void load();
    onCleanup(service.subscribe(id, () => void load()));
  });

  // Sekundentakt für Countdown, Überspringen und Alter im Verlauf; gemessen in lokaler
  // Zeit, damit eine falsch gehende Uhr am Gerät nichts ausmacht
  const now = signal(Date.now());
  const clock = setInterval(() => now.set(Date.now()), 1000);
  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    clearInterval(clock);
  });

  // Jede neue Wartesituation (neuer Zug, bei Flip 7 auch Zielauswahl) startet die Uhr
  // fürs Überspringen neu
  const waitingSince = signal(Date.now());
  const waitingKey = computed(() => {
    const current = game();
    return current?.status === 'playing' ? (current.waiting_since ?? '') : null;
  });
  effect(() => {
    waitingKey();
    untracked(() => waitingSince.set(Date.now()));
  });
  const waitingSeconds = computed(() => Math.floor((now() - waitingSince()) / 1000));

  // Aktion ausführen und danach neu laden, auch bei Fehlern (Stand ist dann evtl. weiter).
  // Buttons erst nach dem Neuladen wieder frei, sonst trifft ein zweiter Tipp den alten Stand.
  const run = async (action: () => Promise<ActionResult>): Promise<boolean> => {
    if (busy()) return false;

    busy.set(true);
    try {
      const result = await action();
      if (!result.ok) {
        appErrors.report(result.message, { title });
      }
      await load();
      return result.ok;
    } finally {
      busy.set(false);
    }
  };

  const confirm = async (data: ConfirmationDialogData): Promise<boolean> => {
    const dialogRef = dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      { data },
    );
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  };

  return {
    game,
    loading,
    busy,
    now,
    isHost,
    mySeat: computed(
      () => game()?.players.find((player) => player.user_id === userId())?.seat ?? null,
    ),
    activeName: computed(() => {
      const current = game();
      const seat = current ? activeSeat(current) : null;
      return current?.players.find((player) => player.seat === seat)?.name ?? 'Spieler';
    }),
    playerCount: computed(
      () => game()?.players.filter((player) => player.state !== 'left').length ?? 0,
    ),
    waitingSeconds,
    waitingClock: computed(() => formatClock(waitingSeconds())),
    canSkip: computed(
      () => isHost() && game()?.status === 'playing' && waitingSeconds() >= skipAfterS,
    ),
    load,
    run,

    // Überspringt nur, wenn nach der Bestätigung noch derselbe Stand gilt
    async skip(current: G): Promise<void> {
      const confirmed = await confirm({
        title: 'Spieler überspringen?',
        message: options.skipMessage,
        confirmLabel: 'Überspringen',
        icon: 'skip_next',
      });
      if (confirmed) {
        await run(() => service.skip(current));
      }
    },

    async endGame(current: G): Promise<void> {
      const confirmed = await confirm({
        title: 'Spiel beenden?',
        message: options.endMessage(current),
        confirmLabel: 'Beenden',
        icon: 'stop_circle',
      });
      if (confirmed) {
        await run(() => service.endGame(current.id));
      }
    },

    async backToLobby(): Promise<void> {
      if (await run(() => service.returnToLobby(lobbyId()))) {
        options.returned.emit();
      }
    },
  };
}

// Verlauf im Kopf und als Bottom-Sheet (Skip-Bo, Uno), neueste oben. Alter ohne
// Uhrabweichung: gemessen ab dem Moment, in dem das neueste Ereignis hier ankam, plus
// Abstand laut Server. headline: welche Ereignisse im Kopf stehen dürfen.
export function injectTableHistory<E extends { at?: string }>(options: {
  log: Signal<readonly E[]>;
  now: Signal<number>;
  describe(event: E): Omit<HistoryRow, 'time'>;
  headline?(event: E): boolean;
}) {
  const { log, now, describe, headline = () => true } = options;
  const bottomSheet = inject(MatBottomSheet);

  const latestAt = computed(() => log().at(-1)?.at);
  const arrivedAt = linkedSignal({ source: latestAt, computation: () => Date.now() });
  // Zuletzt gesehenes Ereignis (beim ersten Laden und beim Öffnen des Verlaufs)
  const seenAt = linkedSignal<string | undefined, string | undefined>({
    source: latestAt,
    computation: (latest, previous) => previous?.value ?? latest,
  });
  const rows = computed((): HistoryRow[] => {
    const time = now();
    return log()
      .map((event) => ({
        ...describe(event),
        time: eventAge(time, arrivedAt(), latestAt(), event.at),
      }))
      .reverse();
  });

  let sheet: MatBottomSheetRef | null = null;
  inject(DestroyRef).onDestroy(() => sheet?.dismiss());

  return {
    lastEvent: computed(() => {
      const event = [...log()].reverse().find(headline);
      return event ? describe(event) : null;
    }),
    historyNew: computed(() => latestAt() !== seenAt()),
    open(): void {
      seenAt.set(latestAt());
      sheet = openHistorySheet(bottomSheet, { title: signal('Verlauf'), rows });
    },
  };
}

// Endstand: beim Laden eines beendeten Spiels sofort, endet es live, bleibt der Tisch
// noch delayMs stehen (letzter Flug, Sieg-Puls)
export function injectFinalDelay(status: Signal<string | null>, delayMs: number): Signal<boolean> {
  const show = signal(false);
  // Spiel lief schon in dieser Ansicht: dann kommt der Endstand verzögert
  let seenPlaying = false;
  effect((onCleanup) => {
    const current = status();
    if (current === 'playing') seenPlaying = true;
    if (current !== 'finished') {
      show.set(false);
      return;
    }
    if (!seenPlaying) {
      show.set(true);
      return;
    }
    const timer = setTimeout(() => show.set(true), delayMs);
    onCleanup(() => clearTimeout(timer));
  });
  return show.asReadonly();
}
