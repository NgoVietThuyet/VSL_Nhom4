import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const mailRoutes: Routes = [
    { path: '', loadComponent: () => import('./components/mail').then(m => m.MailComponent), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MAIL } },
];
