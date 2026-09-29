import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Profile } from '../features/profile/profile.model';
import { ActionResult, failure } from './supabase-errors';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Beziehung aus Sicht des eingeloggten Users
export interface FriendRelation {
  friendshipId: string;
  profile: Profile;
  status: FriendshipStatus;
  outgoing: boolean;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
}

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  // null = Laden fehlgeschlagen
  async getRelations(userId: string): Promise<FriendRelation[] | null> {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
      console.error('Freundschaften konnten nicht geladen werden.', error);
      return null;
    }

    if (!data?.length) {
      return [];
    }

    const rows = data as FriendshipRow[];
    const otherIds = rows.map((row) =>
      row.requester_id === userId ? row.addressee_id : row.requester_id,
    );

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherIds);

    if (profileError) {
      console.error('Profile der Freunde konnten nicht geladen werden.', profileError);
      return null;
    }

    const profilesById = new Map((profiles as Profile[]).map((profile) => [profile.id, profile]));

    return rows.flatMap((row) => {
      const outgoing = row.requester_id === userId;
      const profile = profilesById.get(outgoing ? row.addressee_id : row.requester_id);
      return profile ? [{ friendshipId: row.id, profile, status: row.status, outgoing }] : [];
    });
  }

  async addFriend(userId: string, friendId: string): Promise<ActionResult> {
    const { error } = await supabase.from('friendships').insert({
      requester_id: userId,
      addressee_id: friendId,
      status: 'pending',
    });

    if (error?.code === '23505') {
      return { ok: false, message: 'Zwischen euch gibt es bereits eine Anfrage.' };
    }

    return error ? failure('Freundschaftsanfrage konnte nicht gesendet werden.', error) : { ok: true };
  }

  // Freund entfernen (oder offene Anfrage zurückziehen)
  async removeFriendship(friendshipId: string): Promise<ActionResult> {
    const { data, error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .select('id');

    if (error) {
      return failure('Freund konnte nicht entfernt werden.', error);
    }

    return data?.length ? { ok: true } : { ok: false, message: 'Diese Freundschaft besteht nicht mehr.' };
  }
}
