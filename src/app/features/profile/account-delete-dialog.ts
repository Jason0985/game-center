import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

export interface AccountDeleteDialogData {
  username: string;
}

// Endgültiges Löschen erst nach Eingabe des Benutzernamens, damit es nicht aus Versehen passiert
@Component({
  selector: 'app-account-delete-dialog',
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './account-delete-dialog.html',
  styleUrl: './account-delete-dialog.scss',
})
export class AccountDeleteDialog {
  private readonly dialogRef = inject(MatDialogRef<AccountDeleteDialog, boolean>);
  private readonly authService = inject(AuthService);
  readonly data = inject<AccountDeleteDialogData>(MAT_DIALOG_DATA);

  readonly typedName = signal('');
  readonly deleting = signal(false);
  readonly errorMessage = signal('');

  get confirmed(): boolean {
    return this.typedName().trim().toLowerCase() === this.data.username.toLowerCase();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  async delete(): Promise<void> {
    if (!this.confirmed || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    const result = await this.authService.deleteAccount();
    this.deleting.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }
    this.dialogRef.close(true);
  }
}
