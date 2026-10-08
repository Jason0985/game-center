import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { ProfileRole } from './features/profile/profile.model';
import { SessionService } from './services/session.service';

// Seiten nur für bestimmte Rollen (Admins dürfen immer), ohne Rollen für alle Eingeloggten;
// alle anderen landen in der Sammlung
export function roleGuard(...roles: ProfileRole[]): CanActivateFn {
  return async () => {
    const session = inject(SessionService);
    const router = inject(Router);

    // warten bis Login und Profil (mit Rollen) geladen sind
    await firstValueFrom(toObservable(session.initialized).pipe(filter(Boolean)));

    return (
      (roles.length ? session.hasAnyRole(roles) : session.isLoggedIn()) ||
      router.parseUrl('/collection')
    );
  };
}

// Lobbys auch für Gäste (anonyme Sitzung über den Lobby-Code), sonst zurück zum Beitreten
export const lobbyGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);

  await firstValueFrom(toObservable(session.initialized).pipe(filter(Boolean)));

  return session.hasSession() || router.parseUrl('/multiplayer');
};
