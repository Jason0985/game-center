import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyMessage } from '../lobby.model';
import { LobbyChatStore } from '../lobby/lobby-chat.store';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { ChatPopups } from './chat-popups';

@Component({
  imports: [ChatPopups],
  template: `<button #anchor>Chat</button>
    <app-chat-popups [anchor]="anchor" [paused]="paused()" (arrived)="arrived = arrived + 1" />`,
})
class Host {
  readonly paused = signal(false);
  arrived = 0;
}

const message = (id: number, user_id: string, body = `Nachricht ${id}`): LobbyMessage => ({
  id,
  user_id,
  body,
  game_key: null,
  created_at: '',
});

describe('ChatPopups', () => {
  let fixture: ComponentFixture<Host>;
  let chat: LobbyChatStore;
  const texts = () =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('.pop .body')].map(
      (el) => el.textContent,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [LobbyChatStore, { provide: MultiplayerLobbyService, useValue: {} }],
    });
    chat = TestBed.inject(LobbyChatStore);
    chat.userId.set('me');
    chat.names.set({ me: 'Ich', anna: 'Anna' });
    chat.messages.set([message(1, 'anna', 'alt')]);
    chat.loaded.set(true);
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('shows only new messages from others and lets them go again', () => {
    vi.useFakeTimers();
    expect(texts()).toEqual([]);
    chat.messages.update((list) => [...list, message(2, 'me'), message(3, 'anna', 'Hallo!')]);
    fixture.detectChanges();
    expect(texts()).toEqual(['Hallo!']);
    expect(fixture.componentInstance.arrived).toBe(1);
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(fixture.componentInstance.arrived).toBe(1);
  });

  it('stays quiet while the chat is open', () => {
    fixture.componentInstance.paused.set(true);
    fixture.detectChanges();
    chat.messages.update((list) => [...list, message(2, 'anna')]);
    fixture.detectChanges();
    fixture.componentInstance.paused.set(false);
    fixture.detectChanges();
    expect(texts()).toEqual([]);
  });
});
