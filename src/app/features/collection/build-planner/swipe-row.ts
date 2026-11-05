import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

const ACTION_WIDTH = 84;
// Nur eine Zeile ist gleichzeitig aufgezogen (wie in iOS-Listen)
const openRow = signal<object | null>(null);

/**
 * Listenzeile, die man nach links wischen kann: dahinter liegt eine Aktion (Link).
 * Mit Maus und Hover erscheint die Aktion stattdessen als kleiner Knopf rechts.
 */
@Component({
  selector: 'app-swipe-row',
  imports: [MatIcon],
  template: `
    <a
      class="sw-action"
      [href]="href()"
      target="_blank"
      rel="noopener"
      [attr.aria-label]="label()"
      [attr.tabindex]="open() ? 0 : -1"
      (click)="close()"
    >
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <span>{{ actionText() }}</span>
    </a>
    <div
      class="sw-track"
      [class.sw-track--drag]="dragging()"
      [style.transform]="'translateX(' + offset() + 'px)'"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up()"
      (pointercancel)="up()"
    >
      <ng-content />
    </div>
    <a class="sw-hover" [href]="href()" target="_blank" rel="noopener" [attr.aria-label]="label()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
    </a>
  `,
  styleUrl: './swipe-row.scss',
})
export class SwipeRow {
  readonly href = input.required<string>();
  readonly label = input('Mehr');
  readonly actionText = input('Wiki');
  readonly icon = input('menu_book');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly open = computed(() => openRow() === this);
  readonly dragging = signal(false);
  private readonly drag = signal<number | null>(null);
  readonly offset = computed(() => this.drag() ?? (this.open() ? -ACTION_WIDTH : 0));

  constructor() {
    // Klicks in der Zeile schon in der Capture-Phase abfangen, bevor z. B. das Label den
    // Haken umschaltet
    this.host.nativeElement.addEventListener(
      'click',
      (event) => {
        if ((event.target as HTMLElement).closest('.sw-track')) this.swallow(event);
      },
      true,
    );
  }

  private start: { x: number; y: number; base: number } | null = null;
  private horizontal = false;
  private dragged = false;

  close(): void {
    if (this.open()) openRow.set(null);
  }

  down(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Andere offene Zeile schließen, sobald man eine neue anfasst
    if (openRow() && !this.open()) openRow.set(null);
    this.start = { x: event.clientX, y: event.clientY, base: this.offset() };
    this.horizontal = false;
    this.dragged = false;
  }

  move(event: PointerEvent): void {
    if (!this.start) return;
    const dx = event.clientX - this.start.x;
    const dy = event.clientY - this.start.y;
    if (!this.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        this.start = null; // senkrecht: die Seite scrollt
        return;
      }
      if (Math.abs(dx) < 8) return;
      this.horizontal = true;
      this.dragging.set(true);
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    }
    this.dragged = true;
    // Etwas Widerstand über die Aktion hinaus, nach rechts gar nicht
    const raw = this.start.base + dx;
    const next =
      raw < -ACTION_WIDTH ? -ACTION_WIDTH + (raw + ACTION_WIDTH) * 0.3 : Math.min(0, raw);
    this.drag.set(next);
  }

  up(): void {
    const value = this.drag();
    this.start = null;
    this.dragging.set(false);
    this.drag.set(null);
    if (value === null) return;
    openRow.set(value < -ACTION_WIDTH / 2 ? this : null);
  }

  // Nach einem Wisch kein Klick auf die Zeile (sonst würde z. B. der Haken umspringen)
  swallow(event: Event): void {
    if (this.dragged || this.open()) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.dragged) this.close();
    }
    this.dragged = false;
  }
}
