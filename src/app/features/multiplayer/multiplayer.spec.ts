import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SessionService } from '../../services/session.service';
import { Multiplayer } from './multiplayer';
import { MultiplayerLobby, MultiplayerLobbyService } from './multiplayer-lobby.service';

describe('Multiplayer', () => {
  let component: Multiplayer;
  let fixture: ComponentFixture<Multiplayer>;
  let lobbyService: {
    listOpenLobbies: ReturnType<typeof vi.fn>;
    subscribeToChanges: ReturnType<typeof vi.fn>;
    removeChannel: ReturnType<typeof vi.fn>;
    createLobby: ReturnType<typeof vi.fn>;
    chooseGame: ReturnType<typeof vi.fn>;
    joinLobby: ReturnType<typeof vi.fn>;
    leaveLobby: ReturnType<typeof vi.fn>;
    closeLobby: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    lobbyService = {
      listOpenLobbies: vi.fn().mockResolvedValue([]),
      subscribeToChanges: vi.fn().mockReturnValue(null),
      removeChannel: vi.fn(),
      createLobby: vi.fn(),
      chooseGame: vi.fn(),
      joinLobby: vi.fn(),
      leaveLobby: vi.fn(),
      closeLobby: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Multiplayer],
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: {
            initialized: signal(true),
            user: signal({ id: 'host-user' }),
            isLoggedIn: signal(true),
          },
        },
        { provide: MultiplayerLobbyService, useValue: lobbyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Multiplayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates a lobby and allows its host to choose Flip 7', async () => {
    const lobby: MultiplayerLobby = {
      id: 'lobby-1',
      code: 'ABC123',
      host_user_id: 'host-user',
      game_key: null,
      status: 'open',
      created_at: '2026-09-28T12:00:00Z',
      memberIds: ['host-user'],
    };
    lobbyService.createLobby.mockResolvedValue(lobby);
    lobbyService.chooseGame.mockResolvedValue(undefined);

    await component.createLobby();
    await component.chooseFlip7(lobby);

    expect(lobbyService.createLobby).toHaveBeenCalledWith('host-user');
    expect(lobbyService.chooseGame).toHaveBeenCalledWith('lobby-1');
  });
});
