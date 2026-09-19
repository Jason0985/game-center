import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { GeneralInfoDialog } from './general-info-dialog/general-info-dialog';
import trackData from './tracks.json';
import { DownloadDialog } from './download-dialog/download-dialog';

interface Track {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  laps_50: number;
}

interface TrackData {
  tracks: Track[];
}

@Component({
  selector: 'app-f1-strategy',
  imports: [MatDialogModule, MatIcon, RouterLink],
  templateUrl: './f1-strategy.html',
  styleUrl: './f1-strategy.scss',
})
export class F1Strategy {
  private readonly dialog = inject(MatDialog);
  readonly tracks: Track[] = (trackData as TrackData).tracks;
  readonly searchTerm = signal('');
  readonly filteredTracks = computed(() => {
    const searchTerm = this.searchTerm().trim().toLowerCase();

    if (!searchTerm) {
      return this.tracks;
    }

    return this.tracks.filter((track) => track.name.toLowerCase().includes(searchTerm));
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  openDownloadDialog(): void {
    this.dialog.open(DownloadDialog, {
      width: 'min(92vw, 500px)',
    });
  }

  openGeneralInfoDialog(): void {
    this.dialog.open(GeneralInfoDialog, {
      width: 'min(92vw, 620px)',
    });
  }
}
