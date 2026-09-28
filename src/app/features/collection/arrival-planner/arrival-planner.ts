import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ArrivalPlannerSettingsDialog } from './arrival-planner-settings-dialog';
import { ArrivalPlannerSettings, DEFAULT_ARRIVAL_PLANNER_SETTINGS } from './arrival-planner.model';

const SETTINGS_STORAGE_KEY = 'game-center-arrival-planner-settings';

function formatClock(minutes: number): string {
  const minuteOfDay = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(minuteOfDay / 60);
  const remainingMinutes = minuteOfDay % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

@Component({
  selector: 'app-arrival-planner',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './arrival-planner.html',
  styleUrl: './arrival-planner.scss',
})
export class ArrivalPlanner {
  private readonly dialog = inject(MatDialog);
  readonly arrivalTime = signal('');
  readonly settings = signal(this.loadSettings());
  readonly plan = computed(() => {
    const [hours, minutes] = this.arrivalTime().split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      return null;
    }

    const targetMinutes = hours * 60 + minutes;
    const settings = this.settings();
    const departureMinutes = targetMinutes - settings.travelMinutes - settings.trafficBufferMinutes;
    const alarmMinutes = departureMinutes - settings.preparationMinutes;

    return {
      target: { time: formatClock(targetMinutes), dayOffset: 0 },
      alarm: { time: formatClock(alarmMinutes), dayOffset: Math.floor(alarmMinutes / 1440) },
      departure: {
        time: formatClock(departureMinutes),
        dayOffset: Math.floor(departureMinutes / 1440),
      },
      arrivalWithoutBuffer: {
        time: formatClock(departureMinutes + settings.travelMinutes),
        dayOffset: Math.floor((departureMinutes + settings.travelMinutes) / 1440),
      },
    };
  });

  updateArrivalTime(event: Event): void {
    this.arrivalTime.set((event.target as HTMLInputElement).value);
  }

  openSettingsDialog(): void {
    this.dialog
      .open(ArrivalPlannerSettingsDialog, {
        width: 'min(92vw, 480px)',
        data: this.settings(),
      })
      .afterClosed()
      .subscribe((settings: ArrivalPlannerSettings | undefined) => {
        if (settings) {
          this.settings.set(settings);
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        }
      });
  }

  private loadSettings(): ArrivalPlannerSettings {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!storedSettings) {
        return { ...DEFAULT_ARRIVAL_PLANNER_SETTINGS };
      }

      const parsed = JSON.parse(storedSettings) as Partial<ArrivalPlannerSettings>;
      const values = [parsed.travelMinutes, parsed.trafficBufferMinutes, parsed.preparationMinutes];
      if (values.every((value) => Number.isInteger(value) && value! >= 0 && value! <= 300)) {
        return parsed as ArrivalPlannerSettings;
      }
    } catch {
      return { ...DEFAULT_ARRIVAL_PLANNER_SETTINGS };
    }

    return { ...DEFAULT_ARRIVAL_PLANNER_SETTINGS };
  }
}
