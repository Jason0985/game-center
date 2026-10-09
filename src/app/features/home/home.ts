import { Component, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { PwaService } from '../../services/pwa.service';
import { GameResult, GameResultsService, resultGameName } from '../profile/stats/game-stats';
import { GAMES } from '../multiplayer/lobby.model';

interface HelpTopic {
  icon: string;
  tile: string;
  title: string;
  sub: string;
  points: string[];
  link?: { label: string; path: string };
}

// „So funktioniert's“: je Thema eine Zeile zum Aufklappen, kurz halten
const HELP_TOPICS: HelpTopic[] = [
  {
    icon: 'groups',
    tile: 'var(--tile-pink)',
    title: 'Online zusammen spielen',
    sub: 'Lobby eröffnen, Freunde dazuholen, los',
    points: [
      'Mit Konto eröffnest du eine Lobby und lädst Freunde ein – oder teilst Code bzw. Link.',
      'Ohne Konto trittst du mit dem Code als Gast bei.',
      'Der Host wählt das Spiel. Sobald die Hälfte bereit ist, kann er starten.',
      'Jeder spielt am eigenen Handy, alles läuft live.',
    ],
    link: { label: 'Zu den Lobbys', path: '/multiplayer' },
  },
  {
    icon: 'leaderboard',
    tile: 'var(--tile-blue)',
    title: 'Ranking am Tisch',
    sub: 'Punkte für Spiele mit echten Karten',
    points: [
      'Spieler anlegen, nach jeder Runde Punkte eintragen.',
      'Die Rangliste sortiert sich selbst, am Ende gibt es den Endstand.',
    ],
    link: { label: 'Neues Ranking', path: '/ranking' },
  },
  {
    icon: 'apps',
    tile: 'var(--tile-green)',
    title: 'Sammlung & Werkzeuge',
    sub: 'F1-Strategie, Paddle Tabelle, Ankunftsplaner',
    points: [
      'Helfer für bestimmte Spiele und Abende.',
      'Mit Konto werden Paddle Tabelle und Ankunftsplaner in der Cloud gespeichert.',
    ],
    link: { label: 'Zur Sammlung', path: '/collection' },
  },
  {
    icon: 'person',
    tile: 'var(--tile-purple)',
    title: 'Konto, Freunde & Statistik',
    sub: 'Was du mit einem Konto zusätzlich hast',
    points: [
      'Freunde hinzufügen und direkt in die Lobby einladen.',
      'Deine Online-Spiele zählen in der Statistik: Siege, Serien, Spieleabende.',
    ],
    link: { label: 'Zum Profil', path: '/profile' },
  },
  {
    icon: 'notifications_active',
    tile: 'var(--tile-orange)',
    title: 'Als App & Mitteilungen',
    sub: 'Installieren und nichts verpassen',
    points: [
      'Zum Home-Bildschirm hinzufügen: eigenes Icon, Vollbild, startet auch offline.',
      'Push-Nachrichten bei Einladungen und wenn du dran bist – einstellbar.',
    ],
    link: { label: 'Push-Nachrichten', path: '/settings/push' },
  },
];

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
  readonly helpTopics = HELP_TOPICS;
  readonly games = GAMES;
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
