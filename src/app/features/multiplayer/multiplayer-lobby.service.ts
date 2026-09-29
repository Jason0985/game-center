import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../supabase.client';

export interface MultiplayerLobby {
  id: string;
  code: string;
  host_user_id: string;
  game_key: 'flip-7' | null;
  status: 'open';
  created_at: string;
  memberIds: string[];
}

interface LobbyMember {
  lobby_id: string;
  user_id: string;
}

@Injectable({ providedIn: 'root' })
export class MultiplayerLobbyService {
  async listOpenLobbies(): Promise<MultiplayerLobby[]> {
    const { data: lobbyData, error: lobbyError } = await supabase
      .from('multiplayer_lobbies')
      .select('id, code, host_user_id, game_key, status, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (lobbyError) {
      throw lobbyError;
    }

    const lobbies = (lobbyData ?? []) as Omit<MultiplayerLobby, 'memberIds'>[];
    if (lobbies.length === 0) {
      return [];
    }

    const { data: memberData, error: memberError } = await supabase
      .from('multiplayer_lobby_members')
      .select('lobby_id, user_id')
      .in(
        'lobby_id',
        lobbies.map((lobby) => lobby.id),
      );

    if (memberError) {
      throw memberError;
    }

    const members = (memberData ?? []) as LobbyMember[];
    const membersByLobby = new Map<string, string[]>();
    for (const member of members) {
      const lobbyMembers = membersByLobby.get(member.lobby_id) ?? [];
      lobbyMembers.push(member.user_id);
      membersByLobby.set(member.lobby_id, lobbyMembers);
    }

    return lobbies.map((lobby) => ({
      ...lobby,
      memberIds: membersByLobby.get(lobby.id) ?? [],
    }));
  }

  async createLobby(userId: string): Promise<MultiplayerLobby> {
    const { data, error } = await supabase
      .from('multiplayer_lobbies')
      .insert({ host_user_id: userId })
      .select('id, code, host_user_id, game_key, status, created_at')
      .single();

    if (error) {
      throw error;
    }

    const lobby = data as Omit<MultiplayerLobby, 'memberIds'>;
    const { error: memberError } = await supabase
      .from('multiplayer_lobby_members')
      .insert({ lobby_id: lobby.id, user_id: userId });

    if (memberError) {
      await supabase.from('multiplayer_lobbies').delete().eq('id', lobby.id);
      throw memberError;
    }

    return { ...lobby, memberIds: [userId] };
  }

  async chooseGame(lobbyId: string): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_lobbies')
      .update({ game_key: 'flip-7' })
      .eq('id', lobbyId);

    if (error) {
      throw error;
    }
  }

  async joinLobby(lobbyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_lobby_members')
      .insert({ lobby_id: lobbyId, user_id: userId });

    if (error) {
      throw error;
    }
  }

  async leaveLobby(lobbyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('multiplayer_lobby_members')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  async closeLobby(lobbyId: string): Promise<void> {
    const { error } = await supabase.from('multiplayer_lobbies').delete().eq('id', lobbyId);

    if (error) {
      throw error;
    }
  }

  subscribeToChanges(onChange: () => void): RealtimeChannel {
    return supabase
      .channel('multiplayer-lobbies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_lobbies' },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_lobby_members' },
        onChange,
      )
      .subscribe();
  }

  removeChannel(channel: RealtimeChannel): Promise<string> {
    return supabase.removeChannel(channel);
  }
}
