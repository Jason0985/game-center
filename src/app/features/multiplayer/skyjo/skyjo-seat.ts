import { Component, computed, input } from '@angular/core';
import { AVATAR_COLORS } from '../table/table.model';
import { SkyjoCardView } from './skyjo-card';
import { SkPlayer } from './skyjo.model';

// Eine Zelle des Rasters, wie sie gerade zu sehen ist: Karte (null = Rücken), abgeräumt
// (gone: gestrichelte Lücke) oder leuchtend kurz vor dem Abräumen (glow)
export interface SkCellView {
  cell: number;
  card: number | null;
  gone: boolean;
  glow: boolean;
}

// Hinweis unter dem Schild (letzte Runde): „alles offen“, „fertig“, „nach dir“
export interface SkSeatTag {
  text: string;
  tone: 'gold' | 'done' | 'muted';
}

// Schild eines Mitspielers (Artboards „Am Zug“, iPad, Laptop): Avatar, Name, Summe der
// offenen Karten (beim Rundenstart stattdessen ✓ bzw. „…“), darunter das Raster 3 × 4 in
// Mini-Karten. Am Zug weißer Rand, Rundenbeender gold. Größen kommen vom Tisch (--mini-w …).
@Component({
  selector: '[appSkyjoSeat]',
  imports: [SkyjoCardView],
  template: `
    @let p = player();
    <span class="head">
      @if (p.state === 'left') {
        <span class="avatar avatar--left" aria-hidden="true">
          <span class="material-symbols-rounded">event_seat</span>
        </span>
      } @else {
        <span class="avatar" [style.background]="color()" aria-hidden="true">{{ initial() }}</span>
      }
      <span class="name">{{ p.name }}</span>
      @if (p.state === 'left') {
        <span class="gone-text">weg</span>
      } @else if (status(); as s) {
        <span class="status" [class.on]="s === 'ready'" aria-hidden="true">
          <span class="material-symbols-rounded fill">{{
            s === 'ready' ? 'check' : 'more_horiz'
          }}</span>
        </span>
      } @else {
        <span class="sum">{{ sum() }}</span>
      }
    </span>
    <span class="grid" aria-hidden="true">
      @for (c of cells(); track c.cell) {
        <span class="cell" [class.glow]="c.glow" [attr.data-cell]="p.seat + ':' + c.cell">
          @if (c.gone) {
            <span class="slot"></span>
          } @else {
            <app-skyjo-card class="mini" [card]="c.card" />
          }
        </span>
      }
    </span>
    @if (tag(); as t) {
      <span class="tag" [attr.data-tone]="t.tone">{{ t.text }}</span>
    }
  `,
  styleUrl: './skyjo-seat.scss',
  host: {
    '[attr.data-seat]': 'player().seat',
    '[attr.data-state]': 'player().state',
    '[class.is-turn]': 'turn()',
    '[class.is-ender]': "tag()?.tone === 'gold'",
    '[attr.aria-label]': 'label()',
  },
})
export class SkyjoSeat {
  readonly player = input.required<SkPlayer>();
  readonly cells = input.required<SkCellView[]>();
  // Summe der offenen Karten
  readonly sum = input.required<number>();
  // Rundenstart: ready = hat 2 aufgedeckt, waiting = deckt noch auf; sonst null
  readonly status = input<'ready' | 'waiting' | null>(null);
  readonly turn = input(false);
  readonly tag = input<SkSeatTag | null>(null);

  readonly initial = computed(() => this.player().name.trim().charAt(0).toUpperCase() || '?');
  readonly color = computed(() => AVATAR_COLORS[this.player().seat % AVATAR_COLORS.length]);
  readonly label = computed(() => {
    const player = this.player();
    if (player.state === 'left') return `${player.name}, hat verlassen`;
    const open = this.cells().filter((c) => !c.gone && c.card !== null);
    return [
      player.name,
      `${open.length} von 12 offen, Summe ${this.sum()}`,
      open.length ? `offen: ${open.map((c) => c.card).join(', ')}` : null,
      this.status() === 'ready' && 'hat aufgedeckt',
      this.status() === 'waiting' && 'deckt noch auf',
      this.turn() && 'ist am Zug',
      this.tag()?.text,
    ]
      .filter(Boolean)
      .join(', ');
  });
}
