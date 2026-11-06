import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyChatRead, LobbyMessage } from '../lobby.model';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { LobbyChat } from './lobby-chat';
import { LobbyChatStore } from './lobby-chat.store';

const message = (id: number, user_id: string): LobbyMessage => ({
  id,
  user_id,
  body: `Nachricht ${id}`,
  game_key: null,
  created_at: '2026-11-06T10:00:00Z',
});
const read = (
  user_id: string,
  last_read_id: number,
  read_at = '2026-11-06T10:05:00Z',
): LobbyChatRead => ({
  user_id,
  last_read_id,
  read_at,
});

describe('LobbyChat read receipts', () => {
  let fixture: ComponentFixture<LobbyChat>;
  let store: LobbyChatStore;
  const el = () => fixture.nativeElement as HTMLElement;
  const readsUnder = (id: number) =>
    [...el().querySelectorAll('.msg')]
      .find((msg) => msg.textContent!.includes(`Nachricht ${id}`))!
      .querySelector('.reads');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LobbyChat],
      providers: [
        LobbyChatStore,
        {
          provide: MultiplayerLobbyService,
          useValue: { markChatRead: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
    store = TestBed.inject(LobbyChatStore);
    store.lobbyId.set('l1');
    store.userId.set('me');
    store.names.set({
      me: 'Ich',
      anna: 'Anna Berg',
      ben: 'Ben',
      cleo: 'Cleo',
      dan: 'Dan',
      eva: 'Eva',
    });
    store.messages.set([message(1, 'me'), message(2, 'anna'), message(3, 'me')]);
    fixture = TestBed.createComponent(LobbyChat);
  });

  it('puts each reader under the newest message they read, never under their own', () => {
    store.reads.set([read('me', 3), read('ben', 3), read('anna', 2)]);
    fixture.detectChanges();
    // Ben hat alles gelesen, Anna nur bis zu ihrer eigenen Nachricht: also unter Nachricht 1
    expect(readsUnder(3)?.getAttribute('aria-label')).toBe('Gelesen von Ben');
    expect(readsUnder(3)?.textContent).toContain('Gelesen');
    expect(readsUnder(2)).toBeNull();
    expect(readsUnder(1)?.getAttribute('aria-label')).toBe('Gelesen von Anna Berg');
    expect(readsUnder(1)?.textContent).not.toContain('Gelesen');
  });

  it('stacks three avatars with +N and lists everyone with the time on tap', () => {
    store.reads.set(['ben', 'cleo', 'dan', 'eva'].map((id) => read(id, 3)));
    fixture.detectChanges();
    const reads = readsUnder(3) as HTMLButtonElement;
    expect(reads.querySelectorAll('.reads-avatar').length).toBe(3);
    expect(reads.textContent).toContain('+1');

    reads.click();
    fixture.detectChanges();
    const people = [...el().querySelectorAll('.reads-person')].map(
      (p) => p.querySelector('.reads-name')!.textContent,
    );
    expect(people).toEqual(['Ben', 'Cleo', 'Dan', 'Eva']);
    expect(el().querySelector('.reads-time')?.textContent).toMatch(/\d\d:\d\d/);
  });

  it('marks the chat as read on the server while it is open', () => {
    fixture.detectChanges();
    expect(TestBed.inject(MultiplayerLobbyService).markChatRead).toHaveBeenCalledWith('l1', 3);
  });
});
