import { Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { ProfileRole } from '../profile/profile.model';
import { profileRoleConfig } from '../profile/profile-roles';
import { GAMES } from '../multiplayer/lobby.model';

interface CollectionItem {
  title: string;
  category: string;
  description: string;
  icon: string;
  // Kachelfarbe (Token aus _tokens.scss) und Abschnitt in der Liste
  tile: string;
  group: CollectionGroup;
  path: string;
  // Externer Link (neuer Tab) statt einer Seite der App, z. B. Monopoly auf richup.io
  href?: string;
  // Nur für diese Rollen (und Admins) sichtbar, die Route ist zusätzlich per roleGuard geschützt
  roles?: ProfileRole[];
}

type CollectionGroup = 'Punkte & Tabellen' | 'Racing' | 'Werkzeuge' | 'Multiplayer';

const GROUP_ORDER: CollectionGroup[] = ['Punkte & Tabellen', 'Racing', 'Werkzeuge', 'Multiplayer'];
// Abschnitte zum Auf- und Zuklappen; anfangs ist nur Multiplayer zu
const INITIALLY_CLOSED: CollectionGroup[] = ['Multiplayer'];
const GAME_TILES = [
  'var(--tile-pink)',
  'var(--tile-blue)',
  'var(--tile-orange)',
  'var(--tile-green)',
];

// Alle Online-Spiele aus der Lobby-Liste: führen in die Lobbys, externe direkt zum Anbieter
const MULTIPLAYER_ITEMS: CollectionItem[] = GAMES.map((game, index) => ({
  title: game.name,
  tile: GAME_TILES[index % GAME_TILES.length],
  group: 'Multiplayer',
  category: 'Multiplayer',
  description: game.blurb,
  icon: game.icon,
  path: '/multiplayer',
  href: game.url ?? undefined,
}));

@Component({
  selector: 'app-collection',
  imports: [MatIcon, NgTemplateOutlet, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
})
export class Collection {
  private readonly session = inject(SessionService);
  readonly searchTerm = signal('');

  readonly items: CollectionItem[] = [
    {
      title: 'Ranking',
      tile: 'var(--tile-blue)',
      group: 'Punkte & Tabellen',
      category: 'Punktespiel',
      description: 'Spieler hinzufügen und eine neue Ranglistenrunde starten.',
      icon: 'leaderboard',
      path: '/ranking',
    },
    {
      title: 'Paddle Tabelle',
      tile: 'var(--tile-green)',
      group: 'Punkte & Tabellen',
      category: 'Paddle Übersicht',
      description: 'Übersicht über Gewinne und Verluste',
      icon: 'sports_tennis',
      path: '/collection/paddle-table',
    },
    {
      title: 'Tischtennis',
      tile: 'var(--tile-orange)',
      group: 'Punkte & Tabellen',
      category: 'Punktezähler',
      description: 'Punkte und Sätze zählen, mit Aufschlaganzeige.',
      icon: 'sports_tennis',
      path: '/collection/table-tennis',
    },
    {
      title: 'Tischtennis-Turnier',
      tile: 'var(--tile-purple)',
      group: 'Punkte & Tabellen',
      category: 'Turnierbaum',
      description: 'K.-o.-Turnier auslosen, Ergebnisse eintragen, Sieger feiern.',
      icon: 'account_tree',
      path: '/collection/table-tennis-tournament',
    },
    {
      title: 'Ankunftsplaner',
      tile: 'var(--tile-orange)',
      group: 'Werkzeuge',
      category: 'Tagesplanung',
      description: 'Berechne Aufsteh- und Abfahrtszeit für deinen Termin.',
      icon: 'alarm',
      path: '/collection/arrival-planner',
    },
    {
      title: 'F1 Strategie',
      tile: 'var(--tile-pink)',
      group: 'Racing',
      category: 'Rennstrategie',
      description: 'Strecken und Strategien für deine F1-Rennen.',
      icon: 'sports_motorsports',
      path: '/collection/f1-strategy',
    },
    {
      title: 'Rennergebnisse',
      tile: 'var(--tile-purple)',
      group: 'Racing',
      category: 'Liga-Import',
      description:
        'Ergebnis-Screenshots auslesen und als JSON für Racing League Tools exportieren.',
      icon: 'emoji_events',
      path: '/collection/race-results',
      roles: ['race_results'],
    },
    ...MULTIPLAYER_ITEMS,
  ];
  private readonly closed = signal(new Set<CollectionGroup>(INITIALLY_CLOSED));

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

  /** Gefilterte Einträge nach Abschnitt, leere Abschnitte entfallen. Beim Suchen ist alles offen. */
  readonly groups = computed(() => {
    const searching = !!this.searchTerm().trim();
    return GROUP_ORDER.map((title) => ({
      title,
      open: searching || !this.closed().has(title),
      items: this.filteredItems().filter((item) => item.group === title),
    })).filter((group) => group.items.length);
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  // Auf- und Zuklappen merken; beim Suchen erzwungene Zustände nicht übernehmen
  toggleGroup(title: CollectionGroup, event: Event): void {
    if (this.searchTerm().trim()) return;
    const open = (event.target as HTMLDetailsElement).open;
    this.closed.update((closed) => {
      const next = new Set(closed);
      if (open) next.delete(title);
      else next.add(title);
      return next;
    });
  }
}
