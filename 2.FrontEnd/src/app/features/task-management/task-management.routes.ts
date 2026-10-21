import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const taskManagementRoutes: Routes = [
  {
    path: 'dispatch',
    redirectTo: 'tasks',
    pathMatch: 'full',
  },
  {
    path: 'reception',
    loadComponent: () => import('./components/task-reception/task-reception').then(m => m.TaskReception),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_RECEPTION }
  },
  {
    path: 'receive',
    loadComponent: () => import('./components/task-receive/task-receive').then(m => m.TaskReceive),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_RECEIVE }
  },
  {
    path: 'coordinate',
    loadComponent: () => import('./components/task-coordinate/task-coordinate').then(m => m.TaskCoordinate),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_COORDINATE }
  },
  {
    path: 'create',
    loadComponent: () => import('./components/task-create/task-create').then(m => m.TaskCreate),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_CREATE }
  },
  {
    path: 'documents',
    loadComponent: () => import('./components/task-document/task-document').then(m => m.TaskDocument),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_DOCUMENT }
  },
  {
    path: 'document-tasks',
    loadComponent: () => import('./components/task-document-view/task-document-view').then(m => m.TaskDocumentView),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_DOCUMENT }
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/task-information/task-information').then(m => m.TaskInformation),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_DISPATCH }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/task-dashboard/task-dashboard').then(m => m.TaskDashboard),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_DASHBOARD }
  },
  {
    path: 'approvals',
    loadComponent: () => import('./components/task-approval/task-approval').then(m => m.TaskApproval),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_APPROVAL }
  },
  {
    path: 'my-documents',
    loadComponent: () => import('./components/my-documents/my-documents').then(m => m.MyDocuments),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.MY_DOCUMENTS }
  },
  {
    path: 'internal',
    loadComponent: () => import('./components/task-internal/task-internal').then(m => m.TaskInternal),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.TASK_MANAGEMENT_INTERNAL }
  },
];
