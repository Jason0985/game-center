import { Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LobbyChat } from './lobby-chat';

export interface LobbyChatSheetData {
  // Spiel, das in der Warte-Lobby gewählt ist (Vorschlag dafür zeigt „Gewählt“)
  currentGame: string | null;
}

// Lobby-Chat als Bottom-Sheet: in der Warte-Lobby über die Sprechblase im App-Kopf, im Spiel
// über die im Spielkopf. Vorschlagen geht in der Warte-Lobby über „Spiel vorschlagen“.
@Component({
  selector: 'app-lobby-chat-sheet',
  imports: [LobbyChat],
  template: `
    <div class="sheet-grip" aria-hidden="true"></div>
    <div class="sheet-head">
      <h2>Lobby-Chat</h2>
      <button type="button" class="done" (click)="sheet.dismiss()">Fertig</button>
    </div>
    <app-lobby-chat
      class="chat"
      variant="sheet"
      [currentGame]="data?.currentGame ?? null"
      [canSuggest]="false"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: min(72dvh, 640px);
      box-sizing: border-box;
      padding-top: 8px;
      color: var(--color-text);
      font-family: var(--font-sans);
      letter-spacing: normal;
    }

    .sheet-head {
      padding: 0 16px;
    }

    .done {
      min-height: 44px;
      margin-right: -6px;
      padding: 0 6px;
      border: 0;
      background: none;
      color: var(--color-primary-light);
      font: inherit;
      font-size: 17px;
      font-weight: 600;
      cursor: pointer;
    }

    .done:focus-visible {
      outline: 2px solid var(--color-primary-light);
      outline-offset: -2px;
    }

    .chat {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class LobbyChatSheet {
  readonly sheet = inject(MatBottomSheetRef);
  readonly data = inject<LobbyChatSheetData | null>(MAT_BOTTOM_SHEET_DATA, { optional: true });
}
