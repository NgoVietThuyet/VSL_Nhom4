import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const systemMonitoringRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/system-monitoring-dashboard').then(
        m => m.SystemMonitoringDashboard
      ),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.SYSTEM_MONITORING },
  },
];
