import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import trackData from '../tracks.json';

interface TireTemperature {
  compound: string;
  temp_celsius: string;
}

interface EngineTemperature {
  temp_celsius: number;
  power_percent: number;
}

interface TemperatureData {
  tire_temperatures: TireTemperature[];
  engine_temperatures: EngineTemperature[];
}

@Component({
  selector: 'app-general-info-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIcon],
  templateUrl: './general-info-dialog.html',
  styleUrl: './general-info-dialog.scss',
})
export class GeneralInfoDialog {
  readonly tireTemperatures = (trackData as TemperatureData).tire_temperatures;
  readonly engineTemperatures = (trackData as TemperatureData).engine_temperatures;

  tireRange(range: string): { left: number; width: number } {
    const [minimum, maximum] = range.split('-').map(Number);
    const scaleMinimum = 50;
    const scaleMaximum = 180;
    const scaleWidth = scaleMaximum - scaleMinimum;

    return {
      left: ((minimum - scaleMinimum) / scaleWidth) * 100,
      width: ((maximum - minimum) / scaleWidth) * 100,
    };
  }

  engineTemperatureClass(temperature: number): string {
    if (temperature <= 85) {
      return 'temperature-cool';
    }

    if (temperature <= 125) {
      return 'temperature-optimal';
    }

    if (temperature <= 145) {
      return 'temperature-warm';
    }

    return 'temperature-hot';
  }
}
