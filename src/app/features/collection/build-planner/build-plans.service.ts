import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';
import { BuildPlan, EXAMPLE_HOUSE, EXAMPLE_ID, PlanProgress } from './build-plan.model';

export interface SavedBuild {
  id: string;
  name: string;
  plan: BuildPlan;
  progress: PlanProgress;
  updated_at: string;
  example?: boolean;
}

// Neues Beispielhaus (Cottage): eigener Schlüssel, alter Fortschritt passt nicht mehr
const EXAMPLE_PROGRESS_KEY = 'bauplaner:beispiel-cottage';

/** Baupläne des angemeldeten Kontos (Tabelle build_plans) plus das eingebaute Beispielhaus. */
@Injectable({ providedIn: 'root' })
export class BuildPlansService {
  example(): SavedBuild {
    return {
      id: EXAMPLE_ID,
      name: EXAMPLE_HOUSE.name,
      plan: EXAMPLE_HOUSE,
      progress: readLocal(EXAMPLE_PROGRESS_KEY),
      updated_at: '',
      example: true,
    };
  }

  async list(): Promise<SavedBuild[]> {
    const { data, error } = await supabase
      .from('build_plans')
      .select('id, name, plan, progress, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedBuild[];
  }

  async get(id: string): Promise<SavedBuild | null> {
    if (id === EXAMPLE_ID) return this.example();
    const { data, error } = await supabase
      .from('build_plans')
      .select('id, name, plan, progress, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as SavedBuild | null) ?? null;
  }

  async create(plan: BuildPlan): Promise<string> {
    const { data, error } = await supabase
      .from('build_plans')
      .insert({ name: plan.name, plan })
      .select('id')
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  async saveProgress(id: string, progress: PlanProgress): Promise<void> {
    if (id === EXAMPLE_ID) {
      writeLocal(EXAMPLE_PROGRESS_KEY, progress);
      return;
    }
    const { error } = await supabase.from('build_plans').update({ progress }).eq('id', id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('build_plans').delete().eq('id', id);
    if (error) throw error;
  }
}

function readLocal(key: string): PlanProgress {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeLocal(key: string, value: PlanProgress): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Privater Modus o. Ä.: Fortschritt gilt dann nur bis zum Neuladen
  }
}
