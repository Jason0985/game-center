import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Profile } from '../features/profile/profile.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return error ? null : (data as Profile);
  }

  // Für Einladungen: Profil per Benutzername suchen
  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    return error ? null : (data as Profile | null);
  }

  async searchProfiles(searchTerm: string, currentUserId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .neq('id', currentUserId)
      .order('username')
      .limit(8);

    return error ? [] : (data as Profile[]);
  }

  async updateDisplayName(userId: string, displayName: string) {
    return supabase.from('profiles').update({ display_name: displayName }).eq('id', userId);
  }
}
