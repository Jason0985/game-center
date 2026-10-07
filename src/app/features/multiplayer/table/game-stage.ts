import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { HistoryRow } from './history-sheet';
import { RulesDialog, RulesDialogData } from './rules-dialog';

// Bühne eines laufenden Spiels über der App: Kopf mit ⋮-Menü (Host-Aktionen, Verlassen,
// Regeln) und Inhaltsbereich. Das Spiel liefert nur Zustand und reagiert auf die Ausgaben.
@Component({
  selector: 'app-game-stage',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  templateUrl: './game-stage.html',
  styleUrl: './game-stage.scss',
})
export class GameStage {
  private readonly dialog = inject(MatDialog);

  readonly gameTitle = input.required<string>();
  readonly subtitle = input<string | null>(null);
  // Kurzer Hinweis, was gerade zu tun ist; ersetzt die Unterzeile
  readonly hint = input<string | null>(null);
  // null: Spielerzahl nicht anzeigen (noch kein Spiel)
  readonly players = input<number | null>(null);
  readonly loading = input(false);
  readonly hasGame = input(false);
  // Inhalt scrollt (Endstand, Übersicht) statt Tisch in voller Höhe
  readonly scroll = input(false);
  readonly isHost = input(false);
  readonly busy = input(false);
  // Name des Trödlers; null = „überspringen“ nicht anbieten
  readonly skipName = input<string | null>(null);
  readonly waitingClock = input('');
  readonly finished = input(false);
  // Unterzeile von „Spiel beenden“
  readonly endHint = input('');
  readonly rules = input.required<RulesDialogData>();
  // Letztes Ereignis im Kopf mit Verlauf-Button (Skip-Bo); null = nichts davon zeigen
  readonly lastEvent = input<Omit<HistoryRow, 'time'> | null>(null);
  // Punkt am Verlauf-Button: Es gibt ungesehene Ereignisse
  readonly historyNew = input(false);

  readonly skip = output<void>();
  readonly endGame = output<void>();
  // Spiel verlassen bzw. (Host) Lobby schließen; true: das Spiel ist schon vorbei
  readonly leave = output<boolean>();
  readonly backToLobby = output<void>();
  readonly history = output<void>();

  openRules(): void {
    this.dialog.open(RulesDialog, { width: '440px', data: this.rules() });
  }
}
