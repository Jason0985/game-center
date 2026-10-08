import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { computeStats, GameResult, GameResultsService, resultGameName } from './game-stats';
import { gameOf } from '../../multiplayer/lobby.model';

const percentFormat = new Intl.NumberFormat('de-DE', { style: 'percent' });
const decimalFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
const dayFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

@Component({
  selector: 'app-stats',
  imports: [MatIconModule, RouterLink],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  readonly session = inject(SessionService);
  private readonly resultsService = inject(GameResultsService);
  private readonly results = signal<GameResult[] | null>(null);
  readonly loading = signal(true);
  readonly stats = computed(() => computeStats(this.results() ?? []));
  readonly gameName = resultGameName;

  constructor() {
    effect(() => {
      const userId = this.session.user()?.id;
      if (!userId) return;
      void this.resultsService.getResults(userId).then((results) => {
        if (this.session.user()?.id !== userId) return;
        this.results.set(results);
        this.loading.set(false);
      });
    });
  }

  percent(value: number | null): string {
    return value === null ? '–' : percentFormat.format(value);
  }

  decimal(value: number | null): string {
    return value === null ? '–' : decimalFormat.format(value);
  }

  day(value: Date | string): string {
    return dayFormat.format(new Date(value));
  }

  // "heute, 21:04", "gestern, 22:10" oder "3. Okt. 2026"
  when(value: string): string {
    const date = new Date(value);
    const days = Math.round(
      (new Date().setHours(0, 0, 0, 0) - new Date(value).setHours(0, 0, 0, 0)) / 86_400_000,
    );
    if (days === 0) return `heute, ${timeFormat.format(date)}`;
    if (days === 1) return `gestern, ${timeFormat.format(date)}`;
    return dayFormat.format(date);
  }

  icon(result: GameResult): string {
    return gameOf(result.game_key)?.icon ?? 'casino';
  }

  placementLabel(result: GameResult): string {
    return result.won ? 'Sieg' : `${result.placement}. Platz von ${result.player_count}`;
  }

  scoreLabel(result: GameResult): string | null {
    if (result.score === null || result.game_key === 'skip-bo') return null;
    // Uno: Verlierer haben Restkarten-Punkte, die zählen nicht als eigene Punkte
    if (result.game_key === 'uno') return result.won ? `+${result.score} P.` : null;
    return `${result.score} P.`;
  }
}
