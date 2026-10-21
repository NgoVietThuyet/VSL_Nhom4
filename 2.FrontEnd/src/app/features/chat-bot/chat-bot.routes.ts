import { Routes } from '@angular/router';
import PermissionGuard from '../../core/guards/permission.guard';
import { APP_RIGHTS } from '../../shared/constants';

export const chatBotRoutes: Routes = [
    { path: '', loadComponent: () => import('./components/chat-bot').then(m => m.ChatBot), canActivate: [PermissionGuard], data: { requiredRight: APP_RIGHTS.AI_CHAT_BOT } },
];
