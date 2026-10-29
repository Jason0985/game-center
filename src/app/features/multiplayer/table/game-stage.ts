import { Component, inject, input, output, signal, ViewContainerRef } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import {
  ChristmasBackdrop,
  ChristmasLights,
  ChristmasSnowbank,
} from '../../../ui/christmas/christmas-decor';
import {
  HalloweenBackdrop,
  HalloweenLights,
  HalloweenPumpkins,
} from '../../../ui/halloween/halloween-decor';
import { LobbyChatSheet } from '../lobby/lobby-chat-sheet';
import { LobbyChatStore } from '../lobby/lobby-chat.store';
import { GameReactions, REACTIONS, ReactionLayer } from './game-reactions';
import { HistoryRow } from './history-sheet';
import { RulesDialog, RulesDialogData } from './rules-dialog';

// Bühne eines laufenden Spiels über der App: Kopf mit ⋮-Menü (Host-Aktionen, Verlassen,
// Regeln) und Inhaltsbereich. Mit Deko hängt unter dem Kopf die Lichterkette und hinter dem
// Tisch fallen Flocken bzw. fliegen Fledermäuse; zu Weihnachten liegt Schnee auf dem Kopf,
// zu Halloween stehen Kürbisse auf dem Tisch. Im Kopf außerdem Reaktionen (erscheinen am Platz
// der Person) und der Lobby-Chat. Das Spiel liefert nur Zustand und reagiert auf die Ausgaben.
@Component({
  selector: 'app-game-stage',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    ChristmasBackdrop,
    ChristmasLights,
    ChristmasSnowbank,
    HalloweenBackdrop,
    HalloweenLights,
    HalloweenPumpkins,
    ReactionLayer,
  ],
  templateUrl: './game-stage.html',
  styleUrl: './game-stage.scss',
})
export class GameStage {
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly viewContainer = inject(ViewContainerRef);
  // Kommen von der Lobby; ohne Lobby (Tests) gibt es weder Chat noch Reaktionen
  readonly chat = inject(LobbyChatStore, { optional: true });
  readonly reactions = inject(GameReactions, { optional: true });
  readonly reactionList = REACTIONS;
  readonly pickerOpen = signal(false);

  // Saisonale Deko aus den Einstellungen, wie in der App-Schale
  readonly decor = inject(ThemeService).decor;
  readonly pumpkins = [{ left: '30%', small: true }, { right: '64px' }];

  readonly gameTitle = input.required<string>();
  readonly subtitle = input<string | null>(null);
  // Kurzer Hinweis, was gerade zu tun ist; ersetzt die Unterzeile
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
  // Menüpunkt zum Beenden bzw. Abbrechen (Spiele mit eigenem Ende) und seine Unterzeile
  readonly endLabel = input('Spiel beenden');
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

  react(emoji: string): void {
    this.reactions?.send(emoji);
    this.pickerOpen.set(false);
  }

  openChat(): void {
    this.bottomSheet.open(LobbyChatSheet, {
      viewContainerRef: this.viewContainer,
      panelClass: 'app-sheet-panel',
      backdropClass: 'app-sheet-backdrop',
      ariaLabel: 'Lobby-Chat',
      autoFocus: 'dialog',
    });
  }

  openRules(): void {
    this.dialog.open(RulesDialog, { width: '440px', data: this.rules() });
  }
}
