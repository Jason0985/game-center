// Zusatzrollen; ohne Zusatzrolle ist jemand normaler Nutzer. Admins haben jede Rolle.
export type ProfileRole = 'admin' | 'race_results';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  roles: ProfileRole[];
  created_at: string;
}
