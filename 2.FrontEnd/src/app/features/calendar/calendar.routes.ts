import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const calendarRoutes: Routes = [
  { path: '', loadComponent: () => import('./components/calendar-home').then(m => m.CalendarHome), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.CALENDAR } },
];
