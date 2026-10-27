import { vi } from 'vitest';
import { supabase } from '../../../supabase.client';
import { callRpc } from './table-data';

describe('callRpc', () => {
  afterEach(() => vi.restoreAllMocks());

  function rpcResults(...codes: (string | null)[]) {
    const rpc = vi.spyOn(supabase, 'rpc');
    for (const code of codes) {
      rpc.mockResolvedValueOnce({
        error: code === null ? null : { code, message: 'x' },
      } as unknown as Awaited<ReturnType<typeof supabase.rpc>>);
    }
    return rpc;
  }

  it('retries once after a deadlock', async () => {
    const rpc = rpcResults('40P01', null);
    expect(await callRpc('end_game', { p_game_id: 'g' }, 'x')).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('retries a lost response only for moves with waiting_since', async () => {
    const move = rpcResults('', null);
    expect((await callRpc('hit', { p_game_id: 'g', p_waiting_since: 't' }, 'x')).ok).toBe(true);
    expect(move).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();

    const other = rpcResults('');
    expect((await callRpc('end_game', { p_game_id: 'g' }, 'x')).ok).toBe(false);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('shows messages from the database without retrying', async () => {
    const rpc = rpcResults('P0001');
    expect(await callRpc('hit', { p_game_id: 'g', p_waiting_since: 't' }, 'x')).toEqual({
      ok: false,
      message: 'x',
    });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
