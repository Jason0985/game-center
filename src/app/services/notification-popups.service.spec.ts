import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { NotificationItem } from '../features/notifications/notification.model';
import { NotificationPopupsService } from './notification-popups.service';
import { NotificationsService } from './notifications.service';
import { SessionService } from './session.service';
import { ToastService } from './toast.service';

function notification(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: crypto.randomUUID(),
    recipient_id: 'me',
    sender_id: 'alina',
    sender_name: 'Alina',
    type: 'friend_request',
    title: 'Freundschaftsanfrage',
    message: 'Alina möchte dich als Freund hinzufügen.',
    related_id: 'f1',
    created_at: new Date().toISOString(),
    read_at: null,
    ...overrides,
  };
}

describe('NotificationPopupsService', () => {
  function setup(startItems: NotificationItem[] = []) {
    const incoming = new Subject<NotificationItem>();
    const loadedFor = signal<string | null>(null);
    const markRead = vi.fn();
    const open = vi.fn().mockReturnValue({ afterClosed: () => of('acknowledged') });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: NotificationsService,
          useValue: { incoming, loadedFor, notifications: signal(startItems), markRead },
        },
        { provide: SessionService, useValue: { user: signal({ id: 'me' }) } },
        { provide: MatDialog, useValue: { open } },
      ],
    });

    TestBed.inject(NotificationPopupsService);
    const toasts = TestBed.inject(ToastService);
    return { incoming, loadedFor, markRead, open, toasts };
  }

  it('bundles live notifications that arrive in quick succession', () => {
    const { incoming, toasts } = setup();

    incoming.next(notification({}));
    expect(toasts.toasts()[0].title).toBe('Freundschaftsanfrage');

    incoming.next(notification({ type: 'friend_accepted', title: 'Anfrage angenommen' }));
    expect(toasts.toasts()).toHaveLength(1);
    expect(toasts.toasts()[0].title).toBe('2 neue Benachrichtigungen');
  });

  it('does not announce own actions', () => {
    const { incoming, toasts } = setup();

    incoming.next(notification({ type: 'system_info', sender_id: 'me' }));

    expect(toasts.toasts()).toHaveLength(0);
  });

  it('shows unread important system notifications once on start and marks them read', () => {
    const alert = notification({ type: 'system_alert', title: 'Wartung', sender_id: 'admin' });
    const { loadedFor, open, markRead } = setup([alert]);

    loadedFor.set('me');
    TestBed.tick();
    loadedFor.set(null);
    TestBed.tick();
    loadedFor.set('me');
    TestBed.tick();

    expect(open).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith([alert.id]);
  });
});
