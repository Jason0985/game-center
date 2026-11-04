import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../confirmation-dialog';
import { ToastService } from '../../../services/toast.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import { textureUrl } from './block-textures';
import {
  BuildPlan,
  ItemCount,
  PlacedBlock,
  PlanProgress,
  analyzePlan,
  isYoutubeUrl,
  countItems,
  planFileName,
  rawTotals,
  stacksLabel,
  totalBlocks,
} from './build-plan.model';
import { BuildPlansService, SavedBuild } from './build-plans.service';
import { BlockMode } from './iso-renderer';
import { IsoView } from './iso-view';
import { CellMode, LayerGrid } from './layer-grid';
import { copyText, downloadText } from './plan-io';
import { XpBar } from './xp-bar';

type Tab = 'overview' | 'layers' | 'steps' | 'materials';

interface MaterialRow extends ItemCount {
  swatch: string;
  stacks: string;
  have: boolean;
}

const TAB_KEY = 'bauplaner:tab';

@Component({
  selector: 'app-build-plan-detail',
  imports: [MatIcon, RouterLink, SkeletonRows, IsoView, LayerGrid, XpBar],
  templateUrl: './build-plan-detail.html',
  styleUrl: './build-plan-detail.scss',
})
export class BuildPlanDetail {
  private readonly service = inject(BuildPlansService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'layers', label: 'Ebenen' },
    { id: 'steps', label: 'Anleitung' },
    { id: 'materials', label: 'Material' },
  ];

  readonly build = signal<SavedBuild | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tab = signal<Tab>(readTab());
  readonly layer = signal(0);
  readonly step = signal(0);
  readonly rotation = signal(2);
  private readonly done = signal(new Set<number>());
  private readonly have = signal(new Set<string>());
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  readonly plan = computed(() => this.build()?.plan ?? null);
  readonly analysis = computed(() => {
    const plan = this.plan();
    return plan ? analyzePlan(plan) : null;
  });
  readonly isExample = computed(() => this.build()?.example === true);
  readonly stats = computed(() => {
    const plan = this.plan();
    const A = this.analysis();
    if (!plan || !A) return null;
    return {
      footprint: `${A.W}×${A.D}`,
      height: A.H,
      blocks: totalBlocks(plan, A),
      steps: A.steps.length,
    };
  });

  // --- Fortschritt --------------------------------------------------------
  readonly doneCount = computed(() => this.done().size);
  readonly nextStep = computed(() => {
    const A = this.analysis();
    if (!A) return 0;
    const first = A.steps.findIndex((_, i) => !this.done().has(i));
    return first < 0 ? A.steps.length - 1 : first;
  });
  isDone = (i: number) => this.done().has(i);

  // --- Ebenen -------------------------------------------------------------
  readonly layerItems = computed(() => {
    const plan = this.plan();
    const A = this.analysis();
    if (!plan || !A) return [];
    return this.withSwatch(
      plan,
      countItems(
        plan,
        A.blocks.filter((b) => b.y === this.layer()),
      ),
    );
  });
  readonly layerIsoMode = computed(() => {
    const y = this.layer();
    return (b: PlacedBlock): BlockMode => (b.y > y ? 'hidden' : b.y === y ? 'current' : 'dim');
  });

  // --- Anleitung ----------------------------------------------------------
  readonly currentStep = computed(() => this.analysis()?.steps[this.step()] ?? null);
  readonly stepItems = computed(() => {
    const plan = this.plan();
    const A = this.analysis();
    if (!plan || !A) return [];
    return this.withSwatch(
      plan,
      countItems(
        plan,
        A.blocks.filter((b) => b.step === this.step()),
      ),
    );
  });
  readonly stepLayers = computed(() => {
    const A = this.analysis();
    if (!A) return [];
    const i = this.step();
    return [...new Set(A.blocks.filter((b) => b.step === i).map((b) => b.y))].sort((a, b) => a - b);
  });
  readonly stepIsoMode = computed(() => {
    const i = this.step();
    return (b: PlacedBlock): BlockMode =>
      b.step > i ? 'hidden' : b.step === i ? 'current' : 'normal';
  });
  readonly stepGridMode = computed(() => {
    const i = this.step();
    return (b: PlacedBlock): CellMode => (b.step > i ? 'hidden' : b.step === i ? 'new' : 'dim');
  });

  // --- Material -----------------------------------------------------------
  readonly materials = computed<MaterialRow[]>(() => {
    const plan = this.plan();
    const A = this.analysis();
    if (!plan || !A) return [];
    const have = this.have();
    return this.withSwatch(plan, countItems(plan, A.blocks)).map((item) => ({
      ...item,
      stacks: stacksLabel(item.count, item.def.stack),
      have: have.has(item.name),
    }));
  });
  readonly haveCount = computed(() => this.materials().filter((m) => m.have).length);
  readonly raw = computed(() => {
    const plan = this.plan();
    const A = this.analysis();
    return plan && A
      ? rawTotals(plan, A.blocks).map((r) => ({ ...r, stacks: stacksLabel(r.count) }))
      : [];
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => void this.load(params.get('id') ?? ''));
    inject(DestroyRef).onDestroy(() => this.flushProgress());
  }

  async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const build = await this.service.get(id);
      if (!build) {
        this.error.set('Diesen Bauplan gibt es nicht (mehr).');
        this.build.set(null);
        return;
      }
      this.setBuild(build);
    } catch {
      this.error.set('Der Bauplan konnte nicht geladen werden. Prüf die Verbindung.');
    } finally {
      this.loading.set(false);
    }
  }

  private setBuild(build: SavedBuild): void {
    this.build.set(build);
    this.done.set(new Set(build.progress?.done ?? []));
    this.have.set(new Set(build.progress?.have ?? []));
    this.layer.set(0);
    const A = analyzePlan(build.plan);
    const firstOpen = A.steps.findIndex((_, i) => !this.done().has(i));
    this.step.set(firstOpen < 0 ? 0 : firstOpen);
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    try {
      sessionStorage.setItem(TAB_KEY, tab);
    } catch {
      // egal
    }
    scrollTo({ top: 0 });
  }

  // --- Ebenen -------------------------------------------------------------
  moveLayer(delta: number): void {
    const H = this.analysis()?.H ?? 1;
    this.layer.update((y) => Math.max(0, Math.min(H - 1, y + delta)));
  }

  onLayerRange(event: Event): void {
    this.layer.set(Number((event.target as HTMLInputElement).value) - 1);
  }

  // --- Anleitung ----------------------------------------------------------
  goStep(i: number): void {
    this.step.set(i);
  }

  startSteps(): void {
    this.step.set(this.nextStep());
    this.setTab('steps');
  }

  next(): void {
    this.setDone(this.step(), true);
    const last = (this.analysis()?.steps.length ?? 1) - 1;
    if (this.step() < last) {
      this.step.update((i) => i + 1);
      scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.toast.show({
        tone: 'success',
        icon: 'celebration',
        title: 'Fertig gebaut!',
        message: this.plan()?.name,
      });
    }
  }

  prev(): void {
    this.step.update((i) => Math.max(0, i - 1));
  }

  toggleDone(i: number): void {
    this.setDone(i, !this.done().has(i));
  }

  resetProgress(): void {
    this.done.set(new Set());
    this.step.set(0);
    this.queueSave();
  }

  private setDone(i: number, on: boolean): void {
    const next = new Set(this.done());
    if (on) next.add(i);
    else next.delete(i);
    this.done.set(next);
    this.queueSave();
  }

  // --- Material -----------------------------------------------------------
  toggleHave(name: string): void {
    const next = new Set(this.have());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.have.set(next);
    this.queueSave();
  }

  // --- Speichern des Fortschritts (gebündelt) ------------------------------
  private queueSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushProgress(), 700);
  }

  private flushProgress(): void {
    if (this.saveTimer === undefined) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    const build = this.build();
    if (!build) return;
    const progress: PlanProgress = {
      done: [...this.done()].sort((a, b) => a - b),
      have: [...this.have()],
    };
    this.service.saveProgress(build.id, progress).catch(() =>
      this.toast.show({
        key: 'bauplaner-progress',
        tone: 'error',
        icon: 'cloud_off',
        title: 'Fortschritt nicht gespeichert',
        message: 'Prüf die Verbindung.',
      }),
    );
  }

  // --- Export und KI-Änderung -----------------------------------------------
  async copyJson(): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    const ok = await copyText(JSON.stringify(plan, null, 1));
    this.toast.show(
      ok
        ? { tone: 'success', icon: 'content_copy', title: 'Bauplan kopiert' }
        : { tone: 'error', icon: 'error_outline', title: 'Kopieren ging nicht' },
    );
  }

  downloadJson(): void {
    const plan = this.plan();
    if (plan) downloadText(planFileName(plan), JSON.stringify(plan, null, 1), 'application/json');
  }

  remove(): void {
    const build = this.build();
    if (!build || build.example) return;
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: `„${build.name}“ löschen?`,
          message: 'Der Bauplan und dein Fortschritt werden endgültig gelöscht.',
          confirmLabel: 'Löschen',
          icon: 'delete',
        },
      })
      .afterClosed()
      .subscribe(async (confirmed: boolean | undefined) => {
        if (!confirmed) return;
        try {
          clearTimeout(this.saveTimer);
          this.saveTimer = undefined;
          await this.service.remove(build.id);
          void this.router.navigateByUrl('/collection/bauplaner');
        } catch {
          this.toast.show({
            tone: 'error',
            icon: 'error_outline',
            title: 'Löschen fehlgeschlagen',
          });
        }
      });
  }

  readonly isVideoUrl = isYoutubeUrl;

  hostOf(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  private withSwatch(plan: BuildPlan, items: ItemCount[]): (ItemCount & { swatch: string })[] {
    return items.map((item) => {
      const url = textureUrl(plan.palette[item.key] ?? item.def, 'side');
      return { ...item, swatch: url ? `url(${url})` : 'none' };
    });
  }
}

function readTab(): Tab {
  try {
    const tab = sessionStorage.getItem(TAB_KEY);
    return tab === 'layers' || tab === 'steps' || tab === 'materials' ? tab : 'overview';
  } catch {
    return 'overview';
  }
}
