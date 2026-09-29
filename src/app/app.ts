import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NotificationsService } from './services/notifications.service';

@Component({
  selector: 'app-root',
  imports: [MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly notifications = inject(NotificationsService);
}