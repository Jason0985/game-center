import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO } from './legal-info';

@Component({
  selector: 'app-privacy',
  imports: [MatIconModule, RouterLink],
  templateUrl: './privacy.html',
  styleUrl: './legal.scss',
})
export class Privacy {
  readonly info = LEGAL_INFO;
}
