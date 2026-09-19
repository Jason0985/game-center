import { Routes } from '@angular/router';
import { rankingResumeGuard } from './features/ranking/ranking-resume-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
  },
  {
    path: 'ranking',
    canActivate: [rankingResumeGuard],
    loadComponent: () =>
      import('./features/ranking/game-setup/game-setup').then((m) => m.GameSetup),
  },
  {
    path: 'ranking/game',
    loadComponent: () =>
      import('./features/ranking/scoreboard/scoreboard').then((module) => module.Scoreboard),
  },
  {
    path: 'ranking/end-score',
    loadComponent: () =>
      import('./features/ranking/end-score/end-score').then((module) => module.EndScore),
  },
  {
    path: 'collection',
    loadComponent: () =>
      import('./features/collection/collection').then((module) => module.Collection),
  },
  {
    path: 'collection/paddle-table',
    loadComponent: () =>
      import('./features/collection/paddle-table/paddle-table').then(
        (module) => module.PaddleTable,
      ),
  },
  {
    path: 'collection/flip-7',
    loadComponent: () =>
      import('./features/collection/flip-7/flip-7').then((module) => module.Flip7),
  },
  {
    path: 'collection/f1-strategy',
    loadComponent: () =>
      import('./features/collection/f1-strategy/f1-strategy').then((module) => module.F1Strategy),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'profile/auth',
    loadComponent: () => import('./features/auth/auth').then((module) => module.Auth),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications').then((module) => module.Notifications),
  },
];
