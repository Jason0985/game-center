import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NotificationsService } from '../../services/notifications.service';
import { AppErrorService } from '../../services/app-error.service';
import { SystemNotificationType } from './notification.model';
import { SYSTEM_NOTIFICATION_OPTIONS, notificationTypeConfig } from './notification-types';

@Component({
  selector: 'app-system-notification-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './system-notification-dialog.html',
  styleUrl: './system-notification-dialog.scss',
})
export class SystemNotificationDialog {
  private readonly dialogRef = inject(MatDialogRef<SystemNotificationDialog, number>);
  private readonly notificationsService = inject(NotificationsService);
  private readonly appErrors = inject(AppErrorService);

  readonly options = SYSTEM_NOTIFICATION_OPTIONS.map((option) => ({
    ...option,
    config: notificationTypeConfig(option.type),
  }));
  readonly sending = signal(false);
  readonly errorMessage = signal('');

  // Längen wie die Constraints in der notifications-Tabelle
  readonly form = new FormGroup({
    type: new FormControl<SystemNotificationType>('system_info', { nonNullable: true }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
  });

  cancel(): void {
    this.dialogRef.close();
  }

  async send(): Promise<void> {
    const { type, title, message } = this.form.getRawValue();
    if (this.form.invalid || !title.trim() || !message.trim() || this.sending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');

    const result = await this.notificationsService.sendSystemNotification(
      type,
      title.trim(),
      message.trim(),
    );

    this.sending.set(false);

    if ('error' in result) {
      this.errorMessage.set(result.error);
      this.appErrors.report(result.error, { title: 'Systembenachrichtigung nicht gesendet', toast: false });
      return;
    }

    this.dialogRef.close(result.recipients);
  }
}
