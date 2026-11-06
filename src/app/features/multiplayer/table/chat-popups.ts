import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { AvatarColorPipe, InitialsPipe } from '../../../ui/avatar.pipes';
import { LobbyChatStore } from '../lobby/lobby-chat.store';

// So lange bleibt eine Nachricht stehen (ms); so viele stehen am Handy bzw. breiter untereinander
const SHOW_MS = 4500;
const MAX_PHONE = 1;
const MAX_WIDE = 3;
// Ab hier stehen die Nachrichten als Karte rechts neben dem Spielfeld (wie in chat-popups.scss)
const WIDE = '(min-width: 768px)';

interface ChatPopup {
  id: number;
  name: string;
  body: string;
}

// Neue Nachrichten im Lobby-Chat kurz über dem Spiel: Sie wachsen aus dem Chat-Knopf im Kopf
// (anchor), am Handy unter dem Kopf über die ganze Breite, auf iPad und Laptop als Karte rechts
// neben dem Spielfeld. Eigene Nachrichten und alles, was schon da war, bleiben still; bei
// offenem Chat (paused) ebenso. Antippen öffnet den Chat.
@Component({
  selector: 'app-chat-popups',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarColorPipe, InitialsPipe],
  template: `
    @for (popup of popups(); track popup.id; let first = $first) {
      <button
        type="button"
        class="pop"
        [class.pop--first]="first"
        animate.enter="pop-in"
        animate.leave="pop-out"
        [attr.aria-label]="'Neue Nachricht von ' + popup.name + ': ' + popup.body + '. Chat öffnen'"
        (click)="open.emit()"
      >
        <span class="avatar" [style.background]="popup.name | avatarColor" aria-hidden="true">{{
          popup.name | initials
        }}</span>
        <span class="text">
          <span class="name">{{ popup.name }}</span>
          <span class="body">{{ popup.body }}</span>
        </span>
        <span class="timer" aria-hidden="true"></span>
      </button>
    }
  `,
  styleUrl: './chat-popups.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[style.--head-bottom.px]': 'headBottom()',
    '[style.--icon-right.px]': 'iconRight()',
  },
})
export class ChatPopups {
  private readonly chat = inject(LobbyChatStore);

  // Chat-Knopf im Kopf: daraus wachsen die Nachrichten
  readonly anchor = input.required<HTMLElement>();
  readonly paused = input(false);
  readonly open = output<void>();
  // Eine neue Nachricht ist da (der Knopf wackelt)
  readonly arrived = output<void>();

  readonly popups = signal<ChatPopup[]>([]);
  readonly headBottom = signal(56);
  readonly iconRight = signal(48);

  private lastId: number | null = null;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const messages = this.chat.messages();
      const loaded = this.chat.loaded();
      const paused = this.paused();
      untracked(() => {
        if (!loaded) return;
        const newest = messages.at(-1)?.id ?? 0;
        // Was beim Öffnen des Tisches schon da war, ist nicht neu
        if (this.lastId === null || paused) {
          this.lastId = Math.max(this.lastId ?? 0, newest);
          if (paused) this.clear();
          return;
        }
        const fresh = messages.filter(
          (m) => m.id > this.lastId! && m.user_id !== this.chat.userId(),
        );
        this.lastId = Math.max(this.lastId, newest);
        if (fresh.length)
          this.show(
            fresh.map((m) => ({ id: m.id, name: this.chat.nameOf(m.user_id), body: m.body })),
          );
      });
    });

    inject(DestroyRef).onDestroy(() => this.clear());
  }

  private show(added: ChatPopup[]): void {
    this.measure();
    const max = window.matchMedia?.(WIDE).matches ? MAX_WIDE : MAX_PHONE;
    // Neueste oben
    this.popups.update((list) => [...added.reverse(), ...list].slice(0, max));
    this.arrived.emit();
    for (const popup of added) {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        this.popups.update((list) => list.filter((p) => p.id !== popup.id));
      }, SHOW_MS);
      this.timers.add(timer);
    }
  }

  private clear(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.popups.set([]);
  }

  // Wo der Kopf endet und wie weit der Knopf vom rechten Rand ist (für Zipfel und Ursprung)
  private measure(): void {
    const button = this.anchor().getBoundingClientRect();
    const head = this.anchor().closest('header')?.getBoundingClientRect();
    this.headBottom.set(Math.round(head?.bottom ?? button.bottom));
    this.iconRight.set(Math.round(window.innerWidth - (button.left + button.width / 2)));
  }
}
