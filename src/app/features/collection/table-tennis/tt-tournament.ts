import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmationDialog, ConfirmationDialogData } from '../../../confirmation-dialog';
import {
  BEST_OF_OPTIONS,
  createTournament,
  loadLocal,
  roundName,
  saveLocal,
  setResult,
  setsFor,
  Tournament,
  TOURNAMENT_MAX_PLAYERS,
  TOURNAMENT_MIN_PLAYERS,
  TournamentGame,
  tournamentRounds,
  tournamentSummary,
} from './table-tennis.model';
import { TtResultSheet, TtResultSheetData } from './tt-result-sheet';

// v2: Ergebnisse als Punkte je Satz statt nur Sätze
const STORAGE_KEY = 'game-center-tt-tournament-v2';
const defaultName = (index: number) => `Spieler ${index + 1}`;

// Tischtennis-Turnier im K.-o.-System: Spieler eintragen, Baum auslosen, Ergebnisse eintragen
@Component({
  selector: 'app-tt-tournament',
  imports: [MatIconModule, RouterLink],
  templateUrl: './tt-tournament.html',
  styleUrl: './tt-tournament.scss',
})
export class TtTournament {
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);

  readonly bestOfOptions = BEST_OF_OPTIONS;
  readonly minPlayers = TOURNAMENT_MIN_PLAYERS;
  readonly maxPlayers = TOURNAMENT_MAX_PLAYERS;

  // Einrichtung
  readonly names = signal<string[]>(Array.from({ length: 4 }, (_, i) => defaultName(i)));
  readonly bestOf = signal(3);
  readonly shuffle = signal(true);

  readonly tournament = signal<Tournament | null>(loadLocal(STORAGE_KEY, null));
  readonly rounds = computed(() => {
    const tournament = this.tournament();
    return tournament ? tournamentRounds(tournament) : [];
  });
  readonly summary = computed(() => {
    const tournament = this.tournament();
    return tournament && tournamentSummary(tournament);
  });
  readonly progress = computed(() => {
    const games = this.rounds()
      .flat()
      .filter((game) => !game.bye);
    return { done: games.filter((game) => game.score).length, total: games.length };
  });
  constructor() {
    effect(() => {
      const tournament = this.tournament();
      if (tournament) saveLocal(STORAGE_KEY, tournament);
      else
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
    });
  }

  name(player: number | null): string {
    return player === null ? '' : (this.tournament()?.players[player] ?? '');
  }

  roundName(round: number): string {
    return roundName(round, this.rounds().length);
  }

  setCount(count: number): void {
    const clamped = Math.min(this.maxPlayers, Math.max(this.minPlayers, count));
    this.names.update((names) =>
      Array.from({ length: clamped }, (_, i) => names[i] ?? defaultName(i)),
    );
  }

  rename(index: number, name: string): void {
    this.names.update((names) => names.map((old, i) => (i === index ? name : old)));
  }

  start(): void {
    const names = this.names().map((name, i) => name.trim() || defaultName(i));
    this.tournament.set(createTournament(names, this.bestOf(), this.shuffle()));
  }

  // Ergebnis eintragen oder ändern (Punkte je Satz)
  openResult(game: TournamentGame): void {
    const tournament = this.tournament();
    if (!tournament || game.a === null || game.b === null) return;

    this.bottomSheet
      .open<TtResultSheet, TtResultSheetData, TtResultSheetData['sets']>(TtResultSheet, {
        data: {
          title: this.roundName(game.round),
          names: [this.name(game.a), this.name(game.b)],
          bestOf: tournament.bestOf,
          sets: game.sets,
        },
        panelClass: 'app-sheet-panel',
        backdropClass: 'app-sheet-backdrop',
        ariaLabel: 'Ergebnis eintragen',
      })
      .afterDismissed()
      .subscribe((sets) => {
        if (sets) this.tournament.update((t) => t && setResult(t, game.round, game.index, sets));
      });
  }

  // z. B. "3:1", immer aus Sicht des Siegers
  winnerScore(game: TournamentGame): string {
    const [a, b] = game.score ?? [0, 0];
    return `${Math.max(a, b)}:${Math.min(a, b)}`;
  }

  // z. B. "11:9 · 8:11 · 11:7", aus Sicht des Siegers (oder von a, solange offen)
  setPoints(game: TournamentGame): string {
    return setsFor(game, game.winner ?? game.a!)
      .map(([a, b]) => `${a}:${b}`)
      .join(' · ');
  }

  async reset(): Promise<void> {
    const ref = this.dialog.open<ConfirmationDialog, ConfirmationDialogData, boolean>(
      ConfirmationDialog,
      {
        data: {
          title: 'Neues Turnier?',
          message:
            'Baum und Ergebnisse werden gelöscht. Die Spielernamen bleiben für die Einrichtung.',
          confirmLabel: 'Neues Turnier',
          icon: 'restart_alt',
        },
      },
    );
    if (!(await firstValueFrom(ref.afterClosed()))) return;

    const tournament = this.tournament();
    if (tournament) {
      this.names.set([...tournament.players]);
      this.bestOf.set(tournament.bestOf);
    }
    this.tournament.set(null);
  }
}
