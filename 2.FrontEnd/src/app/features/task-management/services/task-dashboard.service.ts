import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { DashboardFilterDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TaskDashboardService {
  constructor(private common: CommonService) { }

  summary(filter: DashboardFilterDto) { return this.common.get('TaskDashboard/Summary', filter); }
  byStatus(filter: DashboardFilterDto) { return this.common.get('TaskDashboard/ByStatus', filter); }
  byOrg(filter: DashboardFilterDto) { return this.common.get('TaskDashboard/ByOrg', filter); }
  byMonth(filter: DashboardFilterDto) { return this.common.get('TaskDashboard/ByMonth', filter); }
  inTimeTasks(orgId?: string) { return this.common.get('TaskDashboard/InTimeTasks', { orgId }); }
  overdueTasks(orgId?: string) { return this.common.get('TaskDashboard/OverdueTasks', { orgId }); }
  upcomingTasks(orgId?: string, days = 7) { return this.common.get('TaskDashboard/UpcomingTasks', { orgId, days }); }
  priorityTasks(orgId?: string) { return this.common.get('TaskDashboard/PriorityTasks', { orgId }); }
  becomeDueTasks(range: string) { return this.common.get('TaskDashboard/BecomeDueTasks', { range }); }
  overdueTasksByRange(range: string) { return this.common.get('TaskDashboard/OverdueTasksByRange', { range }); }
  leaderTasks(leaderUserName: string) { return this.common.get('TaskDashboard/LeaderTasks', { leaderUserName }); }
  orgTasks(orgId: string) { return this.common.get('TaskDashboard/OrgTasks', { orgId }); }
}
