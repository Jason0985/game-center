import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { BuildPlan, EMPTY_IDEA, IdeaForm, ideaPrompt } from './build-plan.model';
import { BuildPlansService } from './build-plans.service';
import { copyText, downloadText } from './plan-io';
import { PlanImport } from './plan-import';

const DRAFT_KEY = 'bauplaner:idee';

interface Field {
  key: Exclude<keyof IdeaForm, 'mode'>;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

/** Neue Bauidee: Formular → Prompt kopieren → Antwort der KI importieren → speichern. */
@Component({
  selector: 'app-build-plan-new',
  imports: [MatIcon, RouterLink, PlanImport],
  templateUrl: './build-plan-new.html',
  styleUrl: './build-plan-new.scss',
})
export class BuildPlanNew {
  private readonly service = inject(BuildPlansService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly session = inject(SessionService);

  readonly fields: Field[] = [
    { key: 'name', label: 'Name des Baus', placeholder: 'z. B. Windmühle am Fluss' },
    {
      key: 'what',
      label: 'Was soll es sein?',
      placeholder: 'Beschreib deine Idee, je genauer, desto besser',
      multiline: true,
    },
    { key: 'size', label: 'Ungefähre Größe', placeholder: 'z. B. 9 × 9, höchstens 15 hoch' },
    { key: 'style', label: 'Stil und Umgebung', placeholder: 'z. B. mittelalterlich, Birkenwald' },
    { key: 'blocks', label: 'Wunschblöcke', placeholder: 'z. B. Fichte und Stein, keine Wolle' },
    {
      key: 'extra',
      label: 'Besonderheiten',
      placeholder: 'z. B. Keller, Balkon, Platz für Truhen',
      multiline: true,
    },
  ];

  readonly form = signal<IdeaForm>(readDraft());
  readonly prompt = computed(() => ideaPrompt(this.form()));
  readonly copied = signal(false);
  readonly saving = signal(false);
  private readonly importer = viewChild(PlanImport);

  update(key: keyof IdeaForm, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.setForm({ ...this.form(), [key]: value });
  }

  setMode(mode: IdeaForm['mode']): void {
    this.setForm({ ...this.form(), mode });
  }

  clear(): void {
    this.setForm({ ...EMPTY_IDEA });
  }

  async copy(): Promise<void> {
    const ok = await copyText(this.prompt());
    if (ok) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2200);
    } else {
      this.toast.show({
        tone: 'error',
        icon: 'content_copy',
        title: 'Kopieren ging nicht',
        message: 'Speicher den Prompt stattdessen als Datei.',
      });
    }
  }

  download(): void {
    downloadText('bauplaner-prompt.txt', this.prompt());
  }

  async save(plan: BuildPlan): Promise<void> {
    if (!this.session.isLoggedIn()) {
      void this.router.navigateByUrl('/profile/auth');
      return;
    }
    this.saving.set(true);
    try {
      const id = await this.service.create(plan);
      this.toast.show({
        tone: 'success',
        icon: 'check_circle',
        title: `„${plan.name}“ gespeichert`,
      });
      this.importer()?.reset();
      void this.router.navigate(['/collection/bauplaner', id]);
    } catch {
      this.toast.show({
        tone: 'error',
        icon: 'error_outline',
        title: 'Speichern fehlgeschlagen',
        message: 'Prüf die Verbindung und versuch es nochmal.',
      });
    } finally {
      this.saving.set(false);
    }
  }

  private setForm(form: IdeaForm): void {
    this.form.set(form);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Entwurf gilt dann nur bis zum Neuladen
    }
  }
}

function readDraft(): IdeaForm {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    return value && typeof value === 'object' ? { ...EMPTY_IDEA, ...value } : { ...EMPTY_IDEA };
  } catch {
    return { ...EMPTY_IDEA };
  }
}
