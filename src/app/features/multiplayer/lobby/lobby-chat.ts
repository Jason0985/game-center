import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { gameOf } from '../lobby.model';
import { LobbyChatStore } from './lobby-chat.store';
import { LobbySuggestSheet } from './lobby-suggest-sheet';

// Nachrichten derselben Person rücken zusammen, solange keine 5 Minuten dazwischen liegen
const GROUP_GAP_MS = 5 * 60_000;

const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

// Lobby-Chat wie ein Gruppen-Chat: eigene Nachrichten rechts, die der anderen links mit Namen
// über der ersten Blase einer Folge. Spielvorschläge erscheinen als Karte, die der Host in der
// Warte-Lobby übernehmen kann. inline: in der Warte-Lobby; sheet: im Spiel als Bottom-Sheet.
@Component({
  selector: 'app-lobby-chat',
  imports: [MatIconModule],
  templateUrl: './lobby-chat.html',
  styleUrl: './lobby-chat.scss',
  host: { '[class.chat--sheet]': "variant() === 'sheet'" },
})
export class LobbyChat {
  readonly store = inject(LobbyChatStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly variant = input<'inline' | 'sheet'>('inline');
  // Spiel, das gerade gewählt ist (Vorschlag dafür zeigt „Gewählt“)
  readonly currentGame = input<string | null>(null);
  // Spieler sehen den Vorschlags-Knopf; der Host wählt das Spiel direkt
  readonly canSuggest = input(true);

  readonly draft = signal('');
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private stickToBottom = true;

  readonly rows = computed(() => {
    const me = this.store.userId();
    const messages = this.store.messages();
    return messages.map((message, i) => {
      const previous = messages[i - 1];
      const next = messages[i + 1];
      const close = (a: typeof message | undefined, b: typeof message | undefined) =>
        !!a &&
        !!b &&
        a.user_id === b.user_id &&
        Math.abs(Date.parse(b.created_at) - Date.parse(a.created_at)) < GROUP_GAP_MS;
      return {
        message,
        mine: message.user_id === me,
        name: this.store.nameOf(message.user_id),
        first: !close(previous, message),
        last: !close(message, next),
        time: timeFormat.format(new Date(message.created_at)),
        game: gameOf(message.game_key),
      };
    });
  });

  constructor() {
    // Sichtbar heißt gelesen
    effect(() => {
      this.store.messages();
      untracked(() => this.store.markSeen());
    });
    // Neue Nachrichten unten zeigen, außer man hat gerade nach oben gescrollt
    afterRenderEffect(() => {
      this.rows();
      const log = this.log()?.nativeElement;
      if (log && this.stickToBottom) log.scrollTop = log.scrollHeight;
    });
  }

  onScroll(log: HTMLElement): void {
    this.stickToBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  }

  async send(event?: Event): Promise<void> {
    event?.preventDefault();
    const text = this.draft();
    if (!text.trim()) return;
    this.stickToBottom = true;
    if (await this.store.send(text)) this.draft.set('');
  }

  openSuggestions(): void {
    this.bottomSheet.open(LobbySuggestSheet, {
      viewContainerRef: this.viewContainer,
      data: { currentGame: this.currentGame() },
      panelClass: 'app-sheet-panel',
      backdropClass: 'app-sheet-backdrop',
      ariaLabel: 'Spiel vorschlagen',
      autoFocus: 'dialog',
    });
  }
}
