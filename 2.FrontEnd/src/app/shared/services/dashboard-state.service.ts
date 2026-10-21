import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  upcomingTasks: any[] = [];
  priorityTasks: any[] = [];
  priorityTasksByOrg: any[] = [];
  overdueTaskList: any[] = [];
  inTimeTaskList: any[] = [];
}
