export type ProfileRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  role: ProfileRole;
  created_at: string;
}
