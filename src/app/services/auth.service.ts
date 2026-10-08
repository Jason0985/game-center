import { Injectable } from '@angular/core';
import { AuthError, isAuthImplicitGrantRedirectError } from '@supabase/supabase-js';
import { supabase } from '../supabase.client';
import { appUrl } from '../app-url';
import { describeAuthError, describeFunctionError } from './supabase-errors';

// Das Gast-Token gibt es nach Login/Registrierung nur noch hier, daher kurz wiederholen
const GUEST_DELETE_RETRY_DELAYS_MS = [500, 1500];

// Fehler beim Prüfen des Links aus der Passwort-Mail
export interface RecoveryLinkError {
  message: string;
  // true: Link abgelaufen oder schon benutzt; sonst z. B. Netzfehler, dann hilft Neuladen
  linkInvalid: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  async register(email: string, password: string, username: string, displayName: string) {
    const guestToken = await this.guestAccessToken();
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Bestätigungslink (bei „Confirm email“) führt zurück in diese App, auch lokal
        emailRedirectTo: appUrl('profile'),
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    if (result.error || !guestToken) return { ...result, guestCleanupFailed: false };

    const deleted = await this.deleteGuestAfterSignIn(guestToken);
    // Ohne Sitzung (E-Mail-Bestätigung an) ist noch der Gast angemeldet: nur abmelden, wenn er
    // gelöscht ist, sonst behält er seinen Lobby-Platz
    const replacedGuest = result.data.session !== null;
    if (!replacedGuest && deleted) await supabase.auth.signOut({ scope: 'local' });
    return { ...result, guestCleanupFailed: replacedGuest && !deleted };
  }

  async login(email: string, password: string) {
    const guestToken = await this.guestAccessToken();
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Gast erst nach erfolgreicher Anmeldung löschen, sonst wäre der Lobby-Platz bei einem Tippfehler weg.
    // guestCleanupFailed: Der alte Gast sitzt noch in der Lobby (der Host kann ihn entfernen)
    const guestCleanupFailed =
      !result.error && !!guestToken && !(await this.deleteGuestAfterSignIn(guestToken));
    return { ...result, guestCleanupFailed };
  }

  logout() {
    return supabase.auth.signOut();
  }

  // Temporärer Gast (anonyme Supabase-Anmeldung); der Anzeigename landet per Trigger im Profil
  signInAsGuest(displayName: string) {
    return supabase.auth.signInAnonymously({
      options: { data: { display_name: displayName } },
    });
  }

  // Löscht den Gast samt Profil und Lobby-Platz; true, wenn danach keine Gastsitzung mehr besteht.
  // Scheitert das Löschen, bleibt die Sitzung, damit kein verwaister Lobby-Platz zurückbleibt
  async endGuestSession(): Promise<boolean> {
    const token = await this.guestAccessToken();
    if (!token) return true;

    if (!(await this.deleteGuest(token))) return false;

    // Lokal, weil der User serverseitig schon gelöscht ist
    await supabase.auth.signOut({ scope: 'local' });
    return true;
  }

  // Löscht das eigene Konto samt allen Daten endgültig (Edge Function "delete-account")
  async deleteAccount(): Promise<{ ok: true } | { ok: false; message: string }> {
    const { error } = await supabase.functions.invoke('delete-account', {
      body: { confirm: true },
    });
    if (error) {
      console.error('Konto konnte nicht gelöscht werden.', error);
      return { ok: false, message: await describeFunctionError(error) };
    }
    // Lokal, weil der User serverseitig schon gelöscht ist
    await supabase.auth.signOut({ scope: 'local' });
    return { ok: true };
  }

  // Mail mit Link auf /profile/password; ob es die Adresse gibt, verrät GoTrue nicht
  async requestPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appUrl('profile/password'),
    });
    return { error };
  }

  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      // Nach dem Zurücksetzen andere Geräte abmelden
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
      if (signOutError) {
        console.error('Andere Sitzungen konnten nicht beendet werden.', signOutError);
      }
    }
    return { error };
  }

  // Fehler aus dem Link der Mail (z. B. abgelaufen); initialize() liefert das gespeicherte Ergebnis
  async recoveryLinkError(): Promise<RecoveryLinkError | null> {
    const { error } = await supabase.auth.initialize();
    return error
      ? { message: describeAuthError(error), linkInvalid: isAuthImplicitGrantRedirectError(error) }
      : null;
  }

  private async guestAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.is_anonymous ? data.session.access_token : null;
  }

  private async deleteGuestAfterSignIn(token: string): Promise<boolean> {
    for (const delayMs of GUEST_DELETE_RETRY_DELAYS_MS) {
      if (await this.deleteGuest(token)) return true;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return this.deleteGuest(token);
  }

  // Mit dem Token des Gasts, weil nach Login/Registrierung schon das neue Konto angemeldet ist
  private async deleteGuest(token: string): Promise<boolean> {
    const { error } = await supabase
      .rpc('end_guest_session')
      .setHeader('Authorization', `Bearer ${token}`);
    if (error) {
      console.error('Gastsitzung konnte nicht gelöscht werden.', error);
      return false;
    }
    return true;
  }
}
