import { Component, computed, input, output, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  BuildPlan,
  analyzePlan,
  fixPrompt,
  isMaterialsOnly,
  parsePlan,
  planItems,
  toMaterialsOnly,
  totalBlocks,
} from './build-plan.model';
import { SCHEMATIC_EXTENSIONS, readSchematic } from './schematic';
import { copyText, readFileText } from './plan-io';
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
            accept=".json,.txt,.schematic,.schem,.litematic,.nbt,application/json,text/plain"
            (change)="pick($event)"
          />
        </label>
        <span class="import-or">oder einfügen:</span>
      </div>
      <p class="import-formats">
        JSON von der KI oder Schematic-Dateien (.schematic, .schem, .litematic, .nbt)
      </p>
      <textarea
        class="import-text"
        rows="5"
        placeholder="Antwort der KI einfügen"
        aria-label="Bauplan als Text einfügen"
        [value]="text()"
        (input)="onText($event)"
      ></textarea>
      @if (reading()) {
        <p class="import-reading">
          <mat-icon aria-hidden="true">hourglass_top</mat-icon>Datei wird gelesen …
        </p>
      }
      @if (error()) {
        <div class="import-problem" role="alert">
          <p class="import-error">
            <mat-icon aria-hidden="true">error_outline</mat-icon>{{ error() }}
          </p>
          @if (details().length) {
            <ul class="import-details">
              @for (detail of details(); track detail) {
                <li>{{ detail }}</li>
              }
            </ul>
          }
          <div class="import-fix">
            @if (details().length) {
              <button type="button" class="ui-pill-btn" (click)="copyFix(error())">
                <mat-icon aria-hidden="true">{{ fixCopied() ? 'check' : 'content_copy' }}</mat-icon>
                {{ fixCopied() ? 'Kopiert' : 'An KI zurückgeben' }}
              </button>
            }
            @if (repairable()) {
              <button
                type="button"
                class="ui-pill-btn ui-pill-btn--neutral"
                (click)="importAnyway()"
              >
                Trotzdem importieren
              </button>
            }
          </div>
          @if (repairable()) {
            <p class="import-note">„Trotzdem importieren“ setzt unbekannte Zeichen als Luft ein.</p>
          }
        </div>
      }
    </div>

    @if (preview(); as p) {
      <div class="ui-group preview" aria-live="polite">
        @if (!p.materialsOnly) {
          <app-iso-view [plan]="p.plan" [analysis]="p.analysis" [maxHeight]="260" />
        }
        <div class="preview-body">
          <h3>{{ p.plan.name }}</h3>
          <p>{{ p.stats }}</p>
          @if (note()) {
            <p class="import-note-box">
              <mat-icon aria-hidden="true">inventory_2</mat-icon>{{ note() }}
            </p>
          }
          @if (p.materialsOnly) {
            <ul class="import-top">
              @for (item of p.top; track item.name) {
                <li>
                  <span class="import-dot" [style.background]="item.def.color"></span>
                  <b>{{ item.count.toLocaleString('de-DE') }}</b> {{ item.name }}
                </li>
              }
            </ul>
          }
          @if (warnings().length) {
            <div class="import-warn">
              <p>
                <mat-icon aria-hidden="true">warning_amber</mat-icon>Kleine Fehler, automatisch
                ausgeglichen:
              </p>
              <ul class="import-details">
                @for (warning of warnings(); track warning) {
                  <li>{{ warning }}</li>
                }
              </ul>
              <button type="button" class="import-link" (click)="copyFix()">
                {{
                  fixCopied() ? 'Korrektur-Prompt kopiert' : 'Lieber von der KI korrigieren lassen'
                }}
              </button>
            </div>
          }
          <button
            type="button"
            class="ui-btn bp-primary"
            [disabled]="busy()"
            (click)="confirm.emit(p.plan)"
          >
            <mat-icon aria-hidden="true">{{ busy() ? 'hourglass_top' : 'save' }}</mat-icon>
            {{ p.materialsOnly ? materialsLabel() : confirmLabel() }}
          </button>
          @if (!p.materialsOnly) {
            <button
              type="button"
              class="import-link import-alt"
              [disabled]="busy()"
              (click)="confirm.emit(asMaterials(p.plan))"
            >
              Nur die Materialliste speichern
            </button>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './plan-import.scss',
})
export class PlanImport {
  readonly confirmLabel = input('In meinen Bauwerken speichern');
  readonly materialsLabel = input('Materialliste speichern');
  readonly busy = input(false);
  readonly confirm = output<BuildPlan>();

