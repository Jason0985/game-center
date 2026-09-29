import { NotificationType, SystemNotificationType } from './notification.model';

export type NotificationCategory = 'social' | 'game' | 'system';

// Farbton von Karte und Toast, siehe src/styles/_notification-tones.scss ([data-tone])
export type NotificationTone = 'social' | 'success' | 'game' | 'info' | 'alert' | 'error';

// Welche Buttons eine Benachrichtigung hat; 'none' = nur wegklicken
export type NotificationActions = 'friend-request' | 'game-invite' | 'none';

export interface NotificationTypeConfig {
  category: NotificationCategory;
  label: string;
  icon: string;
  tone: NotificationTone;
  actions: NotificationActions;
}

export const NOTIFICATION_TYPES: Record<NotificationType, NotificationTypeConfig> = {
  friend_request: {
    category: 'social',
    label: 'Freunde',
    icon: 'person_add',
    tone: 'social',
    actions: 'friend-request',
  },
  friend_accepted: {
    category: 'social',
    label: 'Freunde',
    icon: 'how_to_reg',
    tone: 'success',
    actions: 'none',
  },
  game_invite: {
    category: 'game',
    label: 'Spiele',
    icon: 'sports_esports',
    tone: 'game',
    actions: 'game-invite',
  },
  system_info: {
    category: 'system',
    label: 'System',
    icon: 'campaign',
    tone: 'info',
    actions: 'none',
  },
  system_alert: {
    category: 'system',
    label: 'Wichtig',
    icon: 'warning',
    tone: 'alert',
    actions: 'none',
  },
  app_error: {
    category: 'system',
    label: 'Fehler',
    icon: 'error',
    tone: 'error',
    actions: 'none',
  },
};

// Unbekannte Typen (z. B. neue DB-Typen vor einem FE-Update) als Info anzeigen
export function notificationTypeConfig(type: string): NotificationTypeConfig {
  return NOTIFICATION_TYPES[type as NotificationType] ?? NOTIFICATION_TYPES.system_info;
}

export const SYSTEM_NOTIFICATION_OPTIONS: { type: SystemNotificationType; label: string }[] = [
  { type: 'system_info', label: 'Info' },
  { type: 'system_alert', label: 'Wichtig' },
];
