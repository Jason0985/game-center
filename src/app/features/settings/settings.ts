import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { THEME_OPTIONS, ThemeService } from '../../services/theme.service';
import { PushService } from '../../services/push.service';
import { PwaService } from '../../services/pwa.service';
import { FeedbackService } from '../../services/feedback.service';
// Wird bei npm run deploy hochgezählt (predeploy in package.json)
import { version } from '../../../../package.json';

@Component({
  selector: 'app-settings',
  imports: [MatIconModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly themes = inject(ThemeService);
  readonly themeOptions = THEME_OPTIONS;
  readonly push = inject(PushService);
  readonly pwa = inject(PwaService);
  readonly feedback = inject(FeedbackService);
  // 5.2.0 → 5.2
  readonly version = version.split('.').slice(0, 2).join('.');
}
