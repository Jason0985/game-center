import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
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

/** 3D-Ansicht eines Baus; wischen oder die Pfeile drehen ihn in 90°-Schritten. */
@Component({
  selector: 'app-iso-view',
  imports: [MatIcon],
  template: `
    <div
      class="iso-stage"
      [class.iso-stage--compact]="compact()"
      (pointerdown)="down($event)"
      (pointerup)="up($event)"
    >
      <canvas #canvas role="img" [attr.aria-label]="label()"></canvas>
      @if (!compact()) {
        <div class="iso-controls">
          <button type="button" class="iso-turn" (click)="turn(-1)" aria-label="Nach links drehen">
            <mat-icon aria-hidden="true">rotate_left</mat-icon>
          </button>
          <button type="button" class="iso-turn" (click)="turn(1)" aria-label="Nach rechts drehen">
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
  readonly label = input('3D-Ansicht des Baus');
  readonly rotation = model(2);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly theme = inject(ThemeService);
  private readonly width = signal(0);
  private swipeX: number | null = null;

  constructor() {
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (width && width !== this.width()) this.width.set(width);
    });
    observer.observe(this.host.nativeElement);
    inject(DestroyRef).onDestroy(() => observer.disconnect());

    afterRenderEffect(() => {
      // Abhängigkeiten: Daten, Drehung, Breite und Farbschema
      const plan = this.plan();
      const analysis = this.analysis();
      const mode = this.mode();
      const rotation = this.rotation();
      this.width();
      this.theme.theme();
      const styles = getComputedStyle(this.host.nativeElement);
      drawIso(this.canvas().nativeElement, plan, analysis, {
        rotation,
        mode,
        maxHeight: this.compact()
          ? this.maxHeight()
          : Math.min(this.maxHeight(), Math.max(260, innerHeight * 0.55)),
        highlight: styles.getPropertyValue('--bp-highlight').trim() || '#f5c451',
        dimColor: styles.getPropertyValue('--bp-dim').trim() || 'rgba(20,24,44,0.6)',
        compact: this.compact(),
      });
    });
  }

  turn(direction: number): void {
    this.rotation.update((value) => (value + direction + 4) % 4);
  }

  down(event: PointerEvent): void {
    this.swipeX =
      this.compact() || (event.target as HTMLElement).closest('button') ? null : event.clientX;
  }

  up(event: PointerEvent): void {
    if (this.swipeX === null) return;
    const dx = event.clientX - this.swipeX;
    this.swipeX = null;
    if (Math.abs(dx) > 40) this.turn(dx > 0 ? 1 : -1);
  }
}
