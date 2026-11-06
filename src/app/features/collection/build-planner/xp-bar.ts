import { Component, computed, input } from '@angular/core';

/**
 * Fortschritt im Stil einer Erfahrungsleiste: grüne Zahl darüber, dunkler Balken mit
 * Segmenten, leuchtend grüne Füllung und eine XP-Kugel an ihrem Ende.
 */
@Component({
  selector: 'app-xp-bar',
  template: `
    <div class="xp" [class.xp--compact]="compact()">
      @if (!compact()) {
        <span class="xp-level" aria-hidden="true">{{ value() }}</span>
      }
      <div
        class="xp-track"
        role="progressbar"
        [attr.aria-label]="label()"
        aria-valuemin="0"
        [attr.aria-valuemax]="max()"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuetext]="value() + ' von ' + max()"
      >
        <i class="xp-fill" [style.width.%]="percent()"></i>
        @if (percent() > 0 && percent() < 100) {
          <span class="xp-orb" [style.left.%]="percent()" aria-hidden="true"></span>
        }
      </div>
      @if (caption()) {
        <span class="xp-caption">{{ caption() }}</span>
      }
    </div>
  `,
  styleUrl: './xp-bar.scss',
})
export class XpBar {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input('Fortschritt');
  readonly caption = input('');
  readonly compact = input(false);

  readonly percent = computed(() =>
    this.max() > 0 ? Math.min(100, Math.max(0, (this.value() / this.max()) * 100)) : 0,
  );
}
