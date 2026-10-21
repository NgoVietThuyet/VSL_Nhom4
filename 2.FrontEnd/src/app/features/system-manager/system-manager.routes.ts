import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';
import { WorkflowComponent } from '../master-data/components/workflow/workflow.component';
import { ListDataComponent } from '../master-data/components/workflow/list-data/list-data.component';
import { WorkflowDetailComponent } from '../master-data/components/workflow/workflow-detail/workflow-detail.component';

export const systemManagerRoutes: Routes = [
  { path: 'profile', loadComponent: () => import('./components/profile/profile').then(m => m.Profile), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'document-system', loadComponent: () => import('./components/document-system/document-system').then(m => m.DocumentSystem), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'message-system', loadComponent: () => import('./components/message-system/message-system').then(m => m.MessageSystem), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_MESSAGE_SYSTEM } },
  { path: 'menu', loadComponent: () => import('./components/menu/menu').then(m => m.Menu), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_MENU } },
  { path: 'right', loadComponent: () => import('./components/right/right').then(m => m.Right), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_RIGHT } },
  { path: 'log-system', loadComponent: () => import('./components/log-system/log-system').then(m => m.LogSystem), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'status-system', loadComponent: () => import('./components/status-system/status-system').then(m => m.StatusSystem), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'background-jobs', loadComponent: () => import('./components/background-jobs/background-jobs').then(m => m.BackgroundJobs), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'history-login', loadComponent: () => import('./components/history-login/history-login').then(m => m.HistoryLogin), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_HISTORY_LOGIN } },
  { path: 'status-integration', loadComponent: () => import('./components/status-integration/status-integration').then(m => m.StatusIntegration), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'account', loadComponent: () => import('./components/account/account').then(m => m.Account), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_ACCOUNT } },
  { path: 'account-group', loadComponent: () => import('./components/account-group/account-group').then(m => m.AccountGroup), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER_ACCOUNT_GROUP } },
  { path: 'contact', loadComponent: () => import('./components/contact/contact').then(m => m.Contact), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'sync-update', loadComponent: () => import('./components/sync-update/sync-update').then(m => m.SyncUpdate), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  { path: 'license-management', loadComponent: () => import('./components/license-management/license-management').then(m => m.LicenseManagement), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.SYSTEM_MANAGER } },
  {
    path: 'workflow',
    component: WorkflowComponent,
    children: [
      { path: '', component: ListDataComponent },
      { path: ':id', component: WorkflowDetailComponent },
      { path: 'add', component: WorkflowDetailComponent },
    ]
  },
];
