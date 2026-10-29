import { Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../services/toast.service';
import { GAMES, rulesOf } from '../lobby.model';
import { LobbyChatStore } from './lobby-chat.store';

export interface LobbySuggestSheetData {
  currentGame: string | null;
}

// Übersicht aller Spiele für die Mitspieler: Kurzinfo, Kurzregeln zum Aufklappen und
// „Vorschlagen“ – der Vorschlag landet als Karte im Lobby-Chat, der Host kann ihn übernehmen
@Component({
  selector: 'app-lobby-suggest-sheet',
  imports: [MatIconModule],
  templateUrl: './lobby-suggest-sheet.html',
  styleUrl: './lobby-suggest-sheet.scss',
})
export class LobbySuggestSheet {
  private readonly chat = inject(LobbyChatStore);
  private readonly toast = inject(ToastService);
  readonly data = inject<LobbySuggestSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly sheet = inject(MatBottomSheetRef);

  readonly games = GAMES.map((game) => ({
    ...game,
    meta: game.url
      ? game.tagline
      : `${game.minPlayers}–${game.maxPlayers} Spieler · ${game.tagline}`,
    rules: rulesOf(game.key, null),
  }));
  readonly open = signal<string | null>(null);
  readonly sending = this.chat.sending;

  toggle(key: string): void {
    this.open.update((current) => (current === key ? null : key));
  }

  async suggest(game: { key: string; name: string }): Promise<void> {
    if (await this.chat.send(`Lust auf ${game.name}?`, game.key)) {
      this.toast.success('Vorschlag gesendet', `${game.name} steht jetzt im Lobby-Chat.`);
      this.sheet.dismiss();
    }
  }
}
