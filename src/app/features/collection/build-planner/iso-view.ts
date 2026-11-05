import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from '../../../services/theme.service';
import { BuildPlan, PlacedBlock, PlanAnalysis } from './build-plan.model';
import { BlockMode, drawIso } from './iso-renderer';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/**
 * 3D-Ansicht eines Baus. Wischen oder Pfeile drehen in 90°-Schritten, zwei Finger,
 * Strg/Cmd + Mausrad oder die Lupen zoomen; gezoomt verschiebt ein Finger das Bild.
 * Inhalte mit dem Attribut isoTop erscheinen als Leiste oben im Fenster.
 */
@Component({
  selector: 'app-iso-view',
  imports: [MatIcon],
  template: `
    <div
      class="iso-stage"
      [class.iso-stage--compact]="compact()"
      [class.iso-stage--zoomed]="zoomed()"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointercancel)="up($event)"
      (wheel)="wheel($event)"
      (dblclick)="resetZoom()"
    >
      <canvas #canvas role="img" [attr.aria-label]="label()"></canvas>
      @if (!compact()) {
        <div class="iso-top"><ng-content select="[isoTop]" /></div>
        <div class="iso-controls iso-controls--start">
          <button
            type="button"
            class="iso-btn"
            (click)="zoomBy(1 / 1.4)"
            [disabled]="!zoomed()"
            aria-label="Verkleinern"
          >
            <mat-icon aria-hidden="true">remove</mat-icon>
          </button>
          <button
            type="button"
            class="iso-btn"
            (click)="zoomBy(1.4)"
            [disabled]="zoom() >= maxZoom"
            aria-label="Vergrößern"
          >
            <mat-icon aria-hidden="true">add</mat-icon>
          </button>
          @if (zoomed()) {
            <button
              type="button"
              class="iso-btn"
              (click)="resetZoom()"
              aria-label="Ganzen Bau zeigen"
            >
              <mat-icon aria-hidden="true">fit_screen</mat-icon>
            </button>
          }
        </div>
        <div class="iso-controls">
          <button type="button" class="iso-btn" (click)="turn(-1)" aria-label="Nach links drehen">
            <mat-icon aria-hidden="true">rotate_left</mat-icon>
          </button>
          <button type="button" class="iso-btn" (click)="turn(1)" aria-label="Nach rechts drehen">
            <mat-icon aria-hidden="true">rotate_right</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './iso-view.scss',
})
export class IsoView {
  readonly plan = input.required<BuildPlan>();
  readonly analysis = input.required<PlanAnalysis>();
  readonly mode = input<(block: PlacedBlock) => BlockMode>(() => 'normal');
  readonly maxHeight = input(440);
  readonly compact = input(false);
  readonly dims = input(true);
  readonly label = input('3D-Ansicht des Baus');
  // Vorderseite zuerst: Drehung 2 zeigt die Seite mit z = 0
  readonly rotation = model(2);

  readonly maxZoom = MAX_ZOOM;
  readonly zoom = signal(1);
  readonly zoomed = computed(() => this.zoom() > 1.001);
  private readonly pan = signal({ x: 0, y: 0 });

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly theme = inject(ThemeService);
  private readonly width = signal(0);

  // Gesten: aktive Finger, Start fürs Wischen, Abstand für Zwei-Finger-Zoom
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private swipeStart: { x: number; y: number } | null = null;
  private pinchDistance = 0;
  private moved = false;

  constructor() {
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (width && width !== this.width()) this.width.set(width);
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());

    afterRenderEffect(() => {
      const plan = this.plan();
      const analysis = this.analysis();
      const mode = this.mode();
      const rotation = this.rotation();
      const zoom = this.zoom();
      const pan = this.pan();
      this.width();
      this.theme.theme();
      const styles = getComputedStyle(this.host.nativeElement);
      drawIso(this.canvas().nativeElement, plan, analysis, {
        rotation,
        mode,
        zoom,
        panX: pan.x,
        panY: pan.y,
        dims: this.dims(),
        maxHeight: this.compact()
          ? this.maxHeight()
          : Math.min(this.maxHeight(), Math.max(260, innerHeight * 0.6)),
        highlight: styles.getPropertyValue('--bp-highlight').trim() || '#f5c451',
        dimColor: styles.getPropertyValue('--bp-dim').trim() || 'rgba(20,24,44,0.6)',
        compact: this.compact(),
      });
    });
  }

  turn(direction: number): void {
    this.rotation.update((value) => (value + direction + 4) % 4);
  }

  zoomBy(factor: number): void {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom() * factor));
    // Verschiebung mitskalieren, damit der Ausschnitt in der Mitte bleibt
    const ratio = next / this.zoom();
    this.pan.update((p) =>
      next <= MIN_ZOOM ? { x: 0, y: 0 } : { x: p.x * ratio, y: p.y * ratio },
    );
    this.zoom.set(next);
  }

  resetZoom(): void {
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
  }

  wheel(event: WheelEvent): void {
    // Nur mit Strg/Cmd (auch Trackpad-Pinch), sonst scrollt die Seite normal weiter
    if (this.compact() || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    this.zoomBy(Math.exp(-event.deltaY * 0.01));
  }

  down(event: PointerEvent): void {
    if (this.compact() || (event.target as HTMLElement).closest('button, a, input')) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.moved = false;
    if (this.pointers.size === 2) {
      this.pinchDistance = this.distance();
      this.swipeStart = null;
    } else {
      this.swipeStart = { x: event.clientX, y: event.clientY };
    }
  }

  move(event: PointerEvent): void {
    const last = this.pointers.get(event.pointerId);
    if (!last) return;
    const next = { x: event.clientX, y: event.clientY };
    this.pointers.set(event.pointerId, next);
    if (this.pointers.size === 2) {
      const distance = this.distance();
      if (this.pinchDistance > 0) this.zoomBy(distance / this.pinchDistance);
      this.pinchDistance = distance;
      this.moved = true;
    } else if (this.zoomed()) {
      // Gezoomt: Bild mit dem Finger verschieben
      this.pan.update((p) => ({ x: p.x + next.x - last.x, y: p.y + next.y - last.y }));
      this.moved = true;
    }
  }

  up(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size > 0) return;
    const start = this.swipeStart;
    this.swipeStart = null;
    this.pinchDistance = 0;
    // Nicht gezoomt: waagerecht wischen dreht
    if (start && !this.moved && !this.zoomed()) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.turn(dx > 0 ? 1 : -1);
    }
  }

  private distance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
}
