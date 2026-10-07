import { Component, computed, input } from '@angular/core';
import { SkipboCardView } from './skipbo-card';
import { fanView, SkipboCard } from './skipbo.model';

// Ablage als senkrechter Fächer (unten → oben, die oberste Karte ganz sichtbar mit
// großer Zahl). Von jeder Karte darunter bleibt ein Streifen (--strip) mit ihrer Zahl;
// mehr als max Karten fasst eine Kappe „+N“ zusammen. Kanten-Modus (Handy-Mitspieler):
// bis zu zwei schmale Kanten. Maße: --fan-w, --fan-h, --strip vom Elternteil.
@Component({
  selector: '[appSkipboFan]',
  imports: [SkipboCardView],
  template: `
    @let view = shown();
    @if (!cards().length) {
      <span class="empty"></span>
    } @else {
      @if (view.cap && !edges()) {
        <span class="cap">+{{ view.cap }}</span>
      }
      @for (card of view.cards; track $index; let last = $last) {
        <app-skipbo-card
          [card]="card"
          [variant]="last ? 'flat' : edges() ? 'edge' : 'fan'"
          [class.fan-top]="last"
        />
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex: none;
      flex-direction: column;
    }

    app-skipbo-card {
      --card-w: var(--fan-w);
      --card-h: var(--fan-h);
    }

    app-skipbo-card + app-skipbo-card {
      margin-top: calc(var(--strip) - var(--fan-h));
    }

    .empty,
    .cap {
      width: var(--fan-w);
      box-sizing: border-box;
    }

    .empty {
      height: var(--fan-h);
      border: 1.5px dashed var(--table-slot-border);
      border-radius: max(3px, calc(var(--fan-w) * 0.145));
      background: var(--table-slot-bg);
    }

    .cap {
      display: flex;
      justify-content: center;
      height: var(--strip);
      padding-top: 1px;
      border: 1px solid var(--color-border-subtle);
      border-radius: max(3px, calc(var(--fan-w) * 0.145)) max(3px, calc(var(--fan-w) * 0.145)) 0 0;
      background: var(--color-surface-raised);
      color: var(--color-text-muted);
      font-size: var(--cap-font, 11px);
      font-weight: 800;
      line-height: 1;
    }
  `,
})
export class SkipboFan {
  readonly cards = input.required<SkipboCard[]>();
  // So viele oberste Karten bleiben sichtbar
  readonly max = input(4);
  readonly edges = input(false);

  readonly shown = computed(() => fanView(this.cards(), this.edges() ? 3 : this.max()));
}
