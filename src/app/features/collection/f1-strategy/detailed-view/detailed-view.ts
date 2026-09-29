import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import trackData from '../tracks.json';
import { SessionService } from '../../../../services/session.service';
import { F1StrategyOverridesService, TrackEditValues } from '../f1-strategy-overrides.service';
import { EditTrackDialog } from './edit-track-dialog';

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
  notes: string;
  creation_date: string;
}

interface TrackData {
  tracks: Track[];
}

@Component({
  selector: 'app-detailed-view',
  imports: [MatDialogModule, MatIcon, RouterLink],
  templateUrl: './detailed-view.html',
  styleUrl: './detailed-view.scss',
})
export class DetailedView {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly session = inject(SessionService);
  private readonly overridesService = inject(F1StrategyOverridesService);
  private readonly overrides = signal<Partial<TrackEditValues>>({});
  readonly baseTrack = (trackData as TrackData).tracks.find(
    (item) => item.id === this.route.snapshot.paramMap.get('trackId'),
  );
  readonly track = computed(() =>
    this.baseTrack ? { ...this.baseTrack, ...this.overrides() } : undefined,
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.session.initialized()) {
        return;
      }

      const userId = this.session.user()?.id;
      const trackId = this.baseTrack?.id;
      if (!userId || !trackId) {
        this.overrides.set({});
        return;
      }

      let active = true;
      onCleanup(() => (active = false));
      void this.overridesService.getOverrides(userId, trackId).then((overrides) => {
        if (active) {
          this.overrides.set(overrides);
        }
      });
    });
  }

  isOverridden(field: keyof TrackEditValues): boolean {
    return Object.hasOwn(this.overrides(), field);
  }

  openEditDialog(track: Track): void {
    const userId = this.session.user()?.id ?? null;
    const baseValues: TrackEditValues = {
      fuel_50: this.baseTrack?.fuel_50 ?? null,
      good_quali_time: this.baseTrack?.good_quali_time ?? null,
      notes: this.baseTrack?.notes ?? '',
    };
    const dialogRef = this.dialog.open(EditTrackDialog, {
      width: 'min(92vw, 440px)',
      data: {
        trackId: track.id,
        country: track.country,
        countryCode: track.countryCode,
        userId,
        baseValues,
        values: {
          ...baseValues,
          ...this.overrides(),
        },
        overrides: this.overrides(),
      },
    });

    dialogRef.afterClosed().subscribe((overrides: Partial<TrackEditValues> | undefined) => {
      if (overrides) {
        this.overrides.set(overrides);
      }
    });
  }

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
