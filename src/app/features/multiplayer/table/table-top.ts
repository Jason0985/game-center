import { Component, computed, input, linkedSignal } from '@angular/core';

// Tischplatte mit Wasserzeichen und Zug-Zeiger; Host ist der Tischbereich (div.table-area).
// Maße kommen vom Spiel (CSS-Variablen am Spiel-Host), der Inhalt wird hineinprojiziert.
@Component({
  selector: '[appTableTop]',
  template: `
    @let c = center();
    <div class="table" [style.aspect-ratio]="w() + ' / ' + h()">
      <span class="watermark" aria-hidden="true">{{ mark() }}</span>

      <svg
        class="pointer"
        [class.pointer--off]="!pointer()"
        [attr.viewBox]="'0 0 ' + w() + ' ' + h()"
        aria-hidden="true"
      >
        <circle class="pointer-ring" [attr.cx]="c.x" [attr.cy]="c.y" [attr.r]="c.r" />
        @if (pointer(); as p) {
          <g
            class="pointer-arm"
            [style.transform]="'rotate(' + p.angle + 'deg)'"
            [style.transform-origin]="c.x + 'px ' + c.y + 'px'"
          >
            <line [attr.x1]="p.x1" [attr.x2]="p.x2" [attr.y1]="c.y" [attr.y2]="c.y" />
            <polygon [attr.points]="p.head" />
          </g>
        }
      </svg>

      <ng-content />
    </div>
  `,
  styleUrl: './table-top.scss',
})
export class TableTop {
  // Design-Pixel der Tischplatte
  readonly w = input.required<number>();
  readonly h = input.required<number>();
  readonly mark = input.required<string>();
  // Stapelmitte (Ring des Zeigers)
  readonly center = input.required<{ x: number; y: number; r: number }>();
  // Wohin der Zeiger zeigt; before: so viel vor dem Ziel aufhören. null = Zeiger aus
  readonly target = input<{ x: number; y: number; before: number } | null>(null);

  private readonly aim = computed(() => {
    const target = this.target();
    if (!target) return null;
    const center = this.center();
    const angle = (Math.atan2(target.y - center.y, target.x - center.x) * 180) / Math.PI;
    return {
      angle,
      tip: Math.hypot(target.x - center.x, target.y - center.y) - target.before,
    };
  });
  // Winkel läuft den kürzesten Weg weiter
  private readonly angle = linkedSignal<number | undefined, number>({
    source: () => this.aim()?.angle,
    computation: (angle, previous) => {
      if (angle === undefined) return previous?.value ?? 0;
      if (!previous) return angle;
      return previous.value + ((((angle - previous.value) % 360) + 540) % 360) - 180;
    },
  });
  readonly pointer = computed(() => {
    const aim = this.aim();
    if (!aim) return null;
    const { x, y, r } = this.center();
    const tip = x + aim.tip;
    return {
      angle: this.angle(),
      x1: x + r + 6,
      x2: Math.max(x + r + 6, tip - 8),
      head: `${tip},${y} ${tip - 12.6},${y - 7.2} ${tip - 12.6},${y + 7.2}`,
    };
  });
}
