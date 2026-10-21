import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const workflowRoutes: Routes = [
    {
        path: 'category',
        loadComponent: () => import('./components/wf-category/wf-category').then(m => m.WfCategory),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_CATEGORY }
    },
    {
        path: 'definition',
        loadComponent: () => import('./components/wf-definition/wf-definition').then(m => m.WfDefinition),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_DEFINITION }
    },
    {
        path: 'designer/:id',
        loadComponent: () => import('./components/wf-designer/wf-designer').then(m => m.WfDesigner),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_DESIGNER }
    },
    {
        path: 'inbox',
        loadComponent: () => import('./components/wf-inbox/wf-inbox').then(m => m.WfInbox),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_INBOX }
    },
    {
        path: 'my-requests',
        loadComponent: () => import('./components/wf-my-requests/wf-my-requests').then(m => m.WfMyRequests),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_MY_REQUESTS }
    },
    {
        path: 'participated',
        loadComponent: () => import('./components/wf-participated/wf-participated').then(m => m.WfParticipated),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_PARTICIPATED }
    },
    {
        path: 'submit',
        loadComponent: () => import('./components/wf-submit/wf-submit').then(m => m.WfSubmit),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW_SUBMIT }
    },
    {
        path: 'detail/:id',
        loadComponent: () => import('./components/wf-detail/wf-detail').then(m => m.WfDetail),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.WORKFLOW }
    },
];
