import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LEGAL_INFO } from './legal-info';

@Component({
  selector: 'app-licenses',
  imports: [MatIconModule, RouterLink],
  templateUrl: './licenses.html',
  styleUrl: './legal.scss',
})
export class Licenses {
  readonly info = LEGAL_INFO;
}
