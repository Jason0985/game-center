import { Component, computed, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

interface CollectionItem {
  title: string;
  category: string;
  description: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-collection',
  imports: [MatIcon, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  readonly searchTerm = signal('');

  readonly items: CollectionItem[] = [
    {
      title: 'Flip 7',
      category: 'Kartenspiel',
      description: 'Risiko eingehen, Karten aufdecken und Punkte sammeln.',
      icon: 'casino',
      path: '/collection/flip-7',
    },
    {
      title: 'Paddle Tabelle',
      category: 'Paddle Übersicht',
      description: 'Übersicht über Gewinne und Verluste',
      icon: 'sports_tennis',
      path: '/collection/paddle-table',
    },
    {
      title: 'F1 Strategie',
      category: 'Rennstrategie',
      description: 'Strecken und Strategien für deine F1-Rennen.',
      icon: 'sports_motorsports',
      path: '/collection/f1-strategy',
    },
  ];

  readonly filteredItems = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();

    if (!searchTerm) {
      return this.items;
    }

    return this.items.filter((item) =>
      `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(searchTerm),
    );
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}
