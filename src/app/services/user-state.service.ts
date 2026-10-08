import { Injectable, effect, inject } from '@angular/core';
import { supabase } from '../supabase.client';
import { SessionService } from './session.service';
import { AppErrorService } from './app-error.service';
import { describeSupabaseError } from './supabase-errors';

export type UserStateKey = 'paddle' | 'arrival-planner' | 'arrival-planner-train';

// Werkzeug-Stände im Konto (Tabelle user_app_state); localStorage bleibt Zwischenspeicher
// für Gäste und offline
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly session = inject(SessionService);
  private readonly appErrors = inject(AppErrorService);
  private readonly saveTimers = new Map<UserStateKey, ReturnType<typeof setTimeout>>();

  // Im Konstruktor aufrufen. Beim Anmelden gewinnt der Stand im Konto; gibt es dort noch
  // keinen, wird der lokale (falls vorhanden) hochgeladen.
  connect<T>(key: UserStateKey, local: () => T | null, apply: (value: unknown) => void): void {
    effect(() => {
      if (!this.session.initialized()) return;
      const userId = this.session.user()?.id;
      if (userId) void this.pull(userId, key, local, apply);
    });
  }

  // Verzögert wie beim Ranking, damit schnelle Klicks nur eine Anfrage auslösen
  save(key: UserStateKey, value: unknown): void {
    const userId = this.session.user()?.id;
    if (!userId) return;

    clearTimeout(this.saveTimers.get(key));
    this.saveTimers.set(
      key,
      setTimeout(async () => {
        if (this.session.user()?.id !== userId) return;
        const { error } = await supabase
          .from('user_app_state')
          .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() });
        if (error) {
          console.error(`Stand „${key}“ konnte nicht gespeichert werden.`, error);
          this.appErrors.report(describeSupabaseError(error), { title: 'Stand nicht gespeichert' });
        }
      }, 400),
    );
  }

  private async pull<T>(
    userId: string,
    key: UserStateKey,
    local: () => T | null,
    apply: (value: unknown) => void,
  ): Promise<void> {
    const { data, error } = await supabase
      .from('user_app_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();
    if (this.session.user()?.id !== userId) return;

    // Bei Fehlern nichts hochladen, sonst überschreibt der lokale den Stand im Konto
    if (error) {
      console.error(`Stand „${key}“ konnte nicht geladen werden.`, error);
      this.appErrors.report(describeSupabaseError(error), { title: 'Stand nicht geladen' });
      return;
    }

    if (data) {
      apply(data.value);
      return;
    }
    const value = local();
    if (value !== null) this.save(key, value);
  }
}
