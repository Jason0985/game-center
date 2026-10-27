import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { vi } from 'vitest';
import { FriendRelation, FriendsService } from '../../../services/friends.service';
import { AppErrorService } from '../../../services/app-error.service';
import { ToastService } from '../../../services/toast.service';
import { Profile, ProfileRole } from '../../profile/profile.model';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { LobbyInviteSheet, LobbyInviteSheetData } from './lobby-invite-sheet';

function relation(
  id: string,
  displayName: string,
  { roles = ['admin'] as ProfileRole[], status = 'accepted' as FriendRelation['status'] } = {},
): FriendRelation {
  const profile: Profile = {
    id,
    username: id,
    display_name: displayName,
    roles,
    is_guest: false,
    created_at: '2026-09-30T12:00:00Z',
  };
  return { friendshipId: `f-${id}`, profile, status, outgoing: false };
}

describe('LobbyInviteSheet', () => {
  let fixture: ComponentFixture<LobbyInviteSheet>;
  let component: LobbyInviteSheet;
  let inviteFriend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    inviteFriend = vi.fn().mockResolvedValue({ ok: true });
    const relations = [
      relation('anna', 'Anna'),
      relation('ben', 'Ben'),
      relation('carl', 'Carl', { roles: [] }),
      relation('dora', 'Dora', { status: 'pending' }),
    ];

    await TestBed.configureTestingModule({
      imports: [LobbyInviteSheet],
      providers: [
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {
            lobbyId: 'lobby-1',
            userId: 'host',
            code: 'ABC234',
            memberIds: ['host', 'ben'],
          } satisfies LobbyInviteSheetData,
        },
        { provide: MatBottomSheetRef, useValue: { dismiss: vi.fn() } },
        {
          provide: FriendsService,
          useValue: { getRelations: vi.fn().mockResolvedValue(relations) },
        },
        { provide: MultiplayerLobbyService, useValue: { inviteFriend } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyInviteSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  // Je Freund: Einladen-Knopf oder Status
  const buttonLabels = (): (string | null | undefined)[] =>
    [...fixture.nativeElement.querySelectorAll('.row')].map((row) => {
      const button = (row as HTMLElement).querySelector('button');
      return button
        ? button.getAttribute('aria-label')
        : (row as HTMLElement).querySelector('.row-state')?.textContent?.trim();
    });

  it('lists accepted friends with their invite state', () => {
    expect(buttonLabels()).toEqual(['Anna einladen', 'In der Lobby', 'Carl einladen']);
  });

  it('filters friends by name', () => {
    component.search.set('CA');
    fixture.detectChanges();

    expect(buttonLabels()).toEqual(['Carl einladen']);

    component.search.set('xyz');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Keine Freunde gefunden.');
  });

  it('marks a friend as invited after a successful invite', async () => {
    const success = vi.spyOn(TestBed.inject(ToastService), 'success').mockReturnValue(0);

    await component.invite(component.rows()[0]);
    fixture.detectChanges();

    expect(inviteFriend).toHaveBeenCalledWith('lobby-1', 'anna');
    expect(buttonLabels()[0]).toBe('checkEingeladen');
    expect(success).toHaveBeenCalledWith('Einladung gesendet', 'Anna kann jetzt beitreten.');
  });

  it('shows the message of a failed invite', async () => {
    inviteFriend.mockResolvedValue({ ok: false, message: 'Du kannst nur Freunde einladen.' });

    await component.invite(component.rows()[0]);
    fixture.detectChanges();

    expect(component.rows()[0].state).toBe('none');
    expect(fixture.nativeElement.textContent).toContain('Du kannst nur Freunde einladen.');
  });
});
