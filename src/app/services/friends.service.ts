import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Profile } from '../features/profile/profile.model';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Beziehung aus Sicht des eingeloggten Users
export interface FriendRelation {
  profile: Profile;
  status: FriendshipStatus;
  outgoing: boolean;
}

interface FriendshipRow {
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
}

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  async getRelations(userId: string): Promise<FriendRelation[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error || !data?.length) {
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
      return [];
    }

    const profilesById = new Map((profiles as Profile[]).map((profile) => [profile.id, profile]));

    return rows.flatMap((row) => {
      const outgoing = row.requester_id === userId;
      const profile = profilesById.get(outgoing ? row.addressee_id : row.requester_id);
      return profile ? [{ profile, status: row.status, outgoing }] : [];
    });
  }

  async addFriend(userId: string, friendId: string): Promise<boolean> {
    const { error } = await supabase.from('friendships').insert({
      requester_id: userId,
      addressee_id: friendId,
      status: 'pending',
    });

    return !error;
  }
}
