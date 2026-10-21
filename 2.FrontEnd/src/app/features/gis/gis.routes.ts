import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const gisRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/gis/gis').then(m => m.Gis),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.GIS_LOCATION }
    }
];
