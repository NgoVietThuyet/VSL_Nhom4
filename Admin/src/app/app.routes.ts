import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { AdminLayoutComponent } from './shared/layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'topics',
        loadComponent: () => import('./features/topics/topics.component').then(m => m.TopicsComponent)
      },
      {
        path: 'topics/:topicId',
        loadComponent: () => import('./features/lessons/topic-detail/topic-detail.component').then(m => m.TopicDetailComponent)
      },
      {
        path: 'topics/:topicId/lessons/:lessonId',
        loadComponent: () => import('./features/lessons/lesson-detail/lesson-detail.component').then(m => m.LessonDetailComponent)
      },
      {
        path: 'signs',
        loadComponent: () => import('./features/signs/signs.component').then(m => m.SignsComponent)
      },
      {
        path: 'quiz',
        loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent)
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring.component').then(m => m.MonitoringComponent)
      },
      {
        path: 'system',
        loadComponent: () => import('./features/system/system.component').then(m => m.SystemComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
