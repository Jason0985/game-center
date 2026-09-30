import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { ProfileRole } from './features/profile/profile.model';
import { SessionService } from './services/session.service';

// Seiten nur für bestimmte Rollen (Admins dürfen immer); alle anderen landen in der Sammlung
export function roleGuard(...roles: ProfileRole[]): CanActivateFn {
  return async () => {
    const session = inject(SessionService);
    const router = inject(Router);

    // warten bis Login und Profil (mit Rollen) geladen sind
    await firstValueFrom(toObservable(session.initialized).pipe(filter(Boolean)));

    return session.hasAnyRole(roles) || router.parseUrl('/collection');
  };
}
