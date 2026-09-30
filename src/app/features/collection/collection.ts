import { Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { ProfileRole } from '../profile/profile.model';
import { profileRoleConfig } from '../profile/profile-roles';

interface CollectionItem {
  title: string;
  category: string;
  description: string;
  icon: string;
  path: string;
  // Nur für diese Rollen (und Admins) sichtbar, die Route ist zusätzlich per roleGuard geschützt
  roles?: ProfileRole[];
}

@Component({
  selector: 'app-collection',
  imports: [MatIcon, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  private readonly session = inject(SessionService);
  readonly searchTerm = signal('');

  readonly items: CollectionItem[] = [
    {
      title: 'Ranking',
      category: 'Punktespiel',
      description: 'Spieler hinzufügen und eine neue Ranglistenrunde starten.',
      icon: 'leaderboard',
      path: '/ranking',
    },
    {
      title: 'Paddle Tabelle',
      category: 'Paddle Übersicht',
      description: 'Übersicht über Gewinne und Verluste',
      icon: 'sports_tennis',
      path: '/collection/paddle-table',
    },
    {
      title: 'Ankunftsplaner',
      category: 'Tagesplanung',
      description: 'Berechne Aufsteh- und Abfahrtszeit für deinen Termin.',
      icon: 'alarm',
      path: '/collection/arrival-planner',
    },
    {
      title: 'F1 Strategie',
      category: 'Rennstrategie',
      description: 'Strecken und Strategien für deine F1-Rennen.',
      icon: 'sports_motorsports',
      path: '/collection/f1-strategy',
    },
    {
      title: 'Rennergebnisse',
      category: 'Liga-Import',
      description:
        'Ergebnis-Screenshots auslesen und als JSON für Racing League Tools exportieren.',
      icon: 'emoji_events',
      path: '/collection/race-results',
      roles: ['race_results'],
    },
  ];

  readonly filteredItems = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();
    const items = this.items
      .filter((item) => !item.roles || this.session.hasAnyRole(item.roles))
      // Tags zeigen, wegen welcher Rolle die Karte sichtbar ist
      .map((item) => ({ ...item, roleTags: (item.roles ?? []).map(profileRoleConfig) }));

    if (!searchTerm) {
      return items;
    }

    return items.filter((item) =>
      `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(searchTerm),
    );
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}
