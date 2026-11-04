import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { SkeletonRows } from '../../../ui/skeleton-rows';
import { PlanAnalysis, analyzePlan, totalBlocks } from './build-plan.model';
import { BuildPlansService, SavedBuild } from './build-plans.service';
import { IsoView } from './iso-view';
import { XpBar } from './xp-bar';

interface BuildRow {
  build: SavedBuild;
  analysis: PlanAnalysis;
  link: string;
  sub: string;
  progress: string;
  complete: boolean;
  done: number;
  steps: number;
}

/** Startseite: eigene Bauwerke aus Supabase, darunter das Beispielhaus. */
@Component({
  selector: 'app-build-planner',
  imports: [MatIcon, NgTemplateOutlet, RouterLink, SkeletonRows, IsoView, XpBar],
  templateUrl: './build-planner.html',
  styleUrl: './build-planner.scss',
})
export class BuildPlanner {
  private readonly service = inject(BuildPlansService);
  readonly session = inject(SessionService);

  readonly loading = signal(false);
  readonly error = signal('');
  private readonly builds = signal<SavedBuild[]>([]);

  readonly rows = computed(() => this.builds().map(toRow));
  readonly example = toRow(this.service.example());

  constructor() {
    effect(() => {
      const user = this.session.user();
      if (!this.session.initialized()) return;
      if (user) void this.load();
      else this.builds.set([]);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.builds.set(await this.service.list());
    } catch {
      this.error.set('Deine Bauwerke konnten nicht geladen werden. Prüf die Verbindung.');
    } finally {
      this.loading.set(false);
    }
  }
}

function toRow(build: SavedBuild): BuildRow {
  const analysis = analyzePlan(build.plan);
  const done = build.progress?.done?.length ?? 0;
  const steps = analysis.steps.length;
  return {
    build,
    analysis,
    link: `/collection/bauplaner/${build.id}`,
    sub: `${analysis.W} × ${analysis.D}, ${analysis.H} hoch, ${totalBlocks(build.plan, analysis)} Blöcke`,
    progress: done ? `${Math.min(done, steps)}/${steps}` : '',
    complete: done >= steps,
    done: Math.min(done, steps),
    steps,
  };
}
