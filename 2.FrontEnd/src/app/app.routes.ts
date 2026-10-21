import { Routes } from '@angular/router';
import AuthGuard from './core/guards/auth.guard';
import UnauthGuard from './core/guards/unauth.guard';
import PermissionGuard from './core/guards/permission.guard';
import { WindowModeGuard } from './shared/guards/window-mode.guard';
import { APP_RIGHTS } from './shared/constants';

export const routes: Routes = [
  {
    path: 'desktop',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayout),
    // canActivateChild fires before each child route activation:
    // in Window Mode, it intercepts navigation and opens the route as a floating window
    canActivateChild: [WindowModeGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./shared/layouts/home/home').then(m => m.Home),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HOME },
      },

      {
        path: 'system-manager',
        loadChildren: () => import('./features/system-manager/system-manager.routes').then(m => m.systemManagerRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.SYSTEM_MANAGER,
            APP_RIGHTS.SYSTEM_MANAGER_MENU,
            APP_RIGHTS.SYSTEM_MANAGER_ACCOUNT_GROUP,
            APP_RIGHTS.SYSTEM_MANAGER_ACCOUNT,
            APP_RIGHTS.SYSTEM_MANAGER_HISTORY_LOGIN,
            APP_RIGHTS.SYSTEM_MANAGER_MESSAGE_SYSTEM,
            APP_RIGHTS.SYSTEM_MANAGER_RIGHT,
          ]
        },
      },
      {
        path: 'master-data',
        loadChildren: () => import('./features/master-data/master-data.routes').then(m => m.masterDataRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.MASTER_DATA,
            APP_RIGHTS.MASTER_DATA_ORGANIZE,
            APP_RIGHTS.MASTER_DATA_TITLE
          ]
        },
      },
      {
        path: 'report',
        loadChildren: () => import('./features/report/report.routes').then(m => m.reportRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.REPORT,
            APP_RIGHTS.REPORT_PERIOD_TYPE,
            APP_RIGHTS.REPORT_PERIOD,
            APP_RIGHTS.REPORT_CATEGORY,
            APP_RIGHTS.REPORT_DATA_TYPE,
            APP_RIGHTS.REPORT_FORMULA_FUNCTION,
            APP_RIGHTS.REPORT_STATUS,
            APP_RIGHTS.REPORT_DEFINITION,
            APP_RIGHTS.REPORT_STRUCTURE,
            APP_RIGHTS.REPORT_FORMULA,
            APP_RIGHTS.REPORT_TEMPLATE,
            APP_RIGHTS.REPORT_DATA_ENTRY,
            APP_RIGHTS.REPORT_WORKFLOW,
            APP_RIGHTS.REPORT_PERMISSION,
            APP_RIGHTS.REPORT_UNIT,
          ]
        },
      },
      {
        path: 'chat',
        loadChildren: () => import('./features/chat/chat.routes').then(m => m.chatRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.CHAT },
      },
      {
        path: 'chat-bot',
        loadChildren: () => import('./features/chat-bot/chat-bot.routes').then(m => m.chatBotRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.AI_CHAT_BOT },
      },
      {
        path: 'documents',
        loadChildren: () => import('./features/documents/documents.routes').then(m => m.documentsRoutes),
        canActivate: [AuthGuard, PermissionGuard],
      },
      {
        path: 'explorer',
        loadChildren: () => import('./features/explorer/explorer.routes').then(m => m.explorerRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.EXPLORER_ARCHIVE,
            APP_RIGHTS.EXPLORER_PERSONAL
          ]
        },
      },
      {
        path: 'meeting',
        loadChildren: () => import('./features/meeting/meeting.routes').then(m => m.meetingsRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.MEETING },
      },
      {
        path: 'task',
        loadChildren: () => import('./features/task/task.routes').then(m => m.taskRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.TASK },
      },
      {
        path: 'task-management',
        loadChildren: () => import('./features/task-management/task-management.routes').then(m => m.taskManagementRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.TASK_MANAGEMENT,
            APP_RIGHTS.TASK_MANAGEMENT_DISPATCH,
            APP_RIGHTS.TASK_MANAGEMENT_RECEIVE,
            APP_RIGHTS.TASK_MANAGEMENT_COORDINATE,
            APP_RIGHTS.TASK_MANAGEMENT_CREATE,
            APP_RIGHTS.TASK_MANAGEMENT_DOCUMENT,
            APP_RIGHTS.TASK_MANAGEMENT_APPROVAL,
            APP_RIGHTS.TASK_MANAGEMENT_DASHBOARD,
            APP_RIGHTS.TASK_MANAGEMENT_INTERNAL,
            APP_RIGHTS.TASK_MANAGEMENT_RECEPTION,
            APP_RIGHTS.MY_DOCUMENTS,
          ]
        },
      },
      {
        path: 'document-workflow',
        loadChildren: () => import('./features/document-workflow/document-workflow.routes').then(m => m.documentWorkflowRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.DOCUMENT_WORKFLOW },
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes').then(m => m.calendarRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.CALENDAR },
      },
      {
        path: 'notes',
        loadChildren: () => import('./features/notes/notes.routes').then(m => m.notesRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.NOTES },
      },
      {
        path: 'mail',
        loadChildren: () => import('./features/mail/mail.routes').then(m => m.mailRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.MAIL },
      },
      {
        path: 'workflow',
        loadChildren: () => import('./features/workflow/workflow.routes').then(m => m.workflowRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.WORKFLOW,
            APP_RIGHTS.WORKFLOW_CATEGORY,
            APP_RIGHTS.WORKFLOW_DEFINITION,
            APP_RIGHTS.WORKFLOW_DESIGNER,
            APP_RIGHTS.WORKFLOW_INBOX,
            APP_RIGHTS.WORKFLOW_MY_REQUESTS,
            APP_RIGHTS.WORKFLOW_PARTICIPATED,
            APP_RIGHTS.WORKFLOW_SUBMIT,
          ]
        },
      },
      {
        path: 'asset',
        loadChildren: () => import('./features/asset/asset.routes').then(m => m.assetRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: {
          requiredRight: [
            APP_RIGHTS.ASSET,
            APP_RIGHTS.ASSET_DASHBOARD,
            APP_RIGHTS.ASSET_LIST,
            APP_RIGHTS.ASSET_ASSIGNMENT,
            APP_RIGHTS.ASSET_MY_ASSETS,
            APP_RIGHTS.ASSET_TRANSFER,
            APP_RIGHTS.ASSET_MAINTENANCE,
            APP_RIGHTS.ASSET_DEPRECIATION,
            APP_RIGHTS.ASSET_INVENTORY,
            APP_RIGHTS.ASSET_DISPOSAL,
            APP_RIGHTS.ASSET_LICENSE,
            APP_RIGHTS.ASSET_CATEGORY,
          ]
        },
      },
      {
        path: 'crm',
        loadChildren: () => import('./features/crm/crm.routes').then(m => m.crmRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.CRM },
      },
      {
		path: 'hrm',
	        loadChildren: () => import('./features/hrm/hrm.routes').then(m => m.hrmRoutes),
	        canActivate: [AuthGuard, PermissionGuard],
	        data: {
	          requiredRight: [
	            APP_RIGHTS.HRM,
	            APP_RIGHTS.HRM_DASHBOARD,
	            APP_RIGHTS.HRM_EMPLOYEE,
	            APP_RIGHTS.HRM_CONTRACT,
	            APP_RIGHTS.HRM_ATTENDANCE,
	            APP_RIGHTS.HRM_ATTENDANCE_MY,
	            APP_RIGHTS.HRM_LEAVE,
	            APP_RIGHTS.HRM_LEAVE_MY,
	            APP_RIGHTS.HRM_PAYROLL,
	            APP_RIGHTS.HRM_PAYROLL_MY,
	            APP_RIGHTS.HRM_RECRUITMENT,
	            APP_RIGHTS.HRM_TRAINING,
	            APP_RIGHTS.HRM_EVALUATION,
	            APP_RIGHTS.HRM_MASTER_DATA,
	          ]
	        },
	      },
      {
        path: 'system-monitoring',
        loadChildren: () => import('./features/system-monitoring/system-monitoring.routes').then(m => m.systemMonitoringRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.SYSTEM_MONITORING },
      },
      {
        path: 'gis',
        loadChildren: () => import('./features/gis/gis.routes').then(m => m.gisRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { requiredRight: APP_RIGHTS.GIS_LOCATION },
      },
      {
        path: 'game',
        loadChildren: () => import('./features/game/game.routes').then(m => m.gameRoutes),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./shared/layouts/blank-layout/blank-layout').then(m => m.BlankLayout),
    children: [
      { path: 'login', loadComponent: () => import('./features/authentication/components/login').then(m => m.Login), canActivate: [UnauthGuard] },
      { path: 'privacy-policy', loadComponent: () => import('./shared/layouts/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy), canActivate: [UnauthGuard] },
      { path: 'form-remove-account', loadComponent: () => import('./shared/layouts/form-remove-account/form-remove-account').then(m => m.FormRemoveAccount), canActivate: [UnauthGuard] },
      { path: 'error-server', loadComponent: () => import('./shared/layouts/error-server/error-server').then(m => m.ErrorServer), canActivate: [UnauthGuard] },
      { path: 'maintain-server', loadComponent: () => import('./shared/layouts/maintain-server/maintain-server').then(m => m.MaintainServer), canActivate: [UnauthGuard] },
      { path: 'un-authen', loadComponent: () => import('./shared/layouts/un-authen/un-authen').then(m => m.UnAuthen), canActivate: [UnauthGuard] },
      { path: 'not-permission', loadComponent: () => import('./shared/layouts/not-permission/not-permission').then(m => m.NotPermission), canActivate: [AuthGuard] },
      { path: 'share/:code', loadComponent: () => import('./shared/layouts/share-viewer/share-viewer').then(m => m.ShareViewer) },
    ],
  },
  {
    path: 'license-expired',
    loadComponent: () => import('./features/license-expired/license-expired').then(m => m.LicenseExpired),
  },
  { path: '**', loadComponent: () => import('./shared/layouts/not-found/not-found').then(m => m.NotFound) },
];
