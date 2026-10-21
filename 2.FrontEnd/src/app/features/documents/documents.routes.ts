import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const documentsRoutes: Routes = [
    { path: '', loadComponent: () => import('./components/documents').then(m => m.Documents) },
];
