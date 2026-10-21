import { Routes } from "@angular/router";
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const meetingsRoutes: Routes = [
  { path: 'home', loadComponent: () => import('./components/home/home').then(m => m.Home), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MEETING } },
  { path: 'detail/:meetingId', loadComponent: () => import('./components/meeting/meeting').then(m => m.Meeting), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MEETING } },
  { path: 'waiting/:meetingId', loadComponent: () => import('./components/waiting-room/waiting-room').then(m => m.WaitingRoom), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MEETING } },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
]
