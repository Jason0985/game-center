import { vi } from 'vitest';
import { supabase } from '../../supabase.client';
import { watchTables } from './realtime-watch';

describe('watchTables', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function fakeChannels() {
    const channels: { status: (s: string) => void }[] = [];
    vi.spyOn(supabase, 'channel').mockImplementation(() => {
      const channel = {
        on: () => channel,
        subscribe: (callback: (s: string) => void) => {
          channels.push({ status: callback });
          return channel;
        },
      };
      return channel as unknown as ReturnType<typeof supabase.channel>;
    });
    const removed = vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok');
    return { channels, removed };
  }

  it('rebuilds a channel the server closed and reloads once it is back', () => {
    vi.useFakeTimers();
    const { channels, removed } = fakeChannels();
    const onChange = vi.fn();
    const stop = watchTables('t', [{ table: 'x' }], onChange);

    channels[0].status('CLOSED');
    vi.advanceTimersByTime(2000);
    expect(channels).toHaveLength(2);
    expect(removed).toHaveBeenCalledTimes(1);

    // Das CLOSED des entfernten alten Kanals löst nichts mehr aus
    channels[0].status('CLOSED');
    vi.advanceTimersByTime(2000);
    expect(channels).toHaveLength(2);

    channels[1].status('SUBSCRIBED');
    vi.advanceTimersByTime(100);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  it('does not rebuild after unsubscribing', () => {
    vi.useFakeTimers();
    const { channels } = fakeChannels();
    const stop = watchTables('t', [{ table: 'x' }], vi.fn());
    stop();
    channels[0].status('CLOSED');
    vi.advanceTimersByTime(2000);
    expect(channels).toHaveLength(1);
  });
});
