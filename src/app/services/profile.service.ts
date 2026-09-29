import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Profile, ProfileRole } from '../features/profile/profile.model';

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
    // PostgREST-Filtersyntax und Wildcards entfernen, sonst lassen sich eigene Filter einschleusen
    const term = searchTerm.replace(/[,()"\\%*]/g, '').trim();
    if (!term) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .neq('id', currentUserId)
      .order('username')
      .limit(8);

    return error ? [] : (data as Profile[]);
  }

  // Für die Rollenübersicht; bei vielen Nutzern später paginieren
  async listProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('username');

    return error ? [] : (data as Profile[]);
  }

  // Nur für Admins; Berechtigung und Schutzregeln prüft die Datenbank
  async setRole(userId: string, role: ProfileRole) {
    return supabase
      .rpc('set_user_role', { p_user_id: userId, p_role: role })
      .single<Profile>();
  }

  async updateDisplayName(userId: string, displayName: string) {
    return supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)
      .select()
      .single<Profile>();
  }
}
