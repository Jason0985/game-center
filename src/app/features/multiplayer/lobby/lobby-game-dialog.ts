import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GAMES, LOBBY_MIN_MEMBERS } from '../lobby.model';

export interface LobbyGameDialogData {
  gameKey: string | null;
}

// Spielauswahl für den Host; schließt mit dem gewählten Spiel-Key
@Component({
  selector: 'app-lobby-game-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './lobby-game-dialog.html',
  styleUrl: './lobby-game-dialog.scss',
})
export class LobbyGameDialog {
  readonly data = inject<LobbyGameDialogData>(MAT_DIALOG_DATA);
  readonly games = GAMES.map((game) => ({
    ...game,
    players: `${LOBBY_MIN_MEMBERS}–${game.maxPlayers} Spieler`,
  }));
}
