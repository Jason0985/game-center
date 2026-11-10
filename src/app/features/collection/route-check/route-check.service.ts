import { Injectable } from '@angular/core';
import { describeFunctionError, describeSupabaseError } from '../../../services/supabase-errors';
import { supabase } from '../../../supabase.client';
import type {
  CheckResult,
  Incident,
  IncidentKind,
  Schedule,
} from '../../../../../supabase/functions/route-traffic/route-logic';

export type { CheckResult, Incident, IncidentKind, Schedule };

export interface Place {
  label: string;
  lat: number;
  lon: number;
}

// Eine Route aus route_watches (Strecke und Prüfstand setzt die Edge Function route-traffic)
export interface RouteWatch {
  id: string;
  name: string;
  origin_label: string;
  origin_lat: number;
  origin_lon: number;
  dest_label: string;
  dest_lat: number;
  dest_lon: number;
  schedules: Schedule[];
  live_alerts: boolean;
  notify_clear: boolean;
  roads: string[];
  length_m: number | null;
  base_seconds: number | null;
  last_check: CheckResult | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface RouteDraft {
  id?: string;
  name: string;
  origin: Place;
  dest: Place;
  schedules: Schedule[];
  live_alerts: boolean;
  notify_clear: boolean;
}

export type RouteResult<T> = { ok: true; value: T } | { ok: false; message: string };

export const MAX_ROUTES = 5;

const COLUMNS =
  'id, name, origin_label, origin_lat, origin_lon, dest_label, dest_lat, dest_lon, schedules, ' +
  'live_alerts, notify_clear, roads, length_m, base_seconds, last_check, last_checked_at, created_at';

/** Routen-Check: eigene Routen laden, ändern, löschen; Planen und Prüfen über route-traffic. */
@Injectable({ providedIn: 'root' })
export class RouteCheckService {
  async list(): Promise<RouteResult<RouteWatch[]>> {
    const { data, error } = await supabase
      .from('route_watches')
      .select(COLUMNS)
      .order('created_at');
    if (error) return { ok: false, message: describeSupabaseError(error) };
    return { ok: true, value: (data ?? []) as unknown as RouteWatch[] };
  }

  async get(id: string): Promise<RouteResult<RouteWatch | null>> {
    const { data, error } = await supabase
      .from('route_watches')
      .select(COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) return { ok: false, message: describeSupabaseError(error) };
    return { ok: true, value: (data as unknown as RouteWatch | null) ?? null };
  }

  // Schalter direkt an der Route (ohne neu zu planen)
  async update(
    id: string,
    patch: Partial<Pick<RouteWatch, 'live_alerts' | 'notify_clear' | 'schedules' | 'name'>>,
  ): Promise<RouteResult<void>> {
    const { error } = await supabase.from('route_watches').update(patch).eq('id', id);
    return error
      ? { ok: false, message: describeSupabaseError(error) }
      : { ok: true, value: undefined };
  }

  async remove(id: string): Promise<RouteResult<void>> {
    const { error } = await supabase.from('route_watches').delete().eq('id', id);
    return error
      ? { ok: false, message: describeSupabaseError(error) }
      : { ok: true, value: undefined };
  }

  async search(query: string): Promise<RouteResult<Place[]>> {
    const result = await invoke<{ places: Place[] }>({ action: 'search', query });
    return result.ok ? { ok: true, value: result.value.places } : result;
  }

  async save(draft: RouteDraft): Promise<RouteResult<RouteWatch>> {
    const result = await invoke<{ route: RouteWatch }>({ action: 'save', ...draft });
    return result.ok ? { ok: true, value: result.value.route } : result;
  }

  async check(id: string, reverse: boolean): Promise<RouteResult<CheckResult>> {
    const result = await invoke<{ result: CheckResult }>({ action: 'check', id, reverse });
    return result.ok ? { ok: true, value: result.value.result } : result;
  }
}

async function invoke<T>(body: Record<string, unknown>): Promise<RouteResult<T>> {
  const { data, error } = await supabase.functions.invoke<T>('route-traffic', { body });
  if (error || !data) return { ok: false, message: await describeFunctionError(error) };
  return { ok: true, value: data };
}
