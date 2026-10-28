import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';

let nextId = 0;

// Saisonaler Tisch: liegt über der Tischplatte und folgt ihrer Rundung; Farben für Filz, Holz
// und Intarsie kommen aus styles/_decor.scss. Weihnachten: Strickmuster im Tannenfilz, Lampen-
// licht, Kirschholzrand mit Goldintarsie und eine Schneewehe mit unregelmäßiger Kante (SVG-
// Turbulenz), auf der es funkelt. Halloween: Nebel zieht über den Filz, Kerzenlicht flackert,
// verkohlter Rand mit glimmender Glut und eine Spinne am Faden. rim=false: nur der Filz
// (Kniffel). Breite des Rands: --rim des Tischs. Nie klickbar.
@Component({
  selector: 'app-table-decor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (decor()) {
      @case ('christmas') {
        <span class="felt">
          <span class="knit"></span>
          <span class="stitch"></span>
          <span class="lamp"></span>
        </span>
        @if (rim()) {
          <span class="wood"></span>
          <span class="inlay"></span>
          <svg class="defs" aria-hidden="true">
            <filter [attr.id]="filterId" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="7" />
            </filter>
          </svg>
          <span
            class="drift"
            [style.filter]="'url(#' + filterId + ') drop-shadow(0 2px 2px rgba(5, 30, 20, 0.45))'"
          >
            <span class="drift-snow"></span>
          </span>
          <span class="glint glint--1"></span>
          <span class="glint glint--2"></span>
          <span class="glint glint--3"></span>
        }
      }
      @case ('halloween') {
        <span class="felt">
          <span class="fog fog--far"></span>
          <span class="fog fog--near"></span>
          <span class="candle candle--left"></span>
          <span class="candle candle--right"></span>
        </span>
        @if (rim()) {
          <span class="wood wood--charred"></span>
          <span class="inlay inlay--ember"></span>
          <span class="spider"></span>
        }
      }
    }
  `,
  styleUrl: './table-decor.scss',
  host: {
    'aria-hidden': 'true',
    '[class]': "'table-decor table-decor--' + decor()",
    '[class.table-decor--flat]': '!rim()',
  },
})
export class TableDecor {
  readonly decor = inject(ThemeService).decor;
  /** false: nur Filz-Muster und Licht, ohne Holzrand (Kniffel). */
  readonly rim = input(true);
  readonly filterId = `table-snow-${nextId++}`;
}
