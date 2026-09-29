import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Notifications } from './notifications';
import { NotificationItem } from './notification.model';
import { NotificationsService } from '../../services/notifications.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../services/toast.service';
import { AppErrorService } from '../../services/app-error.service';

function notification(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n1',
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

describe('Notifications actions', () => {
  async function render(
    items: NotificationItem[],
    { respondResult = { ok: true } as object, confirmDecline = true } = {},
  ) {
    const respondToFriendRequest = vi.fn().mockResolvedValue(respondResult);
    const toast = { success: vi.fn(), error: vi.fn() };
    const appErrors = { report: vi.fn() };
    const dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(confirmDecline) }) };

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [
        provideRouter([]),
        {
          provide: NotificationsService,
          useValue: {
            notifications: signal(items),
            loading: signal(false),
            unreadCount: computed(() => 0),
            respondToFriendRequest,
            markRead: vi.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: { isLoggedIn: signal(true), isAdmin: signal(false), user: signal({ id: 'me' }) },
        },
        { provide: ToastService, useValue: toast },
        { provide: AppErrorService, useValue: appErrors },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Notifications);
    await fixture.whenStable();
    const buttons = (): HTMLButtonElement[] => [...fixture.nativeElement.querySelectorAll('button')];
    const click = async (label: string) => {
      buttons().find((button) => button.textContent?.trim() === label)!.click();
      await fixture.whenStable();
    };
    return { fixture, respondToFriendRequest, toast, appErrors, dialog, buttons, click };
  }

  it('accepts a friend request and confirms it', async () => {
    const item = notification({});
    const { respondToFriendRequest, toast, click } = await render([item]);

    await click('Annehmen');

    expect(respondToFriendRequest).toHaveBeenCalledWith(item, true);
    expect(toast.success).toHaveBeenCalled();
  });

  it('asks before declining and reports failures', async () => {
    const { dialog, appErrors, click } = await render([notification({})], {
      respondResult: { ok: false, message: 'Keine Verbindung zum Server.' },
    });

    await click('Ablehnen');

    expect(dialog.open).toHaveBeenCalled();
    expect(appErrors.report).toHaveBeenCalledWith('Keine Verbindung zum Server.');
  });

  it('keeps the request when declining is cancelled', async () => {
    const { respondToFriendRequest, click } = await render([notification({})], {
      confirmDecline: false,
    });

    await click('Ablehnen');

    expect(respondToFriendRequest).not.toHaveBeenCalled();
  });

  it('does not swallow taps on the answer buttons on touch devices', async () => {
    const { fixture } = await render([notification({})]);
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;

    // Ein verhindertes touchstart/touchend unterdrückt auf Touch-Geräten den Klick
    for (const type of ['touchstart', 'touchend']) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.assign(event, { touches: [], changedTouches: [{ clientX: 10 }] });
      card.dispatchEvent(event);
      expect(event.defaultPrevented, type).toBe(false);
    }
  });

  it('offers no actions on system notifications', async () => {
    const { buttons } = await render([
      notification({ type: 'system_alert', title: 'Wartung', related_id: null }),
    ]);

    const labels = buttons().map((button) => button.textContent?.trim());
    expect(labels).not.toContain('Annehmen');
    expect(labels).not.toContain('Ablehnen');
  });
});
