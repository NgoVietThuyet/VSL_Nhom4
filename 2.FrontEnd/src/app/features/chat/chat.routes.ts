import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const chatRoutes: Routes = [
    { path: '', loadComponent: () => import('./components/chat').then(m => m.Chat), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.CHAT } },
];
