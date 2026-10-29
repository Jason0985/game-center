import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../supabase.client';
import { LobbyChatStore } from '../lobby/lobby-chat.store';

// Die typischen Reaktionen am Spieltisch
export const REACTIONS = ['👍', '😂', '😮', '😡', '😭', '🎉', '🔥', '👏'] as const;

// Wie lange eine Reaktion zu sehen ist bzw. wie oft man reagieren kann (ms)
const SHOW_MS = 3200;
const COOLDOWN_MS = 900;

export interface GameReaction {
  id: number;
  userId: string;
  emoji: string;
}

// Reaktionen im Spiel: flüchtig über einen Realtime-Broadcast der Lobby, nichts wird
// gespeichert. Liegt an der Lobby (providers), die Spiel-Bühne zeigt Auswahl und Blasen.
@Injectable()
export class GameReactions {
  readonly active = signal<GameReaction[]>([]);
  readonly userId = signal<string | null>(null);

  private channel: RealtimeChannel | null = null;
  private topic: string | null = null;
  private nextId = 0;
  private lastSent = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.leave();
      this.timers.forEach(clearTimeout);
    });
  }

  start(lobbyId: string, userId: string | null): void {
    this.userId.set(userId);
    const topic = `reactions-${lobbyId}`;
    if (this.topic === topic) return;
    this.leave();
    this.topic = topic;
    this.channel = supabase
      .channel(topic, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => this.show(payload))
      .subscribe();
  }

  // false: zu schnell hintereinander oder nicht verbunden
  send(emoji: string): boolean {
    const userId = this.userId();
    const now = Date.now();
    if (!this.channel || !userId || now - this.lastSent < COOLDOWN_MS) return false;
    this.lastSent = now;
    void this.channel.send({ type: 'broadcast', event: 'reaction', payload: { userId, emoji } });
    return true;
  }

  private show(payload: unknown): void {
    const { userId, emoji } = (payload ?? {}) as Partial<GameReaction>;
    if (typeof userId !== 'string' || !REACTIONS.includes(emoji as (typeof REACTIONS)[number])) {
      return;
    }
    const reaction = { id: ++this.nextId, userId, emoji: emoji as string };
    // Pro Person nur die neueste Blase
    this.active.update((list) => [...list.filter((r) => r.userId !== userId), reaction]);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.active.update((list) => list.filter((r) => r.id !== reaction.id));
    }, SHOW_MS);
    this.timers.add(timer);
  }

  private leave(): void {
    if (this.channel) void supabase.removeChannel(this.channel);
    this.channel = null;
    this.topic = null;
  }
}

interface PlacedReaction extends GameReaction {
  // Mitte über dem Platz bzw. ohne Platz oben in der Mitte mit Namen
  x: number;
  y: number;
  anchored: boolean;
  name: string;
}

// Blasen über den Plätzen ([data-player]) der Spieler; wer keinen sichtbaren Platz hat
// (oder gerade nicht auf dem Bildschirm ist), erscheint oben unter dem Kopf mit Namen
@Component({
  selector: 'app-reaction-layer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (r of placed(); track r.id) {
      <div
        class="bubble"
        [class.bubble--loose]="!r.anchored"
        [style.left.px]="r.x"
        [style.top.px]="r.y"
        role="status"
        [attr.aria-label]="r.name + ' reagiert mit ' + r.emoji"
      >
        <span class="emoji" aria-hidden="true">{{ r.emoji }}</span>
        @if (!r.anchored) {
          <span class="who" aria-hidden="true">{{ r.name }}</span>
        }
      </div>
    }
  `,
  styleUrl: './game-reactions.scss',
})
export class ReactionLayer {
  private readonly reactions = inject(GameReactions);
  private readonly chat = inject(LobbyChatStore, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly placed = signal<PlacedReaction[]>([]);

  constructor() {
    effect(() => {
      const active = this.reactions.active();
      untracked(() => this.place(active));
    });
  }

  private place(active: GameReaction[]): void {
    const known = new Map(this.placed().map((r) => [r.id, r]));
    const stage = (this.host.nativeElement as HTMLElement).closest('.stage') ?? document.body;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.placed.set(
      active.map((reaction) => {
        const kept = known.get(reaction.id);
        if (kept) return kept;
        const name =
          reaction.userId === this.reactions.userId()
            ? 'Du'
            : (this.chat?.nameOf(reaction.userId) ?? '');
        const target = stage.querySelector<HTMLElement>(
          `[data-player="${CSS.escape(reaction.userId)}"]`,
        );
        const rect = target?.getBoundingClientRect();
        const visible =
          !!rect && rect.width > 0 && rect.bottom > 60 && rect.top < height && rect.right > 0;
        return {
          ...reaction,
          name,
          anchored: visible,
          x: visible ? Math.min(width - 36, Math.max(36, rect!.left + rect!.width / 2)) : width / 2,
          y: visible ? Math.max(70, rect!.top + 6) : 96,
        };
      }),
    );
  }
}
