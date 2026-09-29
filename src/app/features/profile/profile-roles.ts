import { ProfileRole } from './profile.model';

export interface ProfileRoleConfig {
  role: ProfileRole;
  label: string;
  icon: string;
  description: string;
}

// Reihenfolge = Anzeige-Reihenfolge (Übersicht, Auswahl im Dialog)
export const PROFILE_ROLES: ProfileRoleConfig[] = [
  {
    role: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
    description: 'Sendet Systembenachrichtigungen und verwaltet Rollen.',
  },
  {
    role: 'user',
    label: 'Nutzer',
    icon: 'person',
    description: 'Standardrolle für alle Spieler.',
  },
];

export function profileRoleConfig(role: string): ProfileRoleConfig {
  return PROFILE_ROLES.find((config) => config.role === role) ?? PROFILE_ROLES[1];
}
