import { computed, DestroyRef, effect, inject, Signal, signal, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import { AppErrorService } from '../../../services/app-error.service';
import { ActionResult } from '../../../services/supabase-errors';
import { LobbyResult } from '../multiplayer-lobby.service';
import { formatClock } from './table.model';

// Gemeinsamer Rahmen der Spielansichten (Flip 7, Skip-Bo). Nur im Injection Context
// (Feld-Initialisierer der Komponente).
export function injectTableGame<
  G extends { status: string; waiting_since: string | null },
>(options: {
  service: {
    load(lobbyId: string): Promise<LobbyResult<G | null>>;
    subscribe(lobbyId: string, onChange: () => void): () => void;
  };
  lobbyId: Signal<string>;
  isHost: Signal<boolean>;
  // Titel der Fehlermeldungen
  title: string;
  skipAfterS: number;
}) {
  const { service, lobbyId, isHost, title, skipAfterS } = options;
  const appErrors = inject(AppErrorService);
  const dialog = inject(MatDialog);

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

  return {
    game,
    loading,
    busy,
    now,
    waitingSeconds,
    waitingClock: computed(() => formatClock(waitingSeconds())),
    canSkip: computed(
      () => isHost() && game()?.status === 'playing' && waitingSeconds() >= skipAfterS,
    ),
    load,

    // Aktion ausführen und danach neu laden, auch bei Fehlern (Stand ist dann evtl. weiter).
    // Buttons erst nach dem Neuladen wieder frei, sonst trifft ein zweiter Tipp den alten Stand.
    async run(action: () => Promise<ActionResult>): Promise<boolean> {
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
    },

    async confirm(data: ConfirmationDialogData): Promise<boolean> {
      const dialogRef = dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
        ConfirmationDialog,
        { data },
      );
      return (await firstValueFrom(dialogRef.afterClosed())) === true;
    },
  };
}
