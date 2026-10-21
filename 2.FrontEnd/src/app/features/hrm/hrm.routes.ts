import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const hrmRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./components/hrm-dashboard/hrm-dashboard').then(m => m.HrmDashboard),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_DASHBOARD }
    },
    {
        path: 'employee',
        loadComponent: () => import('./components/hrm-employee-list/hrm-employee-list').then(m => m.HrmEmployeeList),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_EMPLOYEE }
    },
    {
        path: 'employee/:id',
        loadComponent: () => import('./components/hrm-employee-detail/hrm-employee-detail').then(m => m.HrmEmployeeDetail),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_EMPLOYEE }
    },
    {
        path: 'org-chart',
        loadComponent: () => import('./components/hrm-org-chart/hrm-org-chart').then(m => m.HrmOrgChart),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_EMPLOYEE }
    },
    {
        path: 'contract',
        loadComponent: () => import('./components/hrm-contract/hrm-contract').then(m => m.HrmContract),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_CONTRACT }
    },
    {
        path: 'attendance',
        loadComponent: () => import('./components/hrm-attendance/hrm-attendance').then(m => m.HrmAttendance),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_ATTENDANCE }
    },
    {
        path: 'attendance/my',
        loadComponent: () => import('./components/hrm-attendance-my/hrm-attendance-my').then(m => m.HrmAttendanceMy),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_ATTENDANCE_MY }
    },
    {
        path: 'leave',
        loadComponent: () => import('./components/hrm-leave/hrm-leave').then(m => m.HrmLeave),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_LEAVE }
    },
    {
        path: 'leave/my',
        loadComponent: () => import('./components/hrm-leave-my/hrm-leave-my').then(m => m.HrmLeaveMy),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_LEAVE_MY }
    },
    {
        path: 'payroll',
        loadComponent: () => import('./components/hrm-payroll/hrm-payroll').then(m => m.HrmPayroll),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_PAYROLL }
    },
    {
        path: 'payroll/my-payslips',
        loadComponent: () => import('./components/hrm-payslip-my/hrm-payslip-my').then(m => m.HrmPayslipMy),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_PAYROLL_MY }
    },
    {
        path: 'recruitment',
        loadComponent: () => import('./components/hrm-recruitment/hrm-recruitment').then(m => m.HrmRecruitment),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_RECRUITMENT }
    },
    {
        path: 'training',
        loadComponent: () => import('./components/hrm-training/hrm-training').then(m => m.HrmTraining),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_TRAINING }
    },
    {
        path: 'evaluation',
        loadComponent: () => import('./components/hrm-evaluation/hrm-evaluation').then(m => m.HrmEvaluation),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_EVALUATION }
    },
    {
        path: 'reward',
        loadComponent: () => import('./components/hrm-reward/hrm-reward').then(m => m.HrmReward),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_EVALUATION }
    },
    {
        path: 'master-data',
        loadComponent: () => import('./components/hrm-master-data/hrm-master-data').then(m => m.HrmMasterData),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.HRM_MASTER_DATA }
    },
];
