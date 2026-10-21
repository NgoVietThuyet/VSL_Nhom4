import { Routes } from "@angular/router";
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const reportRoutes: Routes = [
    {
        path: 'period-type',
        loadComponent: () => import('./components/report-period-type/report-period-type').then(m => m.ReportPeriodType),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_PERIOD_TYPE }
    },
    {
        path: 'period',
        loadComponent: () => import('./components/report-period/report-period').then(m => m.ReportPeriod),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_PERIOD }
    },
    {
        path: 'category',
        loadComponent: () => import('./components/report-category/report-category').then(m => m.ReportCategory),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_CATEGORY }
    },
    {
        path: 'data-type',
        loadComponent: () => import('./components/report-data-type/report-data-type').then(m => m.ReportDataType),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_DATA_TYPE }
    },
    {
        path: 'formula-function',
        loadComponent: () => import('./components/report-formula-function/report-formula-function').then(m => m.ReportFormulaFunction),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_FORMULA_FUNCTION }
    },
    {
        path: 'status',
        loadComponent: () => import('./components/report-status/report-status').then(m => m.ReportStatus),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_STATUS }
    },
    {
        path: 'unit',
        loadComponent: () => import('./components/report-unit/report-unit').then(m => m.ReportUnit),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_UNIT }
    },
    {
        path: 'definition',
        loadComponent: () => import('./components/report-definition/report-definition').then(m => m.ReportDefinition),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_DEFINITION }
    },
    {
        path: 'designer',
        loadComponent: () => import('./components/report-designer/report-designer').then(m => m.ReportDesigner),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_STRUCTURE }
    },
    {
        path: 'designer/:id',
        loadComponent: () => import('./components/report-designer/report-designer').then(m => m.ReportDesigner),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_STRUCTURE }
    },
    {
        path: 'list',
        loadComponent: () => import('./components/report-list/report-list').then(m => m.ReportList),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_DATA_ENTRY }
    },
    {
        path: 'entry/:id',
        loadComponent: () => import('./components/report-entry/report-entry').then(m => m.ReportEntry),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_DATA_ENTRY }
    },
    {
        path: 'permission',
        loadComponent: () => import('./components/report-permission/report-permission').then(m => m.ReportPermission),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.REPORT_PERMISSION }
    },
];
