import { Injectable } from '@angular/core';
import { supabase } from '../../../supabase.client';

export interface TrackEditValues {
  fuel_50: string | null;
  good_quali_time: string | null;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class F1StrategyOverridesService {
  async getOverrides(userId: string, trackId: string): Promise<Partial<TrackEditValues>> {
    const { data, error } = await supabase
      .from('f1_strategy_overrides')
      .select('overrides')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.overrides as Partial<TrackEditValues> | undefined) ?? {};
  }

  async saveOverrides(
    userId: string,
    trackId: string,
    overrides: Partial<TrackEditValues>,
  ): Promise<void> {
    const query = Object.keys(overrides).length
      ? supabase.from('f1_strategy_overrides').upsert({
          user_id: userId,
          track_id: trackId,
          overrides,
          updated_at: new Date().toISOString(),
        })
      : supabase
          .from('f1_strategy_overrides')
          .delete()
          .eq('user_id', userId)
          .eq('track_id', trackId);
    const { error } = await query;

    if (error) {
      throw error;
    }
  }
}
