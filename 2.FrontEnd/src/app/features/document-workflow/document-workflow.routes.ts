import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const documentWorkflowRoutes: Routes = [
  { path: '', redirectTo: 'bo/van-ban-den/tiep-nhan', pathMatch: 'full' },

  // Cấp Bộ / Đơn vị — Văn bản đến (cap = 'bo' | 'don-vi', stage = tiep-nhan|so-loai|xu-ly|xin-y-kien|de-biet)
  {
    path: ':cap/van-ban-den/:stage',
    loadComponent: () => import('./components/document-incoming/document-incoming').then(m => m.DocumentIncoming_List),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.DOCUMENT_WORKFLOW },
  },
  // Cấp Bộ / Đơn vị — Văn bản đi (stage = du-thao|trinh-ky|xu-ly|ban-hanh)
  {
    path: ':cap/van-ban-di/:stage',
    loadComponent: () => import('./components/document-outgoing/document-outgoing').then(m => m.DocumentOutgoing_List),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.DOCUMENT_WORKFLOW },
  },
  {
    path: 'bao-cao',
    loadComponent: () => import('./components/document-report/document-report').then(m => m.DocumentReport),
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.DOCUMENT_WORKFLOW },
  },

];
