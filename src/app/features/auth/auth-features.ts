import { InjectionToken } from '@angular/core';

// Passwort-Reset braucht Custom SMTP in Supabase; bis dahin ausgegraut (danach auf true setzen)
export const PASSWORD_RESET_ENABLED = new InjectionToken<boolean>('PASSWORD_RESET_ENABLED', {
  providedIn: 'root',
  factory: () => false,
});
