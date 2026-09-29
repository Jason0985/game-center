export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'system_info'
  | 'system_alert';

export type SystemNotificationType = Extract<NotificationType, 'system_info' | 'system_alert'>;

export interface NotificationItem {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  sender_name: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  created_at: string;
}
