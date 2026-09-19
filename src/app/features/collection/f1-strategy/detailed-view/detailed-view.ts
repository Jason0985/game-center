import { Component, computed, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import trackData from '../tracks.json';

interface Track {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  circuit: string;
  aero: string;
  differential: string;
  suspension_geometry: string;
  suspension: string;
  brakes: string;
  tires_quali: string;
  tires_race: string;
  compounds: string;
  strategy_50: string[];
  fuel_50: string | null;
  laps_50: number;
  good_quali_time: string | null;
  quali_recharge_mj: number | null;
  race_recharge: number | null;
  notes: string;
  creation_date: string;
}

interface TrackData {
  tracks: Track[];
}

@Component({
  selector: 'app-detailed-view',
  imports: [MatIcon, RouterLink],
  templateUrl: './detailed-view.html',
  styleUrl: './detailed-view.scss',
})
export class DetailedView {
  private readonly route = inject(ActivatedRoute);
  readonly track = computed(() => {
    const trackId = this.route.snapshot.paramMap.get('trackId');
    return (trackData as TrackData).tracks.find((item) => item.id === trackId);
  });

  formatStrategy(strategy: string): string {
    const compounds = strategy.match(/^[MHS]+(?:\/[MHS]+)*/)?.[0];
    return compounds
      ? compounds
          .split('/')
          .map((compound) => this.formatCompounds(compound))
          .join(' / ')
      : strategy;
  }

  formatStops(strategy: string): string[] {
    const stops = strategy.match(/^[MHS]+(?:\/[MHS]+)*\s+(.+)$/)?.[1];
    if (!stops || stops.includes('for ')) {
      return stops ? [stops] : [];
    }

    return stops.split(',').map((stop) => stop.trim().replace(/-/g, '–'));
  }

  private formatCompounds(compounds: string): string {
    const tireNames: Record<string, string> = {
      S: 'Soft',
      M: 'Medium',
      H: 'Hard',
    };

    return compounds
      .split('')
      .map((tire) => tireNames[tire])
      .join(' → ');
  }
}
