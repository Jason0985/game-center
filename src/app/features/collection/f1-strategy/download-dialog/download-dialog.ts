import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-download-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIcon],
  templateUrl: './download-dialog.html',
  styleUrl: './download-dialog.scss',
})
export class DownloadDialog {}
