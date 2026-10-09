import { Component, computed, effect, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  BEST_OF_OPTIONS,
  counterState,
  CounterMatch,
  loadLocal,
  saveLocal,
  setsToWin,
  Side,
} from './table-tennis.model';

const STORAGE_KEY = 'game-center-tt-counter';
const NEW_MATCH: CounterMatch = {
  names: ['Spieler 1', 'Spieler 2'],
  bestOf: 3,
  firstServer: 0,
  rallies: [],
};

// Punktezähler für ein Tischtennis-Match: Seite antippen = Punkt
@Component({
  selector: 'app-tt-counter',
  imports: [MatIconModule, RouterLink],
  templateUrl: './tt-counter.html',
  styleUrl: './tt-counter.scss',
})
export class TtCounter {
  readonly bestOfOptions = BEST_OF_OPTIONS;
  readonly match = signal<CounterMatch>(loadLocal(STORAGE_KEY, NEW_MATCH));
  readonly state = computed(() => counterState(this.match()));
  // Ein Punkt je Satz, der zum Sieg nötig ist
  readonly pips = computed(() => Array.from({ length: setsToWin(this.match().bestOf) }));
  readonly started = computed(() => this.match().rallies.length > 0);
  // Nur die Anzeige: wer links steht
  readonly swapped = signal(false);
  readonly sides = computed<Side[]>(() => (this.swapped() ? [1, 0] : [0, 1]));

  constructor() {
    effect(() => saveLocal(STORAGE_KEY, this.match()));
  }

  point(side: Side): void {
    if (this.state().winner !== null) return;
    this.match.update((match) => ({ ...match, rallies: [...match.rallies, side] }));
  }

  undo(): void {
    this.match.update((match) => ({ ...match, rallies: match.rallies.slice(0, -1) }));
  }

  // Gleiche Spieler und Einstellungen; im neuen Match schlägt der andere zuerst auf
  rematch(): void {
    this.match.update((match) => ({
      ...match,
      firstServer: (1 - match.firstServer) as Side,
      rallies: [],
    }));
  }

  rename(side: Side, name: string): void {
    this.match.update((match) => {
      const names = [...match.names] as [string, string];
      names[side] = name.trim() || NEW_MATCH.names[side];
      return { ...match, names };
    });
  }

  setBestOf(bestOf: number): void {
    this.match.update((match) => ({ ...match, bestOf }));
  }

  setFirstServer(firstServer: Side): void {
    this.match.update((match) => ({ ...match, firstServer }));
  }
}
