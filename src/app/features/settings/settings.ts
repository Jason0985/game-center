import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { THEME_OPTIONS, ThemeService } from '../../services/theme.service';
import { RoleManagement } from './role-management/role-management';
import { PushService } from '../../services/push.service';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-settings',
  imports: [MatIconModule, RouterLink, RoleManagement],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly session = inject(SessionService);
  readonly themes = inject(ThemeService);
  readonly themeOptions = THEME_OPTIONS;
  readonly push = inject(PushService);
  readonly feedback = inject(FeedbackService);
}
