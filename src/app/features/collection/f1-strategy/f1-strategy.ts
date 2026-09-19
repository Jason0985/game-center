import { Component, computed, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import trackData from './tracks.json';

interface Track {
  id: string;
  name: string;
  country: string;
  countryCode: string;
}

interface TrackData {
  tracks: Track[];
}

@Component({
  selector: 'app-f1-strategy',
  imports: [MatIcon, RouterLink],
  templateUrl: './f1-strategy.html',
  styleUrl: './f1-strategy.scss',
})
export class F1Strategy {
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

  downloadTracks(): void {
    const data = JSON.stringify(this.tracks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = 'f1-tracks.json';
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }
}
