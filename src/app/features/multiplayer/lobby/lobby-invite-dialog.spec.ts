import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import { FriendRelation, FriendsService } from '../../../services/friends.service';
import { AppErrorService } from '../../../services/app-error.service';
import { Profile, ProfileRole } from '../../profile/profile.model';
import { MultiplayerLobbyService } from '../multiplayer-lobby.service';
import { LobbyInviteDialog, LobbyInviteDialogData } from './lobby-invite-dialog';

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

describe('LobbyInviteDialog', () => {
  let fixture: ComponentFixture<LobbyInviteDialog>;
  let component: LobbyInviteDialog;
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
      imports: [LobbyInviteDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { lobbyId: 'lobby-1', userId: 'host', memberIds: ['host', 'ben'] } satisfies LobbyInviteDialogData,
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: FriendsService, useValue: { getRelations: vi.fn().mockResolvedValue(relations) } },
        { provide: MultiplayerLobbyService, useValue: { inviteFriend } },
        { provide: AppErrorService, useValue: { report: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyInviteDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const buttonLabels = (): (string | null)[] =>
    [...fixture.nativeElement.querySelectorAll('.user-row button')].map((button) =>
      (button as HTMLButtonElement).getAttribute('aria-label'),
    );

  it('lists accepted friends with their invite state', () => {
    expect(buttonLabels()).toEqual([
      'Anna: Einladen',
      'Ben: Bereits in der Lobby',
      'Carl: Einladen',
    ]);
  });

  it('filters friends by name', () => {
    component.search.set('CA');
    fixture.detectChanges();

    expect(buttonLabels()).toEqual(['Carl: Einladen']);

    component.search.set('xyz');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Keine Freunde gefunden.');
  });

  it('marks a friend as invited after a successful invite', async () => {
    await component.invite(component.rows()[0]);
    fixture.detectChanges();

    expect(inviteFriend).toHaveBeenCalledWith('lobby-1', 'anna');
    expect(buttonLabels()[0]).toBe('Anna: Eingeladen');
  });

  it('shows the message of a failed invite', async () => {
    inviteFriend.mockResolvedValue({ ok: false, message: 'Du kannst nur Freunde einladen.' });

    await component.invite(component.rows()[0]);
    fixture.detectChanges();

    expect(component.rows()[0].state).toBe('none');
    expect(fixture.nativeElement.textContent).toContain('Du kannst nur Freunde einladen.');
  });
});
