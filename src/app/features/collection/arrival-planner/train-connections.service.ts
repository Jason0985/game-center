import { Injectable } from '@angular/core';
import { describeFunctionError } from '../../../services/supabase-errors';
import { supabase } from '../../../supabase.client';
import { TrainJourney, TrainLocation } from './arrival-planner-train.model';

export type TrainResult<T> = { ok: true; value: T } | { ok: false; message: string };

@Injectable({ providedIn: 'root' })
export class TrainConnectionsService {
  async searchLocations(query: string): Promise<TrainResult<TrainLocation[]>> {
    const result = await invoke<{ locations: TrainLocation[] }>({ action: 'locations', query });
    return result.ok ? { ok: true, value: result.value.locations } : result;
  }

  async searchJourneys(
    from: TrainLocation,
    to: TrainLocation,
    arriveBy: Date,
  ): Promise<TrainResult<TrainJourney[]>> {
    const result = await invoke<{ journeys: TrainJourney[] }>({
      action: 'journeys',
      from: from.place,
      to: to.place,
      arriveBy: arriveBy.toISOString(),
    });
    return result.ok ? { ok: true, value: result.value.journeys } : result;
  }
}

async function invoke<T>(body: Record<string, unknown>): Promise<TrainResult<T>> {
  const { data, error } = await supabase.functions.invoke<T>('train-connections', { body });
  if (error || !data) {
    console.error('Zugverbindungen', error);
    return { ok: false, message: await describeFunctionError(error) };
  }
  return { ok: true, value: data };
}
