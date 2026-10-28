import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';

// Saisonale Deko auf dem Spieltisch, liegt über der Tischfläche und folgt ihrer Rundung.
// Weihnachten: der Rand ist leicht verschneit. Halloween: Rand glimmt orange-lila, in den
// oberen Ecken hängen Spinnennetze und oben baumelt eine kleine Spinne. Nie klickbar.
// Breite des Rands: --rim des Tischs (Kniffel hat keinen, dann 8px).
@Component({
  selector: 'app-table-decor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (decor()) {
      @case ('christmas') {
        <span class="frost"></span>
        <span class="flurry"></span>
      }
      @case ('halloween') {
        <span class="glow"></span>
        <span class="web web--left"></span>
        <span class="web web--right"></span>
        <span class="spider"></span>
      }
    }
  `,
  styleUrl: './table-decor.scss',
  host: { 'aria-hidden': 'true', '[class]': "'table-decor table-decor--' + decor()" },
})
export class TableDecor {
  readonly decor = inject(ThemeService).decor;
}
