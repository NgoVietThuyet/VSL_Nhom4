import { Routes } from '@angular/router';

export const gameRoutes: Routes = [
  {
    path: 'flappy-bird',
    loadComponent: () =>
      import('./components/flappy-bird/flappy-bird').then(m => m.FlappyBird),
  },
  { path: '', redirectTo: 'flappy-bird', pathMatch: 'full' },
];
