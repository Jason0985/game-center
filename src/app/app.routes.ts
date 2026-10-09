import { Routes } from '@angular/router';
import { lobbyGuard, roleGuard } from './role-guard';
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
    path: 'collection/arrival-planner',
    loadComponent: () =>
      import('./features/collection/arrival-planner/arrival-planner').then(
        (module) => module.ArrivalPlanner,
      ),
  },
  // Ohne Guard: Ohne Konto kann man dort als Gast mit dem Lobby-Code beitreten
  {
    path: 'multiplayer',
    loadComponent: () =>
      import('./features/multiplayer/multiplayer').then((module) => module.Multiplayer),
  },
  {
    path: 'multiplayer/:lobbyId',
    canActivate: [lobbyGuard],
    loadComponent: () =>
      import('./features/multiplayer/lobby/lobby').then((module) => module.Lobby),
  },
  {
    path: 'collection/f1-strategy',
    loadComponent: () =>
      import('./features/collection/f1-strategy/f1-strategy').then((module) => module.F1Strategy),
  },
  {
    path: 'collection/f1-strategy/:trackId',
    loadComponent: () =>
      import('./features/collection/f1-strategy/detailed-view/detailed-view').then(
        (module) => module.DetailedView,
      ),
  },
  {
    path: 'collection/race-results',
    canActivate: [roleGuard('race_results')],
    loadComponent: () =>
      import('./features/collection/race-results/race-results').then(
        (module) => module.RaceResults,
      ),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((module) => module.Profile),
  },
  {
    path: 'profile/stats',
    loadComponent: () => import('./features/profile/stats/stats').then((module) => module.Stats),
  },
  {
    path: 'profile/admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./features/admin/admin').then((module) => module.Admin),
  },
  {
    path: 'profile/auth',
    loadComponent: () => import('./features/auth/auth').then((module) => module.Auth),
  },
  // Ziel des Links aus der Mail „Passwort zurücksetzen“ (redirectTo); ohne Guard, die Seite prüft selbst
  {
    path: 'profile/password',
    loadComponent: () =>
      import('./features/auth/password-reset').then((module) => module.PasswordReset),
  },
  {
    path: 'settings/push',
    loadComponent: () =>
      import('./features/settings/push-settings/push-settings').then(
        (module) => module.PushSettings,
      ),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  {
    path: 'legal/impressum',
    loadComponent: () => import('./features/legal/imprint').then((module) => module.Imprint),
  },
  {
    path: 'legal/datenschutz',
    loadComponent: () => import('./features/legal/privacy').then((module) => module.Privacy),
  },
  {
    path: 'legal/nutzungsbedingungen',
    loadComponent: () => import('./features/legal/terms').then((module) => module.Terms),
  },
  {
    path: 'legal/lizenzen',
    loadComponent: () => import('./features/legal/licenses').then((module) => module.Licenses),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications').then((module) => module.Notifications),
  },
];
