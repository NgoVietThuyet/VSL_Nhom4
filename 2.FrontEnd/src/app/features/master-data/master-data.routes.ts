import { Routes } from "@angular/router";
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const masterDataRoutes: Routes = [
  { path: 'organize', loadComponent: () => import('./components/organize/organize').then(m => m.Organize), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_ORGANIZE } },
  { path: 'title', loadComponent: () => import('./components/title/title').then(m => m.Title), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_TITLE } },
  { path: 'role', loadComponent: () => import('./components/role/role').then(m => m.Role), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_ROLE } },
  { path: 'document-type', loadComponent: () => import('./components/document-type/document-type').then(m => m.DocumentType), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_DOCUMENT_TYPE } },
  { path: 'fields', loadComponent: () => import('./components/fields/fields').then(m => m.Fields), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_FIELDS } },
  { path: 'document-urgency', loadComponent: () => import('./components/document-urgency/document-urgency').then(m => m.DocumentUrgency), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_DOCUMENT_URGENCY } },
  { path: 'document-book', loadComponent: () => import('./components/document-book/document-book.component').then(m => m.DocumentBookComponent), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_DOCUMENT_BOOK } },
  { path: 'document-security', loadComponent: () => import('./components/document-security/document-security').then(m => m.DocumentSecurity), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_DOCUMENT_SECURITY } },
  { path: 'organize-group', loadComponent: () => import('./components/organize-group/organize-group').then(m => m.OrganizeGroup), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_ORGANIZE_GROUP } },
  { path: 'task-priority', loadComponent: () => import('./components/task-priority/task-priority').then(m => m.TaskPriority), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_TASK_PRIORITY } },
  { path: 'main-task', loadComponent: () => import('./components/main-task/main-task').then(m => m.MainTask), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_MAIN_TASK } },
  { path: 'issuing-org', loadComponent: () => import('./components/issuing-org/issuing-org').then(m => m.IssuingOrg), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.MASTER_DATA_ISSUING_ORG } },
]
