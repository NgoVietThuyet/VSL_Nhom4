import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const explorerRoutes: Routes = [
    { path: 'personal', loadComponent: () => import('./components/personal/personal').then(m => m.Personal), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.EXPLORER_PERSONAL } },
    { path: 'archive', loadComponent: () => import('./components/archive/archive').then(m => m.Archive), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.EXPLORER_ARCHIVE } },
];
