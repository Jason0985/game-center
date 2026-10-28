import { InjectionToken } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

// Vor createClient merken: auth-js entfernt den Hash aus dem Link der Passwort-Mail gleich beim Start
const openedFromRecoveryLink = /(?:^#|&)type=recovery(?:&|$)/.test(globalThis.location?.hash ?? '');

// Nur dieser Tab kam über den Link aus der Passwort-Mail (andere Tabs bekommen das Event per Broadcast)
export const OPENED_FROM_RECOVERY_LINK = new InjectionToken<boolean>('OPENED_FROM_RECOVERY_LINK', {
  providedIn: 'root',
  factory: () => openedFromRecoveryLink,
});

export const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
