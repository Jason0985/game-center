import { Component, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { supabase } from '../../../supabase.client';
import { SessionService } from '../../../services/session.service';
import { PushService } from '../../../services/push.service';
import { AppErrorService } from '../../../services/app-error.service';
import { ToastService } from '../../../services/toast.service';
import { describeSupabaseError } from '../../../services/supabase-errors';
import { NOTIFICATION_TYPES } from '../../notifications/notification-types';
import { NotificationType } from '../../notifications/notification.model';

type PushType = Exclude<NotificationType, 'app_error'>;

// Reihenfolge und Texte der Liste; Arten wie in der DB (push_preferences.muted_types)
const PUSH_TYPES: { type: PushType; title: string; sub: string; tile: string }[] = [
  {
    type: 'game_invite',
    title: 'Spiel-Einladungen',
    sub: 'Jemand lädt dich in eine Lobby ein',
    tile: 'var(--tile-pink)',
  },
  {
    type: 'friend_request',
    title: 'Freundschaftsanfragen',
    sub: 'Jemand möchte dich als Freund hinzufügen',
    tile: 'var(--tile-purple)',
  },
  {
    type: 'friend_accepted',
    title: 'Angenommene Anfragen',
    sub: 'Jemand hat deine Anfrage angenommen',
    tile: 'var(--tile-green)',
  },
  {
    type: 'system_info',
    title: 'Neuigkeiten',
    sub: 'Infos rund um das Game Center',
    tile: 'var(--tile-blue)',
  },
  {
    type: 'system_alert',
    title: 'Wichtige Hinweise',
    sub: 'Zum Beispiel Wartungsarbeiten',
    tile: 'var(--tile-orange)',
  },
];

@Component({
  selector: 'app-push-settings',
  imports: [MatIconModule, RouterLink],
  templateUrl: './push-settings.html',
  styleUrl: './push-settings.scss',
})
export class PushSettings {
  readonly session = inject(SessionService);
  readonly push = inject(PushService);
  private readonly appErrors = inject(AppErrorService);
  private readonly toasts = inject(ToastService);
  readonly types = PUSH_TYPES.map((entry) => ({
    ...entry,
    icon: NOTIFICATION_TYPES[entry.type].icon,
  }));
  // Stumme Arten; null = noch nicht geladen
  readonly muted = signal<PushType[] | null>(null);
  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const userId = this.session.user()?.id;
      if (userId) void this.load(userId);
    });
  }

  async toggleAll(): Promise<void> {
    const turnOn = this.push.state() !== 'on';
    const result = turnOn ? await this.push.enable() : await this.push.disable(true);
    if (!result.ok) {
      this.appErrors.report(result.message, { title: 'Push-Nachrichten' });
    } else if (turnOn && this.push.state() === 'on') {
      this.toasts.success('Push-Nachrichten aktiviert');
    }
  }

  async toggleType(type: PushType): Promise<void> {
    const userId = this.session.user()?.id;
    const previous = this.muted();
    if (!userId || !previous || this.saving()) return;

    const muted = previous.includes(type)
      ? previous.filter((entry) => entry !== type)
      : [...previous, type];
    this.muted.set(muted);
    this.saving.set(true);
    const { error } = await supabase
      .from('push_preferences')
      .upsert({ user_id: userId, muted_types: muted, updated_at: new Date().toISOString() });
    this.saving.set(false);

    if (error) {
      this.muted.set(previous);
      this.appErrors.report(describeSupabaseError(error), { title: 'Push-Nachrichten' });
    }
  }

  private async load(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('push_preferences')
      .select('muted_types')
      .eq('user_id', userId)
      .maybeSingle();
    if (this.session.user()?.id !== userId) return;

    if (error) {
      this.appErrors.report(describeSupabaseError(error), { title: 'Push-Nachrichten' });
      return;
    }
    this.muted.set((data?.muted_types as PushType[] | undefined) ?? []);
  }
}
