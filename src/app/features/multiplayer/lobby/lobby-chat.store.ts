import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AppErrorService } from '../../../services/app-error.service';
import { LobbyMessage } from '../lobby.model';
import { censor } from './chat-filter';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';

const SEEN_KEY = 'game-center-chat-seen:';

// Lobby-Chat einer Lobby: Nachrichten live, gesendet über die Datenbank. Liegt an der Lobby
// (providers), damit Warte-Lobby und Spieltisch (Chat-Sheet im Spiel) denselben Stand sehen.
// Die Lobby trägt Namen und Rechte ein und reicht das Übernehmen eines Vorschlags weiter.
@Injectable()
export class LobbyChatStore {
  private readonly lobbyService = inject(MultiplayerLobbyService);
  private readonly appErrors = inject(AppErrorService);

  readonly lobbyId = signal<string | null>(null);
  readonly userId = signal<string | null>(null);
  readonly messages = signal<LobbyMessage[]>([]);
  readonly loaded = signal(false);
  readonly sending = signal(false);
  // Anzeigenamen je user_id (auch von Leuten, die die Lobby schon verlassen haben)
  readonly names = signal<Record<string, string>>({});
  // Host in der Warte-Lobby: Vorschläge lassen sich übernehmen
  readonly canAdopt = signal(false);
  adopt: (gameKey: string) => void = () => undefined;
  // Spieler in der Warte-Lobby: Spieleliste zum Vorschlagen öffnen (die Lobby kehrt danach in
  // den Chat zurück)
  suggest: () => void = () => undefined;

  // Zuletzt gesehene Nachricht (je Lobby gemerkt), daraus die Zahl am Chat-Knopf
  private readonly seenId = signal(0);
  readonly unread = computed(
    () => this.messages().filter((m) => m.id > this.seenId() && m.user_id !== this.userId()).length,
  );

  private stop: (() => void) | null = null;
  private loadSequence = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop?.());
  }

  start(lobbyId: string, userId: string | null): void {
    if (this.lobbyId() === lobbyId) {
      this.userId.set(userId);
      return;
    }
    this.stop?.();
    this.lobbyId.set(lobbyId);
    this.userId.set(userId);
    this.messages.set([]);
    this.loaded.set(false);
    this.seenId.set(this.readSeen(lobbyId));
    this.stop = this.lobbyService.subscribeToMessages(lobbyId, () => void this.load());
  }

  async load(): Promise<void> {
    const lobbyId = this.lobbyId();
    if (!lobbyId) return;
    const sequence = ++this.loadSequence;
    const messages = await this.lobbyService.loadMessages(lobbyId);
    if (sequence !== this.loadSequence || lobbyId !== this.lobbyId() || !messages) return;
    this.messages.set(messages);
    this.loaded.set(true);
  }

  // true = gesendet; Schimpfwörter gehen schon verschleiert raus
  async send(body: string, gameKey: string | null = null): Promise<boolean> {
    const lobbyId = this.lobbyId();
    const text = censor(body.trim());
    if (!lobbyId || !text || this.sending()) return false;
    this.sending.set(true);
    const result = await this.lobbyService.sendMessage(lobbyId, text, gameKey);
    this.sending.set(false);
    if (!result.ok) {
      this.appErrors.report(result.message, { title: 'Chat' });
      return false;
    }
    await this.load();
    return true;
  }

  markSeen(): void {
    const last = this.messages().at(-1)?.id ?? 0;
    const lobbyId = this.lobbyId();
    if (!lobbyId || last <= this.seenId()) return;
    this.seenId.set(last);
    try {
      sessionStorage.setItem(SEEN_KEY + lobbyId, String(last));
    } catch {
      // Speicher nicht verfügbar: der Punkt gilt nur bis zum Neuladen
    }
  }

  nameOf(userId: string): string {
    return this.names()[userId] ?? 'Ehemaliger Spieler';
  }

  private readSeen(lobbyId: string): number {
    try {
      return Number(sessionStorage.getItem(SEEN_KEY + lobbyId)) || 0;
    } catch {
      return 0;
    }
  }
}
