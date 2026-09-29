import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppErrorService } from './app-error.service';
import { NotificationsService } from './notifications.service';
import { ToastService } from './toast.service';

describe('AppErrorService', () => {
  function setup() {
    const notifications = { addLocalError: vi.fn() };
    const toast = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        { provide: ToastService, useValue: toast },
      ],
    });

    return { service: TestBed.inject(AppErrorService), notifications, toast };
  }

  it('shows a pop-up and keeps the error in the notifications', () => {
    const { service, notifications, toast } = setup();

    service.report('Keine Verbindung zum Server.');

    expect(toast.error).toHaveBeenCalledWith('Keine Verbindung zum Server.', 'Das hat nicht geklappt');
    expect(notifications.addLocalError).toHaveBeenCalledWith(
      'Das hat nicht geklappt',
      'Keine Verbindung zum Server.',
    );
  });

  it('reports the same error only once in quick succession', () => {
    const { service, notifications } = setup();

    service.report('Speichern fehlgeschlagen.');
    service.report('Speichern fehlgeschlagen.');

    expect(notifications.addLocalError).toHaveBeenCalledTimes(1);
  });

  it('skips the pop-up for errors already shown inline', () => {
    const { service, notifications, toast } = setup();

    service.report('Ungültiger Name.', { toast: false });

    expect(toast.error).not.toHaveBeenCalled();
    expect(notifications.addLocalError).toHaveBeenCalled();
  });
});
