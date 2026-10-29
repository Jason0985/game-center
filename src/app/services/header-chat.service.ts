import { Injectable, Signal, signal } from '@angular/core';

export interface HeaderChat {
  unread: Signal<number>;
  open: () => void;
}

// Chat-Knopf im App-Kopf: Die Warte-Lobby meldet hier ihren Chat an (ungelesene Nachrichten,
// Öffnen), solange sie zu sehen ist; der Kopf zeigt ihn links neben den Benachrichtigungen
@Injectable({ providedIn: 'root' })
export class HeaderChatService {
  readonly chat = signal<HeaderChat | null>(null);
}
