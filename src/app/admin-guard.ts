import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { SessionService } from './services/session.service';

// Seiten, die (vorerst) nur Admins sehen dürfen; alle anderen landen in der Sammlung
export const adminGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);

  // warten bis Login und Profil (mit Rolle) geladen sind
  await firstValueFrom(toObservable(session.initialized).pipe(filter(Boolean)));

  return session.isAdmin() || router.parseUrl('/collection');
};
