import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const crmRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/crm-home/crm-home').then(m => m.CrmHome),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_DASHBOARD },
  },
  {
    path: 'customer',
    loadComponent: () => import('./components/crm-customer-list/crm-customer-list').then(m => m.CrmCustomerList),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_CUSTOMER },
  },
  {
    path: 'lead',
    loadComponent: () => import('./components/crm-lead-list/crm-lead-list').then(m => m.CrmLeadList),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_LEAD },
  },
  {
    path: 'opportunity',
    loadComponent: () => import('./components/crm-opportunity-board/crm-opportunity-board').then(m => m.CrmOpportunityBoard),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_OPPORTUNITY },
  },
  {
    path: 'opportunity/:id',
    loadComponent: () => import('./components/crm-opportunity-detail/crm-opportunity-detail').then(m => m.CrmOpportunityDetail),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_OPPORTUNITY },
  },
  {
    path: 'quotation',
    loadComponent: () => import('./components/crm-quotation-editor/crm-quotation-editor').then(m => m.CrmQuotationEditor),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_QUOTATION },
  },
  {
    path: 'activity',
    loadComponent: () => import('./components/crm-activity-calendar/crm-activity-calendar').then(m => m.CrmActivityCalendar),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_ACTIVITY },
  },
  {
    path: 'campaign',
    loadComponent: () => import('./components/crm-campaign-detail/crm-campaign-detail').then(m => m.CrmCampaignDetail),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_CAMPAIGN },
  },
  {
    path: 'product',
    loadComponent: () => import('./components/crm-product-list/crm-product-list').then(m => m.CrmProductList),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_PRODUCT },
  },
  {
    path: 'master-data',
    loadComponent: () => import('./components/crm-master-data/crm-master-data').then(m => m.CrmMasterData),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.CRM_MASTER_DATA },
  },
];
