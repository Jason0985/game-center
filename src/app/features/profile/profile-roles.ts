import { ProfileRole } from './profile.model';

export interface ProfileRoleConfig {
  role: ProfileRole | 'user';
  label: string;
  icon: string;
  description: string;
}

// Vergebbare Zusatzrollen; Reihenfolge = Anzeige-Reihenfolge (Übersicht, Auswahl im Dialog)
export const PROFILE_ROLES: (ProfileRoleConfig & { role: ProfileRole })[] = [
  {
    role: 'admin',
    label: 'Admin',
    icon: 'admin_panel_settings',
    description: 'Sieht alles, sendet Systembenachrichtigungen und verwaltet Rollen.',
  },
  {
    role: 'race_results',
    label: 'Rennergebnisse',
    icon: 'emoji_events',
    description: 'Darf Rennergebnisse aus Screenshots auslesen.',
  },
];

// Basisrolle aller Spieler, wird nicht gespeichert
export const USER_ROLE: ProfileRoleConfig = {
  role: 'user',
  label: 'Nutzer',
  icon: 'person',
  description: 'Standardrolle für alle Spieler.',
};

export function profileRoleConfig(role: ProfileRole): ProfileRoleConfig {
  return PROFILE_ROLES.find((config) => config.role === role) ?? USER_ROLE;
}

// Chips für ein Profil: seine Zusatzrollen, sonst "Nutzer"
export function profileRoleConfigs(roles: ProfileRole[]): ProfileRoleConfig[] {
  const configs = PROFILE_ROLES.filter((config) => roles.includes(config.role));
  return configs.length ? configs : [USER_ROLE];
}