  readonly text = signal('');
  readonly error = signal('');
  readonly details = signal<string[]>([]);
  readonly warnings = signal<string[]>([]);
  readonly repairable = signal(false);
  readonly fixCopied = signal(false);
  readonly reading = signal(false);
  // Hinweis zum Schematic-Import (Format, warum nur Materialliste)
  readonly note = signal('');
  private readonly plan = signal<BuildPlan | null>(null);

  readonly preview = computed(() => {
    const plan = this.plan();
    if (!plan) return null;
    if (isMaterialsOnly(plan)) {
      const items = planItems(plan);
      const total = items.reduce((sum, item) => sum + item.count, 0);
      return {
        plan,
        analysis: analyzePlan(plan),
        materialsOnly: true,
        top: items.slice(0, 6),
        stats: `Materialliste: ${total.toLocaleString('de-DE')} Blöcke in ${items.length} Sorten`,
      };
    }
    const analysis = analyzePlan(plan);
    return {
      plan,
      analysis,
      materialsOnly: false,
      top: [],
      stats: `${analysis.W} × ${analysis.D} Grundfläche, ${analysis.H} Ebenen, ${totalBlocks(plan, analysis).toLocaleString('de-DE')} Blöcke, ${analysis.steps.length} ${analysis.steps.length === 1 ? 'Bauschritt' : 'Bauschritte'}`,
    };
  });

  async pick(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    try {
      if (SCHEMATIC_EXTENSIONS.test(file.name)) await this.applySchematic(file);
      else this.apply(await readFileText(file));
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
    this.apply('');
  }

  importAnyway(): void {
    this.apply(this.text(), true);
  }

  asMaterials(plan: BuildPlan): BuildPlan {
    return toMaterialsOnly(plan);
  }

  /** Schematic-Datei lesen: kleine Bauten werden ein Bauplan, große eine Materialliste. */
  private async applySchematic(file: File): Promise<void> {
    if (file.size > 30 * 1024 * 1024) throw new Error('Die Datei ist zu groß (höchstens 30 MB).');
    this.apply('');
    this.reading.set(true);
    try {
      const result = await readSchematic(await file.arrayBuffer(), file.name);
      this.plan.set(result.plan);
      this.note.set(
        result.materialsOnlyReason
          ? `${result.materialsOnlyReason} Du bekommst die komplette Materialliste.`
          : `${result.format} gelesen. Bauschritte gehen Ebene für Ebene.`,
      );
    } catch (error) {
      console.error('Schematic', error);
      throw new Error(
        'Die Datei konnte nicht gelesen werden. Unterstützt: .schematic, .schem, .litematic und .nbt.',
      );
    } finally {
      this.reading.set(false);
    }
  }

  /** Korrektur-Prompt mit allen Fundstellen kopieren, damit die KI selbst nachbessert. */
  async copyFix(summary = ''): Promise<void> {
    const problems = this.plan() ? this.warnings() : [summary, ...this.details()].filter(Boolean);
    if (await copyText(fixPrompt(problems))) {
      this.fixCopied.set(true);
      setTimeout(() => this.fixCopied.set(false), 2200);
    }
  }

  private apply(text: string, unknownAsAir = false): void {
    this.text.set(text);
    this.fixCopied.set(false);
    this.note.set('');
    const result = text.trim() ? parsePlan(text, { unknownAsAir }) : null;
    this.plan.set(result?.plan ?? null);
    this.error.set(result?.error ?? '');
    this.details.set(result?.error ? (result.details ?? []) : []);
    this.repairable.set(!!result?.error && !!result.repairable);
    this.warnings.set(result?.plan ? result.warnings : []);
  }
}
