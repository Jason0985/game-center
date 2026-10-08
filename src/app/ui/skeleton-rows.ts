import { Component, computed, input } from '@angular/core';

// Unterschiedliche Längen, damit die Platzhalter nicht wie ein Raster aussehen
const TITLE_WIDTHS = [62, 48, 70, 55, 66];
const SUB_WIDTHS = [40, 58, 35, 50, 45];

// Platzhalter-Zeilen in Form von .ui-row, solange eine Liste lädt. In eine .ui-group setzen,
// dann bleibt das Grundgerüst stehen und nur der Inhalt wird ersetzt.
@Component({
  selector: 'app-skeleton-rows',
  template: `
    @for (row of rows(); track $index) {
      <div class="ui-row" aria-hidden="true">
        @if (lead() !== 'none') {
          <span
            class="ui-skeleton skeleton-lead"
            [class.skeleton-lead--avatar]="lead() === 'avatar'"
          ></span>
        }
        <span class="ui-row-text skeleton-text">
          <span class="ui-skeleton ui-skeleton--title" [style.width.%]="row.title"></span>
          <span class="ui-skeleton" [style.width.%]="row.sub"></span>
        </span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .skeleton-lead {
      flex: none;
      width: 30px;
      height: 30px;
      border-radius: 8px;
    }
    .skeleton-lead--avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
    .skeleton-text {
      gap: 8px;
      padding: 4px 0;
    }
  `,
  host: { role: 'status', '[attr.aria-label]': 'label()' },
})
export class SkeletonRows {
  readonly count = input(3);
  readonly lead = input<'avatar' | 'icon' | 'none'>('icon');
  readonly label = input('Wird geladen');
  readonly rows = computed(() =>
    Array.from({ length: this.count() }, (_, i) => ({
      title: TITLE_WIDTHS[i % TITLE_WIDTHS.length],
      sub: SUB_WIDTHS[i % SUB_WIDTHS.length],
    })),
  );
}
