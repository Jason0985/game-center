import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { supabase } from '../supabase.client';
import { AppErrorService } from './app-error.service';
import { NotificationsService } from './notifications.service';
import { SessionService } from './session.service';

describe('NotificationsService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the list and stays silent when a background reload fails', async () => {
    const item = { id: 'n1', created_at: '2026-10-10T10:00:00Z', read_at: null };
    let result: { data: unknown; error: unknown } = { data: [item], error: null };
    const query = { select: () => query, eq: () => query, order: () => Promise.resolve(result) };
    vi.spyOn(supabase, 'from').mockReturnValue(query as never);
    vi.spyOn(supabase, 'channel').mockImplementation(() => {
      const channel = { on: () => channel, subscribe: () => channel };
      return channel as never;
    });
    vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const report = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SessionService,
          useValue: { initialized: signal(true), user: signal({ id: 'user-1' }) },
        },
        { provide: AppErrorService, useValue: { report } },
      ],
    });
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    await vi.waitFor(() => expect(service.unreadCount()).toBe(1));

    result = { data: null, error: { message: 'Failed to fetch' } };
    await service.reload();

    expect(service.notifications().map((n) => n.id)).toEqual(['n1']);
    expect(report).not.toHaveBeenCalled();
  });
});
