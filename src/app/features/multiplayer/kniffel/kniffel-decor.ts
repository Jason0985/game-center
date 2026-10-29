import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { HalloweenPumpkins } from '../../../ui/halloween/halloween-decor';

// Saisonale Deko direkt auf dem Kniffelblock (liegt über dem Papier, folgt seiner Kante).
// Weihnachten: Schneekappe mit Zapfen auf der Oberkante, ein Stechpalmenzweig an der Ecke
// und kalte Ränder. Halloween: Kürbisse stehen auf dem Block (antippen gibt Süßes), in der
// Ecke ein Spinnennetz mit Spinne, oben eine Fledermaus als Stempel und glimmende Ränder.
@Component({
  selector: 'app-kniffel-decor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HalloweenPumpkins],
  template: `
    @switch (decor()) {
      @case ('christmas') {
        <span class="edge edge--frost"></span>
        <span class="snowcap"></span>
        <span class="holly"></span>
      }
      @case ('halloween') {
        <span class="edge edge--glow"></span>
        <span class="web"></span>
        <span class="spider"></span>
        <span class="bat"></span>
        <app-halloween-pumpkins [spots]="pumpkins" />
      }
    }
  `,
  styleUrl: './kniffel-decor.scss',
  host: { 'aria-hidden': 'true' },
})
export class KniffelDecor {
  readonly decor = inject(ThemeService).decor;
  readonly pumpkins = [{ right: '16px' }, { right: '52px', small: true }];
}
