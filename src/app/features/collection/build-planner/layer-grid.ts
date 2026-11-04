import { Component, computed, input, signal } from '@angular/core';
import { BlockDef, BuildPlan, PlacedBlock, PlanAnalysis, blockKey } from './build-plan.model';
import { textureUrl } from './block-textures';

export type CellMode = 'normal' | 'new' | 'dim' | 'hidden';

interface Cell {
  key: string;
  kind: 'block' | 'ghost' | 'empty';
  mode?: CellMode;
  def?: BlockDef;
  image?: string;
  mark?: string;
  info?: string;
  // obere Blockhälfte (umgedrehte Treppe, obere Stufe/Falltür) und schmale Formen
  top?: boolean;
  thin?: boolean;
}

/** Eine Ebene als Raster von oben: unten ist vorne, Spalten von links nach rechts. */
@Component({
  selector: 'app-layer-grid',
  template: `
    <div
      class="grid"
      role="grid"
      [attr.aria-label]="'Ebene ' + (y() + 1)"
      [style.grid-template-columns]="'1.4em repeat(' + analysis().W + ', minmax(0, 1fr))'"
      [style.max-width.px]="maxWidth()"
    >
      @for (row of rows(); track row.z) {
        <span class="axis">{{ row.z + 1 }}</span>
        @for (cell of row.cells; track cell.key) {
          @if (cell.kind === 'block') {
            <button
              type="button"
              class="cell"
              [class.cell--new]="cell.mode === 'new'"
              [class.cell--top]="cell.top"
              [class.cell--thin]="cell.thin"
              [class.cell--dim]="cell.mode === 'dim'"
              [class.cell--selected]="selected() === cell.key"
              [style.background-color]="cell.thin ? null : cell.def!.color"
              [style.background-image]="cell.image"
              [attr.aria-label]="cell.info"
              (click)="select(cell)"
            >
              @if (cell.mark) {
                <span class="mark">{{ cell.mark }}</span>
              }
            </button>
          } @else if (cell.kind === 'ghost') {
            <span
              class="cell cell--ghost"
              [style.background-image]="cell.image"
              [style.background-color]="cell.def!.color"
            ></span>
          } @else {
            <span class="cell cell--empty"></span>
          }
        }
      }
      <span></span>
      @for (x of columns(); track x) {
        <span class="axis">{{ x + 1 }}</span>
      }
    </div>
    <p class="front">Vorne{{ plan().front ? ' (' + plan().front + ')' : '' }}</p>
    <p class="info" role="status">{{ info() || 'Tipp auf einen Block für Details' }}</p>
  `,
  styleUrl: './layer-grid.scss',
})
export class LayerGrid {
  readonly plan = input.required<BuildPlan>();
  readonly analysis = input.required<PlanAnalysis>();
  readonly y = input.required<number>();
  readonly mode = input<(block: PlacedBlock) => CellMode>(() => 'normal');
  readonly ghost = input(false);

  readonly selected = signal<string | null>(null);
  readonly info = signal('');

  readonly columns = computed(() => Array.from({ length: this.analysis().W }, (_, x) => x));
  readonly maxWidth = computed(() => Math.min(this.analysis().W * 46 + 28, 620));

  readonly rows = computed(() => {
    const plan = this.plan();
    const A = this.analysis();
    const y = this.y();
    const mode = this.mode();
    const rows: { z: number; cells: Cell[] }[] = [];
    // Hinten oben, vorne unten (wie beim Blick von oben mit dem Rücken zur Tür)
    for (let z = A.D - 1; z >= 0; z--) {
      const cells: Cell[] = [];
      for (let x = 0; x < A.W; x++) {
        const key = blockKey(x, y, z);
        const block = A.map.get(key);
        const cellMode = block ? mode(block) : 'hidden';
        if (block && cellMode !== 'hidden') {
          const def = plan.palette[block.ch];
          cells.push({
            key,
            kind: 'block',
            mode: cellMode,
            def,
            image: url(def),
            mark: mark(def),
            top: def.half === 'top' || def.shape === 'slab_top',
            thin: isThin(def),
            info: `${def.name}: Spalte ${x + 1}, Reihe ${z + 1}, Ebene ${y + 1}`,
          });
          continue;
        }
        const below = this.ghost() && y > 0 ? A.map.get(blockKey(x, y - 1, z)) : undefined;
        if (below) {
          const def = plan.palette[below.ch];
          cells.push({ key, kind: 'ghost', def, image: url(def) });
        } else {
          cells.push({ key, kind: 'empty' });
        }
      }
      rows.push({ z, cells });
    }
    return rows;
  });

  select(cell: Cell): void {
    this.selected.set(cell.key);
    this.info.set(cell.info ?? '');
  }
}

function url(def: BlockDef): string {
  const data = textureUrl(def, 'top');
  return data ? `url(${data})` : 'none';
}

function mark(def: BlockDef): string {
  const top = def.half === 'top' && def.shape === 'trapdoor';
  switch (def.shape) {
    case 'stair': {
      const [dx, dz] = def.dir ?? [0, 1];
      const arrow = dz === 1 ? '▲' : dz === -1 ? '▼' : dx === 1 ? '▶' : '◀';
      return arrow;
    }
    case 'slab':
      return '½';
    case 'slab_top':
      return '½';
    case 'trapdoor':
    case 'carpet':
      return top ? '▔' : '▁';
    default:
      return '';
  }
}

// Schmale Formen nur als kleines Feld in der Mitte der Zelle
const THIN = ['fence', 'wall', 'pane', 'small'];
export const isThin = (def: BlockDef) => THIN.includes(def.shape ?? '');
