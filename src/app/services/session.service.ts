import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { OPENED_FROM_RECOVERY_LINK, supabase } from '../supabase.client';
import { ProfileService } from './profile.service';
import { Profile, ProfileRole } from '../features/profile/profile.model';

// Pro Tab (sessionStorage), damit das Formular ein Neuladen übersteht
const RECOVERY_STORAGE_KEY = 'password-recovery-user';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly openedFromRecoveryLink = inject(OPENED_FROM_RECOVERY_LINK);

  private readonly currentUser = signal<User | null>(null);
  // Inhaltsvergleich: das stündliche Nachladen meldet sich nur, wenn sich etwas geändert hat
  private readonly currentProfile = signal<Profile | null>(null, { equal: sameProfile });

  private readonly sessionInitialized = signal(false);
  readonly initialized = this.sessionInitialized.asReadonly();

  // Jede Sitzung, auch Gäste (anonyme Anmeldung über den Lobby-Code); nur für Lobby und Spiele.
  // Die stündliche Token-Erneuerung liefert ein neues User-Objekt für dasselbe Konto: gleich
  // bleiben, damit Effekte, die den Nutzer lesen, nicht jedes Mal neu laufen.
  readonly authUser = computed(() => this.currentUser(), { equal: sameUser });
  readonly isGuest = computed(() => this.currentUser()?.is_anonymous === true);
  readonly hasSession = computed(() => this.currentUser() !== null);
  // Nur echte Konten: Gäste gelten überall sonst als nicht angemeldet
  readonly user = computed(() => (this.isGuest() ? null : this.currentUser()), { equal: sameUser });
  readonly profile = this.currentProfile.asReadonly();
  readonly isLoggedIn = computed(() => this.user() !== null);

  readonly displayName = computed(
    () => this.currentProfile()?.display_name ?? this.currentProfile()?.username ?? '',
  );
  readonly username = computed(() => this.currentProfile()?.username ?? '');
  readonly roles = computed(() => this.currentProfile()?.roles ?? []);
  readonly isAdmin = computed(() => this.roles().includes('admin'));

  // Konto, das über den Link aus der Passwort-Mail angemeldet wurde: nur dann gibt es das
  // Formular „Neues Passwort“ (sonst könnte jede offene Sitzung das Passwort ändern)
  private readonly recoveryUserId = signal<string | null>(readRecoveryUserId());
  readonly isRecovering = computed(() => {
    const id = this.user()?.id;
    return id !== undefined && id === this.recoveryUserId();
  });

  constructor() {
    // INITIAL_SESSION kommt einmal nach dem Start von auth-js; kein zusätzliches getSession(),
    // sonst wird das Profil beim Start doppelt geladen
    supabase.auth.onAuthStateChange((event, session) => {
      void this.setUser(session?.user ?? null).then(() => {
        if (event === 'INITIAL_SESSION') this.sessionInitialized.set(true);
      });

      // Nur im Tab, der über den Link geöffnet wurde; landet der Link anderswo
      // (z. B. Site URL), führt das zum Formular
      if (event === 'PASSWORD_RECOVERY' && session && this.openedFromRecoveryLink) {
        this.setRecoveryUser(session.user.id);
        void this.router.navigateByUrl('/profile/password');
      } else if (event === 'SIGNED_OUT') {
        this.setRecoveryUser(null);
      }
    });
  }

  // Nach dem Setzen des neuen Passworts ist der Link verbraucht
  finishRecovery(): void {
    this.setRecoveryUser(null);
  }

  // Admins haben jede Rolle
  hasAnyRole(roles: ProfileRole[]): boolean {
    return this.isAdmin() || roles.some((role) => this.roles().includes(role));
  }

  // Nach dem Bearbeiten das aktualisierte Profil übernehmen
  setProfile(profile: Profile): void {
    this.currentProfile.set(profile);
  }

  // User setzen und passendes Profil aus der Tabelle nachladen; auch bei der Token-Erneuerung,
  // damit vom Admin geänderte Rollen eine offene App erreichen
  private async setUser(user: User | null): Promise<void> {
    const sameAccount = user !== null && user.id === this.currentUser()?.id;
    this.currentUser.set(user);
    const profile = user ? await this.profileService.getProfile(user.id) : null;
    if (user?.id !== this.currentUser()?.id) return; // inzwischen ab- oder umgemeldet
    if (sameAccount && !profile) return; // Ladefehler: bekanntes Profil behalten
    this.currentProfile.set(profile);
  }

  private setRecoveryUser(userId: string | null): void {
    this.recoveryUserId.set(userId);
    try {
      if (userId) sessionStorage.setItem(RECOVERY_STORAGE_KEY, userId);
      else sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
    } catch {
      // ohne Speicher gilt es nur bis zum Neuladen
    }
  }
}

function sameUser(a: User | null, b: User | null): boolean {
  return a?.id === b?.id && a?.is_anonymous === b?.is_anonymous;
}

function sameProfile(a: Profile | null, b: Profile | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readRecoveryUserId(): string | null {
  try {
    return sessionStorage.getItem(RECOVERY_STORAGE_KEY);
  } catch {
    return null;
  }
}
