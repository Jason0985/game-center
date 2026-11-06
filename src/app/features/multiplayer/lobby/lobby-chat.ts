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
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AvatarColorPipe, InitialsPipe } from '../../../ui/avatar.pipes';
import { gameOf, LobbyMessage } from '../lobby.model';
import { censor } from './chat-filter';
import { LobbyChatStore } from './lobby-chat.store';

// Nachrichten derselben Person rücken zusammen, solange keine 5 Minuten dazwischen liegen
const GROUP_GAP_MS = 5 * 60_000;

const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dayTimeFormat = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});
// So viele Lese-Avatare stehen nebeneinander, der Rest als „+N“
const READ_AVATARS = 3;

// Lobby-Chat wie ein Gruppen-Chat: eigene Nachrichten rechts, die der anderen links mit Namen
// über der ersten Blase einer Folge. Spielvorschläge erscheinen als Karte, die der Host in der
// Warte-Lobby übernehmen kann. Unter den Nachrichten stehen wie in der PS-App die Avatare derer,
// die bis dorthin gelesen haben; antippen zeigt die Liste mit Namen und Uhrzeit.
// Steckt im Chat-Sheet (Warte-Lobby: App-Kopf, Spiel: Spielkopf).
@Component({
  selector: 'app-lobby-chat',
  imports: [MatIconModule, AvatarColorPipe, InitialsPipe],
  templateUrl: './lobby-chat.html',
  styleUrl: './lobby-chat.scss',
  host: { '[class.chat--sheet]': "variant() === 'sheet'" },
})
export class LobbyChat {
  readonly store = inject(LobbyChatStore);

  readonly variant = input<'inline' | 'sheet'>('inline');
  // Spiel, das gerade gewählt ist (Vorschlag dafür zeigt „Gewählt“)
  readonly currentGame = input<string | null>(null);
  // Spieler sehen den Vorschlags-Knopf; der Host wählt das Spiel direkt
  readonly canSuggest = input(true);

  readonly draft = signal('');
  // Nachricht, deren Leseliste offen ist
  readonly openReads = signal<number | null>(null);
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private stickToBottom = true;

  // Lesebestätigungen: jede Person (außer mir) unter der neuesten Nachricht, die sie gelesen hat
  // und die nicht von ihr selbst ist; neueste Lesezeit zuerst
  private readonly readersAt = computed(() => {
    const me = this.store.userId();
    const newestFirst = [...this.store.messages()].reverse();
    const at = new Map<number, { userId: string; name: string; seed: string }[]>();
    const reads = [...this.store.reads()].sort((a, b) => b.read_at.localeCompare(a.read_at));
    for (const read of reads) {
      if (read.user_id === me) continue;
      const message = newestFirst.find(
        (m) => m.id <= read.last_read_id && m.user_id !== read.user_id,
      );
      if (!message) continue;
      at.set(message.id, [
        ...(at.get(message.id) ?? []),
        {
          userId: read.user_id,
          name: this.store.nameOf(read.user_id),
          seed: this.store.avatarSeedOf(read.user_id),
        },
      ]);
    }
    return at;
  });

  // Offene Leseliste: alle (außer mir und dem Absender), die die Nachricht gelesen haben
  readonly readList = computed(() => {
    const id = this.openReads();
    const message = this.store.messages().find((m) => m.id === id);
    if (!message) return [];
    const me = this.store.userId();
    const today = new Date().toDateString();
    return this.store
      .reads()
      .filter(
        (r) => r.last_read_id >= message.id && r.user_id !== me && r.user_id !== message.user_id,
      )
      .map((r) => {
        const at = new Date(r.read_at);
        return {
          userId: r.user_id,
          name: this.store.nameOf(r.user_id),
          seed: this.store.avatarSeedOf(r.user_id),
          time: (at.toDateString() === today ? timeFormat : dayTimeFormat).format(at),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  });

  readonly rows = computed(() => {
    const me = this.store.userId();
    const messages = this.store.messages();
    const readersAt = this.readersAt();
    const latestRead = Math.max(0, ...readersAt.keys());
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
        // Auch beim Anzeigen filtern, falls etwas am Filter vorbei gespeichert wurde
        body: censor(message.body),
        first: !close(previous, message),
        last: !close(message, next),
        time: timeFormat.format(new Date(message.created_at)),
        game: gameOf(message.game_key),
        readers: (readersAt.get(message.id) ?? []).slice(0, READ_AVATARS),
        moreReaders: Math.max(0, (readersAt.get(message.id)?.length ?? 0) - READ_AVATARS),
        readLabel: (readersAt.get(message.id) ?? []).map((r) => r.name).join(', '),
        latestRead: message.id === latestRead,
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

  toggleReads(message: LobbyMessage): void {
    this.openReads.update((open) => (open === message.id ? null : message.id));
  }

  openSuggestions(): void {
    this.store.suggest();
  }
}
