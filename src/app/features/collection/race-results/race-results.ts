import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ConfirmationDialog } from '../../../confirmation-dialog';
import { AppErrorService } from '../../../services/app-error.service';
import { ToastService } from '../../../services/toast.service';
import { buildRltSessionExport, sortRows } from './race-results-export';
import {
  DRIVER_STATUSES,
  ExtractedResult,
  KNOWN_TEAMS,
  KNOWN_TRACKS,
  ResultRow,
  SessionMeta,
  findTeam,
  findTrack,
} from './race-results.model';
import { RaceResultsService } from './race-results.service';

const MAX_SCREENSHOTS = 4;
const LEAGUE_STORAGE_KEY = 'game-center-race-results-league';

interface Screenshot {
  id: number;
  file: File;
  previewUrl: string;
}

type LeagueFields = Pick<SessionMeta, 'leagueName' | 'seasonName' | 'championshipName'>;
type NumberField = 'position' | 'gridPosition' | 'penaltySeconds' | 'points';
type TextField = 'driverName' | 'teamName' | 'bestLap' | 'time' | 'status';

function todayAt20(): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${date}T20:00`;
}

function toNumber(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// Erkannte Namen auf die RLT-Schreibweise bringen, damit der Import sie zuordnen kann
function matchTrack(name: string | null): string {
  return name ? (findTrack(name)?.name ?? name) : '';
}

function matchTeam(name: string | null): string {
  return name ? (findTeam(name)?.name ?? name) : '';
}

@Component({
  selector: 'app-race-results',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './race-results.html',
  styleUrl: './race-results.scss',
})
export class RaceResults implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly raceResultsService = inject(RaceResultsService);
  private readonly appError = inject(AppErrorService);
  private readonly toast = inject(ToastService);

  readonly statuses = DRIVER_STATUSES;
  readonly knownTracks = KNOWN_TRACKS;
  readonly knownTeams = KNOWN_TEAMS;
  readonly maxScreenshots = MAX_SCREENSHOTS;

  readonly screenshots = signal<Screenshot[]>([]);
  readonly rows = signal<ResultRow[]>([]);
  readonly extracting = signal(false);
  readonly meta = signal<SessionMeta>({
    ...this.loadLeagueFields(),
    round: null,
    sessionStart: todayAt20(),
    trackName: '',
    sessionType: 'Race',
    raceType: 'Main',
    totalLaps: null,
  });

  readonly missingForExport = computed(() => {
    const missing: string[] = [];
    if (!this.rows().length) missing.push('Ergebnisse');
    if (!this.meta().trackName.trim()) missing.push('Strecke');
    if (this.rows().some((row) => !row.driverName.trim())) missing.push('Fahrernamen');
    return missing;
  });

  private nextId = 1;

  ngOnDestroy(): void {
    this.screenshots().forEach((screenshot) => URL.revokeObjectURL(screenshot.previewUrl));
  }

  addScreenshots(event: Event): void {
    const input = event.target as HTMLInputElement;
    const free = MAX_SCREENSHOTS - this.screenshots().length;
    const files = Array.from(input.files ?? []).filter((file) => file.type.startsWith('image/'));
    input.value = '';

    if (files.length > free) {
      this.toast.error(`Es passen höchstens ${MAX_SCREENSHOTS} Screenshots in eine Auswertung.`);
    }
    const added = files.slice(0, free).map((file) => ({
      id: this.nextId++,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    this.screenshots.update((screenshots) => [...screenshots, ...added]);
  }

  removeScreenshot(id: number): void {
    const screenshot = this.screenshots().find((item) => item.id === id);
    if (screenshot) URL.revokeObjectURL(screenshot.previewUrl);
    this.screenshots.update((screenshots) => screenshots.filter((item) => item.id !== id));
  }

  extract(): void {
    if (!this.rows().length) {
      void this.runExtraction();
      return;
    }

    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Tabelle ersetzen?',
          message:
            'Deine bisherigen Einträge werden durch die neu ausgelesenen Ergebnisse ersetzt.',
          confirmLabel: 'Ersetzen',
          icon: 'warning',
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          void this.runExtraction();
        }
      });
  }

  private async runExtraction(): Promise<void> {
    this.extracting.set(true);
    const response = await this.raceResultsService.extract(
      this.screenshots().map((item) => item.file),
    );
    this.extracting.set(false);

    if (!response.ok) {
      this.appError.report(response.message, { title: 'Auslesen fehlgeschlagen' });
      return;
    }
    this.applyExtracted(response.result);
    this.toast.success(
      'Screenshots ausgelesen',
      `${response.result.drivers.length} Fahrer erkannt. Bitte kurz prüfen.`,
    );
  }

  updateMeta<K extends keyof SessionMeta>(field: K, value: SessionMeta[K]): void {
    this.meta.update((meta) => ({ ...meta, [field]: value }));
    if (field === 'leagueName' || field === 'seasonName' || field === 'championshipName') {
      this.saveLeagueFields();
    }
  }

  updateMetaNumber(field: 'round' | 'totalLaps', event: Event): void {
    this.updateMeta(field, toNumber((event.target as HTMLInputElement).value));
  }

  updateMetaText(field: keyof LeagueFields | 'trackName' | 'sessionStart', event: Event): void {
    this.updateMeta(field, (event.target as HTMLInputElement).value);
  }

  updateRowText(id: number, field: TextField, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  updateRowNumber(id: number, field: NumberField, event: Event): void {
    const value = toNumber((event.target as HTMLInputElement).value);
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  addRow(): void {
    const position = Math.max(0, ...this.rows().map((row) => row.position ?? 0)) + 1;
    this.rows.update((rows) => [
      ...rows,
      {
        id: this.nextId++,
        position,
        driverName: '',
        teamName: '',
        gridPosition: null,
        bestLap: '',
        time: '',
        status: 'Finished',
        penaltySeconds: null,
        points: null,
      },
    ]);
  }

  removeRow(id: number): void {
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
  }

  sortByPosition(): void {
    this.rows.update(sortRows);
  }

  downloadJson(): void {
    const meta = this.meta();
    const json = JSON.stringify(buildRltSessionExport(meta, this.rows()), null, 2);
    const slug = `${meta.trackName}-${meta.sessionType}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    link.download = `rlt-${slug}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private applyExtracted(result: ExtractedResult): void {
    this.rows.set(
      result.drivers.map((driver) => ({
        id: this.nextId++,
        position: driver.position,
        driverName: driver.driverName,
        teamName: matchTeam(driver.teamName),
        gridPosition: driver.gridPosition,
        bestLap: driver.bestLap ?? '',
        time: driver.time ?? '',
        status: driver.status,
        penaltySeconds: driver.penaltySeconds,
        points: driver.points,
      })),
    );
    this.meta.update((meta) => ({
      ...meta,
      trackName: result.trackName ? matchTrack(result.trackName) : meta.trackName,
      sessionType: result.sessionType === 'Unknown' ? meta.sessionType : result.sessionType,
      totalLaps: result.totalLaps ?? meta.totalLaps,
    }));
  }

  private loadLeagueFields(): LeagueFields {
    const defaults: LeagueFields = { leagueName: '', seasonName: '', championshipName: '' };
    try {
      const stored = JSON.parse(localStorage.getItem(LEAGUE_STORAGE_KEY) ?? '{}');
      return {
        leagueName: typeof stored.leagueName === 'string' ? stored.leagueName : '',
        seasonName: typeof stored.seasonName === 'string' ? stored.seasonName : '',
        championshipName:
          typeof stored.championshipName === 'string' ? stored.championshipName : '',
      };
    } catch {
      return defaults;
    }
  }

  private saveLeagueFields(): void {
    const { leagueName, seasonName, championshipName } = this.meta();
    try {
      localStorage.setItem(
        LEAGUE_STORAGE_KEY,
        JSON.stringify({ leagueName, seasonName, championshipName }),
      );
    } catch {
      // Ohne Speicher gehen die Felder beim nächsten Öffnen nur verloren
    }
  }
}
