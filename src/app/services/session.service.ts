import { Injectable, signal, computed, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase.client';
import { ProfileService } from './profile.service';
import { Profile } from '../features/profile/profile.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly profileService = inject(ProfileService);

  private readonly currentUser = signal<User | null>(null);
  private readonly currentProfile = signal<Profile | null>(null);

  private readonly sessionInitialized = signal(false);
  readonly initialized = this.sessionInitialized.asReadonly();

  readonly user = this.currentUser.asReadonly();
  readonly profile = this.currentProfile.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  readonly displayName = computed(
    () => this.currentProfile()?.display_name ?? this.currentProfile()?.username ?? '',
  );
  readonly username = computed(() => this.currentProfile()?.username ?? '');
  readonly isAdmin = computed(() => this.currentProfile()?.role === 'admin');

  constructor() {
    supabase.auth.getSession().then(async ({ data }) => {
      await this.setUser(data.session?.user ?? null);
      this.sessionInitialized.set(true); // erste Prüfung abgeschlossen
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this.setUser(session?.user ?? null);
    });
  }

  // Nach dem Bearbeiten das aktualisierte Profil übernehmen
  setProfile(profile: Profile): void {
    this.currentProfile.set(profile);
  }

  // User setzen und passendes Profil aus der Tabelle nachladen
  private async setUser(user: User | null): Promise<void> {
    this.currentUser.set(user);
    this.currentProfile.set(user ? await this.profileService.getProfile(user.id) : null);
  }
}
