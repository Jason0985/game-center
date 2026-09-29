import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { RoleManagement } from './role-management/role-management';

@Component({
  selector: 'app-settings',
  imports: [MatIconModule, RouterLink, RoleManagement],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  readonly session = inject(SessionService);
}
