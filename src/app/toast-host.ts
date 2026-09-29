import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Toast, ToastService } from './services/toast.service';

// Zeigt die Toasts aus dem ToastService oben unter dem Header an
@Component({
  selector: 'app-toast-host',
  imports: [MatIconModule],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
})
export class ToastHost {
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);

  open(toast: Toast): void {
    if (!toast.link) return;

    this.toastService.dismiss(toast.id);
    void this.router.navigateByUrl(toast.link);
  }
}
