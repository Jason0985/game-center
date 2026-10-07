// Zusatzrollen; ohne Zusatzrolle ist jemand normaler Nutzer. Admins haben jede Rolle.
export type ProfileRole = 'admin' | 'race_results';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  roles: ProfileRole[];
  // Temporärer Gast aus dem Lobby-Beitritt per Code
  is_guest: boolean;
  created_at: string;
}
