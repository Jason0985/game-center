import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly greeting = greetingFor(new Date().getHours());

  // Statistik ist noch in Planung und wird als Platzhalter angezeigt
  readonly stats = [
    { icon: 'emoji_events', label: 'Spiele gewonnen' },
    { icon: 'sports_esports', label: 'Spiele gespielt' },
    { icon: 'trending_up', label: 'Top-3-Quote' },
  ];
}

function greetingFor(hour: number): string {
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}
