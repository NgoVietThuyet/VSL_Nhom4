import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const notesRoutes: Routes = [
  {
    path: '',
    canActivate: [PermissionGuard],
    data: { requiredRight: APP_RIGHTS.NOTES },
    loadComponent: () =>
      import('./components/notes-home').then(m => m.NotesHome),
  },
];
