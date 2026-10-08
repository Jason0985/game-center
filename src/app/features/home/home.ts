import { Component, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { PwaService } from '../../services/pwa.service';
import { GameResult, GameResultsService, resultGameName } from '../profile/stats/game-stats';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly session = inject(SessionService);
  readonly pwa = inject(PwaService);
  readonly greeting = greetingFor(new Date().getHours());
  // undefined = lädt noch
  readonly lastResult = signal<GameResult | null | undefined>(undefined);
  readonly gameName = resultGameName;
  private readonly resultsService = inject(GameResultsService);

  constructor() {
    effect(() => {
      const userId = this.session.user()?.id;
      this.lastResult.set(userId ? undefined : null);
      if (!userId) return;
      void this.resultsService.getResults(userId, 1).then((results) => {
        if (this.session.user()?.id === userId) this.lastResult.set(results?.[0] ?? null);
      });
    });
  }
}

function greetingFor(hour: number): string {
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}
