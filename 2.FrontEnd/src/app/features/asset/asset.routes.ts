import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const assetRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./components/ast-dashboard/ast-dashboard').then(m => m.AstDashboard),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_DASHBOARD }
    },
    {
        path: 'category',
        loadComponent: () => import('./components/ast-category/ast-category').then(m => m.AstCategory),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_CATEGORY }
    },
    {
        path: 'asset',
        loadComponent: () => import('./components/ast-asset/ast-asset').then(m => m.AstAsset),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_LIST }
    },
    {
        path: 'asset/detail/:id',
        loadComponent: () => import('./components/ast-asset-detail/ast-asset-detail').then(m => m.AstAssetDetail),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_LIST }
    },
    {
        path: 'assignment',
        loadComponent: () => import('./components/ast-assignment/ast-assignment').then(m => m.AstAssignment),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_ASSIGNMENT }
    },
    {
        path: 'my-assets',
        loadComponent: () => import('./components/ast-my-assets/ast-my-assets').then(m => m.AstMyAssets),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_MY_ASSETS }
    },
    {
        path: 'transfer',
        loadComponent: () => import('./components/ast-transfer/ast-transfer').then(m => m.AstTransfer),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_TRANSFER }
    },
    {
        path: 'maintenance',
        loadComponent: () => import('./components/ast-maintenance/ast-maintenance').then(m => m.AstMaintenance),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_MAINTENANCE }
    },
    {
        path: 'depreciation',
        loadComponent: () => import('./components/ast-depreciation/ast-depreciation').then(m => m.AstDepreciation),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_DEPRECIATION }
    },
    {
        path: 'inventory',
        loadComponent: () => import('./components/ast-inventory/ast-inventory').then(m => m.AstInventory),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_INVENTORY }
    },
    {
        path: 'disposal',
        loadComponent: () => import('./components/ast-disposal/ast-disposal').then(m => m.AstDisposal),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_DISPOSAL }
    },
    {
        path: 'license',
        loadComponent: () => import('./components/ast-license/ast-license').then(m => m.AstLicense),
        canActivate: [PermissionGuard],
        data: { requiredRight: APP_RIGHTS.ASSET_LICENSE }
    },
];
