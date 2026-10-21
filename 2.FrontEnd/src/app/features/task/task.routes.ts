import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const taskRoutes: Routes = [
  { path: 'home', loadComponent: () => import('./components/task-home/task-home').then(m => m.TaskHome), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.TASK } },
  { path: 'board/:id', loadComponent: () => import('./components/board/board').then(m => m.Board), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.TASK } },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
