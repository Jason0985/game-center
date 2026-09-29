import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NotificationItem } from './notification.model';
import { notificationTypeConfig } from './notification-types';

export interface SystemAlertDialogData {
  alert: NotificationItem;
  moreCount: number;
}

// 'all' = zur Benachrichtigungsseite, sonst einfach bestätigt
export type SystemAlertDialogResult = 'acknowledged' | 'all';

@Component({
  selector: 'app-system-alert-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './system-alert-dialog.html',
  styleUrl: './system-alert-dialog.scss',
})
export class SystemAlertDialog {
  private readonly dialogRef = inject(
    MatDialogRef<SystemAlertDialog, SystemAlertDialogResult>,
  );
  readonly data = inject<SystemAlertDialogData>(MAT_DIALOG_DATA);
  readonly config = notificationTypeConfig(this.data.alert.type);

  close(result: SystemAlertDialogResult): void {
    this.dialogRef.close(result);
  }
}
