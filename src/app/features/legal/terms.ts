import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO } from './legal-info';

@Component({
  selector: 'app-terms',
  imports: [MatIconModule, RouterLink],
  templateUrl: './terms.html',
  styleUrl: './legal.scss',
})
export class Terms {
  readonly info = LEGAL_INFO;
}
