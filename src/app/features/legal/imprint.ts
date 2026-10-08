import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO } from './legal-info';

@Component({
  selector: 'app-imprint',
  imports: [MatIconModule, RouterLink],
  templateUrl: './imprint.html',
  styleUrl: './legal.scss',
})
export class Imprint {
  readonly info = LEGAL_INFO;
}
