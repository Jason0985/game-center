import { Component, computed, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { BuildPlan, analyzePlan, parsePlan, totalBlocks } from './build-plan.model';
import { readFileText } from './plan-io';
import { IsoView } from './iso-view';

/** Bauplan aus Datei oder eingefügtem Text lesen, prüfen und als Vorschau zeigen. */
@Component({
  selector: 'app-plan-import',
  imports: [MatIcon, IsoView],
  template: `
    <div class="ui-group import">
      <div class="import-actions">
        <label class="ui-pill-btn import-file">
          <mat-icon aria-hidden="true">upload_file</mat-icon>Datei wählen
          <input
            type="file"
            accept=".json,.txt,application/json,text/plain"
            (change)="pick($event)"
          />
        </label>
        <span class="import-or">oder einfügen:</span>
      </div>
      <textarea
        class="import-text"
        rows="5"
        placeholder="Antwort der KI einfügen"
        aria-label="Bauplan als Text einfügen"
        [value]="text()"
        (input)="onText($event)"
      ></textarea>
      @if (error()) {
        <p class="import-error" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>{{ error() }}
        </p>
      }
    </div>

    @if (preview(); as p) {
      <div class="ui-group preview" aria-live="polite">
        <app-iso-view [plan]="p.plan" [analysis]="p.analysis" [maxHeight]="260" />
        <div class="preview-body">
          <h3>{{ p.plan.name }}</h3>
          <p>{{ p.stats }}</p>
          <button
            type="button"
            class="ui-btn bp-primary"
            [disabled]="busy()"
            (click)="confirm.emit(p.plan)"
          >
            <mat-icon aria-hidden="true">{{ busy() ? 'hourglass_top' : 'save' }}</mat-icon>
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './plan-import.scss',
})
export class PlanImport {
  readonly confirmLabel = input('In meinen Bauwerken speichern');
  readonly busy = input(false);
  readonly confirm = output<BuildPlan>();

  readonly text = signal('');
  readonly error = signal('');
  private readonly plan = signal<BuildPlan | null>(null);

  readonly preview = computed(() => {
    const plan = this.plan();
    if (!plan) return null;
    const analysis = analyzePlan(plan);
    return {
      plan,
      analysis,
      stats: `${analysis.W} × ${analysis.D} Grundfläche, ${analysis.H} Ebenen, ${totalBlocks(plan, analysis)} Blöcke, ${analysis.steps.length} ${analysis.steps.length === 1 ? 'Bauschritt' : 'Bauschritte'}`,
    };
  });

  async pick(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    try {
      this.apply(await readFileText(file));
    } catch (error) {
      this.plan.set(null);
      this.error.set(
        error instanceof Error ? error.message : 'Die Datei konnte nicht gelesen werden.',
      );
    }
  }

  onText(event: Event): void {
    this.apply((event.target as HTMLTextAreaElement).value);
  }

  reset(): void {
    this.text.set('');
    this.plan.set(null);
    this.error.set('');
  }

  private apply(text: string): void {
    this.text.set(text);
    if (!text.trim()) {
      this.plan.set(null);
      this.error.set('');
      return;
    }
    const result = parsePlan(text);
    this.plan.set(result.plan ?? null);
    this.error.set(result.error ?? '');
  }
}
